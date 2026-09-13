import DB from '../database';
import logger from '../logger';
import config from '../config';
import PoolsRepository from '../repositories/PoolsRepository';
import { PoolTag } from '../mempool.interfaces';
import diskCache from './disk-cache';
import transactionUtils from './transaction-utils';
import BlocksRepository from '../repositories/BlocksRepository';
import valkeyCache from './valkey-cache';
import blocks from './blocks';
import { parseMinerTag } from './miner-tag';

/**
 * $getPools and $getUnknownPool both SELECT `unique_id as uniqueId`, but
 * $getPool does SELECT *, so its rows carry the raw database column instead.
 * Callers read pool.uniqueId - blocks.ts puts it straight into
 * block.extras.pool.id - so a row from $getPool has to be normalised before it
 * is handed on. Returning one unnormalised made every block fail to save with
 * "Could not find a mining pool with the unique_id = undefined".
 */
function normalisePoolRow(row: PoolTag): PoolTag {
  const raw = row as any;
  return { ...raw, uniqueId: raw.uniqueId ?? raw.unique_id };
}

class PoolsParser {
  miningPools: any[] = [];
  unknownPool: any = {
    id: 0,
    name: 'Unknown',
    link: 'https://learnmeabitcoin.com/technical/coinbase-transaction',
    regexes: '[]',
    addresses: '[]',
    slug: 'unknown',
  };

  public setMiningPools(pools): void {
    for (const pool of pools) {
      pool.regexes = pool.tags;
      pool.slug = pool.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
      delete pool.tags;
    }
    this.miningPools = pools;
  }

  /**
   * Populate our db with updated mining pool definition
   * @param pools
   */
  public async migratePoolsJson(): Promise<void> {
    // We also need to wipe the backend cache to make sure we don't serve blocks with
    // the wrong mining pool (usually happen with unknown blocks)
    diskCache.setIgnoreBlocksCache();
    valkeyCache.setIgnoreBlocksCache();

    await this.$insertUnknownPool();

    let reindexUnknown = false;
    let clearCache = false;

    for (const pool of this.miningPools) {
      if (!pool.id) {
        logger.info(`Mining pool ${pool.name} has no unique 'id' defined. Skipping.`);
        continue;
      }

      // One of the two fields 'addresses' or 'regexes' must be a non-empty array
      if (!pool.addresses && !pool.regexes) {
        logger.err(`Mining pool ${pool.name} must have at least one of the fields 'addresses' or 'regexes'. Skipping.`);
        continue;
      }

      pool.addresses = pool.addresses || [];
      pool.regexes = pool.regexes || [];

      if (pool.addresses.length === 0 && pool.regexes.length === 0) {
        logger.err(`Mining pool ${pool.name} has no 'addresses' nor 'regexes' defined. Skipping.`);
        continue;
      }

      if (pool.addresses.length === 0) {
        logger.warn(`Mining pool ${pool.name} has no 'addresses' defined.`);
      }

      if (pool.regexes.length === 0) {
        logger.warn(`Mining pool ${pool.name} has no 'regexes' defined.`);
      }

      const poolDB = await PoolsRepository.$getPoolByUniqueId(pool.id, false);
      if (!poolDB) {
        // New mining pool
        const slug = pool.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
        logger.debug(`Inserting new mining pool ${pool.name}`);
        await PoolsRepository.$insertNewMiningPool(pool, slug);
        reindexUnknown = true;
        clearCache = true;
      } else {
        if (poolDB.name !== pool.name) {
          // Pool has been renamed
          const newSlug = pool.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
          logger.warn(
            `Renaming ${poolDB.name} mining pool to ${pool.name}. Slug has been updated. Maybe you want to make a redirection from 'https://bchexplorer.cash/mining/pool/${poolDB.slug}' to 'https://bchexplorer.cash/mining/pool/${newSlug}`
          );
          await PoolsRepository.$renameMiningPool(poolDB.id, newSlug, pool.name);
          clearCache = true;
        }
        if (poolDB.link !== pool.link) {
          // Pool link has changed
          logger.debug(`Updating link for ${pool.name} mining pool`);
          await PoolsRepository.$updateMiningPoolLink(poolDB.id, pool.link);
          clearCache = true;
        }
        if (JSON.stringify(pool.addresses) !== poolDB.addresses || JSON.stringify(pool.regexes) !== poolDB.regexes) {
          // Pool addresses changed or coinbase tags changed
          logger.notice(`Updating addresses and/or coinbase tags for ${pool.name} mining pool.`);
          await PoolsRepository.$updateMiningPoolTags(poolDB.id, pool.addresses, pool.regexes);
          reindexUnknown = true;
          clearCache = true;
          await this.$reindexBlocksForPool(poolDB.id);
        }
      }
    }

    if (reindexUnknown) {
      logger.notice(`Updating addresses and/or coinbase tags for unknown mining pool.`);
      let unknownPool;
      if (config.DATABASE.ENABLED === true) {
        unknownPool = await PoolsRepository.$getUnknownPool();
      } else {
        unknownPool = this.unknownPool;
      }
      await this.$reindexBlocksForPool(unknownPool.id);
    }

    // refresh the in-memory block cache with the reindexed data
    if (clearCache) {
      for (const block of blocks.getBlocks()) {
        const reindexedBlock = await blocks.$indexBlock(block.id);
        block.extras.pool = reindexedBlock.extras.pool;
      }
      // update persistent cache with the reindexed data
      diskCache.$saveCacheToDisk();
      valkeyCache.$updateBlocks(blocks.getBlocks());
    }
  }

  public matchBlockMiner(scriptsig: string, addresses: string[], pools: PoolTag[]): PoolTag | undefined {
    const asciiScriptSig = transactionUtils.hex2ascii(scriptsig);

    for (let i = 0; i < pools.length; ++i) {
      if (addresses.length) {
        const poolAddresses: string[] =
          typeof pools[i].addresses === 'string' ? JSON.parse(pools[i].addresses) : pools[i].addresses;
        for (let y = 0; y < poolAddresses.length; y++) {
          if (addresses.indexOf(poolAddresses[y]) !== -1) {
            return pools[i];
          }
        }
      }

      const regexes: string[] = typeof pools[i].regexes === 'string' ? JSON.parse(pools[i].regexes) : pools[i].regexes;
      for (let y = 0; y < regexes.length; ++y) {
        const regex = new RegExp(regexes[y], 'i');
        const match = asciiScriptSig.match(regex);
        if (match !== null) {
          return pools[i];
        }
      }
    }
  }

  /**
   * Manually add the 'unknown pool'
   */
  public async $insertUnknownPool(): Promise<void> {
    if (!config.DATABASE.ENABLED) {
      return;
    }

    try {
      const [rows]: any[] = await DB.query({
        sql: 'SELECT name from pools where name="Unknown"',
        timeout: 120000,
      });
      if (rows.length === 0) {
        await DB.query({
          sql: `INSERT INTO pools(name, link, regexes, addresses, slug, unique_id)
          VALUES("${this.unknownPool.name}", "${this.unknownPool.link}", "[]", "[]", "${this.unknownPool.slug}", 0);
        `,
        });
      } else {
        await DB.query(`UPDATE pools
          SET name='${this.unknownPool.name}', link='${this.unknownPool.link}',
          regexes='[]', addresses='[]',
          slug='${this.unknownPool.slug}',
          unique_id=0
          WHERE slug='${this.unknownPool.slug}'
        `);
      }
    } catch (e) {
      logger.err(`Unable to insert or update "Unknown" mining pool. Reason: ${e instanceof Error ? e.message : e}`);
    }
  }

  /**
   * re-index pool assignment for blocks previously associated with pool
   *
   * @param pool local id of existing pool to reindex
   */
  private async $reindexBlocksForPool(poolId: number): Promise<void> {
    // BitFinite is a fresh chain (re-anchored genesis 2026) — mining pools are known
    // from block 1, unlike Bitcoin Cash where the first pool-tagged block was 130635.
    //
    // Starts at 1, not 0, because the genesis coinbase carries the fair-launch
    // message rather than a miner tag. Naming miners from their coinbase would
    // otherwise turn that sentence into a mining pool called
    // "ABFX 2026-06-29 BitFinite fair l".
    const firstKnownBlockPool = 1;

    const [blocks]: any[] = await DB.query(
      `
      SELECT height, hash, coinbase_raw, coinbase_addresses
      FROM blocks
      WHERE pool_id = ?
      AND height >= ?
      ORDER BY height DESC
    `,
      [poolId, firstKnownBlockPool]
    );

    let pools: PoolTag[] = [];
    if (config.DATABASE.ENABLED === true) {
      pools = await PoolsRepository.$getPools();
    } else {
      pools = this.miningPools;
    }

    let changed = 0;
    for (const block of blocks) {
      const addresses = JSON.parse(block.coinbase_addresses) || [];
      let newPool = this.matchBlockMiner(block.coinbase_raw, addresses, pools);
      // Same fall-through as $findBlockMiner: a block matching no curated pool
      // is named from the tag its miner wrote. Without this, reindexing leaves
      // every historical Unknown block exactly as it was, because it only ever
      // re-checks them against the curated list.
      //
      // Note $savePool wants the auto-increment `id`, not `unique_id`. Both are
      // present on what $getOrCreateSelfReportedPool returns, and picking the
      // wrong one is what broke block indexing on 2026-09-13.
      if (!newPool) {
        newPool = await this.$getOrCreateSelfReportedPool(block.coinbase_raw);
      }
      if (newPool && newPool.id !== poolId) {
        changed++;
        await BlocksRepository.$savePool(block.hash, newPool.id);
      }
    }

    logger.info(`${changed} blocks assigned to a new pool`, logger.tags.mining);

    // Re-index hashrates later
    // Note: Disable for now, as it's causing incorrectly re-indexing hashrates (specifically the daily hashrate)
    // mining.reindexHashrateRequested = true;
  }

  // ── self-reported miner tags ────────────────────────────────────────────────
  // Parsing lives in ./miner-tag, which has no imports so it can be tested on
  // its own. Everything here is the database half: look the tag up, create the
  // pool row if it is new, and refuse in the cases that would let a miner pick
  // an identity that is not theirs.
  //
  // Self-reported pools carry a NEGATIVE unique_id. Curated pools from
  // pools-v2.json are positive, so the two can never be confused, and a miner
  // cannot promote itself into a curated identity by naming itself after one:
  // a slug that already belongs to a curated pool falls back to Unknown.
  //
  // AUTO_POOL_LIMIT is the backstop against a miner that rotates its tag every
  // block to fill the table.
  private static readonly AUTO_POOL_LIMIT = 250;
  private autoPoolCount: number | null = null;

  public async $getOrCreateSelfReportedPool(scriptsig: string): Promise<PoolTag | undefined> {
    if (!config.DATABASE.ENABLED) {
      return undefined;
    }

    const parsed = parseMinerTag(scriptsig);
    if (!parsed) {
      return undefined;
    }

    try {
      const existing = await PoolsRepository.$getPool(parsed.slug);
      if (existing) {
        const row = normalisePoolRow(existing);
        // Curated pools win. A miner writing an existing pool's name into its
        // coinbase gets Unknown, not that pool's identity.
        return typeof row.uniqueId === 'number' && row.uniqueId < 0 ? row : undefined;
      }

      if (this.autoPoolCount === null) {
        this.autoPoolCount = await PoolsRepository.$countSelfReportedPools();
      }
      if (this.autoPoolCount >= PoolsParser.AUTO_POOL_LIMIT) {
        return undefined;
      }

      await PoolsRepository.$insertNewMiningPool(
        { name: parsed.name, link: '', addresses: [], regexes: [], id: parsed.uniqueId },
        parsed.slug
      );
      this.autoPoolCount++;
      logger.info(`Self-reported mining pool "${parsed.name}" added from its coinbase tag`, logger.tags.mining);

      const created = await PoolsRepository.$getPool(parsed.slug);
      return created ? normalisePoolRow(created) : undefined;
    } catch (e) {
      logger.err(`Cannot resolve self-reported mining pool. Reason: ${e instanceof Error ? e.message : e}`);
      return undefined;
    }
  }
}

export default new PoolsParser();

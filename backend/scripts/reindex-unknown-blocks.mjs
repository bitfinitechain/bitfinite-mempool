#!/usr/bin/env node
/**
 * Re-attribute blocks currently filed under "Unknown".
 *
 * Exists because the built-in trigger cannot fire here. migratePoolsJson only
 * runs when the pools-v2.json sha CHANGES, and that sha is fetched from
 * gitlab.melroy.org, which is unreachable from this host. updatePoolsJson
 * returns at `sha === null` before doing anything, so the reindex never
 * happens, with or without the --update-pools flag. The same dead dependency
 * is why the pools_json_sha row in `state` is load-bearing: do not delete it.
 *
 * Safe to run against a live backend - it only rewrites blocks.pool_id. Run it
 * BEFORE restarting, so the restart clears the in-memory block cache and the
 * API stops serving the old names for recent blocks.
 *
 *   node scripts/reindex-unknown-blocks.mjs [--dry-run]
 */
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const base = process.cwd();
process.env.EXPLORER_CONFIG_FILE ||= path.join(base, 'explorer-config.json');

const DB = require(path.join(base, 'dist/database')).default;
const poolsParser = require(path.join(base, 'dist/api/pools-parser')).default;
const PoolsRepository = require(path.join(base, 'dist/repositories/PoolsRepository')).default;
const BlocksRepository = require(path.join(base, 'dist/repositories/BlocksRepository')).default;

const DRY = process.argv.includes('--dry-run');

await DB.checkDbConnection();
const unknown = await PoolsRepository.$getUnknownPool();
const pools = await PoolsRepository.$getPools();

const [rows] = await DB.query(
  // height >= 1: the genesis coinbase holds the fair-launch message, not a
  // miner tag, and must never be turned into a pool.
  'SELECT height, hash, coinbase_raw, coinbase_addresses FROM blocks WHERE pool_id = ? AND height >= 1 ORDER BY height',
  [unknown.id]
);
console.log(`${rows.length} block(s) filed under Unknown${DRY ? '  (dry run)' : ''}\n`);

const tally = new Map();
let changed = 0;
for (const b of rows) {
  const addresses = JSON.parse(b.coinbase_addresses) || [];
  let pool = poolsParser.matchBlockMiner(b.coinbase_raw, addresses, pools);
  if (!pool) {
    pool = await poolsParser.$getOrCreateSelfReportedPool(b.coinbase_raw);
  }
  if (!pool || pool.id === unknown.id) {
    tally.set('(stays Unknown)', (tally.get('(stays Unknown)') || 0) + 1);
    continue;
  }
  tally.set(pool.name, (tally.get(pool.name) || 0) + 1);
  changed++;
  // $savePool takes the auto-increment id, not unique_id.
  if (!DRY) await BlocksRepository.$savePool(b.hash, pool.id);
}

console.log('outcome:');
for (const [name, n] of [...tally].sort((a, b) => b[1] - a[1])) {
  console.log(`  %s  %s`.replace('%s', String(n).padStart(5)).replace('%s', name));
}
console.log(`\n${changed} block(s) ${DRY ? 'would be' : ''} reattributed`);
process.exit(0);

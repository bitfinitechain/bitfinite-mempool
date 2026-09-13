#!/usr/bin/env node
/**
 * Verify the database half of self-reported miner naming, against a real
 * database, before restarting anything.
 *
 * This exists because unit tests covered parseMinerTag - pure, and never the
 * risk - while the half that talks to the database shipped unexercised. It
 * returned a row straight from $getPool, which does SELECT * and so carries
 * `unique_id` rather than the `uniqueId` every caller reads. Block indexing
 * then failed on every block with "Could not find a mining pool with the
 * unique_id = undefined", in a retry loop that never recovers.
 *
 * Run from backend/ against a built dist, BEFORE restarting the service:
 *   node scripts/check-self-reported-pool.mjs
 *
 * Exits non-zero on failure. Removes the row it creates.
 */
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const base = process.cwd();
process.env.EXPLORER_CONFIG_FILE ||= path.join(base, 'explorer-config.json');

const DB = require(path.join(base, 'dist/database')).default;
const poolsParser = require(path.join(base, 'dist/api/pools-parser')).default;

// A real /mined by me/ coinbase from this chain: BIP34 height push, extranonce,
// then the tag. Hand-typing one is how the first version of this check failed -
// an odd number of hex digits shifts every later byte by a nibble.
const COINBASE =
  '02415800040637a66a04b66333250ccfb5a56a0000000000047b8e0d2f6d696e6564206279206d652f';
const EXPECT_SLUG = 'minedbyme';

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

try {
  await DB.checkDbConnection();
  const pool = await poolsParser.$getOrCreateSelfReportedPool(COINBASE);

  check('a tagged coinbase resolves to a pool', !!pool);
  if (pool) {
    check('name came from the tag', pool.name === 'mined by me', pool.name);
    check('slug is url-safe', /^[a-z0-9]+$/.test(pool.slug), pool.slug);

    // blocks.ts puts uniqueId straight into extras.pool.id, which
    // BlocksRepository then looks up. This is the exact break.
    check('uniqueId is a number', typeof pool.uniqueId === 'number', String(pool.uniqueId));
    check('uniqueId is negative, so it can never collide with a curated pool', pool.uniqueId < 0);
    const [byUnique] = await DB.query('SELECT id FROM pools WHERE unique_id = ?', [pool.uniqueId]);
    check('$getPoolByUniqueId would resolve it', byUnique.length === 1);

    // the reindex path uses the auto-increment id instead
    check('auto-increment id is present for $savePool', Number.isInteger(pool.id), String(pool.id));

    const again = await poolsParser.$getOrCreateSelfReportedPool(COINBASE);
    check('a second call reuses the row instead of duplicating', again?.uniqueId === pool.uniqueId);
    const [all] = await DB.query('SELECT COUNT(*) AS n FROM pools WHERE slug = ?', [EXPECT_SLUG]);
    check('exactly one row exists for the tag', all[0].n === 1, `found ${all[0].n}`);
  }
} catch (e) {
  console.error('  FAIL  probe threw:', e.message);
  failures++;
} finally {
  // Leave the database as we found it; production creates the row for real.
  try {
    await DB.query('DELETE FROM pools WHERE unique_id < 0 AND slug = ?', [EXPECT_SLUG]);
  } catch { /* nothing to clean */ }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);

import config from '../config';
import { IDifficultyAdjustment } from '../mempool.interfaces';
import blocks from './blocks';

export interface DifficultyAdjustment {
  scheduleOffsetSeconds: number; // seconds ahead(+) or behind(-) ideal schedule
  difficultyDriftPercent: number; // next-block % difficulty change (assuming an on-schedule block)
  currentBits: string; // current block bits (hex)
  nextBits: string; // predicted next block bits (hex)
  timeAvg: number; // avg block time over recent 8 blocks (ms)
}

// --- ASERT (aserti3-2d) functions ---
// Ported from: https://gist.github.com/A60AB5450353F40E/5607d5aeb9ba0e84a71ab8f55ebdd2ad

interface AsertAnchor {
  bits: string; // anchor nBits, hex
  height: number; // anchor height
  timestamp: number; // anchor nPrevBlockTime
  tau: number; // half-life in seconds
  targetSpacing: number; // ideal block time in seconds
}

// BitFinite ASERT anchors, from bitfinite-core src/chainparams.cpp
// (consensus.asertAnchorParams, nASERTHalfLife, nPowTargetSpacing).
//
// These were Bitcoin Cash's values, inherited at the fork, and they made this
// endpoint return garbage rather than merely drift. BCH anchors at height
// 661,647 with a 2-day half-life and 600s blocks; BitFinite anchors at GENESIS
// with a 6-hour half-life and 300s blocks. Feeding our height into their anchor
// put the ASERT exponent at ~3292, so 2**(hi-16) overflowed to Infinity and
// targetToBits stringified it as "Infinity000NaN". The schedule offset came out
// as -568,906,323 seconds, which is just (17090 - 661647) * 600 minus the real
// elapsed time.
//
// Spacing is per-network because it is not the same on both: mainnet targets
// 5 minutes, testnet 10. Anything that hardcodes 600 here is a BCH assumption.
const ASERT_ANCHORS: Record<string, AsertAnchor> = {
  mainnet: { bits: '1b00efab', height: 0, timestamp: 1782691200, tau: 6 * 60 * 60, targetSpacing: 5 * 60 },
  testnet: { bits: '1d00ffff', height: 0, timestamp: 1787400000, tau: 60 * 60, targetSpacing: 10 * 60 },
};

function anchorFor(network: string): AsertAnchor {
  return ASERT_ANCHORS[network] ?? ASERT_ANCHORS.mainnet;
}

function bitsToTarget(bits: string): number {
  const exponent = parseInt(bits.slice(0, 2), 16);
  const mantissa = parseInt(bits.slice(2), 16);
  return mantissa * Math.pow(2, (exponent - 3) * 8);
}

function targetToBits(target: number): string {
  if (target === 0) {
    return '00000000';
  }

  let exponent = Math.floor(Math.log2(target) / 8) + 1;
  let mantissa = Math.floor(target / Math.pow(2, (exponent - 3) * 8));

  if (mantissa > 0x7fffff) {
    mantissa = Math.floor(mantissa / 256);
    exponent++;
  }

  return exponent.toString(16).padStart(2, '0') + mantissa.toString(16).padStart(6, '0');
}

function calculateTarget(height: number, timestamp: number, anchor: AsertAnchor): number {
  const anchorTarget = bitsToTarget(anchor.bits);
  const spacing = anchor.targetSpacing;

  // exponent = (elapsed - spacing * (heightDelta + 1)) / halfLife
  const heightDelta = height - anchor.height;
  const timeDelta = timestamp - anchor.timestamp;

  const t = Math.trunc;
  const base = t(((timeDelta - spacing * (heightDelta + 1)) * 65536) / anchor.tau);
  const hi = t(base / 65536) + (base < 0 ? -1 : 0);
  const lo = base - hi * 65536;

  // 2**(hi-16) is the step that overflowed on the wrong anchor. Guard it: a target
  // of Infinity does not throw, it propagates into targetToBits and comes out of
  // the API as a string like "Infinity000NaN", which is worse than an error
  // because it looks like data.
  const target =
    (t((195766423245049 * lo + 971821376 * lo ** 2 + 5127 * lo ** 3 + 140737488355328) / 2 ** 48) + 65536) *
    anchorTarget *
    2 ** (hi - 16);

  return Number.isFinite(target) ? target : 0;
}

// function numericBitsToHex(bits: number): string {
//   return bits.toString(16).padStart(8, '0');
// }

// --- End ASERT functions ---

/**
 * Returns the ASERT anchor block height for the given network.
 *
 * @param {string} network - Network name ('mainnet' or 'testnet').
 * @returns {number} The anchor block height. BitFinite anchors both networks at
 *   genesis, so this is 0 — it is not a constant to rely on, since a future
 *   chain could anchor elsewhere, but it is never BCH's 661647.
 */
export function getAsertAnchorHeight(network: string): number {
  return anchorFor(network).height;
}

/**
 * Returns the target block spacing in seconds for the given network.
 *
 * Exported so nothing else has to hardcode it. BitFinite mainnet targets 5
 * minutes, not Bitcoin's or Bitcoin Cash's 10, and a stray 600 in a divisor is
 * a silent factor-of-two error rather than a visible failure.
 *
 * @param {string} network - Network name ('mainnet' or 'testnet').
 * @returns {number} Target seconds between blocks.
 */
export function getTargetBlockSpacing(network: string): number {
  return anchorFor(network).targetSpacing;
}

/**
 * Returns how many blocks the network aims to produce per day.
 *
 * @param {string} network - Network name ('mainnet' or 'testnet').
 * @returns {number} Blocks per day at the target spacing (288 on mainnet).
 */
export function getBlocksPerDay(network: string): number {
  return 86400 / getTargetBlockSpacing(network);
}

/**
 * Calculate the difficulty increase/decrease by using the `bits` integer contained in two
 * block headers.
 *
 * Warning: Only compare `bits` from blocks in two adjacent difficulty periods. This code
 * assumes the maximum difference is x4 or /4 (as per the protocol) and will throw an
 * error if an exponent difference of 2 or more is seen.
 *
 * @param {number} oldBits The 32 bit `bits` integer from a block header.
 * @param {number} newBits The 32 bit `bits` integer from a block header in the next difficulty period.
 * @returns {number} A floating point decimal of the difficulty change from old to new.
 *          (ie. 21.3 means 21.3% increase in difficulty, -21.3 is a 21.3% decrease in difficulty)
 */
export function calcBitsDifference(oldBits: number, newBits: number): number {
  // Must be
  // - integer
  // - highest exponent is 0x20, so max value (as integer) is 0x207fffff
  // - min value is 1 (exponent = 0)
  // - highest bit of the number-part is +- sign, it must not be 1
  const verifyBits = (bits: number): void => {
    if (
      Math.floor(bits) !== bits ||
      bits > 0x207fffff ||
      bits < 1 ||
      (bits & 0x00800000) !== 0 ||
      (bits & 0x007fffff) === 0
    ) {
      throw new Error('Invalid bits');
    }
  };
  verifyBits(oldBits);
  verifyBits(newBits);

  // No need to mask exponents because we checked the bounds above
  const oldExp = oldBits >> 24;
  const newExp = newBits >> 24;
  const oldNum = oldBits & 0x007fffff;
  const newNum = newBits & 0x007fffff;
  // The diff can only possibly be 1, 0, -1
  // (because maximum difficulty change is x4 or /4 (2 bits up or down))
  let result: number;
  switch (newExp - oldExp) {
    // New less than old, target lowered, difficulty increased
    case -1:
      result = ((oldNum << 8) * 100) / newNum - 100;
      break;
    // Same exponent, compare numbers as is.
    case 0:
      result = (oldNum * 100) / newNum - 100;
      break;
    // Old less than new, target raised, difficulty decreased
    case 1:
      result = (oldNum * 100) / (newNum << 8) - 100;
      break;
    default:
      throw new Error('Impossible exponent difference');
  }

  // Min/Max values
  return result > 300 ? 300 : result < -75 ? -75 : result;
}

/**
 * Calculate ASERT-based difficulty adjustment data.
 *
 * Uses the aserti3-2d algorithm to compute:
 * - Schedule offset: how far ahead/behind the network is against its ideal
 *   block schedule (5 minutes on mainnet, 10 on testnet)
 * - Difficulty drift: expected % change for the next block
 * - Current and predicted next block bits
 */
export function calcAsertDifficultyAdjustment(
  blockHeight: number,
  latestBlockTimestamp: number,
  network: string,
  recentBlocks: { timestamp: number }[]
): DifficultyAdjustment {
  const anchor = anchorFor(network);
  const BLOCK_SECONDS_TARGET = anchor.targetSpacing;

  // Schedule offset: how far ahead or behind the ideal schedule
  // Positive = network is ahead (blocks mined faster than the target spacing)
  // Negative = network is behind (blocks mined slower than the target spacing)
  const idealElapsed = (blockHeight - anchor.height) * BLOCK_SECONDS_TARGET;
  const actualElapsed = latestBlockTimestamp - anchor.timestamp;
  const scheduleOffsetSeconds = idealElapsed - actualElapsed;

  // Current ASERT target and bits
  const currentTarget = calculateTarget(blockHeight, latestBlockTimestamp, anchor);
  const currentBits = targetToBits(currentTarget);

  // Predicted next block target, assuming it arrives exactly on schedule
  const nextTarget = calculateTarget(blockHeight + 1, latestBlockTimestamp + BLOCK_SECONDS_TARGET, anchor);
  const nextBits = targetToBits(nextTarget);

  // Difficulty drift %: how much harder/easier the next block will be
  // Higher target = easier mining = difficulty decrease (negative drift)
  // Lower target = harder mining = difficulty increase (positive drift)
  const difficultyDriftPercent = currentTarget !== 0 ? ((currentTarget - nextTarget) / currentTarget) * 100 : 0;

  // Average block time from recent blocks (last ~8 blocks = 7 intervals)
  let timeAvgSecs = BLOCK_SECONDS_TARGET;
  if (recentBlocks.length >= 2) {
    const sorted = [...recentBlocks].sort((a, b) => a.timestamp - b.timestamp);
    const totalTime = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    timeAvgSecs = totalTime / (sorted.length - 1);
  }

  const timeAvg = Math.floor(timeAvgSecs * 1000);

  return {
    scheduleOffsetSeconds,
    difficultyDriftPercent,
    currentBits,
    nextBits,
    timeAvg,
  };
}

class DifficultyAdjustmentApi {
  public getDifficultyAdjustment(): IDifficultyAdjustment | null {
    const blockHeight = blocks.getCurrentBlockHeight();
    const blocksCache = blocks.getBlocks();
    const latestBlock = blocksCache[blocksCache.length - 1];
    if (!latestBlock) {
      return null;
    }
    // Use last ~8 blocks for average block time calculation (7 intervals)
    const recentBlocks = blocksCache.slice(-8).map((b) => ({ timestamp: b.timestamp }));

    return calcAsertDifficultyAdjustment(blockHeight, latestBlock.timestamp, config.EXPLORER.NETWORK, recentBlocks);
  }
}

export default new DifficultyAdjustmentApi();

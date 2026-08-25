// --- ASERT (aserti3-2d) functions ---
// Ported from: https://gist.github.com/A60AB5450353F40E/5607d5aeb9ba0e84a71ab8f55ebdd2ad
//
// DUPLICATE OF backend/src/api/difficulty-adjustment.ts. The two builds cannot
// share a module, so they are kept in sync by hand - change one, change the
// other. They diverged once already: the backend was fixed while this copy kept
// Bitcoin Cash's anchor and rendered "-Infinity%" in the UI.

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
// These were Bitcoin Cash's values. The old comment above them claimed they came
// from BitFinite chainparams, which was simply untrue - BCH anchors at height
// 661,647 with a 2-day half-life and 600s blocks; we anchor at GENESIS with a
// 6-hour half-life and 300s blocks. Feeding our height into their anchor drove
// the ASERT exponent past 3000, so 2**(hi-16) overflowed to Infinity and the
// drift indicator rendered -Infinity%.
//
// Spacing is per-network because it differs: mainnet targets 5 minutes,
// testnet 10. Any hardcoded 600 here is a Bitcoin Cash assumption.
const ASERT_ANCHORS: Record<string, AsertAnchor> = {
  mainnet: {
    bits: '1b00efab',
    height: 0,
    timestamp: 1782691200,
    tau: 6 * 60 * 60,
    targetSpacing: 5 * 60,
  },
  testnet: {
    bits: '1d00ffff',
    height: 0,
    timestamp: 1787400000,
    tau: 60 * 60,
    targetSpacing: 10 * 60,
  },
};

export function getAsertAnchor(network: string): AsertAnchor {
  return ASERT_ANCHORS[network] ?? ASERT_ANCHORS['mainnet'];
}

export function getAsertAnchorHeight(network: string): number {
  return getAsertAnchor(network).height;
}

export function getTargetBlockSpacing(network: string): number {
  return getAsertAnchor(network).targetSpacing;
}

/** Blocks the network aims to produce per day (288 on mainnet, not Bitcoin's 144). */
export function getBlocksPerDay(network: string): number {
  return 86400 / getTargetBlockSpacing(network);
}

/** Blocks the network aims to produce per week (2016 on mainnet, not Bitcoin's 1008). */
export function getBlocksPerWeek(network: string): number {
  return 7 * getBlocksPerDay(network);
}

export function bitsToTarget(bits: string): number {
  const exponent = parseInt(bits.slice(0, 2), 16);
  const mantissa = parseInt(bits.slice(2), 16);
  return mantissa * Math.pow(2, (exponent - 3) * 8);
}

export function targetToBits(target: number): string {
  if (target === 0) return '00000000';

  let exponent = Math.floor(Math.log2(target) / 8) + 1;
  let mantissa = Math.floor(target / Math.pow(2, (exponent - 3) * 8));

  if (mantissa > 0x7fffff) {
    mantissa = Math.floor(mantissa / 256);
    exponent++;
  }

  return (
    exponent.toString(16).padStart(2, '0') +
    mantissa.toString(16).padStart(6, '0')
  );
}

export function calculateTarget(
  height: number,
  timestamp: number,
  anchor: AsertAnchor
): number {
  const anchorTarget = bitsToTarget(anchor.bits);
  const spacing = anchor.targetSpacing;

  // exponent = (elapsed - spacing * (heightDelta + 1)) / halfLife
  const heightDelta = height - anchor.height;
  const timeDelta = timestamp - anchor.timestamp;

  const t = Math.trunc;
  const base = t(((timeDelta - spacing * (heightDelta + 1)) * 65536) / anchor.tau);
  const hi = t(base / 65536) + (base < 0 ? -1 : 0);
  const lo = base - hi * 65536;

  // 2**(hi-16) is the step that overflowed on the wrong anchor. Guard it: an
  // Infinity target does not throw, it propagates into the drift percentage and
  // renders as "-Infinity%", which is worse than an error because it looks like
  // a reading.
  const target =
    (t(
      (195766423245049 * lo +
        971821376 * lo ** 2 +
        5127 * lo ** 3 +
        140737488355328) /
        2 ** 48
    ) +
      65536) *
    anchorTarget *
    2 ** (hi - 16);

  return Number.isFinite(target) ? target : 0;
}

export function getScheduleOffsetSeconds(
  height: number,
  timestamp: number,
  network: string = 'mainnet'
): number {
  const anchor = getAsertAnchor(network);
  const idealElapsed = (height - anchor.height) * anchor.targetSpacing;
  const actualElapsed = timestamp - anchor.timestamp;
  return idealElapsed - actualElapsed;
}

export function getDifficultyDriftPercentSinceAnchor(
  height: number,
  timestamp: number,
  network: string = 'mainnet'
): number {
  const anchor = getAsertAnchor(network);
  const anchorTarget = bitsToTarget(anchor.bits);
  const currentTarget = calculateTarget(height, timestamp, anchor);
  if (anchorTarget === 0) return 0;
  // Higher target = easier = difficulty decrease (negative drift)
  // Lower target = harder = difficulty increase (positive drift)
  return ((anchorTarget - currentTarget) / anchorTarget) * 100;
}

// --- End ASERT functions ---

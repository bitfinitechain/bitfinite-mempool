import { calcBitsDifference, calcAsertDifficultyAdjustment } from '../../api/difficulty-adjustment';

describe('Mempool Difficulty Adjustment', () => {
  const recentBlocksFor = (blockTimestamp: number) => [
    { timestamp: blockTimestamp - 3600 },
    { timestamp: blockTimestamp - 3000 },
    { timestamp: blockTimestamp - 2400 },
    { timestamp: blockTimestamp - 1800 },
    { timestamp: blockTimestamp - 1200 },
    { timestamp: blockTimestamp - 600 },
    { timestamp: blockTimestamp },
  ];

  // Real BitFinite mainnet headers, read from the chain. These are the strongest
  // available fixture: ASERT is a consensus rule, so a correct port must
  // reproduce the bits the network actually mined. The previous version of this
  // file asserted values derived from Bitcoin Cash's anchor on networks
  // (testnet4, chipnet, scalenet) that core removed in 3.2.0, so it passed while
  // the endpoint served "Infinity000NaN" in production.
  //
  // ASERT computes a block's target from its PARENT's height and timestamp,
  // so each row is (parentHeight, parentTimestamp) -> the child's real bits.
  const MAINNET_HEADERS = [
    { parentHeight: 17085, parentTimestamp: 1787617678, childBits: '196655c4' },
    { parentHeight: 17086, parentTimestamp: 1787618801, childBits: '19691337' },
    { parentHeight: 17087, parentTimestamp: 1787618932, childBits: '196881a3' },
    { parentHeight: 17088, parentTimestamp: 1787619096, childBits: '19680cd9' },
    { parentHeight: 17089, parentTimestamp: 1787619476, childBits: '196851a8' },
  ];

  test.each(MAINNET_HEADERS)(
    'reproduces the real mainnet bits mined above block $parentHeight',
    ({ parentHeight, parentTimestamp, childBits }) => {
      const result = calcAsertDifficultyAdjustment(
        parentHeight,
        parentTimestamp,
        'mainnet',
        recentBlocksFor(parentTimestamp)
      );
      expect(result.currentBits).toBe(childBits);
    }
  );

  test('never emits non-finite bits, whatever height it is given', () => {
    // The production bug did not throw. bitsToTarget overflowed to Infinity and
    // targetToBits stringified it, so the API served 'Infinity000NaN' as if it
    // were data. Assert the shape, not just the absence of an exception.
    const heights = [0, 1, 1000, 17090, 250000, 5000000];
    for (const height of heights) {
      const timestamp = 1782691200 + height * 300;
      for (const network of ['mainnet', 'testnet']) {
        const result = calcAsertDifficultyAdjustment(height, timestamp, network, recentBlocksFor(timestamp));
        expect(result.currentBits).toMatch(/^[0-9a-f]{8}$/);
        expect(result.nextBits).toMatch(/^[0-9a-f]{8}$/);
        expect(Number.isFinite(result.scheduleOffsetSeconds)).toBe(true);
        expect(Number.isFinite(result.difficultyDriftPercent)).toBe(true);
      }
    }
  });

  test('a chain mined exactly on schedule has no schedule offset', () => {
    // Mainnet targets 300s blocks and anchors at genesis, so an on-pace chain
    // sits at offset 0. This is the assertion that would have caught the BCH
    // anchor: with it, the same input reported -568,906,323 seconds.
    const blockHeight = 17090;
    const blockTimestamp = 1782691200 + blockHeight * 300;

    const result = calcAsertDifficultyAdjustment(
      blockHeight,
      blockTimestamp,
      'mainnet',
      recentBlocksFor(blockTimestamp)
    );

    expect(result.scheduleOffsetSeconds).toBe(0);
  });

  test('mainnet and testnet use different anchors', () => {
    const blockHeight = 5000;
    const blockTimestamp = 1787500000;
    const recentBlocks = recentBlocksFor(blockTimestamp);

    const mainnet = calcAsertDifficultyAdjustment(blockHeight, blockTimestamp, 'mainnet', recentBlocks);
    const testnet = calcAsertDifficultyAdjustment(blockHeight, blockTimestamp, 'testnet', recentBlocks);

    expect(testnet.currentBits).not.toEqual(mainnet.currentBits);
  });

  test('an unknown network falls back to mainnet rather than producing garbage', () => {
    const blockHeight = 17089;
    const blockTimestamp = 1787619476;
    const recentBlocks = recentBlocksFor(blockTimestamp);

    const unknown = calcAsertDifficultyAdjustment(blockHeight, blockTimestamp, 'chipnet', recentBlocks);
    const mainnet = calcAsertDifficultyAdjustment(blockHeight, blockTimestamp, 'mainnet', recentBlocks);

    expect(unknown).toEqual(mainnet);
  });

  test('should calculate Difficulty change from bits fields of two blocks', () => {
    // Check same exponent + check min max for output
    expect(calcBitsDifference(0x1d000200, 0x1d000100)).toEqual(100);
    expect(calcBitsDifference(0x1d000400, 0x1d000100)).toEqual(300);
    expect(calcBitsDifference(0x1d000800, 0x1d000100)).toEqual(300); // Actually 700
    expect(calcBitsDifference(0x1d000100, 0x1d000200)).toEqual(-50);
    expect(calcBitsDifference(0x1d000100, 0x1d000400)).toEqual(-75);
    expect(calcBitsDifference(0x1d000100, 0x1d000800)).toEqual(-75); // Actually -87.5
    // Check new higher exponent
    expect(calcBitsDifference(0x1c000200, 0x1d000001)).toEqual(100);
    expect(calcBitsDifference(0x1c000400, 0x1d000001)).toEqual(300);
    expect(calcBitsDifference(0x1c000800, 0x1d000001)).toEqual(300);
    expect(calcBitsDifference(0x1c000100, 0x1d000002)).toEqual(-50);
    expect(calcBitsDifference(0x1c000100, 0x1d000004)).toEqual(-75);
    expect(calcBitsDifference(0x1c000100, 0x1d000008)).toEqual(-75);
    // Check new lower exponent
    expect(calcBitsDifference(0x1d000002, 0x1c000100)).toEqual(100);
    expect(calcBitsDifference(0x1d000004, 0x1c000100)).toEqual(300);
    expect(calcBitsDifference(0x1d000008, 0x1c000100)).toEqual(300);
    expect(calcBitsDifference(0x1d000001, 0x1c000200)).toEqual(-50);
    expect(calcBitsDifference(0x1d000001, 0x1c000400)).toEqual(-75);
    expect(calcBitsDifference(0x1d000001, 0x1c000800)).toEqual(-75);
    // Check error when exponents are too far apart
    expect(() => calcBitsDifference(0x1d000001, 0x1a000800)).toThrow(/Impossible exponent difference/);
    // Check invalid inputs
    expect(() => calcBitsDifference(0x7f000001, 0x1a000800)).toThrow(/Invalid bits/);
    expect(() => calcBitsDifference(0, 0x1a000800)).toThrow(/Invalid bits/);
    expect(() => calcBitsDifference(100.2783, 0x1a000800)).toThrow(/Invalid bits/);
    expect(() => calcBitsDifference(0x00800000, 0x1a000800)).toThrow(/Invalid bits/);
    expect(() => calcBitsDifference(0x1c000000, 0x1a000800)).toThrow(/Invalid bits/);
  });
});

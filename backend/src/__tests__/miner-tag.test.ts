import { parseMinerTag } from '../api/miner-tag';

/** Encode a scriptSig the way a real coinbase does: BIP34 height push, then tag. */
const coinbase = (tag: string, height = 22463): string => {
  const h: number[] = [];
  let n = height;
  while (n > 0) {
    h.push(n & 0xff);
    n >>= 8;
  }
  const bytes = [h.length, ...h, ...Array.from(tag, (c) => c.charCodeAt(0) & 0xff)];
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
};

describe('parseMinerTag', () => {
  describe('real tags seen on the chain', () => {
    it.each([
      ['/mined by me/', 'mined by me', 'minedbyme'],
      ['/mined by BitFinite pool/', 'mined by BitFinite pool', 'minedbybitfinitepool'],
      ['/FutureBit-BFX/', 'FutureBit-BFX', 'futurebitbfx'],
      ['BFX/GoStratumEngine', 'BFX GoStratumEngine', 'bfxgostratumengine'],
    ])('reads %s', (tag, name, slug) => {
      const r = parseMinerTag(coinbase(tag));
      expect(r).not.toBeNull();
      expect(r!.name).toBe(name);
      expect(r!.slug).toBe(slug);
    });

    // The height bytes are often printable and sit flush against the tag. Height
    // 22463 puts a 'W' there, which is how BFX/GoStratumEngine read as WBFX/...
    it('does not glue the BIP34 height onto the tag', () => {
      expect(parseMinerTag(coinbase('BFX/GoStratumEngine'))!.name).not.toMatch(/^W/);
    });
  });

  // The coinbase is chosen by the miner and nobody else. Everything here is
  // input we must assume is deliberately hostile.
  describe('hostile input is never turned into a pool', () => {
    it.each([
      ['binary noise', '\x00\x01\x02\x7f\x1b'],
      ['digits only', '1234567890'],
      ['too few letters', 'ab'],
      ['slugs to the reserved Unknown', '/Unknown/'],
      // 4 letters, but the first 32 chars hold only one alphanumeric, so the
      // slice leaves nothing meaningful behind.
      ['punctuation padding', 'a' + '-.'.repeat(20) + 'bcd'],
    ])('rejects %s', (_what, tag) => {
      expect(parseMinerTag(coinbase(tag))).toBeNull();
    });

    it('strips characters that could escape a name or a URL', () => {
      const r = parseMinerTag(coinbase('<script>alert(1)</script>'));
      expect(r!.name).not.toMatch(/[<>()]/);
      expect(r!.slug).toMatch(/^[a-z0-9]+$/);
    });

    it('neutralises quotes and semicolons from a SQL attempt', () => {
      const r = parseMinerTag(coinbase('" OR 1=1; DROP TABLE pools; --'));
      expect(r!.name).not.toMatch(/["';]/);
    });

    it('caps the name below the varchar(50) the column allows', () => {
      expect(parseMinerTag(coinbase('A'.repeat(300)))!.name).toHaveLength(32);
    });
  });

  describe('identity', () => {
    it('is deterministic, so one tag always means one pool row', () => {
      expect(parseMinerTag(coinbase('/mined by me/'))!.uniqueId)
        .toBe(parseMinerTag(coinbase('/mined by me/', 99999))!.uniqueId);
    });

    // Curated pools from pools-v2.json carry positive ids. The sign is what
    // keeps a self-reported name from ever being mistaken for a curated one.
    it('always yields a negative id', () => {
      for (const tag of ['/mined by me/', 'SoloRig', 'BFX/GoStratumEngine']) {
        expect(parseMinerTag(coinbase(tag))!.uniqueId).toBeLessThan(0);
      }
    });
  });
});

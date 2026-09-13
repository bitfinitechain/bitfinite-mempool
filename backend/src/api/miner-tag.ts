/**
 * Naming a miner from the tag it writes into its own coinbase.
 *
 * A block whose coinbase matches no curated pool used to render as "Unknown",
 * which meant every new miner needed a hand-written pools-v2.json entry before
 * the dashboard could name them. Instead we take the miner at their word.
 *
 * That string is chosen by the miner and by nobody else, so it is treated as
 * hostile input throughout: a character whitelist rather than a blacklist,
 * length capped well under the varchar(50) the column allows, and a minimum of
 * real letters so binary noise never becomes a pool.
 *
 * This file deliberately has NO imports. The parsing is pure, and keeping it
 * free of the database and config modules is what makes it testable on its own.
 */

const NAME_MAX = 32;

export interface MinerTag {
  name: string;
  slug: string;
  uniqueId: number;
}

function hexToBytes(hex: string): number[] {
  const clean = (hex || '').replace(/[^0-9a-fA-F]/g, '');
  const out: number[] = [];
  for (let i = 0; i + 1 < clean.length; i += 2) {
    out.push(parseInt(clean.substr(i, 2), 16));
  }
  return out;
}

/**
 * A coinbase scriptSig opens with the BIP34 block height: one length byte, then
 * that many little-endian height bytes. Those bytes are often printable and sit
 * flush against the miner's tag, which is how "BFX/GoStratumEngine" was being
 * read as "WBFX/GoStratumEngine" - the W is the high byte of height 22463.
 * Skipping the push removes that whole class of noise.
 */
function stripHeightPush(bytes: number[]): number[] {
  if (bytes.length < 1) {
    return bytes;
  }
  const len = bytes[0];
  if (len >= 1 && len <= 8 && bytes.length > len) {
    return bytes.slice(1 + len);
  }
  return bytes;
}

export function parseMinerTag(scriptsig: string): MinerTag | null {
  const ascii = String.fromCharCode(...stripHeightPush(hexToBytes(scriptsig)));

  // Printable runs of 3+ chars. The miner tag is the longest run holding real
  // letters; the block height and extranonce are what everything else is.
  const runs = ascii.match(/[\x20-\x7E]{3,}/g) || [];
  let best = '';
  for (const run of runs) {
    const letters = (run.match(/[A-Za-z]/g) || []).length;
    if (letters >= 3 && run.length > best.length) {
      best = run;
    }
  }
  if (!best) {
    return null;
  }

  const name = best
    .replace(/[^A-Za-z0-9 ._+-]/g, ' ') // whitelist, never a blacklist
    .replace(/\s+/g, ' ')
    .replace(/^[\s._+-]+|[\s._+-]+$/g, '') // miners wrap tags in /slashes/
    .trim()
    .slice(0, NAME_MAX)
    .trim();

  if ((name.match(/[A-Za-z0-9]/g) || []).length < 3) {
    return null;
  }

  const slug = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (!slug || slug === 'unknown') {
    return null;
  }

  // Deterministic, so the same tag always resolves to the same pool row.
  // Negative by construction: curated pools from pools-v2.json are positive, so
  // the sign alone tells self-reported and curated identities apart.
  let h = 0;
  for (let i = 0; i < slug.length; ++i) {
    h = (Math.imul(h, 31) + slug.charCodeAt(i)) | 0;
  }
  const uniqueId = -(Math.abs(h) % 2000000000) - 1;

  return { name, slug, uniqueId };
}

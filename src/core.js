/** Diacritic Bloom v1.0.0. Visual Unicode codec, not encryption. No dependencies. */
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
deepFreeze(DATA);
const VERSION = '1.0.0';
const FONTS = DATA.fonts;
const MARKS = DATA.pools;
const ORIGINAL = DATA.original;
const PROFILES = deepFreeze({
  dust: {overlay: 0, above: 1, below: 1},
  bloom: {overlay: 1, above: 2, below: 1},
  feral: {overlay: 1, above: 4, below: 3},
  overgrown: {overlay: 1, above: 6, below: 5}
});
const LIMITS = deepFreeze({source: 20000, encoded: 300000, marks: 12, packet: 2000000});
const reverse = new Map();
for (const font of Object.values(FONTS)) {
  for (const [plain, styled] of Object.entries(font.map)) {
    if (reverse.has(styled) && reverse.get(styled) !== plain) throw new Error('Conflicting mapping.');
    reverse.set(styled, plain);
  }
}
const ownedMarks = new Set(Object.keys(DATA.markInfo));
const isMark = /\p{M}/u;
const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('en', {granularity: 'grapheme'}) : null;
function textArg(value, name = 'text', max = LIMITS.encoded) {
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string.`);
  if (value.length > max) throw new RangeError(`${name} exceeds ${max} UTF-16 code units.`);
  for (const ch of value) {
    const cp = ch.codePointAt(0);
    if (cp >= 0xD800 && cp <= 0xDFFF) throw new TypeError(`${name} contains an unpaired surrogate.`);
  }
  return value;
}
function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
  return value;
}
function segments(text) {
  if (!segmenter) throw new Error('This browser needs Intl.Segmenter support. Try a current browser.');
  return Array.from(segmenter.segment(text), x => x.segment);
}
function optionsArg(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Options must be an object.');
  const allowed = new Set(['font','mode','palette','seed','overlay','above','below','strict','frame']);
  for (const key of Object.keys(input)) if (!allowed.has(key)) throw new TypeError(`Unknown option: ${key}`);
  const o = {
    font: 'fraktur', mode: 'single', palette: ['fraktur','bold-script','double-struck','monospace'],
    seed: 12648430, overlay: 1, above: 2, below: 1, strict: false, frame: false, ...input
  };
  if (!Object.hasOwn(FONTS, o.font)) throw new RangeError(`Unknown font: ${o.font}`);
  if (!['single','cycle-letter','cycle-word','random-letter'].includes(o.mode)) throw new RangeError('Unknown mixing mode.');
  if (!Array.isArray(o.palette) || !o.palette.length || o.palette.length > 32 ||
      o.palette.some(f => !Object.hasOwn(FONTS, f))) throw new RangeError('Palette must contain 1 to 32 known font IDs.');
  o.palette = [...o.palette];
  integer(o.seed, 'seed', 0, 0xFFFFFFFF);
  integer(o.overlay, 'overlay', 0, 2); integer(o.above, 'above', 0, 6); integer(o.below, 'below', 0, 6);
  if (o.overlay + o.above + o.below > LIMITS.marks) throw new RangeError('Use at most 12 added marks per styled character.');
  if (typeof o.strict !== 'boolean' || typeof o.frame !== 'boolean') throw new TypeError('strict and frame must be booleans.');
  return o;
}
/** Mulberry32. This is a reproducibility generator, not a cryptographic RNG. */
function seeded(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Sample without replacement. Order is deliberate and frozen by v1. */
function pickMarks(pool, count, rng) {
  const bag = [...pool]; let out = '';
  for (let i = 0; i < count; i++) out += bag.splice(Math.floor(rng() * bag.length), 1)[0];
  return out;
}
function frameText(text) { return DATA.frame.prefix + text + DATA.frame.suffix; }
function unframeText(text) {
  return text.startsWith(DATA.frame.prefix) && text.endsWith(DATA.frame.suffix)
    ? text.slice(DATA.frame.prefix.length, -DATA.frame.suffix.length) : text;
}
/**
 * Style ASCII letters/digits and append marks. Non-ASCII grapheme clusters pass through.
 * strict=true accepts printable ASCII plus TAB/LF/CR only, giving exact text round trips.
 */
function encode(text, options = {}) {
  textArg(text, 'source', LIMITS.source);
  const o = optionsArg(options);
  if (o.strict && /[^\x20-\x7E\t\n\r]/u.test(text))
    throw new RangeError('Strict mode accepts printable ASCII plus tab and line breaks only.');
  const rng = seeded(o.seed); let result = '', glyph = 0, word = -1, insideWord = false;
  for (const cluster of segments(text)) {
    const eligible = /^[A-Za-z0-9]$/.test(cluster);
    if (!eligible) { result += cluster; insideWord = false; continue; }
    if (!insideWord) { word++; insideWord = true; }
    let family = o.font;
    if (o.mode === 'cycle-letter') family = o.palette[glyph % o.palette.length];
    if (o.mode === 'cycle-word') family = o.palette[word % o.palette.length];
    if (o.mode === 'random-letter') family = o.palette[Math.floor(rng() * o.palette.length)];
    glyph++;
    const base = FONTS[family].map[cluster];
    // Families without digits keep ASCII digits undecorated, not borrowed from a different face.
    if (!base) { result += cluster; continue; }
    result += base + pickMarks(MARKS.overlay, o.overlay, rng)
      + pickMarks(MARKS.above, o.above, rng) + pickMarks(MARKS.below, o.below, rng);
  }
  return o.frame ? frameText(result) : result;
}
/**
 * Recover readable text by reversing only our known alphabets and their adjacent mark allowlist.
 * Does not globally normalize or delete combining marks from ordinary text/emoji.
 * Original styling/accent intent on a known styled base cannot be inferred from naked text.
 */
function decode(text, {stripFrame = true, strictOutput = false} = {}) {
  textArg(text);
  if (typeof stripFrame !== 'boolean' || typeof strictOutput !== 'boolean') throw new TypeError('Decoder flags must be booleans.');
  const chars = Array.from(stripFrame ? unframeText(text) : text); let out = '';
  for (let i = 0; i < chars.length; i++) {
    const plain = reverse.get(chars[i]);
    if (plain === undefined) { out += chars[i]; continue; }
    out += plain;
    while (i + 1 < chars.length && isMark.test(chars[i + 1])) {
      const mark = chars[++i]; if (!ownedMarks.has(mark)) out += mark;
    }
  }
  if (strictOutput && /[^\x20-\x7E\t\n\r]/u.test(out))
    throw new RangeError('Decoded text contains characters outside the strict ASCII domain.');
  return out;
}
function specimen({frame = false} = {}) {
  if (typeof frame !== 'boolean') throw new TypeError('frame must be a boolean.');
  return frame ? frameText(ORIGINAL.encoded) : ORIGINAL.encoded;
}
/** An explicit sidecar keeps source, settings and the exact encoded sequence. Nothing is hidden. */
function pack(source, options = {}) {
  const settings = optionsArg(options);
  const encoded = encode(source, settings);
  return {format: 'diacritic-bloom', version: 1, kind: 'generated', source, settings, encoded};
}
function specimenPacket({frame = false} = {}) {
  return {format: 'diacritic-bloom', version: 1, kind: 'specimen', source: ORIGINAL.plain,
    settings: {frame}, encoded: specimen({frame})};
}
/** Validate before accepting a saved recipe. Returns a new object; never executes imported content. */
function unpack(value) {
  let p = value;
  if (typeof p === 'string') { textArg(p, 'packet', LIMITS.packet); p = JSON.parse(p); }
  if (!p || typeof p !== 'object' || Array.isArray(p) || p.format !== 'diacritic-bloom' || p.version !== 1)
    throw new TypeError('Not a supported Diacritic Bloom v1 packet.');
  textArg(p.source, 'source', LIMITS.source); textArg(p.encoded);
  let rebuilt;
  if (p.kind === 'generated') rebuilt = pack(p.source, p.settings);
  else if (p.kind === 'specimen') {
    if (!p.settings || typeof p.settings.frame !== 'boolean') throw new TypeError('Invalid specimen settings.');
    rebuilt = specimenPacket(p.settings);
  } else throw new TypeError('Unknown packet kind.');
  if (rebuilt.source !== p.source || rebuilt.encoded !== p.encoded)
    throw new Error('Recipe validation failed: source, settings and encoded text disagree.');
  return rebuilt;
}
function codepoint(ch) { return 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'); }
function inspect(text, limit = 48) {
  textArg(text); integer(limit, 'limit', 1, 256);
  return segments(text).slice(0, limit).map((cluster, index) => ({
    index, cluster, characters: Array.from(cluster, ch => ({
      character: ch, codepoint: codepoint(ch),
      name: DATA.markInfo[ch]?.name ?? DATA.baseNames[ch] ??
        (ch === ' ' ? 'SPACE' : ch === '\n' ? 'LINE FEED' : ch === '\t' ? 'TAB' : 'CHARACTER'),
      layer: MARKS.overlay.includes(ch) ? 'through' : MARKS.above.includes(ch) ? 'above / upper-right'
        : MARKS.below.includes(ch) ? 'below' : DATA.markInfo[ch] ? 'specimen mark' : 'base / passthrough',
      combiningClass: DATA.markInfo[ch]?.ccc ?? null
    }))
  }));
}
function stats(text) {
  textArg(text);
  return {graphemes: segments(text).length, codepoints: Array.from(text).length,
    utf16: text.length, utf8: new TextEncoder().encode(text).length,
    combiningMarks: Array.from(text).filter(ch => isMark.test(ch)).length};
}
const Bloom = Object.freeze({VERSION,FONTS,MARKS,ORIGINAL,PROFILES,LIMITS,
  encode,decode,specimen,pack,unpack,specimenPacket,inspect,stats});

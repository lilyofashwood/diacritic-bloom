# ⟬ Diacritic Bloom ⟭
## Visual Unicode codec and styling specification · v1.0.0

**Design goal:** recreate the decorated Fraktur line “the diacritics are now free,” then let the same combining-mark architecture grow on other Unicode letter families. Provide a readable-text decoder and a separate, exact recipe format.

This is a specification for transforming text, not a new installable font. The “letter-body” is an existing Unicode character; the decoration is a sequence of combining characters appended to it. Actual glyph placement belongs to the receiving font and text-layout engine. [U1]

The codec is decorative, not cryptographic. There is no secret key, hidden message or steganographic transport layer. Seed values select visual variation only.

---

## 1. The two-layer construction

```text
plain source letter
  → select its styled Unicode counterpart
  → append an ordered combining-mark stack
  → display the resulting cluster
```

For the generated v1 format, each transformed unit is:

```text
cluster := styled_base + through_marks + above_marks + below_marks
```

The letters and the mark stack are independently selectable. “Above,” “through” and “below” are this application's visual grouping labels, not separate Unicode character categories. Some marks classified here with “above” attach at the upper right rather than directly over the center.

A displayed unit can contain several code points. Unicode's grapheme-cluster rules supply the units used by the encoder and the microscope. Do not count UTF-16 code units as if they were displayed characters. [U2]

## 2. The literal original specimen

The accompanying `original-specimen.txt` contains the exact unframed sequence, without an added newline. `specimen()` returns it verbatim. This is a stored specimen, not the output of an invented historical random seed.

𝔱̷̛̝̈́𝔥̶͖̈́𝔢̵̪͆ 𝔡̴̹̄𝔦̸̙̀𝔞̶̽͜𝔠̷̤͋𝔯̶̱͊𝔦̵̲̑𝔱̴̱͝𝔦̴̬͘𝔠̶͇̀𝔰̵̮͝ 𝔞̵̢͛𝔯̴͍͝𝔢̴͉̀ 𝔫̷̪̌𝔬̷̼͂𝔴̵̯̉ 𝔣̷̛͖𝔯̸̯̈𝔢̶̱͆𝔢̶̠̔

Source: `the diacritics are now free`

The optional original frame is independent of the encoded text:

```text
prefix: ꧁𓆙𓇼꧂␠
suffix: ␠꧁𓇼𓆙꧂
```

Here `␠` documents an ordinary U+0020 space; the visible `␠` symbol is not inserted.

### Exact anatomy of its first decorated letter

```javascript
const firstGlyph = "\u{1D531}\u0337\u0344\u031B\u031D";
```

| Code point | Character role |
| :--- | :--- |
| U+1D531 | MATHEMATICAL FRAKTUR SMALL T: the letter-body |
| U+0337 | COMBINING SHORT SOLIDUS OVERLAY: diagonal stroke |
| U+0344 | COMBINING GREEK DIALYTIKA TONOS: above decoration |
| U+031B | COMBINING HORN: upper-right attachment |
| U+031D | COMBINING UP TACK BELOW: lower decoration |

These character names come from Unicode's character listings. [U3] [U4]

The stored phrase comprises **27 grapheme clusters, 97 code points, 120 UTF-16 code units, 236 UTF-8 bytes and 70 combining marks** in the tested runtime. Its first cluster has one styled base and four combining marks. These counts exclude its optional frame.

The original is not completely uniform: most letters have three marks, and the first has four. Its U+0344 mark decomposes canonically into U+0308 + U+0301; U+0340 decomposes to U+0300. Normalization can therefore change its code-point sequence even while preserving canonical equivalence. The original also contains double diacritics U+035C and U+035D, which may span neighboring letters visually. These historical choices are preserved literally, not reused in the random-generation pools. [U4] [U5]

### Swap only the letter-body

```javascript
const stack = "\u0337\u0344\u031B\u031D";
const samples = ["𝔱", "𝓽", "𝕥", "𝚝", "ｔ"].map(base => base + stack);
console.log(samples.join("   "));
```

The mark sequence is identical for all five samples. Their pixels need not be: letter shape, anchor support and layout-engine behavior affect placement. [U1]

## 3. Supported source domain

**Exact, raw-text round-trip domain:** U+0020 through U+007E, plus U+0009 TAB, U+000A LF and U+000D CR. Activate `strict: true` to reject other source text rather than silently transliterating it.

Within that domain, ASCII letters A–Z and a–z are styled. ASCII digits 0–9 are styled only when the selected family has a native digit set. Unsupported digits remain ordinary, undecorated ASCII. Punctuation, whitespace and case are preserved.

With `strict: false`, other grapheme clusters pass through unchanged. This means a composed accented letter, a decomposed letter-plus-accent cluster, an emoji sequence, a keycap, or non-Latin text is not restyled. No accent is stripped during encoding. A source string containing pre-existing styled symbols can nevertheless be ambiguous to the later plain-text decoder. Section 7 describes the limits and section 8 provides exact preservation.

Unpaired UTF-16 surrogates are rejected. Source input is limited to 20,000 UTF-16 code units; encoded input is limited to 300,000. These are application resource limits, not Unicode limits.

## 4. Letter families

The complete source-to-target mappings are normative in `tables.json`, under `fonts`. There are 14 families and 788 mapped base characters. Each mapped character is an existing Unicode scalar value. The Fraktur, script and double-struck alphabets have historical exceptions in the Letterlike Symbols block; simple arithmetic offsets alone are insufficient for all letters. [U3] [U6]

| Family ID | Sample | Native digits |
| :--- | :--- | :--- |
| `fraktur` | 𝔄𝔟𝔠 | No |
| `bold-fraktur` | 𝕬𝖇𝖈 | No |
| `script` | 𝒜𝒷𝒸 | No |
| `bold-script` | 𝓐𝓫𝓬 | No |
| `double-struck` | 𝔸𝕓𝕔 | Yes |
| `bold` | 𝐀𝐛𝐜 | Yes |
| `italic` | 𝐴𝑏𝑐 | No |
| `bold-italic` | 𝑨𝒃𝒄 | No |
| `sans` | 𝖠𝖻𝖼 | Yes |
| `sans-bold` | 𝗔𝗯𝗰 | Yes |
| `sans-italic` | 𝘈𝘣𝘤 | No |
| `sans-bold-italic` | 𝘼𝙗𝙘 | No |
| `monospace` | 𝙰𝚋𝚌 | Yes |
| `fullwidth` | Ａｂｃ | Yes |

### Fraktur mapping used by the original

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZ
𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ

abcdefghijklmnopqrstuvwxyz
𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷
```

The original uses **regular mathematical Fraktur**, not bold Fraktur. Mapping preserves case. Fonts without a native digit set do not borrow one from another family.

### Font mixing

`mode` accepts `single`, `cycle-letter`, `cycle-word`, or `random-letter`.

`single` uses the selected `font`. Other modes use the ordered `palette`, whose default is:

```json
["fraktur", "bold-script", "double-struck", "monospace"]
```

For mixing, a candidate is a grapheme cluster consisting of exactly one ASCII letter or digit. The letter counter advances for each candidate, including a digit that the chosen family cannot style. The word counter advances upon entering a run of such candidates; any other cluster ends the run. This is a deliberate, simple codec rule, not a natural-language word-boundary algorithm.

`cycle-letter` indexes the palette with the letter counter modulo its length. `cycle-word` uses the word counter. `random-letter` draws an index with the seeded generator before drawing that candidate's marks. The library accepts custom palettes of 1–32 known family IDs. The browser UI starts with the four-family palette above; imported recipes can retain custom palettes.

## 5. Combining-mark architecture

The normative ordered pools are `tables.json` → `pools`. Their order is part of the reproducibility contract.

The generator has 5 through marks, 32 above/upper-right marks and 43 below marks. The decoder recognizes 84 distinct marks after including specimen-only marks and canonical decompositions.

The general generator uses single-base combining marks. It does not inject double diacritics, default-ignorable characters, bidirectional controls, zero-width joiners, variation selectors, or hidden payload characters. Existing unsupported source clusters are preserved, not filtered for security.

Marks are appended in the order **through → above → below**. Selection is without replacement within each layer of a cluster. The pool is reset for each layer of each new cluster.

```text
through ∈ 0..2 marks
above   ∈ 0..6 marks
below   ∈ 0..6 marks
sum     ≤ 12 added marks per styled base
```

The 12-mark ceiling is an application choice. It is not a claim that every destination app will support, retain or render that many marks correctly.

### Density presets

| Preset | Through | Above | Below | Total |
| :--- | ---: | ---: | ---: | ---: |
| dust | 0 | 1 | 1 | 2 |
| bloom | 1 | 2 | 1 | 4 |
| feral | 1 | 4 | 3 | 8 |
| overgrown | 1 | 6 | 5 | 12 |

`bloom` is the default generated profile. The literal original is its own specimen and does not claim to obey a fixed per-letter density.

## 6. Reproducible encoder algorithm

A seed is an integer from 0 through 4,294,967,295. The default is 12,648,430. The generator is Mulberry32, fully specified by `seeded()` in the source. It is **not** a cryptographic random-number generator.

```javascript
let state = seed >>> 0;
function next() {
  state = (state + 0x6D2B79F5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

Process source grapheme clusters left to right. Pass through noncandidate clusters unchanged. Choose the family according to section 4. Look up the candidate in that family's map. A missing digit is emitted unchanged, with no mark draws.

For each present styled base, copy each layer's pool, in through/above/below order. For each requested mark, compute `floor(next() * remainingPoolLength)`, append that element, then remove it from that temporary pool. Concatenate the results after the base. Add the optional frame only after finishing the entire text.

Do not normalize the input, output or saved literal specimen inside this algorithm. Identical source, version, tables, palette, seed, mode and counts produce identical generated code-point sequences. The seed alone does not identify a complete recipe.

## 7. Decoder contract

```text
decode(encode(source, settings)) == source
```

This guarantee applies to strict-domain source text generated by the corresponding v1 encoder, with the optional frame correctly recognized. It also holds for that output after NFC/NFD in the included tests. It does not promise recovery after arbitrary platform transformations.

The decoder builds an inverse map from the explicit family tables. It reads code points, not JavaScript `split("")` halves of surrogate pairs. For a recognized styled base, it emits the corresponding ASCII character and consumes the immediately following combining marks. It drops only recognized codec marks and keeps any other combining marks. A base not in the inverse map and its marks remain untouched.

The recognized mark set includes the generator pools, literal-specimen marks and their canonical-decomposition closure. This lets the decoder recognize the specimen after decomposition of U+0344 and U+0340.

By default, it removes the optional ornamental frame only when the exact prefix and suffix both match at the outer edges. `stripFrame: false` preserves the frame. No general removal of ornament, emoji, script marks or invisible characters is performed.

### What the plain-text decoder cannot infer

The unadorned words do not reveal the source's original font choice, seed, or intended decorative mark sequence. If the source already contained `ℝ` or `𝔄`, the decoder cannot tell those apart from symbols created by the encoder. Similarly, an intentional accent on a recognized styled base may be indistinguishable from decoration. This is why raw styled text is not an arbitrary-Unicode lossless container.

The decoder deliberately does **not** globally apply NFKD and erase every combining mark. That would transform unrelated compatibility symbols and could destroy meaningful language marks or emoji components. For a saved exact source, use a recipe instead.

### Normalization boundary

NFC and NFD use canonical equivalences; they can reorder or decompose marks. NFKC and NFKD additionally apply compatibility mappings, including the mathematical alphabet mappings to ordinary letters. Once that styled-base identity has been erased, the conservative decoder does not guess whether marks on ordinary ASCII are decorative or linguistic. Exact saved output should be kept without normalization. [U5]

## 8. Explicit recipe format

A generated recipe is UTF-8 JSON:

```json
{
  "format": "diacritic-bloom",
  "version": 1,
  "kind": "generated",
  "source": "your ordinary words",
  "settings": {
    "font": "fraktur",
    "mode": "single",
    "palette": ["fraktur", "bold-script", "double-struck", "monospace"],
    "seed": 42,
    "overlay": 1,
    "above": 2,
    "below": 1,
    "strict": false,
    "frame": false
  },
  "encoded": "the actual generated Unicode sequence goes here"
}
```

The `encoded` field above is explanatory, not a valid fixture. Use `pack()` to create a consistent packet.

The literal specimen uses `kind: "specimen"` and `settings: {"frame": false}` or `true`. Its stored output must match the original specimen exactly.

`unpack()` validates structure, version, types and limits, then regenerates the declared output and compares source and encoded strings. It rejects inconsistent recipes rather than silently accepting altered glyphs. This is a consistency check, **not** authentication or cryptographic tamper protection. A deliberately rewritten but internally consistent recipe is still valid.

The original source is saved openly in the JSON. This is not a hidden payload. The imported packet is never evaluated as code. `unpack(packet).source` restores the original source; `unpack(packet).encoded` restores its exact saved decoration.

## 9. JavaScript API

```javascript
import {
  encode, decode, specimen, pack, unpack, inspect, stats
} from "./bloom.mjs";

const source = "the diacritics are now free";
const encoded = encode(source, {
  font: "fraktur",
  seed: 42,
  overlay: 1,
  above: 2,
  below: 1,
  strict: true
});

console.log(encoded);
console.log(decode(encoded));
console.assert(decode(encoded) === source);

// The original has its own literal code-point sequence.
console.log(specimen());
console.log(inspect(specimen(), 1));

// Explicit preservation for source plus exact decoration.
const saved = JSON.stringify(pack("ℝ, café and 👾", {font: "bold-script", seed: 9}));
const restored = unpack(saved);
console.log(restored.source);   // ℝ, café and 👾
console.log(restored.encoded);  // The exact saved generated sequence.
console.log(stats(restored.encoded));
```

The module has no package dependencies. It requires JavaScript Unicode property escapes, `Intl.Segmenter`, `TextEncoder` and ordinary ES-module support. The included CLI and test runner use Node's standard library. The standalone HTML embeds the same module logic and does not require a server or an import from a neighboring file.

## 10. Browser workshop

Open `diacritic-bloom.html` in a browser that permits local HTML scripts. Source and controls update the encoded preview. The original button restores the exact specimen; changing the source or generation controls starts a new generated bloom.

The page provides 14 family choices, font mixing, layer counts, density presets, seeded regeneration, an optional frame, a plain reading view, encoding/decoding, a code-point microscope, clipboard copying, encoded-text export, and JSON recipe export/import. Everything runs in the page. No text is uploaded and no remote libraries, font files or images are fetched. External Unicode reference links load only when deliberately followed.

The page includes ordinary-text labels and a plain reading view. These accommodations do not make decorative mathematical text universally accessible; use ordinary text alongside art when reliable reading, searching or assistive-technology output matters. Unicode assigns these mathematical alphabets semantic roles and recommends normal letters plus markup for ordinary prose. [U3]

## 11. Rendering and transport expectations

The exact code points are reproducible; the exact pixels are not. Font coverage, combining-mark anchors, fallback and layout-engine support affect the result. [U1] Tall stacks may collide with neighboring lines or be clipped by a host container. The workshop leaves extra vertical room, but cannot control another app's layout.

Keep exact specimen text in UTF-8 files or the recipe's encoded field. Keep the source and settings too. Do not assume a social platform, clipboard intermediary or editor preserves every sequence unchanged. After transporting a recipe, verify it with `unpack()` before relying on exact reproduction.

## 12. Test and version policy

Run `node --test bloom.test.mjs` to exercise the source module. The included tests cover all printable ASCII, all 14 families, all profiles, all mixing modes, multiple seeds, randomized inputs, normalization, styled-letter exceptions, emoji, decomposed accents, frame handling, invalid input and recipe replay.

Version 1 freezes alphabet maps, pool contents/order, generation order, mixing counters, the PRNG, the literal specimen and decoder behavior. Any change that changes generated code points for the same settings requires a new codec version. Visual CSS refinements can be made without changing the encoding contract.

The actual environment and observed test results are recorded in `TESTING.md`.

---

## Unicode references

[U1]: https://www.unicode.org/faq/char_combmark.html "Unicode FAQ: Characters and Combining Marks"
[U2]: https://www.unicode.org/reports/tr29/ "Unicode Standard Annex #29: Unicode Text Segmentation"
[U3]: https://www.unicode.org/charts/nameslist/n_1D400.html "Unicode character listing: Mathematical Alphanumeric Symbols"
[U4]: https://www.unicode.org/charts/nameslist/n_0300.html "Unicode character listing: Combining Diacritical Marks"
[U5]: https://www.unicode.org/reports/tr15/ "Unicode Standard Annex #15: Unicode Normalization Forms"
[U6]: https://www.unicode.org/charts/nameslist/n_2100.html "Unicode character listing: Letterlike Symbols"

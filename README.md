# Diacritic Bloom

A local Unicode workshop for styling letter-bodies, stacking combining marks, and recovering the words underneath.

## Start here

Open **diacritic-bloom.html** in a browser that permits local HTML JavaScript. It is self-contained: no installation, network requests or neighboring files are required by the app. The default output is the exact original “the diacritics are now free” specimen.

Use **Your exact original** to restore that sequence. Edit text or controls to make a seeded variation. **Copy bloom** copies the actual Unicode text, not an image. **Use current bloom** sends it to the decoder. **Save recipe .json** saves source, settings and exact decoration; **Open recipe** validates and restores them.

The full specification is in **SPEC.md**. The complete alphabet and mark tables are in **tables.json**. No font files are included or required.

## Included files

- `diacritic-bloom.html`: standalone browser encoder, decoder and code-point inspector.
- `SPEC.md`: rendering recipe, exact original, decoder limits, seeded algorithm and packet format.
- `bloom.mjs`: dependency-free JavaScript ES module.
- `cli.mjs`: Node command-line encoder and decoder.
- `tables.json`: 14 letter-family maps and ordered combining-mark pools.
- `original-specimen.txt`: exact unframed original, with no appended newline.
- `original-recipe.json`: source plus exact original in the validated recipe format.
- `specimen-clusters.json`: the original split into base-plus-mark units.
- `test-vectors.json`: fixed regression vectors.
- `bloom.test.mjs`: 27 source-module tests, including exhaustive profile/family combinations and randomized round trips.
- `TESTING.md`: actual checks, runtime versions and limitations.
- `src/` and `build.mjs`: maintainable browser/core source and rebuild script.

## Module example

```javascript
import {encode, decode, specimen} from './bloom.mjs';

const source = 'the diacritics are now free';
const bloom = encode(source, {
  font: 'fraktur', seed: 42,
  overlay: 1, above: 2, below: 1,
  strict: true
});
console.log(bloom);
console.log(decode(bloom));
console.assert(decode(bloom) === source);
console.log(specimen()); // The original stored sequence, not a random approximation.
```

## Command line

Tested with Node 22.16.0. No package installation is needed.

```sh
printf 'kettle resurrection' | node cli.mjs encode --font bold-script --seed 42
node cli.mjs decode < bloom.txt
node cli.mjs specimen > original.txt
node cli.mjs unpack --field source < bloom-recipe.json
node --test bloom.test.mjs
node build.mjs
```

## Preservation boundary

Plain text in the strict domain, printable ASCII plus tab and line breaks, round-trips exactly through this codec. Other clusters pass through during encoding, but pre-existing styled symbols can be ambiguous when decoded. Recipe files openly preserve the original source and exact output, avoiding that ambiguity. Recipe validation is a consistency check, not authentication.

Do not globally normalize exact specimens or remove all combining marks from arbitrary Unicode text. Glyph placement differs across fonts, browsers and applications. The same characters are reproducible; pixel-identical display everywhere is not promised. This is decorative encoding, not encryption or a hidden-payload cipher.

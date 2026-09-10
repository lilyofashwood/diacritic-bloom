/** Rebuild the standalone HTML and ES module from the readable source and tables. */
import {readFileSync, writeFileSync} from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const write = (path, data) => writeFileSync(new URL(path, import.meta.url), data, 'utf8');
const data = 'const DATA = ' + JSON.stringify(JSON.parse(read('./tables.json'))) + ';\n';
const core = data + read('./src/core.js');
const exports = '\nexport { VERSION, FONTS, MARKS, ORIGINAL, PROFILES, LIMITS, encode, decode, specimen, pack, unpack, specimenPacket, inspect, stats };\nexport default Bloom;\n';
write('./bloom.mjs', core + exports);
write('./diacritic-bloom.html', read('./src/page.html')
  .replace('/*__BLOOM_CORE__*/', core)
  .replace('/*__BLOOM_UI__*/', read('./src/ui.js')));
console.log('Built bloom.mjs and diacritic-bloom.html.');

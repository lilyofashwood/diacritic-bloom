import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from './bloom.mjs';
const printable = Array.from({length:95},(_,i)=>String.fromCharCode(i+32)).join('');
const pangram = 'Sphinx of black quartz, judge my vow! 0123456789\nABC xyz\t\r';

test('exact original specimen recovers its source',()=>{
  assert.equal(B.decode(B.specimen()), B.ORIGINAL.plain);
  assert.equal(B.decode(B.specimen({frame:true})), B.ORIGINAL.plain);
  assert.equal(B.specimen(), B.ORIGINAL.encoded);
  assert.deepEqual(Array.from(B.specimen()).slice(0,5).map(c=>c.codePointAt(0)),[0x1D531,0x0337,0x0344,0x031B,0x031D]);
});
test('all 14 families, all printable ASCII, every profile and all mixing modes',()=>{
  for(const font of Object.keys(B.FONTS)) for(const profile of Object.values(B.PROFILES))
    for(const mode of ['single','cycle-letter','cycle-word','random-letter'])
      for(const seed of [0,1,42,0xFFFFFFFF]){
        const source=printable+'\n\t\r'+pangram;
        const options={font,...profile,mode,seed,strict:true,frame:true};
        const encoded=B.encode(source,options);
        assert.equal(B.decode(encoded,{strictOutput:true}),source,JSON.stringify(options));
      }
});
test('exact recovery after NFC and NFD normalization of generated output',()=>{
  for(const font of Object.keys(B.FONTS))for(const form of ['NFC','NFD']){
    const encoded=B.encode(pangram,{font,...B.PROFILES.overgrown});
    assert.equal(B.decode(encoded.normalize(form)),pangram,`${font}/${form}`);
  }
});
test('literal original NFC and NFD are decodable, but not code-point-identical',()=>{
  for(const form of ['NFC','NFD']){
    assert.notEqual(B.specimen().normalize(form), B.specimen());
    assert.equal(B.decode(B.specimen().normalize(form)), B.ORIGINAL.plain);
  }
});
test('known alphabet entries all have the intended Unicode compatibility mapping',()=>{
  for(const f of Object.values(B.FONTS))for(const [plain,styled]of Object.entries(f.map))
    assert.equal(styled.normalize('NFKD'),plain);
});
test('historical letterlike exceptions are correctly mapped',()=>{
  assert.equal(B.encode('CHIRZ',{font:'fraktur',overlay:0,above:0,below:0}),'ℭℌℑℜℨ');
  assert.equal(B.encode('BEFHILMRego',{font:'script',overlay:0,above:0,below:0}),'ℬℰℱℋℐℒℳℛℯℊℴ');
  assert.equal(B.encode('h',{font:'italic',overlay:0,above:0,below:0}),'ℎ');
});
test('digits missing from a family remain undecorated ASCII',()=>{
  assert.equal(B.encode('0123',{font:'fraktur'}),'0123');
  assert.equal(B.encode('0123',{font:'fullwidth',overlay:0,above:0,below:0}),'０１２３');
});
test('emoji, keycaps, accented letters and non-Latin clusters pass through',()=>{
  const s='café cafe\u0301 mañana नमस्ते العربية 日本語 👩‍🔬 ❤️‍🔥 1️⃣ 🏳️‍🌈 🐈\n';
  for(const font of Object.keys(B.FONTS))assert.equal(B.decode(B.encode(s,{font})),s);
});
test('decoder does not globally strip linguistic combining marks',()=>{
  const s='e\u0301 x\u0331 अं ❤️ 1️⃣'; assert.equal(B.decode(s),s);
});
test('unknown marks on a known styled base are preserved',()=>{
  assert.equal(B.decode('𝔞\u0483\u0337'),'a\u0483');
});
test('existing styled source is explicitly lossy as plain text, preserved in a recipe',()=>{
  const s='ℝ + 𝔄 + café\u0301'; const p=B.pack(s);
  assert.notEqual(B.decode(p.encoded),s);
  assert.equal(B.unpack(JSON.stringify(p)).source,s);
});
test('seed determinism and seed variation',()=>{
  assert.equal(B.encode(pangram,{seed:99}),B.encode(pangram,{seed:99}));
  assert.notEqual(B.encode(pangram,{seed:99}),B.encode(pangram,{seed:100}));
});
test('formatting is not applied to whitespace and punctuation',()=>{
  const s=' \n\t\r!@#$%^&*()[]{}:;,.<>/?\\|_+-=\"\'';
  assert.equal(B.encode(s),s); assert.equal(B.decode(B.encode(s)),s);
});
test('zero intensity maps bases without adding marks',()=>{
  assert.equal(B.encode('cat',{overlay:0,above:0,below:0}),'𝔠𝔞𝔱');
});
test('frame removal requires an exact pair at both edges',()=>{
  const e=B.specimen({frame:true});assert.equal(B.decode(e,{stripFrame:false}),'꧁𓆙𓇼꧂ '+B.ORIGINAL.plain+' ꧁𓇼𓆙꧂');
  assert.ok(B.decode('x'+e).startsWith('x꧁'));assert.ok(B.decode(e+'x').endsWith('꧂x'));
});
test('empty and multiline input',()=>{
  assert.equal(B.encode(''),'');assert.equal(B.decode(''),'');
  assert.equal(B.decode(B.encode('\n\n\t\r')),'\n\n\t\r');
});
test('strict input rejects unsupported text without silent data loss',()=>{
  assert.throws(()=>B.encode('café',{strict:true}),/Strict/);
  assert.throws(()=>B.encode('hello\u0000',{strict:true}),/Strict/);
  assert.throws(()=>B.decode('🌱',{strictOutput:true}),/ASCII/);
});
test('invalid types, options and limits fail explicitly',()=>{
  assert.throws(()=>B.encode(null),TypeError);
  assert.throws(()=>B.encode('a',{seed:-1}),RangeError);
  assert.throws(()=>B.encode('a',{seed:1.2}),RangeError);
  assert.throws(()=>B.encode('a',{font:'fake'}),RangeError);
  assert.throws(()=>B.encode('a',{palette:[]}),RangeError);
  assert.throws(()=>B.encode('a',{above:6,below:6,overlay:2}),RangeError);
  assert.throws(()=>B.encode('a',{strict:'true'}),TypeError);
  assert.throws(()=>B.encode('a',{fonts:'script'}),TypeError);
  assert.throws(()=>B.encode('a'.repeat(B.LIMITS.source+1)),RangeError);
  assert.throws(()=>B.encode('\uD800'),TypeError);
});
test('generated recipes replay exactly',()=>{
  const p=B.pack(pangram,{font:'script',seed:777,mode:'random-letter',...B.PROFILES.feral});
  assert.deepEqual(B.unpack(JSON.stringify(p)),p);
  assert.equal(B.encode(p.source,p.settings),p.encoded);
});
test('literal specimen recipes preserve exact source and encoded sequence',()=>{
  const p=B.specimenPacket({frame:true});assert.deepEqual(B.unpack(JSON.stringify(p)),p);
});
test('tampered recipes are rejected rather than silently decoded',()=>{
  const p=B.pack('hello');p.encoded+='x';assert.throws(()=>B.unpack(p),/validation/);
  assert.throws(()=>B.unpack('{'),SyntaxError);
  assert.throws(()=>B.unpack({format:'wrong',version:1}),/supported/);
});
test('inspector exposes first-cluster anatomy and five code points',()=>{
  const first=B.inspect(B.specimen(),1)[0];assert.equal(first.characters.length,5);
  assert.equal(first.characters[0].name,'MATHEMATICAL FRAKTUR SMALL T');
  assert.equal(first.characters[2].codepoint,'U+0344');
});
test('stats distinguish graphemes, code points, UTF-16 and UTF-8',()=>{
  assert.deepEqual(B.stats(B.specimen()),{graphemes:27,codepoints:97,utf16:120,utf8:236,combiningMarks:70});
});
test('no newly inserted default-ignorable characters',()=>{
  const generated=B.encode(pangram,{...B.PROFILES.overgrown,mode:'random-letter'});
  assert.equal(/\p{Default_Ignorable_Code_Point}/u.test(generated),false);
});
test('family and mark tables are frozen',()=>{
  assert.throws(()=>{B.FONTS.fraktur.map.a='z';},TypeError);
  assert.throws(()=>{B.MARKS.above.push('x');},TypeError);
});
test('randomized printable ASCII round-trip fuzz checks',()=>{
  let state=42; const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state;};
  const fonts=Object.keys(B.FONTS);
  for(let k=0;k<500;k++){
    let source='';for(let i=0;i<80;i++)source+=String.fromCharCode(32+rand()%95);
    const e=B.encode(source,{font:fonts[rand()%fonts.length],seed:rand(),above:rand()%7,below:rand()%5,overlay:1});
    assert.equal(B.decode(e),source);
  }
});

test('saved golden vectors match generated and literal output exactly',async()=>{
  const {readFileSync}=await import('node:fs');
  const vectors=JSON.parse(readFileSync(new URL('./test-vectors.json',import.meta.url),'utf8'));
  for(const v of vectors)assert.deepEqual(B.unpack(v),v);
});

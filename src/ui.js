'use strict';
window.Bloom = Bloom;
const $ = id => document.getElementById(id);
let literal = true, currentPacket = null, currentWire = '', selectedGlyph = 0;
let currentPalette = ['fraktur','bold-script','double-struck','monospace'];
for (const [id, f] of Object.entries(Bloom.FONTS)) {
  const option = document.createElement('option'); option.value = id;
  option.textContent = f.label + ' · ' + Array.from('Abc').map(c => f.map[c]).join(''); $('font').append(option);
}
function settings() {
  return {font: $('font').value, mode: $('mode').value, seed: Number($('seed').value),
    above: Number($('above').value), overlay: Number($('overlay').value), below: Number($('below').value),
    frame: $('frame').checked, strict: $('strict').checked, palette: currentPalette};
}
function setSettings(s) {
  for (const id of ['font','mode','seed','above','overlay','below']) $(id).value = s[id];
  $('frame').checked = s.frame; $('strict').checked = s.strict; currentPalette = [...s.palette];
}
function announce(text) { $('toast').textContent = text; }
function drawGlyph(item) {
  $('glyph-big').textContent = item?.cluster ?? '∅'; $('cp-list').replaceChildren();
  if (!item) return;
  for (const c of item.characters) {
    const row = document.createElement('div'); row.className = 'cp';
    const code = document.createElement('code'); code.textContent = c.codepoint;
    const name = document.createElement('span'); name.textContent = c.name;
    const sub = document.createElement('em'); sub.textContent = c.layer + (c.combiningClass === null ? '' : ' · ccc ' + c.combiningClass);
    name.append(sub); row.append(code,name); $('cp-list').append(row);
  }
}
function microscope() {
  const items = Bloom.inspect(currentWire, 64).filter(x => !/^\s+$/u.test(x.cluster)).slice(0,24);
  selectedGlyph = Math.min(selectedGlyph, Math.max(0,items.length - 1)); $('chips').replaceChildren();
  for (let i=0; i<items.length; i++) {
    const btn = document.createElement('button'); btn.textContent = items[i].cluster;
    btn.setAttribute('aria-label', `Inspect cluster ${i+1}: ${items[i].characters.map(c => c.codepoint).join(' ')}`);
    btn.setAttribute('aria-pressed', String(i === selectedGlyph));
    btn.onclick = () => { selectedGlyph=i; for (const b of $('chips').children) b.setAttribute('aria-pressed','false'); btn.setAttribute('aria-pressed','true'); drawGlyph(items[i]); };
    $('chips').append(btn);
  }
  drawGlyph(items[selectedGlyph]);
}
function paintReadingView() {
  $('bloom').textContent = $('plain-view').checked ? Bloom.decode(currentWire) : currentWire;
  $('bloom').classList.toggle('plain', $('plain-view').checked);
}
function render() {
  $('error').textContent = '';
  $('palette-hint').textContent = 'Mixed palette: ' + currentPalette.map(id => Bloom.FONTS[id].label).join(' → ') + '.';
  for (const id of ['above','overlay','below']) $(id+'-value').textContent = $(id).value;
  try {
    const p = literal ? Bloom.specimenPacket({frame:$('frame').checked}) : Bloom.pack($('source').value, settings());
    currentPacket = p; currentWire = p.encoded; $('wire').value = currentWire; paintReadingView();
    $('accessible-output').textContent = Bloom.decode(currentWire);
    $('render-mode').textContent = literal ? 'LITERAL SPECIMEN' : 'SEEDED BLOOM';
    const n = Bloom.stats(currentWire); $('stats').replaceChildren();
    for (const label of [`${n.graphemes} clusters`,`${n.codepoints} code points`,`${n.utf8} UTF-8 bytes`,`${n.combiningMarks} marks`]) {
      const span = document.createElement('span'); span.textContent = label; $('stats').append(span);
    }
    const exact = Bloom.decode(currentWire) === p.source;
    $('roundtrip').textContent = exact ? '✓ Plain-text recovery matches this source exactly.' : '△ Plain decoding changes original styling. Save the JSON recipe to preserve the exact source.';
    $('roundtrip').classList.toggle('warn',!exact); microscope();
    for (const id of ['copy','save-text','save-recipe','use-current']) $(id).disabled = false;
  } catch(e) {
    $('error').textContent = e.message;
    // Do not leave a stale bloom that appears to correspond to invalid settings.
    currentPacket=null; currentWire=''; $('bloom').textContent=''; $('wire').value=''; $('accessible-output').textContent=''; $('stats').replaceChildren(); $('roundtrip').textContent=''; microscope();
    for (const id of ['copy','save-text','save-recipe','use-current']) $(id).disabled = true;
  }
}
function decodePanel() {
  try { $('decoded').textContent=Bloom.decode($('decode-input').value); $('decode-error').textContent=''; }
  catch(e) { $('decoded').textContent=''; $('decode-error').textContent=e.message; }
}
async function copyText(text, field = null) {
  try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text); return true; }
  catch {
    const temp=document.createElement('textarea'); temp.value=text; temp.style.position='fixed'; temp.style.top='0'; temp.style.left='-9999px'; document.body.append(temp); temp.focus(); temp.select();
    let copied=false; try { copied=document.execCommand('copy'); } catch {} temp.remove();
    if (copied) return true;
    if (field) { $('wire-details').open=true; field.focus(); field.select(); }
    return false;
  }
}
function downloadText(text, filename, type) {
  const url=URL.createObjectURL(new Blob([text],{type})); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function freshSeed() {
  const v=new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(v); else v[0]=Math.floor(Math.random()*4294967296);
  return v[0];
}
for (const id of ['source','font','mode','seed','above','overlay','below','strict']) {
  $(id).addEventListener(id==='font'||id==='mode'||id==='strict'?'change':'input', ()=>{
    literal=false;
    if (['above','overlay','below'].includes(id)) {
      const total=Number($('above').value)+Number($('overlay').value)+Number($('below').value);
      if (total>12) { $(id).value=Number($(id).value)-(total-12); announce('Stack capped at 12 added marks per styled character.'); }
    }
    render();
  });
}
$('frame').addEventListener('change',render);
$('plain-view').addEventListener('change',paintReadingView);
$('mutate').onclick=()=>{ literal=false; $('seed').value=freshSeed(); render(); announce('New seed. Same words, different growth.'); };
for (const button of document.querySelectorAll('[data-profile]')) button.onclick=()=>{
  const p=Bloom.PROFILES[button.dataset.profile]; for (const id of ['above','overlay','below']) $(id).value=p[id]; literal=false; render();
};
$('original').onclick=()=>{
  $('source').value=Bloom.ORIGINAL.plain; literal=true; selectedGlyph=0;
  setSettings({font:'fraktur',mode:'single',seed:12648430,above:2,overlay:1,below:1,frame:false,strict:false,palette:['fraktur','bold-script','double-struck','monospace']});
  render(); announce('Your exact original is restored. Sliders apply when you generate a new bloom.');
};
$('example').onclick=()=>{ $('source').value='the kettle has entered its\nornamental awakening phase'; $('font').value='bold-script'; literal=false; render(); };
$('copy').onclick=async()=>{ const ok=await copyText(currentWire,$('wire')); announce(ok?'Bloom copied.':'Encoded text selected below. Use your copy command.'); };
$('save-text').onclick=()=>{downloadText(currentWire,'bloom.txt','text/plain;charset=utf-8');announce('Encoded text exported.');};
$('save-recipe').onclick=()=>{if(currentPacket){downloadText(JSON.stringify(currentPacket,null,2)+'\n','bloom-recipe.json','application/json;charset=utf-8');announce('Recipe exported with exact source, settings and encoded text.');}};
$('load-recipe').onclick=()=>$('recipe-file').click();
$('recipe-file').onchange=async()=>{
  try {
    const file=$('recipe-file').files[0]; if(!file)return;
    if(file.size>Bloom.LIMITS.packet)throw new Error('Recipe file is too large.');
    const p=Bloom.unpack(await file.text()); $('source').value=p.source;
    literal=p.kind==='specimen';
    if(literal){$('frame').checked=p.settings.frame;}else setSettings(p.settings);
    selectedGlyph=0; render(); announce('Recipe restored and verified.');
  }catch(e){announce('Recipe not loaded: '+e.message);}finally{$('recipe-file').value='';}
};
$('decode-input').addEventListener('input',decodePanel);
$('use-current').onclick=()=>{$('decode-input').value=currentWire;decodePanel();};
$('copy-plain').onclick=async()=>{const ok=await copyText($('decoded').textContent);announce(ok?'Decoded words copied.':'Copy unavailable. Select and copy the decoded text.');};
$('source').value=Bloom.ORIGINAL.plain;
// Public launch routes select only existing UI presets, never source text or recipes.
const route=new URLSearchParams(location.search);
for(const id of ['font','mode']){
  const value=route.get(id);
  if(value&&Array.from($(id).options).some(option=>option.value===value)){$(id).value=value;literal=false;}
}
const profile=route.get('profile');
if(Object.hasOwn(Bloom.PROFILES,profile)){
  for(const id of ['above','overlay','below'])$(id).value=Bloom.PROFILES[profile][id];
  literal=false;
}
render();

// Node alternative to the preserved Python Playwright harness.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.BLOOM_CHROMIUM?{executablePath:process.env.BLOOM_CHROMIUM}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1365,height:1150}}),errors=[],network=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
    await page.goto(pathToFileURL(path.join(__dirname,'diacritic-bloom.html')).href);
    const narrative=async()=>assert.deepEqual(await page.evaluate(()=>{
      const skip=GardenPresentation.skipSelector+',#bloom,#decoded,#accessible-output,#chips,#glyph-big,#cp-list,#font option';
      const walker=document.createTreeWalker(document.body,4),leaks=[];
      while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement.getClientRects().length&&!n.parentElement.closest(skip)&&GardenPresentation.prose(n.data)!==n.data)leaks.push(n.data);}
      for(const e of document.querySelectorAll('[placeholder],[title]'))for(const name of ['placeholder','title'])if(/[A-Za-z]/.test(e.getAttribute(name)||''))leaks.push(e.id+':'+name);
      return leaks;
    }),[]);
    assert(!/[A-Za-z]/.test(await page.title()));
    assert.equal(await page.getAttribute('#source','aria-placeholder'),'what would you like to grow?');
    assert(!/[A-Za-z]/.test(await page.textContent('.spec-grid h3:nth-of-type(1)')));
    assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('#font option')].map(o=>[o.value,o.textContent.slice(o.textContent.lastIndexOf(' · ')+3)])),await page.evaluate(()=>Object.entries(Bloom.FONTS).map(([id,f])=>[id,Array.from('Abc').map(c=>f.map[c]).join('')])));
    await narrative();
    assert.equal(await page.inputValue('#wire'),fs.readFileSync(path.join(__dirname,'original-specimen.txt'),'utf8'));
    assert.equal(await page.locator('#font option').count(),14);
    console.log('PASS exact specimen and all 14 fonts load');
    const source='café cafe\u0301 👩‍🔬 1️⃣ hello';
    await page.fill('#source',source);await page.selectOption('#font','bold-script');await page.click('#use-current');
    assert.equal(await page.innerText('#decoded'),source);
    const before=await page.inputValue('#wire');await page.click('#mutate');assert.notEqual(await page.inputValue('#wire'),before);
    await page.check('#plain-view');assert.equal(await page.innerText('#bloom'),source);await page.uncheck('#plain-view');
    await page.selectOption('#mode','cycle-letter');await page.click('[data-profile=overgrown]');assert.equal(await page.innerText('#error'),'');
    console.log('PASS Unicode live roundtrip, mutation, mixed families and profiles');
    await page.check('#strict');assert.match((await page.innerText('#error')).normalize('NFKC'),/strict/i);assert(await page.isDisabled('#copy'));assert.equal(await page.inputValue('#wire'),'');await narrative();
    await page.uncheck('#strict');assert(!(await page.isDisabled('#copy')));
    console.log('PASS strict errors clear output and disable export');
    await page.click('#original');await page.check('#frame');await page.click('#use-current');
    const download=page.waitForEvent('download');await page.click('#save-recipe');
    const downloaded=await download,packet=JSON.parse(fs.readFileSync(await downloaded.path(),'utf8'));
    assert.equal(packet.kind,'specimen');assert(packet.settings.frame);
    await page.click('#example');await page.setInputFiles('#recipe-file',{name:'recipe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(packet))});
    await page.waitForFunction(()=>document.querySelector('#toast').textContent.normalize('NFKC').includes('restored and verified'));
    assert.equal(await page.inputValue('#wire'),packet.encoded);
    console.log('PASS recipe export/import reproduces exact framed specimen');
    await page.fill('#source','<img src=x onerror=alert(1)>');assert.equal(await page.locator('.bloom-display img').count(),0);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__copied=t;}}}));
    await page.click('#copy');await page.waitForFunction(()=>window.__copied===document.querySelector('#wire').value);
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked');}}});document.execCommand=()=>false;});
    await page.click('#copy');await page.waitForFunction(()=>document.querySelector('#wire-details').open);
    assert.match((await page.innerText('#toast')).normalize('NFKC'),/selected/);await narrative();
    console.log('PASS inert input, exact clipboard and blocked-clipboard fallback');
    await page.click('#original');assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
    await page.locator('details').evaluateAll(items=>items.forEach(item=>item.open=true));await narrative();
    fs.mkdirSync(path.join(__dirname,'test-artifacts'),{recursive:true});
    await page.screenshot({path:path.join(__dirname,'test-artifacts/desktop-current.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await page.screenshot({path:path.join(__dirname,'test-artifacts/mobile-current.png'),fullPage:true});
    console.log('PASS no page errors/network requests; 390px mobile has no page overflow');
    const target=pathToFileURL(path.join(__dirname,'diacritic-bloom.html')).href;
    for(const mode of ['single','cycle-letter','cycle-word','random-letter']){
      await page.goto(target+'?mode='+mode+'&font=bold-script&profile=feral');
      assert.equal(await page.inputValue('#mode'),mode);assert.equal(await page.inputValue('#font'),'bold-script');
      assert.deepEqual(await page.evaluate(()=>['above','overlay','below'].map(id=>Number(document.getElementById(id).value))),await page.evaluate(()=>['above','overlay','below'].map(id=>Bloom.PROFILES.feral[id])));
      await page.click('#use-current');assert.equal(await page.textContent('#decoded'),await page.inputValue('#source'));await narrative();
    }
    await page.goto(target+'?mode=unknown&font=__proto__&profile=constructor');
    assert.equal(await page.inputValue('#wire'),fs.readFileSync(path.join(__dirname,'original-specimen.txt'),'utf8'));await narrative();
    console.log('PASS allowlisted launch modes/fonts/profiles; invalid routes preserve original specimen');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

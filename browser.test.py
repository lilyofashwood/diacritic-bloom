from playwright.sync_api import sync_playwright
from pathlib import Path
import os, shutil
import json
ROOT=Path(__file__).resolve().parent
ARTIFACTS=ROOT/'test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
    executable=os.environ.get('BLOOM_CHROMIUM') or shutil.which('chromium') or shutil.which('google-chrome')
    browser=p.chromium.launch(headless=True,**({'executable_path':executable} if executable else {}))
    page=browser.new_page(viewport={'width':1365,'height':1150},device_scale_factor=1)
    errors=[]; requests=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url))
    page.set_content((ROOT/'diacritic-bloom.html').read_text(),wait_until='load')
    page.wait_for_function('window.Bloom && document.querySelector("#wire").value.length > 0')
    assert page.locator('#wire').input_value()==(ROOT/'original-specimen.txt').read_text()
    assert 'matches' in page.locator('#roundtrip').inner_text()
    assert page.locator('#cp-list').locator('.cp').count()==5
    assert page.locator('#font option').count()==14
    results.append('Exact literal specimen, 14 font options and five-code-point first glyph load correctly.')
    page.screenshot(path=str(ARTIFACTS/'desktop.png'),full_page=True)
    page.locator('#source').fill('café cafe\u0301 👩‍🔬 1️⃣ hello')
    page.select_option('#font','bold-script')
    page.locator('#use-current').click()
    assert page.locator('#decoded').inner_text()=='café cafe\u0301 👩‍🔬 1️⃣ hello'
    results.append('Live encode/decode preserves accented text, decomposed accents, emoji and keycaps.')
    before=page.locator('#wire').input_value();page.locator('#mutate').click()
    assert before!=page.locator('#wire').input_value()
    page.check('#plain-view');assert page.locator('#bloom').inner_text()=='café cafe\u0301 👩‍🔬 1️⃣ hello'
    page.uncheck('#plain-view');page.select_option('#mode','cycle-letter')
    page.locator('[data-profile=overgrown]').click()
    assert page.locator('#error').inner_text()==''
    results.append('Mutate, mixed-family rendering, plain reading view and maximum-density preset work.')
    page.check('#strict');assert 'Strict' in page.locator('#error').inner_text()
    assert page.locator('#copy').is_disabled();assert page.locator('#wire').input_value()==''
    page.uncheck('#strict');assert not page.locator('#copy').is_disabled()
    results.append('Invalid strict input clears stale output and disables exports until corrected.')
    page.locator('#original').click();page.check('#frame');page.locator('#use-current').click()
    assert page.locator('#decoded').inner_text()=='the diacritics are now free'
    results.append('Exact original reset and ornamental-frame stripping work.')
    with page.expect_download() as download_info: page.locator('#save-recipe').click()
    d=download_info.value
    d.save_as(str(ARTIFACTS/'test-recipe.json'))
    packet=json.loads(Path(str(ARTIFACTS/'test-recipe.json')).read_text())
    assert packet['kind']=='specimen' and packet['settings']['frame']
    page.locator('#example').click()
    page.locator('#recipe-file').set_input_files(str(ARTIFACTS/'test-recipe.json'))
    page.wait_for_function('document.querySelector("#toast").textContent.includes("restored and verified")')
    assert page.locator('#wire').input_value()==packet['encoded']
    results.append('Recipe export/import replays the exact original with its frame.')
    page.locator('#source').fill('seed packet test 123')
    page.select_option('#mode','random-letter')
    page.select_option('#font','monospace')
    with page.expect_download() as download_info: page.locator('#save-recipe').click()
    download_info.value.save_as(str(ARTIFACTS/'test-generated-recipe.json'))
    saved=page.locator('#wire').input_value()
    page.locator('#mutate').click()
    page.locator('#recipe-file').set_input_files(str(ARTIFACTS/'test-generated-recipe.json'))
    page.wait_for_function('document.querySelector("#toast").textContent.includes("restored and verified")')
    assert page.locator('#wire').input_value()==saved
    results.append('Generated JSON recipe replays source, mixed family mode, seed and marks exactly.')
    page.locator('#source').fill('<img src=x onerror=alert(1)>')
    assert page.locator('.bloom-display img').count()==0
    results.append('User text remains inert text rather than inserted HTML.')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__copied=t;}}})")
    page.locator('#copy').click()
    page.wait_for_function('window.__copied===document.querySelector("#wire").value')
    results.append('Copy button hands the exact encoded sequence to the clipboard API.')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('blocked')}}});document.execCommand=()=>false;")
    page.locator('#copy').click()
    page.wait_for_function('document.querySelector("#wire-details").open')
    assert 'selected' in page.locator('#toast').inner_text()
    results.append('Blocked clipboard has a manual-selection fallback.')
    page.locator('#original').click()
    assert not errors,errors
    network=[url for url in requests if url.startswith(('http:','https:'))]
    assert not network,network
    results.append('No page JavaScript errors and no HTTP requests during workshop use.')
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    mobile.set_content((ROOT/'diacritic-bloom.html').read_text(),wait_until='load')
    mobile.wait_for_function('window.Bloom && document.querySelector("#wire").value.length > 0')
    assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    mobile.screenshot(path=str(ARTIFACTS/'mobile.png'),full_page=True)
    results.append('390-pixel mobile layout has no page-level horizontal overflow.')
    browser.close()
print('\n'.join('PASS '+r for r in results))
(ARTIFACTS/'browser-tests.json').write_text(json.dumps(results,indent=2))

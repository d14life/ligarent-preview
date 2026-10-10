/* Run with NODE_PATH pointing to a Playwright installation.
   Uses installed Chrome by default; CHROME_PATH can override it. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const path = require('node:path');
const server = spawn('python3',['-m','http.server','8766'],{cwd:path.join(__dirname,'..'),stdio:'ignore'});
const base = 'http://localhost:8766';
const expected = {ru:'Три бульдозера.',en:'Three bulldozers.',tt:'Өч бульдозер.',zh:'三款推土机。',es:'Tres bulldozers.'};
(async()=>{
  let browser;
  try {
    for(let i=0;i<50;i++){try{await fetch(base);break}catch{await new Promise(r=>setTimeout(r,100))}}
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
    const errors=[];
    for(const width of [390,1440]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/site.html');
      await page.locator('[data-language-select]').waitFor();
      await page.fill('#description','Машины — user text must stay unchanged');
      for(const language of ['en','tt','zh','es','ru']){
        await page.selectOption('[data-language-select]',language);
        await page.waitForTimeout(80);
        assert.equal(await page.locator('html').getAttribute('lang'),language);
        assert.equal((await page.locator('h1').textContent()).trim(),expected[language]);
        assert.equal(await page.inputValue('#description'),'Машины — user text must stay unchanged');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${language} overflow at ${width}`);
        for(const [field,value] of Object.entries({job:'3',area:'2',ground:'2',access:'1'})) await page.selectOption('#'+field,value);
        await page.locator('#selector button[type=submit]').click();
        assert.equal(await page.inputValue('#chosen-machine'),'Cat D8R');
        await page.waitForTimeout(30);
        assert.ok((await page.locator('#selection-result').innerText()).includes('Cat D8R'));
        if(language==='en') assert.match(await page.locator('#selection-result').innerText(),/Site access needs clarification/);
        for(let album=0;album<6;album++){
          await page.locator(`[data-album="${album}"]`).click();
          await page.waitForTimeout(30);
          if(['en','es','zh'].includes(language)) assert.ok(!/[А-Яа-я]/.test(await page.locator('#photo-dialog').innerText()),`${language} album ${album} untranslated`);
          await page.locator('#photo-dialog .album-photo-open').first().click();
          await page.locator('#photo-zoom .close').click();
          await page.locator('#photo-dialog .close').click();
        }
        await page.locator('.site-menu-toggle').click();
        if(language==='es') assert.match(await page.locator('#site-menu').innerText(),/Zonas de servicio/i);
        await page.keyboard.press('Escape');
        if(['en','es','zh'].includes(language)){
          const remaining=await page.evaluate(()=>{
            const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),out=[];
            while(w.nextNode()){const n=w.currentNode;if(!n.parentElement.closest('script,style,textarea,[data-no-translate]')&&/[А-Яа-я]/.test(n.data))out.push(n.data.trim())}
            return out.filter(Boolean);
          });
          assert.deepEqual(remaining,[],`${language} remaining Russian`);
        }
      }
      await page.selectOption('[data-language-select]','es');
      await page.reload();
      assert.equal((await page.locator('h1').textContent()).trim(),expected.es);
      await page.goto(base+'/start.html');
      await page.waitForFunction(()=>window.ligarentSiteStatus==='ready');
      assert.equal(await page.locator('[data-language-select]').count(),1);
      assert.equal(await page.locator('html').getAttribute('lang'),'es');
      assert.match(await page.locator('#hero-title').textContent(),/Movemos tierra/);
      await page.selectOption('[data-language-select]','zh');
      assert.match(await page.locator('#hero-title').textContent(),/土方作业/);
      assert.equal((await page.locator('#machines h1').textContent()).trim(),expected.zh);
      await page.screenshot({path:`/tmp/ligarent-intro-${width}.png`});
      await page.close();
    }
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/site.html?lang=en');
    await page.fill('#description','Машины');await page.fill('#location','Казань');
    let telegram;
    await page.route('https://t.me/**',route=>{telegram=route.request().url();return route.abort()});
    await page.locator('#enquiry-form button[type=submit]').click();
    await page.waitForTimeout(300);
    assert.ok(telegram,'Telegram draft should open');
    const draft=new URL(telegram).searchParams.get('text');
    assert.match(draft,/Site description: Машины/);assert.match(draft,/Site location: Казань/);
    assert.deepEqual(errors,[]);
    console.log('PASS: five languages, mobile/desktop, all albums, menu, recommendation, persistence, intro embed and Telegram draft.');
  }finally{await browser?.close();server.kill()}
})().catch(error=>{console.error(error);process.exitCode=1});

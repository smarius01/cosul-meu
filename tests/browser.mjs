import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.APP_URL || 'http://127.0.0.1:4179/';
await mkdir('.artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
try {
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage(); const errors=[]; const requests=[];
 page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await page.goto(base); await page.getByLabel('Captură sau mesaj').waitFor({timeout:5000});
 await page.getByLabel('Captură sau mesaj').fill('Lapte 2 l\nOuă 10 buc\nRoșii 1,5 kg');
 await page.getByRole('button',{name:'Fă lista',exact:true}).click();
 assert.equal(await page.locator('#pending-list .item-toggle').count(),3);
 await page.getByRole('button',{name:'Pune în coș: Lapte 2 l',exact:true}).click();
 assert.equal(await page.locator('#pending-list .item-toggle').count(),2);
 assert.equal(await page.locator('#basket-list .item-toggle').count(),1);
 assert.ok(await page.locator('#pending').evaluate((el)=>el.compareDocumentPosition(document.querySelector('#basket')) & Node.DOCUMENT_POSITION_FOLLOWING));
 await page.reload(); await page.getByRole('button',{name:'Înapoi pe listă: Lapte 2 l',exact:true}).waitFor();
 await page.getByRole('button',{name:'Înapoi pe listă: Lapte 2 l',exact:true}).click();
 assert.equal(await page.locator('#pending-list .item-toggle').count(),3);
 await page.getByRole('button',{name:'Editează: Ouă 10 buc',exact:true}).click();
 await page.getByLabel('Denumirea produsului').fill('Ouă 12 buc'); await page.getByRole('button',{name:'Salvează',exact:true}).click();
 await page.getByRole('button',{name:'Pune în coș: Ouă 12 buc',exact:true}).waitFor();
 await page.getByRole('button',{name:'Listă nouă',exact:true}).click();
 await page.getByRole('button',{name:'Începe lista nouă',exact:true}).click();
 assert.equal(await page.locator('#pending-list .item-toggle').count(),0);
 // Synthetic fixtures drawn by the browser; never claim these are real user screenshots.
 for (const dark of [false,true]) {
  const fixture=await page.evaluate(dark=>{
   const c=document.createElement('canvas'); c.width=720;c.height=1040;const g=c.getContext('2d');
   g.fillStyle=dark?'#0b141a':'#efeae2';g.fillRect(0,0,720,1040);
   g.fillStyle=dark?'#202c33':'#075e54';g.fillRect(0,0,720,110);
   g.fillStyle='#f8fafc';g.font='bold 30px Arial';g.fillText('Andreea',55,67);
   g.fillStyle=dark?'#202c33':'#ffffff';g.fillRect(24,170,620,400);
   g.fillStyle=dark?'#e9edef':'#111b21';g.font='32px Arial';
   const rows=['Lista de cumpărături:','Lapte 2 l','Ouă 10 buc','Roșii 1,5 kg','Pâine integrală'];
   rows.forEach((t,i)=>g.fillText(t,50,223+i*65));
   g.fillStyle=dark?'#cbd5dc':'#5b666d';g.font='22px Arial';g.fillText('14:23',554,550);
   return c.toDataURL('image/png').split(',')[1];
  },dark);
  const path=`.artifacts/whatsapp-synthetic-${dark?'dark':'light'}.png`;await writeFile(path,Buffer.from(fixture,'base64'));
  await page.locator('#screenshot').setInputFiles(path);
  await page.locator('#preview-section').waitFor();
  await page.getByRole('button',{name:'Fă lista',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#read-image').disabled===false && document.querySelector('#pending-list').children.length>=4,{},{timeout:120000});
  const text=await page.locator('#pending-list').innerText();
  console.log('REAL OCR',dark?'dark':'light',JSON.stringify(text));
  assert.match(text,/Lapte 2 l/i); assert.match(text,/Ou[ăa] 10 buc/i); assert.match(text,/Ro[șs]ii 1,5 kg/i); assert.match(text,/P[âa]ine integral[ăa]/i);
  // OCR may retain contact names; user can delete them with the existing edit affordance.
  if(await page.getByRole('button',{name:'Editează: Andreea',exact:true}).count()) {
   await page.getByRole('button',{name:'Editează: Andreea',exact:true}).click();await page.getByRole('button',{name:'Șterge',exact:true}).click();
  }
  assert.equal(await page.locator('#pending-list .item-toggle').count(),4);
  if (!dark) {await page.getByRole('button',{name:'Listă nouă',exact:true}).click();await page.getByRole('button',{name:'Începe lista nouă',exact:true}).click();}
 }
 await page.getByRole('button',{name:'Pune în coș: Lapte 2 l',exact:true}).click();
 await page.screenshot({path:'.artifacts/mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.artifacts/desktop.png',fullPage:true});
 await page.emulateMedia({colorScheme:'dark'});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.screenshot({path:'.artifacts/mobile-dark.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 const remote=requests.filter(r=>!r.url.startsWith(new URL(base).origin) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'));
 assert.deepEqual(remote,[], 'all OCR resources must be same-origin');
 assert.deepEqual(requests.filter(r=>r.method!=='GET'),[], 'screenshots must never be sent to a server');
 console.log('PASS: import, real light/dark OCR, review, basket, undo, edit, reset, persistence, mobile/desktop, no external requests or uploads.');
 await ctx.close();
} finally {await browser.close();}

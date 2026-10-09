import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const base=process.env.APP_URL||'http://127.0.0.1:4179/';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
await mkdir('.artifacts',{recursive:true});
try {
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:1440,height:1000}});
 const page=await context.newPage(); const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await page.goto(base);const field=page.getByLabel('Captură sau mesaj');await field.waitFor({timeout:4000});
 await field.fill('Unt 200 g');
 // OS/browser clipboard plus a trusted keyboard paste, not a synthetic paste-only assertion.
 const fixture=(await readFile('.artifacts/whatsapp-synthetic-light.png')).toString('base64');
 await page.evaluate(async image=>{const blob=await (await fetch('data:image/png;base64,'+image)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);},fixture);
 await field.focus();await page.keyboard.press('Control+V');
 await page.locator('#preview-image').waitFor();await page.waitForFunction(()=>document.querySelector('#preview-image').naturalWidth>0);
 assert.equal(await field.inputValue(),'Unt 200 g','image paste preserves typed draft');
 assert.equal(await page.locator('#composer').evaluate(el=>el.contains(document.querySelector('#preview-image'))),true,'attachment is inside text composer');
 await page.screenshot({path:'.artifacts/composer-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.artifacts/composer-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.getByRole('button',{name:'Fă lista',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#pending-list').children.length>=4,{},{timeout:120000});
 assert.equal(await page.locator('#pending-list .item-toggle').count(),5);
 await page.getByRole('button',{name:'Pune în coș: Lapte 2 l',exact:true}).click();
 assert.equal(await page.locator('#basket-list .item-toggle').count(),1);
 await page.reload();await page.getByRole('button',{name:'Înapoi pe listă: Lapte 2 l',exact:true}).waitFor();
 // Plain text pasting remains normal and attachment removal retains draft.
 await field.fill('Iaurt');
 await page.evaluate(async()=>navigator.clipboard.writeText('\nMere'));await field.focus();await page.keyboard.press('Control+End');await page.keyboard.press('Control+V');
 assert.equal(await field.inputValue(),'Iaurt\nMere');
 await page.evaluate(async image=>{const blob=await (await fetch('data:image/png;base64,'+image)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);},fixture);
 await field.focus();await page.keyboard.press('Control+V');await page.locator('#preview-image').waitFor();
 await page.getByRole('button',{name:'Elimină captura',exact:true}).click();assert.equal(await field.inputValue(),'Iaurt\nMere');
 assert.equal(await page.locator('#preview-section').isVisible(),false);
 await page.getByRole('button',{name:'Fă lista',exact:true}).click();
 await page.getByRole('button',{name:'Pune în coș: Mere',exact:true}).waitFor();
 // Fallback file picker and explicit paste button use the same path.
 await page.locator('#screenshot').setInputFiles('.artifacts/whatsapp-synthetic-dark.png');await page.locator('#preview-image').waitFor();
 await page.getByRole('button',{name:'Elimină captura',exact:true}).click();
 await page.getByRole('button',{name:'Lipește',exact:true}).click();await page.locator('#preview-image').waitFor();
 await page.getByRole('button',{name:'Elimină captura',exact:true}).click();
 // Invalid image MIME gives an inline error, without losing existing list.
 await page.locator('#screenshot').setInputFiles({name:'not-an-image.txt',mimeType:'text/plain',buffer:Buffer.from('not image')});
 assert.match(await page.locator('#import-error').textContent(),/PNG.*JPG.*WebP/);
 assert.deepEqual(errors,[]);assert.deepEqual(requests.filter(r=>r.method!=='GET'),[]);
 assert.deepEqual(requests.filter(r=>!r.url.startsWith(new URL(base).origin)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')),[]);
 console.log('PASS: real clipboard image Ctrl+V into visible field, attachment inside composer, OCR directly to list, typed draft retained, text paste, remove attachment, explicit paste, file fallback, invalid file, basket and persistence.');
 await context.close();
} finally {await browser.close();}

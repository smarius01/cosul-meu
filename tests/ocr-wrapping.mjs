import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const source=process.env.SCREENSHOT_PATH;if(!source)throw new Error('SCREENSHOT_PATH must point to the private original user screenshot; never commit it.');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
try{const p=await browser.newPage();const requests=[],errors=[];p.on('request',r=>requests.push({url:r.url(),method:r.method()}));p.on('pageerror',e=>errors.push(e.message));
const base=process.env.APP_URL||'http://127.0.0.1:4179/';await p.goto(base);await p.locator('#screenshot').setInputFiles(source);await p.locator('#preview-section').waitFor();await p.getByRole('button',{name:'Fă lista',exact:true}).click();
await p.waitForFunction(()=>document.querySelector('#pending-list').children.length>0&&!document.querySelector('#read-image').disabled,{},{timeout:120000});
const raw=await p.locator('.item-label').allTextContents();const labels=raw.map(x=>x.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase());
assert.ok(labels.includes('6 cutii mici de icre'),JSON.stringify(raw));assert.ok(labels.includes('esenta de vanilie'),JSON.stringify(raw));
assert.ok(labels.includes('esenta de rom'),JSON.stringify(raw));assert.ok(!labels.includes('rom'),JSON.stringify(raw));
assert.ok(labels.some(x=>x.includes('6 mezeluri')&&x.includes('sau salam')),JSON.stringify(raw));
assert.ok(labels.some(x=>x.includes('hartie igienica')&&x.includes('munca')),JSON.stringify(raw));
assert.ok(labels.some(x=>x.includes('babybell')&&x.includes('dalea rulate asa')),JSON.stringify(raw));
assert.ok(!labels.some(x=>/^(de icre|6 cutii mici|de vanilie|sau salam|munca)$/.test(x)));
assert.deepEqual(errors,[]);assert.deepEqual(requests.filter(r=>r.method!=='GET'),[]);
console.log('PASS: real supplied WhatsApp screenshot, wrapped quantities/vanilla/alternatives/descriptions retained as complete products; screenshot never uploaded.');console.log('Actual extracted labels:',raw);
}finally{await browser.close();}

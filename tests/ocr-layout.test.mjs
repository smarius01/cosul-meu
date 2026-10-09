import {test} from 'node:test';import assert from 'node:assert/strict';import * as model from '../src/model.mjs';
// Synthetic geometry fixtures. They are test inputs, not actual OCR success claims.
const parse=data=>model.parseOcrList(data);
const line=(text,y)=>({text,bbox:{x0:20,y0:y,x1:700,y1:y+40},words:text.trim().split(/\s+/).map((text,i)=>({text,confidence:95,bbox:{x0:20+i*65,y0:y,x1:75+i*65,y1:y+40}}))});
const data=lines=>({text:lines.map(l=>l.text).join('\n'),blocks:[{paragraphs:[{lines}]}]});
test('joins visual wraps before splitting a comma-separated message',()=>{
 assert.deepEqual(parse(data([line('Zahăr, esențe',10),line('de vanilie, 6 cutii mici',65),line('de icre, 6 banane.',120)])),['Zahăr','esențe de vanilie','6 cutii mici de icre','6 banane']);
});
test('keeps alternatives attached to the product across OCR block boundaries',()=>{
 const a=line('6 mezeluri feliate în vid de șuncă',10),b=line('sau salam, 6 cutii de bere',65);
 assert.deepEqual(parse({text:a.text+'\n\n'+b.text,blocks:[{paragraphs:[{lines:[a]}]},{paragraphs:[{lines:[b]}]}]}),['6 mezeluri feliate în vid de șuncă sau salam','6 cutii de bere']);
});
test('quantity and packaging alone remain attached to the wrapped product',()=>{
 assert.deepEqual(parse(data([line('6 cutii mici',10),line('icre',65)])),['6 cutii mici icre']);
});
test('a bulleted product can itself wrap without merging the next bullet',()=>{
 assert.deepEqual(parse(data([line('• 6 cutii mici',10),line('de icre',65),line('• Pâine',120)])),['6 cutii mici de icre','Pâine']);
});
test('lowered metadata after a lowercase-only short line is removed using the shared font height',()=>{
 const a=line('Hârtie igienică pentru',10),b=line('munca',65);b.words[0].bbox.y0=76;b.words.push({text:'Sia',confidence:16,bbox:{x0:600,y0:97,x1:680,y1:122}});b.text+=' Sia';
 assert.deepEqual(parse(data([a,b])),['Hârtie igienică pentru munca']);
});
test('OCR reconstruction preserves decimal quantities',()=>{
 assert.deepEqual(parse(data([line('1,5 kg făină, 1.5 l lapte',10)])),['1,5 kg făină','1.5 l lapte']);
});
test('message gaps do not merge separate chat bubbles',()=>{
 assert.deepEqual(parse(data([line('Suc de',10),line('mere',65),line('Struguri',210)])),['Suc de mere','Struguri']);
});
test('retains separate newline and bulleted shopping lists',()=>{
 assert.deepEqual(parse(data([line('Lapte 2 l',10),line('Ouă 10 buc',65),line('• Pâine',120),line('• Mere',175)])),['Lapte 2 l','Ouă 10 buc','Pâine','Mere']);
});
test('joins a wrapped descriptive note rather than creating a product named munca',()=>{
 assert.deepEqual(parse(data([line('Hârtie igienică x2 una acasă una la',10),line('muncă',65)])),['Hârtie igienică x2 una acasă una la muncă']);
});
test('trailing small lowered timestamps are ignored even when OCR misreads letters',()=>{
 const a=line('Struguri',10);a.words.push({text:'TERTA',confidence:17,bbox:{x0:600,y0:41,x1:680,y1:61}});a.text+=' TERTA';
 assert.deepEqual(parse(data([a])),['Struguri']);
});
test('small legitimate product text at the same baseline is not discarded',()=>{
 const a=line('Lapte 2 l',10);a.words.at(-1).bbox={x0:170,y0:25,x1:180,y1:50};
 assert.deepEqual(parse(data([a])),['Lapte 2 l']);
});
test('text-only OCR fallback handles comma wrapping without affecting manual line parsing',()=>{
 assert.deepEqual(parse({text:'Zahăr, 6 cutii mici\nde icre, 6 banane.\n\nPaie, limonadă'}),['Zahăr','6 cutii mici de icre','6 banane','Paie','limonadă']);
 assert.deepEqual(model.parseList('Lapte\nOuă\nPâine'),['Lapte','Ouă','Pâine']);
});

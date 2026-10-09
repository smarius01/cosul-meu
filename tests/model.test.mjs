import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseList, mergeItems, toggleItem, readSaved } from '../src/model.mjs';
test('extracts WhatsApp lines and preserves quantities, dropping UI and times', () => {
 assert.deepEqual(parseList('WhatsApp\nAndreea\nAzi\nLista de cumpărături:\n• Roșii 1,5 kg 14:23 ✓✓\n2. Lapte 2 l\n- Ouă 10 buc\nMesaj'), ['Andreea','Roșii 1,5 kg','Lapte 2 l','Ouă 10 buc']);
});
test('splits comma/semicolon lists, but does not split decimal quantities', () => {
 assert.deepEqual(parseList('Ia te rog: pâine, lapte 1,5 l; ouă\nPÂINE'), ['pâine','lapte 1,5 l','ouă']);
});
test('new items append without duplicates or changing basket states', () => {
 const old=[{id:'a',label:'Ouă 10 buc',bought:true}];
 const next=mergeItems(old,['oua 10 buc','Lapte']);
 assert.equal(next.length,2); assert.deepEqual(next[0],old[0]);
 assert.equal(next[1].label,'Lapte'); assert.equal(next[1].bought,false); assert.ok(next[1].id);
});
test('toggle moves an item to the basket, toggling again restores it without mutating original', () => {
 const before=[{id:'a',label:'Lapte',bought:false}];
 const basket=toggleItem(before,'a'); assert.equal(basket[0].bought,true); assert.equal(before[0].bought,false);
 assert.deepEqual(toggleItem(basket,'a'),before);
});
test('invalid saved data recovers safely rather than breaking page', () => {
 assert.deepEqual(readSaved('{broken'),[]); assert.deepEqual(readSaved('{"not":"list"}'),[]);
 assert.deepEqual(readSaved('[{"id":"x","label":"Lapte","bought":true},{"bad":true}]'),[{id:'x',label:'Lapte',bought:true}]);
});
test('normalizes a pipe misread as liters only after a numeric quantity', () => {
 assert.deepEqual(parseList('Lapte 2 |\nApă 1,5 |\nBrânză | maturată'), ['Lapte 2 l','Apă 1,5 l','Brânză | maturată']);
});
test('blank lines, timestamps and headers do not become products', () => {
 assert.deepEqual(parseList('\n14:32\nAzi\nCumpărături\n\n'),[]);
});

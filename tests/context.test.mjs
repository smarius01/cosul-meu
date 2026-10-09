import {test} from 'node:test';import assert from 'node:assert/strict';import {parseList,parseOcrList} from '../src/model.mjs';
test('expands a clearly shared essence category across comma-separated flavors',()=>{
 assert.deepEqual(parseList('Zahăr, esențe de vanilie, rom, 6 cornuri'),['Zahăr','esență de vanilie','esență de rom','6 cornuri']);
});
test('supports successive named flavors with or without repeated de',()=>{
 assert.deepEqual(parseList('ESENTE de vanilie, de rom, migdale, lămâie'),['esență de vanilie','esență de rom','esență de migdale','esență de lămâie']);
});
test('does not invent a shared quantity for an abbreviated second flavor',()=>{
 assert.deepEqual(parseList('2 esențe de vanilie, rom'),['2 esențe de vanilie','esență de rom']);
});
test('does not change an independent rum or a rum bottle with its own quantity',()=>{
 assert.deepEqual(parseList('Rom, esențe de vanilie, rom 1 l'),['Rom','esențe de vanilie','rom 1 l']);
});
test('context ends at another product or a new message',()=>{
 assert.deepEqual(parseList('Esențe de vanilie, zahăr, rom'),['Esențe de vanilie','zahăr','rom']);
 assert.deepEqual(parseOcrList({text:'Esențe de vanilie\n\nRom'}),['Esențe de vanilie','Rom']);
});
test('unknown flavors and alternatives are left editable rather than guessed',()=>{
 assert.deepEqual(parseList('Esențe de vanilie, tort, rom'),['Esențe de vanilie','tort','rom']);
 assert.deepEqual(parseList('Esență de vanilie sau rom'),['Esență de vanilie sau rom']);
});

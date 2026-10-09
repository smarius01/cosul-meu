import {mkdir,cp,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out='dist';await mkdir(out,{recursive:true});
for(const file of ['index.html','src','public']) {
 if(file==='public') {await cp(file,out,{recursive:true});} else await cp(file,path.join(out,file),{recursive:true});
}
await mkdir(`${out}/vendor/core`,{recursive:true}); await mkdir(`${out}/vendor/lang`,{recursive:true}); await mkdir(`${out}/icons`,{recursive:true});
for(const name of ['tesseract.min.js','worker.min.js']) await cp(`node_modules/tesseract.js/dist/${name}`,`${out}/vendor/${name}`);
for(const name of await readdir('node_modules/tesseract.js-core')) if(name.endsWith('.wasm')||name.endsWith('.wasm.js')) await cp(`node_modules/tesseract.js-core/${name}`,`${out}/vendor/core/${name}`);
for(const lang of ['ron','eng']) await cp(`node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,`${out}/vendor/lang/${lang}.traineddata.gz`);
for(const name of ['shopping-bag','image','plus','pencil-simple','trash','x','arrow-counter-clockwise','check','arrow-down','clipboard-text','shield-check']) await cp(`node_modules/@phosphor-icons/core/assets/regular/${name}.svg`,`${out}/icons/${name}.svg`);
await cp('node_modules/@phosphor-icons/core/LICENSE',`${out}/icons/LICENSE.txt`);
await cp('node_modules/tesseract.js/LICENSE.md',`${out}/vendor/LICENSE-tesseract.txt`);
await writeFile(`${out}/.nojekyll`,'');
console.log('Static production build ready in dist/. OCR worker, WASM, and language files are served locally.');

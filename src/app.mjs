import { parseList, mergeItems, toggleItem, readSaved } from './model.mjs';
const $ = id => document.getElementById(id);
const STORAGE='cosul-meu:list:v1';
const appBase=new URL('../',import.meta.url);
let items=[]; let storageOk=true;
try {items=readSaved(localStorage.getItem(STORAGE));} catch {storageOk=false;}
let editId=null, previewUrl=null, crop=null, drag=null, busy=false, worker=null, job=0, timer=null, libraryPromise=null, attachmentJob=0;
function icon(name) {const image=document.createElement('img');image.src=new URL(`icons/${name}.svg`,appBase).href;image.className='icon';image.alt='';return image;}
function tell(message, error=false) {$('status').textContent=message;$('status').classList.toggle('error',error);}
function save() {
 try {localStorage.setItem(STORAGE,JSON.stringify(items));storageOk=true;} catch {storageOk=false;}
 $('saved-note').textContent=storageOk?'Lista se salvează automat în acest browser.':'Browserul nu permite salvarea. Lista se pierde dacă închizi pagina.';
 $('saved-note').classList.toggle('error',!storageOk);
}
function render() {
 const pending=$('pending-list'), basket=$('basket-list');pending.replaceChildren();basket.replaceChildren();
 for (const item of items) {
  const row=document.createElement('li');row.className=`item${item.bought?' bought':''}`;
  const toggle=document.createElement('button');toggle.type='button';toggle.className='item-toggle';toggle.dataset.id=item.id;
  toggle.setAttribute('aria-label',`${item.bought?'Înapoi pe listă':'Pune în coș'}: ${item.label}`);toggle.setAttribute('aria-pressed',String(item.bought));
  const check=document.createElement('span');check.className='checkmark';check.append(icon('check'));
  const label=document.createElement('span');label.className='item-label';label.textContent=item.label;toggle.append(check,label);
  toggle.addEventListener('click',event=>{
   const oldIndex=Array.from(pending.children).indexOf(row);
   items=toggleItem(items,item.id);save();render();tell(item.bought?`${item.label} a revenit pe listă.`:`${item.label} este în coș.`);
   // Keep keyboard navigation usable after the original row is removed.
   if(event.detail===0) {
    const next=pending.children[Math.max(0,Math.min(oldIndex,pending.children.length-1))]?.querySelector('button');
    (next||document.querySelector(`[data-id="${CSS.escape(item.id)}"]`))?.focus({preventScroll:true});
   }
  });
  const tools=document.createElement('div');tools.className='item-tools';
  const edit=document.createElement('button');edit.type='button';edit.className='icon-button';edit.setAttribute('aria-label',`Editează: ${item.label}`);edit.append(icon('pencil-simple'));
  edit.addEventListener('click',()=>{editId=item.id;$('edit-label').value=item.label;$('edit-dialog').showModal();$('edit-label').focus();});
  tools.append(edit);row.append(toggle,tools);(item.bought?basket:pending).append(row);
 }
 const pendingCount=items.filter(i=>!i.bought).length, basketCount=items.length-pendingCount;
 $('pending-count').textContent=pendingCount;$('basket-count').textContent=basketCount;
 $('pending-empty').hidden=pendingCount>0;$('basket-empty').hidden=basketCount>0;
 $('empty-title').textContent=items.length?'Totul este în coș':'Începe cu lista ta';
 $('empty-description').textContent=items.length?'Ai luat toate produsele de pe listă.':'Lipește captura sau mesajul în câmpul de mai sus.';
 $('restore-all').hidden=basketCount===0;$('new-list').hidden=items.length===0;
}
function setBusy(value) {
 busy=value;for(const id of ['read-image','reset-crop','choose-file','paste-image','remove-image'])$(id).disabled=value;
 $('ocr-progress').hidden=!value;$('review-text').disabled=value;$('read-image').textContent=value?'Citesc captura…':'Fă lista';
}
function stopOcr(message='Citirea a fost oprită. Captura și textul sunt păstrate; poți încerca din nou.') {
 job++;clearTimeout(timer);timer=null;
 if(worker){worker.terminate().catch(()=>{});worker=null;}
 setBusy(false);$('import-error').textContent=message;
}
function releasePreview() {
 attachmentJob++;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;$('preview-image').removeAttribute('src');$('screenshot').value='';crop=null;drag=null;
 $('crop-selection').hidden=true;$('preview-section').hidden=true;
}
function closeImport() {if(busy)stopOcr('');releasePreview();$('review-text').value='';$('import-error').textContent='';}
function importLabels(labels) {
 if(!labels.length){$('import-error').textContent='Nu am găsit produse. Lipește o captură mai clară sau scrie lista în câmp.';return false;}
 const old=items.length;items=mergeItems(items,labels);save();render();closeImport();
 tell(items.length>old?'Lista este gata. Verifică denumirile și cantitățile; creionul le modifică.':'Produsele sunt deja pe listă.');
 $('pending').scrollIntoView({block:'start',behavior:'auto'});return true;
}
async function attachImage(file) {
 if(busy)return;$('import-error').textContent='';
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)){$('import-error').textContent='Alege o captură PNG, JPG sau WebP.';return;}
 if(file.size>12*1024*1024){$('import-error').textContent='Imaginea depășește 12 MB. Decupează captura din galeria telefonului.';return;}
 releasePreview();const current=++attachmentJob;previewUrl=URL.createObjectURL(file);const image=$('preview-image');image.src=previewUrl;
 try {
  await image.decode();if(current!==attachmentJob)return;
  if(image.naturalWidth*image.naturalHeight>25000000)throw new Error('oversize');
  $('preview-section').hidden=false;tell('Captura este atașată. Apasă „Fă lista”.');
 } catch(error) {if(current!==attachmentJob)return;releasePreview();$('import-error').textContent=error.message==='oversize'?'Captura este prea mare. Decupează zona cu lista din galerie.':'Nu am putut deschide imaginea. Încearcă o captură PNG sau JPG.';}
}
$('choose-file').addEventListener('click',()=>$('screenshot').click());
$('screenshot').addEventListener('change',event=>{const file=event.target.files?.[0];if(file)void attachImage(file);});
$('remove-image').addEventListener('click',()=>{releasePreview();tell('Captura a fost eliminată. Textul este păstrat.');$('review-text').focus({preventScroll:true});});
document.addEventListener('paste',event=>{
 if(event.target.closest?.('dialog')||event.target.id==='new-item')return;
 const image=[...(event.clipboardData?.items||[])].find(item=>item.kind==='file'&&item.type.startsWith('image/'))?.getAsFile()
  ||[...(event.clipboardData?.files||[])].find(file=>file.type.startsWith('image/'));
 if(!image)return;event.preventDefault();if(busy){tell('Așteaptă să se termine citirea sau oprește-o.',true);return;}void attachImage(image);
});
$('paste-image').addEventListener('click',async()=>{
 if(!navigator.clipboard?.read){$('review-text').focus();$('import-error').textContent='Folosește Ctrl+V / ⌘V în câmp sau ține apăsat și alege Lipire. Poți și atașa captura.';return;}
 try {
  const clipboard=await navigator.clipboard.read();
  for(const item of clipboard){const type=item.types.find(t=>t.startsWith('image/'));if(type){await attachImage(await item.getType(type));return;}}
  const textItem=clipboard.find(i=>i.types.includes('text/plain'));
  if(textItem){const text=await(await textItem.getType('text/plain')).text();$('review-text').focus();$('review-text').setRangeText(text,$('review-text').selectionStart,$('review-text').selectionEnd,'end');$('import-error').textContent='';return;}
  $('import-error').textContent='Nu este o captură sau un text în clipboard. Copiază imaginea și încearcă din nou.';
 }catch{$('review-text').focus();$('import-error').textContent='Browserul nu a permis citirea clipboardului. Folosește Ctrl+V / ⌘V sau Lipire în câmp; atașarea din galerie rămâne disponibilă.';}
});
$('composer').addEventListener('dragover',event=>{if(event.dataTransfer?.types.includes('Files')){event.preventDefault();$('composer').classList.add('dragover');}});
$('composer').addEventListener('dragleave',event=>{if(!$('composer').contains(event.relatedTarget))$('composer').classList.remove('dragover');});
$('composer').addEventListener('drop',event=>{const file=event.dataTransfer?.files?.[0];$('composer').classList.remove('dragover');if(file){event.preventDefault();void attachImage(file);}});
function point(event) {const rect=$('preview-image').getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};}
function drawCrop() {
 const selection=$('crop-selection');selection.hidden=!crop;if(!crop)return;
 Object.assign(selection.style,{left:`${crop.x*100}%`,top:`${crop.y*100}%`,width:`${crop.w*100}%`,height:`${crop.h*100}%`});
}
$('preview-wrap').addEventListener('pointerdown',event=>{if(busy||event.button!==0||drag)return;drag={...point(event),id:event.pointerId};$('preview-wrap').setPointerCapture(event.pointerId);event.preventDefault();});
$('preview-wrap').addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const p=point(event);crop={x:Math.min(p.x,drag.x),y:Math.min(p.y,drag.y),w:Math.abs(p.x-drag.x),h:Math.abs(p.y-drag.y)};drawCrop();});
function finishCrop(event) {if(!drag||event.pointerId!==drag.id)return;drag=null;if(crop&&(crop.w<.03||crop.h<.03)){crop=null;drawCrop();}}
$('preview-wrap').addEventListener('pointerup',finishCrop);$('preview-wrap').addEventListener('pointercancel',finishCrop);
$('preview-wrap').addEventListener('keydown',event=>{if(event.key==='Escape'){crop=null;drawCrop();}});
$('reset-crop').addEventListener('click',()=>{crop=null;drawCrop();});
function loadLibrary() {
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(libraryPromise)return libraryPromise;
 libraryPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('vendor/tesseract.min.js',appBase).href;script.onload=()=>resolve(window.Tesseract);script.onerror=()=>{script.remove();libraryPromise=null;reject(new Error('library'));};document.head.append(script);});
 return libraryPromise;
}
function prepareImage() {
 const image=$('preview-image');const c=crop||{x:0,y:0,w:1,h:1};
 const sw=Math.max(1,Math.round(image.naturalWidth*c.w)),sh=Math.max(1,Math.round(image.naturalHeight*c.h));
 const scale=Math.min(2,1600/sw,Math.sqrt(6500000/(sw*sh)));
 const canvas=document.createElement('canvas');canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(image,image.naturalWidth*c.x,image.naturalHeight*c.y,sw,sh,0,0,canvas.width,canvas.height);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);let brightness=0;
 for(let i=0;i<pixels.data.length;i+=4){brightness+=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;}
 const invert=brightness/(pixels.data.length/4)<110;
 for(let i=0;i<pixels.data.length;i+=4){let value=.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2];if(invert)value=255-value;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;}
 ctx.putImageData(pixels,0,0);return canvas;
}
$('review-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;const draft=$('review-text').value;
 if(!previewUrl){importLabels(parseList(draft));return;}
 const current=++job;setBusy(true);$('import-error').textContent='';$('progress').value=0;$('ocr-label').textContent='Pregătesc citirea pe telefon… Prima dată durează puțin mai mult.';
 timer=setTimeout(()=>{if(current===job)stopOcr('Citirea durează prea mult. Decupează doar mesajul cu lista sau lipește textul.');},90000);
 try {
  const t=await loadLibrary();if(current!==job)return;
  const created=await t.createWorker(['ron','eng'],1,{
   workerPath:new URL('vendor/worker.min.js',appBase).href,corePath:new URL('vendor/core',appBase).href,langPath:new URL('vendor/lang',appBase).href,
   workerBlobURL:false,
   logger:message=>{if(current!==job)return;const reading=message.status==='recognizing text';$('ocr-label').textContent=reading?'Citesc produsele din captură…':'Pregătesc citirea locală…';$('progress').value=reading?25+Math.round(message.progress*75):Math.round((message.progress||0)*25);},
   errorHandler:()=>{if(current===job)stopOcr('Citirea nu a reușit. Încearcă din nou sau lipește mesajul.');}
  });
  if(current!==job){await created.terminate();return;}worker=created;
  await created.setParameters({tessedit_pageseg_mode:t.PSM.AUTO,user_defined_dpi:'150'});
  const result=await created.recognize(prepareImage());if(current!==job)return;
  const labels=[...parseList(result.data.text),...parseList(draft)];importLabels(labels);
 } catch {if(current===job){$('import-error').textContent='Nu am putut citi captura. Textul și captura sunt păstrate. Încearcă decuparea sau scrie produsele în câmp.';}}
 finally {if(current===job){clearTimeout(timer);setBusy(false);if(worker){worker.terminate().catch(()=>{});worker=null;}}}
});
$('cancel-ocr').addEventListener('click',()=>stopOcr());
$('add-form').addEventListener('submit',event=>{event.preventDefault();const label=$('new-item').value.trim();if(!label)return;const old=items.length;items=mergeItems(items,[label]);save();render();$('new-item').value='';tell(items.length>old?`${label} a fost adăugat.`:'Produsul este deja pe listă.');});
$('edit-form').addEventListener('submit',event=>{event.preventDefault();const label=$('edit-label').value.trim();if(!label)return;items=items.map(i=>i.id===editId?{...i,label}:i);save();render();$('edit-dialog').close();tell('Produsul a fost modificat.');});
$('cancel-edit').addEventListener('click',()=>$('edit-dialog').close());
$('delete-item').addEventListener('click',()=>{items=items.filter(i=>i.id!==editId);save();render();$('edit-dialog').close();tell('Produsul a fost șters.');});
$('restore-all').addEventListener('click',()=>{items=items.map(i=>({...i,bought:false}));save();render();tell('Toate produsele sunt din nou pe listă.');});
$('new-list').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click',()=>{items=[];save();render();closeImport();$('reset-dialog').close();tell('Lista nouă este pregătită.');});
window.addEventListener('storage',event=>{if(event.key===STORAGE){items=readSaved(event.newValue);render();tell('Lista a fost schimbată în altă fereastră.');}});
render();if(!storageOk){$('saved-note').textContent='Browserul nu permite salvarea listei.';$('saved-note').classList.add('error');}
if('serviceWorker' in navigator)navigator.serviceWorker.register(new URL('sw.js',appBase),{scope:appBase.pathname}).catch(()=>{});

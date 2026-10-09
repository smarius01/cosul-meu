const key = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ro').replace(/\s+/g,' ').trim();
export function parseList(text) {
 const seen=new Set();
 return String(text).replace(/(?<!\d),|,(?!\d)|;/g,'\n').split(/\r?\n/).map(line => line
  .replace(/^\s*(?:[•●▪◦*+\-–—]\s*|\d+[.)](?=\s|[^\d\s])\s*)/u,'')
  .replace(/^\s*(?:lista(?: de)? cump[ăa]r[ăa]turi|lista de cump[ăa]r[ăa]turi|cump[ăa]r[ăa]turi|ia te rog|te rog(?: s[ăa])? (?:iei|cumperi)|de cump[ăa]rat)\s*:\s*/iu,'')
  .replace(/\s*\b\d{1,2}:\d{2}\s*(?:[✓✔√]+)?\s*$/u,'')
  .replace(/[✓✔√]+$/u,'').trim()
  .replace(/(\d+(?:[,.]\d+)?)\s*\|$/u,'$1 l')
 ).filter(line => {
  const k=key(line);
  if (!line || !/\p{L}/u.test(line) || /^(?:whatsapp|azi|ieri|astazi|mesaj|online|scrie un mesaj|cump[aă]r[aă]turi|lista(?: de)? cump[aă]r[aă]turi)[:\s]*$/iu.test(line) || seen.has(k)) return false;
  seen.add(k); return true;
 });
}
const median = values => {const sorted=values.filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]||0;};
const listMarker = /^\s*(?:[•●▪◦*+\-–—]|\d+[.)](?=\s))/u;
const delimiter = /(?<!\d),|,(?!\d)|;/u;
const clock = /^\d{1,2}:\d{2}(?:\s*[✓✔√]+)?$/u;
function ocrLine(line, sharedHeight=0) {
 let words=(line.words||[]).filter(w=>String(w.text||'').trim());
 if(words.length>1) {
  // Chat timestamps occupy the lower-right corner in smaller type. Do not
  // discard ordinary small units at the product baseline, or low-confidence food words.
  const body=words.slice(0,-1).filter(w=>/\p{L}/u.test(w.text)&&w.bbox);
  const height=Math.max(sharedHeight,median(body.map(w=>w.bbox.y1-w.bbox.y0)));
  const top=median(body.map(w=>w.bbox.y0));
  while(words.length>1) {
   const last=words.at(-1),box=last.bbox;
   const loweredSmall=box&&height&&box.y1-box.y0<height*.78&&box.y0>top+height*.5&&box.x0>words.at(-2).bbox?.x1;
   if(clock.test(last.text)||loweredSmall&&!/^[.,;]$/u.test(last.text))words.pop();else break;
  }
 }
 const text=(words.length?words.map(w=>w.text).join(' '):String(line.text||'')).trim();
 const boxes=words.map(w=>w.bbox).filter(Boolean);
 const bbox=boxes.length?{x0:Math.min(...boxes.map(b=>b.x0)),y0:Math.min(...boxes.map(b=>b.y0)),x1:Math.max(...boxes.map(b=>b.x1)),y1:Math.max(...boxes.map(b=>b.y1))}:line.bbox;
 return {text,bbox};
}
function joinOcrGroup(lines) {
 const hasCommas=lines.some(line=>delimiter.test(line));
 const rows=[];
 for(const text of lines) {
  const previous=rows.at(-1)||'';
  const continuation=/^(?:de|din|cu|f[ăa]r[ăa]|sau|[șs]i|d-?alea|alea)\b/iu.test(text);
  const incomplete=/\b(?:de|din|cu|pentru|pt|la|[șs]i|sau)\s*$/iu.test(previous)||/^\d+(?:[,.]\d+)?\s+(?:cutii|cutie|pachete|pachet|sticle|sticl[ăa]|buc[ăa][țt]i|buc|kg|g|l|ml)(?:\s+(?:mici|mari|mic[ăa]|mare))?\s*$/iu.test(previous);
  // Explicit bullets/numbering win. Plain line-separated lists remain separate
  // unless there is a comma-list or concrete evidence of an unfinished phrase.
  if(previous&&!listMarker.test(text)&&(continuation||incomplete||hasCommas&&!listMarker.test(previous)))rows[rows.length-1]+=' '+text;
  else rows.push(text);
 }
 return rows;
}
export function parseOcrList(data) {
 const raw=(data?.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]));
 const groups=[];
 if(raw.length) {
  const sharedHeight=median(raw.flatMap(l=>(l.words||[]).filter(w=>/\p{L}/u.test(w.text)&&w.bbox).map(w=>w.bbox.y1-w.bbox.y0)));
  const lines=raw.map(l=>ocrLine(l,sharedHeight)).sort((a,b)=>(a.bbox?.y0||0)-(b.bbox?.y0||0)||(a.bbox?.x0||0)-(b.bbox?.x0||0));
  const height=median(lines.filter(l=>/\p{L}/u.test(l.text)).map(l=>l.bbox?l.bbox.y1-l.bbox.y0:0));
  let previous=null;
  for(const line of lines) {
   if(clock.test(line.text)||!line.text){previous=null;continue;}
   if(!/\p{L}/u.test(line.text))continue;
   const close=previous?.bbox&&line.bbox&&line.bbox.y0-previous.bbox.y1<=height*.75&&Math.abs(line.bbox.x0-previous.bbox.x0)<=height*2;
   if(!close)groups.push([]);
   groups.at(-1).push(line.text);previous=line;
  }
 } else {
  for(const paragraph of String(data?.text||'').split(/\r?\n\s*\r?\n/))groups.push(paragraph.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!clock.test(s)));
 }
 const text=groups.flatMap(joinOcrGroup).join('\n');
 // Sentence punctuation from messages is not part of the product name.
 return parseList(parseList(text).map(label=>label.replace(/\s*[.!?–—]+\s*$/u,'')).join('\n'));
}
export function mergeItems(items, labels) {
 const seen=new Set(items.map(item=>key(item.label)));
 const added=[];
 for (const raw of labels) {
  const label=String(raw).trim(); const k=key(label);
  if (label && !seen.has(k)) { added.push({id:crypto.randomUUID(),label,bought:false}); seen.add(k); }
 }
 return [...items,...added];
}
export function toggleItem(items,id) {
 return items.map(item=>item.id===id ? {...item,bought:!item.bought}:item);
}
export function readSaved(raw) {
 try {
  const value=JSON.parse(raw); if (!Array.isArray(value)) return [];
  const ids=new Set();
  return value.filter(i=>i && typeof i.id==='string' && !ids.has(i.id) && typeof i.label==='string' && i.label.trim() && typeof i.bought==='boolean' && ids.add(i.id))
   .map(({id,label,bought})=>({id,label,bought}));
 } catch {return [];}
}

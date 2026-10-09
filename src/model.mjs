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

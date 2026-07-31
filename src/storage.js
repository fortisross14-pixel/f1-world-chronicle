const DB_NAME='f1-world-chronicle-db';
const DB_VERSION=1;
const STORE='saves';

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB is not available in this browser.'));return;}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'slot'});};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Could not open save database.'));
  });
}
function transaction(db,mode,operation){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode);const store=tx.objectStore(STORE);const request=operation(store);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Save operation failed.'));
    tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error||new Error('Save transaction failed.'));
  });
}
export async function saveSlot(slot,universe,label='F1 Universe'){
  const db=await openDb();
  return transaction(db,'readwrite',(store)=>store.put({slot,label,year:universe.year,round:universe.currentRound,phase:universe.phase,updatedAt:new Date().toISOString(),schemaVersion:universe.schemaVersion,universe}));
}
export async function loadSlot(slot){const db=await openDb();const row=await transaction(db,'readonly',(store)=>store.get(slot));return row?.universe||null;}
export async function deleteSlot(slot){const db=await openDb();return transaction(db,'readwrite',(store)=>store.delete(slot));}
export async function listSlots(){
  const db=await openDb();const rows=await transaction(db,'readonly',(store)=>store.getAll());
  return rows.sort((a,b)=>a.slot-b.slot).map(({universe,...meta})=>meta);
}
export function exportUniverse(universe){
  const blob=new Blob([JSON.stringify(universe)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');
  link.href=url;link.download=`f1-world-chronicle-${universe.year}.json`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
export function importUniverse(file){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed?.teams||!parsed?.drivers||!parsed?.calendar)throw new Error('This is not a valid F1 World Chronicle save.');resolve(parsed);}catch(error){reject(error);}};reader.onerror=()=>reject(reader.error||new Error('Could not read the save file.'));reader.readAsText(file);});
}

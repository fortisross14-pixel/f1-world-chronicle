import React, { createContext, useContext } from 'react';

// Tappable names in the guided flows. App provides {can(kind,id), open(kind,id)}.
// kind: 'driver' | 'team' | 'staff' | 'series'. Unknown targets render as plain text.
export const LinksContext=createContext(null);
export const useLinks=()=>useContext(LinksContext);

export function L({kind,id,children,className=''}){
  const links=useLinks();
  if(id==null||!links?.can(kind,id))return <>{children}</>;
  return <button type="button" className={`entity-link ${className}`} onClick={(event)=>{event.stopPropagation();links.open(kind,id);}}>{children}</button>;
}

// Remember where the reader was, so Back from a linked page lands on the same spot.
export function rememberScroll(){
  try{window.history.replaceState({...(window.history.state||{}),scrollY:window.scrollY},'');}catch{/* history unavailable */}
}
export function restoreScroll(){
  const y=window.history.state?.scrollY||0;
  window.requestAnimationFrame?.(()=>window.scrollTo?.({top:y}));
}

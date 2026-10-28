// OS save/share APIs must run directly from a click on an already prepared file.
export function saveCapabilities(env,file){
 let share=false;
 try{share=!!(env.isSecureContext&&env.navigator?.share&&env.navigator?.canShare?.({files:[file]}));}catch{}
 const topLevel=!env.top||env.top===env;
 return {picker:!!(env.isSecureContext&&topLevel&&typeof env.showSaveFilePicker==='function'),share};
}
export async function saveNativeFile(file,env,mode){
 let writable;
 if(mode==='desktop'){try{return await env.metaalmaatDesktop.saveFile(file.name,new Uint8Array(await file.arrayBuffer()));}catch(e){return {status:'failed',message:e.message};}}
 try{
  if(mode==='picker'){
   const extension='.'+file.name.split('.').pop().toLowerCase();
   // Do not await file generation or another API before asking for the handle.
   const mime=(file.type||'application/octet-stream').split(';')[0];
   const handlePromise=env.showSaveFilePicker({suggestedName:file.name,types:[{description:extension==='.csv'?'CSV-bestand':'Excelbestand',accept:{[mime]:[extension]}}]});
   const handle=await handlePromise;writable=await handle.createWritable();await writable.write(file);await writable.close();return {status:'saved'};
  }
  if(mode==='share'){
   const shared=env.navigator.share({files:[file],title:file.name});await shared;return {status:'shared'};
  }
  return {status:'blocked',reason:'Unsupported'};
 }catch(error){
  if(writable?.abort){try{await writable.abort();}catch{}}
  if(error.name==='AbortError')return {status:'cancelled'};
  if(['SecurityError','NotAllowedError','TypeError','Unsupported'].includes(error.name))return {status:'blocked',reason:error.name};
  return {status:'failed',message:error.message||'Opslaan is mislukt.'};
 }
}

let current=null,objectURL=null,primaryMode='download',initialized=false;
const $=id=>document.getElementById(id);
function configureButtons(){
 const capabilities=saveCapabilities(window,current);primaryMode=window.metaalmaatDesktop?'desktop':capabilities.picker?'picker':capabilities.share?'share':'download';
 $('saveFileBtn').textContent=['desktop','picker'].includes(primaryMode)?'Opslaan als…':primaryMode==='share'?'Bewaar / deel bestand':'Download bestand';
 $('shareFileBtn').hidden=!capabilities.share||primaryMode==='share';
 $('savePlatformHint').textContent=['desktop','picker'].includes(primaryMode)?'Kies zelf de bestandsnaam en map in het opslagvenster.':primaryMode==='share'?'Kies in het deelmenu ‘Bewaar in Bestanden’ om een map op je iPhone of iPad te kiezen.':'Deze browser heeft geen eigen opslagvenster. Gebruik de downloadlink of open het bestand. Je browser bepaalt of je een map kiest of het bestand naar Downloads gaat.';
}
function openSaveDialog(){if(!current)return;configureButtons();$('saveDialogStatus').textContent='Het bestand is klaar. Kies hieronder hoe je het wilt opslaan.';if(!$('saveDialog').open)$('saveDialog').showModal();}
async function save(mode){
 if(!current)return;
 const file=current;
 if(mode==='download'){$('downloadDirect').click();return;}
 $('saveFileBtn').disabled=true;$('shareFileBtn').disabled=true;
 // Calling this before the first await retains the click's user activation.
 const resultPromise=saveNativeFile(file,window,mode);
 const result=await resultPromise;
 $('saveFileBtn').disabled=false;$('shareFileBtn').disabled=false;
 if(current!==file)return;
 if(result.status==='saved')$('saveDialogStatus').textContent='Bestand opgeslagen in de door jou gekozen map.';
 else if(result.status==='shared')$('saveDialogStatus').textContent='Het deelmenu is afgerond. Controleer de gekozen bestemming voor je bestand.';
 else if(result.status==='cancelled')$('saveDialogStatus').textContent='Opslaan geannuleerd. Je bestand blijft hier klaarstaan; probeer het opnieuw wanneer je wilt.';
 else if(result.status==='blocked'){
  $('saveDialogStatus').textContent='Deze browser blokkeert het opslag- of deelvenster. Gebruik ‘Gewoon downloaden’ of ‘Open bestand’. Open de tool eventueel rechtstreeks in Safari, Edge of Chrome.';
  primaryMode='download';$('saveFileBtn').textContent='Download bestand';
 }else $('saveDialogStatus').textContent='Opslaan is mislukt: '+result.message+' Je kunt opnieuw proberen of gewoon downloaden.';
}
function initialize(){
 if(initialized)return;initialized=true;
 $('saveFileBtn').addEventListener('click',()=>save(primaryMode));
 $('shareFileBtn').addEventListener('click',()=>save('share'));
 $('downloadDirect').addEventListener('click',()=>{$('saveDialogStatus').textContent='Download aangevraagd. Kijk in de downloadlijst van je browser. Afhankelijk van je instellingen verschijnt een opslagvenster of gaat het bestand naar Downloads.';});
 $('openFileLink').addEventListener('click',()=>{$('saveDialogStatus').textContent='Het bestand wordt in een nieuw tabblad geopend. Op iPhone kun je via Delen kiezen voor ‘Bewaar in Bestanden’.';});
 $('downloadLink').addEventListener('click',event=>{event.preventDefault();openSaveDialog();});
}
export function presentDownload(blob,name,options={}){
 initialize();if(objectURL)URL.revokeObjectURL(objectURL);
 current=new File([blob],name,{type:(blob.type||'application/octet-stream').split(';')[0]});objectURL=URL.createObjectURL(current);
 $('downloadLink').href=objectURL;
 const directURL=options.url?new URL(options.url,location.href):null;
 if(directURL&&directURL.origin!==location.origin)throw Error('Een downloadlink moet bij deze tool horen.');
 $('downloadDirect').href=directURL?.href??objectURL;$('openFileLink').href=directURL?.href??objectURL;
 $('openToolLink').href=location.origin;
 for(const id of ['downloadLink','downloadDirect'])$(id).download=name;
 $('downloadLink').textContent='↓ '+name+' · opslaan';
 $('saveFileName').textContent=name;$('saveFileSize').textContent=new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(current.size/1024)+' kB';
 $('downloadReady').hidden=false;openSaveDialog();
}

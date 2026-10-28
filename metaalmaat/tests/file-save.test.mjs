import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCapabilities,saveNativeFile} from '../dist/file-save.mjs';
const file=new File(['example Excel bytes'],'Materiaalprijs-Converter-invulformat.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
test('Windows: opslagvenster opent direct in dezelfde klik; bytes worden geschreven en afgesloten',async()=>{
 const events=[];let received;
 const env={isSecureContext:true,showSaveFilePicker(options){events.push('picker');assert.equal(options.suggestedName,file.name);assert.deepEqual(options.types[0].accept[file.type],['.xlsx']);return Promise.resolve({async createWritable(){events.push('writer');return {async write(data){received=data;events.push('write');},async close(){events.push('close');}};}});}};
 assert.equal(saveCapabilities(env,file).picker,true);const pending=saveNativeFile(file,env,'picker');assert.deepEqual(events,['picker']);assert.deepEqual(await pending,{status:'saved'});assert.equal(received,file);assert.deepEqual(events,['picker','writer','write','close']);
});
test('iPhone: direct het native bestandsdeelmenu openen zonder voorafgaande await',async()=>{
 const calls=[];const env={isSecureContext:true,navigator:{canShare(data){return data.files[0]===file;},share(data){calls.push(data);return Promise.resolve();}}};
 assert.equal(saveCapabilities(env,file).share,true);const pending=saveNativeFile(file,env,'share');assert.equal(calls.length,1);assert.equal(calls[0].files[0],file);assert.deepEqual(await pending,{status:'shared'});
});
test('Annuleren opent geen tweede venster of automatische download',async()=>{
 const env={isSecureContext:true,showSaveFilePicker(){return Promise.reject(new DOMException('Cancelled','AbortError'));}};
 assert.deepEqual(await saveNativeFile(file,env,'picker'),{status:'cancelled'});
});
test('Geblokkeerde API wordt zichtbaar teruggegeven; geen succesmelding',async()=>{
 const env={isSecureContext:true,showSaveFilePicker(){throw new DOMException('Blocked in embedded browser','SecurityError');}};
 const result=await saveNativeFile(file,env,'picker');assert.equal(result.status,'blocked');assert.equal(result.reason,'SecurityError');
});
test('Safari zonder file picker en browser zonder delen houden een downloadroute',()=>{
 assert.deepEqual(saveCapabilities({isSecureContext:true,navigator:{}},file),{picker:false,share:false});
 assert.equal(saveCapabilities({isSecureContext:false,showSaveFilePicker(){}},file).picker,false);
 assert.equal(saveCapabilities({isSecureContext:true,navigator:{share(){},canShare(){throw Error('Blocked');}}},file).share,false);
});
test('Een schrijffout is geen succesvol opgeslagen bestand',async()=>{
 const env={isSecureContext:true,showSaveFilePicker(){return Promise.resolve({async createWritable(){return {async write(){throw new Error('Disk full');},async close(){assert.fail('Must not close after failed write');},async abort(){}};}});}};
 const result=await saveNativeFile(file,env,'picker');assert.equal(result.status,'failed');assert.equal(result.message,'Disk full');
});
test('CSV met charset levert een geldige MIME-filter aan het opslagvenster',async()=>{
 const csv=new File(['a;b'],'resultaat.csv',{type:'text/csv;charset=utf-8'});let accept;
 const env={showSaveFilePicker(options){accept=options.types[0].accept;return Promise.reject(new DOMException('Cancelled','AbortError'));}};
 await saveNativeFile(csv,env,'picker');assert.deepEqual(accept,{'text/csv':['.csv']});
});
test('Een ingesloten tool belooft geen verboden desktopbestandskiezer',()=>{
 const embedded={isSecureContext:true,top:{},showSaveFilePicker(){}};
 assert.equal(saveCapabilities(embedded,file).picker,false);
});

test('Desktop: native opslag ontvangt exacte bytes; annuleren blijft geannuleerd',async()=>{
 const file=new File(['metaalmaat'],'test.csv',{type:'text/csv'});
 let received;
 const env={metaalmaatDesktop:{saveFile:async(name,bytes)=>{received={name,bytes};return {status:'saved'};}}};
 assert.equal((await saveNativeFile(file,env,'desktop')).status,'saved');
 assert.equal(received.name,'test.csv');assert.equal(new TextDecoder().decode(received.bytes),'metaalmaat');
 env.metaalmaatDesktop.saveFile=async()=>({status:'cancelled'});
 assert.equal((await saveNativeFile(file,env,'desktop')).status,'cancelled');
 env.metaalmaatDesktop.saveFile=async()=>{throw Error('Schijf vol');};
 assert.deepEqual(await saveNativeFile(file,env,'desktop'),{status:'failed',message:'Schijf vol'});
});

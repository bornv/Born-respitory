const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('metaalmaatDesktop',Object.freeze({
 saveFile:(name,bytes)=>ipcRenderer.invoke('file:save',{name,bytes})
}));

const {app,BrowserWindow,Menu,ipcMain,dialog,shell,net}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');

let win;
const entry=path.join(__dirname,'../dist/index.html');
const trusted=e=>e.sender===win?.webContents && e.senderFrame===win.webContents.mainFrame && e.senderFrame.url.startsWith('file://');

app.setName('Metaalmaat');
if(!app.requestSingleInstanceLock())app.quit();
else {
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
 app.whenReady().then(()=>{
  win=new BrowserWindow({width:1440,height:940,minWidth:1000,minHeight:720,backgroundColor:'#f4f6f9',show:false,title:'Metaalmaat Desktop — JBT Marel',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.once('ready-to-show',()=>win.show());
  const external=url=>{try{const u=new URL(url);if(u.protocol==='https:')shell.openExternal(u.href);}catch{}};
  win.webContents.setWindowOpenHandler(({url})=>{external(url);return {action:'deny'};});
  win.webContents.on('will-navigate',(e,url)=>{if(url!==win.webContents.getURL()){e.preventDefault();external(url);}});
  win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  win.webContents.session.on('will-download',(_e,item)=>item.setSaveDialogOptions({title:'Bestand opslaan',defaultPath:path.join(app.getPath('documents'),path.basename(item.getFilename()))}));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   {label:'Bestand',submenu:[{label:'Afsluiten',role:'quit'}]},
   {label:'Bewerken',submenu:[{role:'undo',label:'Ongedaan maken'},{role:'redo',label:'Opnieuw'}, {type:'separator'},{role:'cut',label:'Knippen'},{role:'copy',label:'Kopiëren'},{role:'paste',label:'Plakken'},{role:'selectAll',label:'Alles selecteren'}]},
   {label:'Beeld',submenu:[{role:'resetZoom',label:'Werkelijke grootte'},{role:'zoomIn',label:'Inzoomen'},{role:'zoomOut',label:'Uitzoomen'},{role:'togglefullscreen',label:'Volledig scherm'}]},
   {label:'Help',submenu:[{label:'Over Metaalmaat',click:()=>dialog.showMessageBox(win,{type:'info',title:'Metaalmaat Desktop',message:'Metaalmaat 2.0.0 — JBT Marel',detail:'Leveranciers-Excel omrekenen · lokale verwerking · valutaomrekening'})}]}
  ]));
  ipcMain.handle('file:save',async(e,{name,bytes})=>{
   if(!trusted(e))throw Error('Geen toegang.');
   if(typeof name!=='string'||!(bytes instanceof Uint8Array)||bytes.length>100*1024*1024)throw Error('Ongeldig bestand.');
   const filename=path.basename(name);const result=await dialog.showSaveDialog(win,{title:'Bestand opslaan',defaultPath:path.join(app.getPath('documents'),filename),filters:[{name:'Excel / CSV',extensions:[path.extname(filename).slice(1)||'xlsx']}]});
   if(result.canceled||!result.filePath)return {status:'cancelled'};
   try{await fs.writeFile(result.filePath,bytes);return {status:'saved'};}catch(error){return {status:'failed',message:error.message};}
  });
  win.loadFile(entry);
 });
 app.on('window-all-closed',()=>app.quit());
}

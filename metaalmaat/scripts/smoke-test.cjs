// Runs against the real Electron app on Windows; --browser is local renderer QA.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {_electron,chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const JSZip=require('jszip');
globalThis.JSZip=JSZip;
(async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'converter-qa-'));
 const out=path.join(root,'release/qa');await fs.mkdir(out,{recursive:true});
 const browserMode=process.argv.includes('--browser');let app,browser,page;
 const checks=[];const check=(name,fn)=>{fn();checks.push(name);};
 try{
  if(browserMode){browser=await chromium.launch({headless:true,args:['--no-sandbox','--allow-file-access-from-files']});page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);}
  else{const executable=process.env.CONVERTER_EXE;app=await _electron.launch({...(executable?{executablePath:path.resolve(executable),args:[]}:{args:[root]}),timeout:60000});page=await app.firstWindow();await page.setViewportSize({width:1440,height:1000});}
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.waitForSelector('#fileInput',{state:'attached'});
  check('Naam en JBT Marel-logo geladen',()=>assert.match(page.url(),/index\.html/));
  assert.match(await page.title(),/Materiaalprijs Converter/);
  await page.waitForFunction(()=>{const img=document.querySelector('.company-logo');return img?.naturalWidth>0&&!img.hidden;});
  const headers=['Artikel','Omschrijving','Type','Prijs','Bron eenheid','Prijsbasis','Valuta','Diameter (mm)','Dichtheid (kg/m3)'];
  const nl=[headers.join(';'),'NL;ROND 20 S235;Rondstaf;1.200;kg;1;EUR;20;7.850','LOW;ROND 20 S235;Rondstaf;1,20;kg;1;EUR;20;7,85','BAD;ROND 20 S235;Rondstaf;12.34;kg;1;EUR;20;7850'].join('\r\n');
  await page.locator('#fileInput').setInputFiles({name:'leverancier-nl.csv',mimeType:'text/csv',buffer:Buffer.from(nl)});
  await page.waitForFunction(()=>document.getElementById('statAll').textContent==='3');
  const row=id=>page.locator('#resultBody tr').filter({has:page.locator('td b',{hasText:new RegExp('^'+id+'$')})});
  check('Nederlandse 1.200 en 7.850 correct omgerekend',()=>{});assert.match(await row('NL').locator('td').nth(4).innerText(),/2\.959,38/);assert.match(await row('NL').innerText(),/Omgerekend/);
  check('Lage dichtheid krijgt Controle nodig',()=>{});assert.match(await row('LOW').innerText(),/Controle nodig/);assert.match(await row('LOW').locator('td').nth(5).getAttribute('title'),/100 kg\/m³/);assert.equal((await row('LOW').locator('td').nth(4).innerText()).trim(),'—');
  check('Ongeldige Nederlandse getalnotatie wordt niet omgerekend',()=>{});assert.match(await row('BAD').innerText(),/Controle nodig/);
  await page.selectOption('#numberFormat','international');
  assert.match(await row('NL').innerText(),/Controle nodig/);checks.push('Notatiewijziging herberekent bestaande regels');
  const international=[headers.join(';'),'INT;ROND 20 S235;Rondstaf;1,200.50;kg;1;EUR;20;7,850'].join('\r\n');
  await page.locator('#fileInput').setInputFiles({name:'leverancier-int.csv',mimeType:'text/csv',buffer:Buffer.from(international)});
  await page.waitForFunction(()=>document.getElementById('statAll').textContent==='1');
  assert.match(await row('INT').locator('td').nth(4).innerText(),/2\.960,61/);checks.push('Internationale bron expliciet en correct verwerkt');
  const {createXlsx}=await import(pathToFileURL(path.join(root,'dist/excel.mjs')).href);
  const blob=await createXlsx([{name:'Materialen',rows:[headers,['NUM','ROND 20 S235','Rondstaf',1.234,'kg',1,'EUR',20,7850],['TXT','ROND 20 S235','Rondstaf','1.200','kg',1,'EUR',20,'7.850']]},{name:'Broninformatie',rows:[['Notitie'],['=HYPERLINK("https://example.invalid")']]}]);
  await page.selectOption('#numberFormat','nl');
  await page.locator('#fileInput').setInputFiles({name:'leverancier.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(await blob.arrayBuffer())});
  await page.waitForFunction(()=>document.getElementById('statAll').textContent==='2');
  assert.match(await row('NUM').locator('td').nth(4).innerText(),/3,04/);assert.match(await row('TXT').locator('td').nth(4).innerText(),/2\.959,38/);checks.push('Getypte en tekstuele Excelcellen correct onderscheiden');
  await page.click('#exportBtn');await page.waitForSelector('#saveDialog[open]');
  const prepared=await page.evaluate(async()=>({name:document.getElementById('downloadDirect').download,bytes:Array.from(new Uint8Array(await (await fetch(document.getElementById('downloadDirect').href)).arrayBuffer()))}));
  const zip=await JSZip.loadAsync(Buffer.from(prepared.bytes));
  assert.match(await zip.file('xl/workbook.xml').async('string'),/Broninformatie/);assert.match(await zip.file('xl/workbook.xml').async('string'),/Gebruikte omrekening/);
  assert.match(await zip.file('xl/worksheets/sheet3.xml').async('string'),/Notatie tekstgetallen/);checks.push('Excel-export bewaart brontabbladen en gebruikte tekstnotatie');
  if(app){
   const target=path.join(temp,'resultaat.xlsx');
   await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},target);
   await page.click('#saveFileBtn');await page.waitForFunction(()=>document.getElementById('saveDialogStatus').textContent.includes('Bestand opgeslagen'));
   assert.deepEqual(await fs.readFile(target),Buffer.from(prepared.bytes));checks.push('Windows-opslag schrijft exacte Excelbytes');
   await app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true});});
   await page.click('#saveFileBtn');await page.waitForFunction(()=>document.getElementById('saveDialogStatus').textContent.includes('geannuleerd'));checks.push('Annuleren blijft zichtbaar en meldt geen opslagsucces');
  }
  await page.locator('#saveDialog [data-close]').first().click();
  await page.click('#csvBtn');await page.waitForSelector('#saveDialog[open]');
  const csv=await page.evaluate(async()=>(await fetch(document.getElementById('downloadDirect').href)).text());
  assert.match(csv,/"1,234"/);assert.match(csv,/"3,043229/);assert.match(csv,/"1\.200"/);checks.push('CSV gebruikt komma voor numerieke uitvoer en behoudt brontekst');
  await page.locator('#saveDialog [data-close]').first().click();
  await page.locator('[data-mode="single"]').first().click();await page.fill('#calcDensity','7,85');
  assert.match(await page.locator('#calcIssues').innerText(),/100 kg\/m³/);checks.push('Losse calculator toont dezelfde dichtheidscontrole');
  assert.deepEqual(errors,[]);checks.push('Geen JavaScript-fouten tijdens de gebruikstest');
  await page.screenshot({path:path.join(out,'converter-smoke.png'),fullPage:true});
  const report={appPath:app?await app.evaluate(({app})=>app.getAppPath()):null,userDataDirectory:app?await app.evaluate(({app})=>app.getPath('userData')):null,version:require('../package.json').version,platform:process.platform,runtime:app?(process.env.CONVERTER_EXE?'Electron verpakte Windows-app':'Electron bronapp'):'Chromium renderer',checks,limitations:app?'Native bestandskeuze wordt nagebootst; werkelijke IPC en bestandsbytes zijn gecontroleerd. Geen handmatige acceptatietest.':'Geen Electron- of Windows-test.'};
  await fs.writeFile(path.join(out,'smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await app?.close();await browser?.close();await fs.rm(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});

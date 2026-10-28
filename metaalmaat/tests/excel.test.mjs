import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createXlsx,createCSV,colName} from '../dist/excel.mjs';
const require=createRequire(import.meta.url);
const JSZip=require('jszip');
globalThis.JSZip=JSZip;
test('Excel export bevat alle tabbladen en typed waarden, zonder formule-injectie',async()=>{
 const blob=await createXlsx([{name:'Materialen',rows:[['Artikel','EUR/kg','kg/m'],['=HYPERLINK("malicious")',1.2,2.46615],['Onderdeel & plaat',0,null]]},{name:'Uitleg',rows:[['Onderwerp','Tekst'],['notatie','Ø20 × 6 m²']]}]);
 assert.ok(blob.size>1000);const zip=await JSZip.loadAsync(await blob.arrayBuffer());
 const wb=await zip.file('xl/workbook.xml').async('string');assert.match(wb,/name="Materialen"/);assert.match(wb,/name="Uitleg"/);
 const sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');assert.match(sheet,/<v>1.2<\/v>/);assert.match(sheet,/<v>0<\/v>/);assert.match(sheet,/t="inlineStr"[^>]*><is><t[^>]*>=HYPERLINK/);assert.doesNotMatch(sheet,/<f[ >]/);assert.match(sheet,/Onderdeel &amp; plaat/);assert.match(sheet,/state="frozen"/);
});
test('CSV beschermt tekstformules en ontsnapt quotes en nieuwe regels',async()=>{
 const text=await createCSV([['Artikel','Prijs'],['=2+2',1.2],['A;"B"\nC',0]]).text();assert.match(text,/'=2\+2/);assert.match(text,/"A;""B""\nC"/);assert.match(text,/;"0"/);
});
test('Kolommen correct voorbij Z en ZZ',()=>{assert.equal(colName(0),'A');assert.equal(colName(25),'Z');assert.equal(colName(26),'AA');assert.equal(colName(701),'ZZ');assert.equal(colName(702),'AAA');});

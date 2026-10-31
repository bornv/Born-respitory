import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from '../dist/excel.mjs';
const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version;
test('Versie in app, handleiding en lockfile komt overeen met package.json',()=>{
 const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url)));
 assert.equal(lock.version,version);assert.equal(lock.packages[''].version,version);
 assert.match(readFileSync(new URL('../dist/desktop.mjs',import.meta.url),'utf8'),new RegExp(`DESKTOP ${version.replace(/\./g,'\\.')}'`));
 assert.match(readFileSync(new URL('../LEESMIJ-WINDOWS.txt',import.meta.url),'utf8'),new RegExp(`Setup-${version.replace(/\./g,'\\.')}-x64`));
 assert.match(readFileSync(new URL('../RELEASE-NOTES.md',import.meta.url),'utf8'),new RegExp(`^# .* ${version.replace(/\./g,'\\.')} `));
});
const csv=n=>new File(['Artikel;Prijs\r\n'+Array.from({length:n-1},(_,i)=>`A${i};1,20`).join('\r\n')],'leverancier.csv',{type:'text/csv'});
test('CSV met te veel rijen wordt geweigerd met het gevonden aantal',async()=>{
 await assert.rejects(readFile(csv(50001)),/50\.001 rijen.*maximaal 49\.999 regels plus een kopregel/);
 const book=await readFile(csv(50000));assert.equal(book.sheets[0].rows.length,50000);
});

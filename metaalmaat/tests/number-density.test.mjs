import test from 'node:test';
import assert from 'node:assert/strict';
import {number,physical,conversion,priceBasis,parseUnit} from '../dist/core.mjs';
import {createCSV,readFile} from '../dist/excel.mjs';

test('Nederlandse tekstgetallen gebruiken punt voor duizendtallen en komma voor decimalen',()=>{
 for(const [s,n] of [['1.200',1200],['7.850',7850],['1.200,50',1200.5],['1.234.567,89',1234567.89],['0,125',.125],['-1.200',-1200],['0',0]])assert.equal(number(s,'nl'),n,s);
 assert.equal(number('12.34','nl'),null);
 assert.equal(number('1,234.56','nl'),null);
});
test('Internationale tekstnotatie is expliciet; echte numerieke cellen veranderen niet',()=>{
 assert.equal(number('1.200','international'),1.2);
 assert.equal(number('1,200.50','international'),1200.5);
 assert.equal(number('1.200,50','international'),null);
 for(const format of ['nl','international'])for(const n of [1.2,7.85,.125,7850])assert.equal(number(n,format),n);
 assert.equal(number('2.4661502330679874'),2.4661502330679874);
 assert.equal(priceBasis('1.000',1,1,'nl').basis,1000);
 assert.deepEqual(parseUnit('1.000 kg','nl'),{unit:'kg',basis:1000});
});
test('Onwaarschijnlijk lage dichtheid wordt gemarkeerd, zonder automatische correctie',()=>{
 for(const density of [7.85,2.7,99.99]){
  const p=physical({type:'round',density,diameter:20});
  assert.match(p.issues.join(' '),/dichtheid.*100.*kg\/m³/i);
  assert.equal(p.kgm,null);
  assert.equal(conversion({price:1.2,basis:1,unit:'kg'},p).prices.m,null);
 }
 const p=physical({type:'round',density:100,diameter:20});assert.equal(p.issues.length,0);
 assert.ok(physical({type:'round',density:7850,diameter:20}).kgm>2);
 assert.equal(physical({type:'profile',kgm:3}).kgm,3);
});
test('CSV exporteert numerieke waarden met komma en behoudt tekst en formulebescherming',async()=>{
 const blob=createCSV([['Prijs','Brontekst'],[2.959380279681585,'1.200'],[1200.5,'+cmd'],[1.2e-7,'00123'],[0,'=HYPERLINK("x")']]);
 const text=await blob.text();assert.match(text,/"2,959380279681585";"1.200"/);assert.match(text,/"1200,5";"'\+cmd"/);assert.match(text,/"1,2e-7";"00123"/);
 const book=await readFile(new File([blob],'uitvoer.csv',{type:'text/csv'}));
 assert.equal(number(book.sheets[0].rows[1][0],'nl'),2.959380279681585);
 assert.equal(number(book.sheets[0].rows[2][0],'nl'),1200.5);
 assert.equal(number(book.sheets[0].rows[3][0],'nl'),1.2e-7);
 assert.equal(book.sheets[0].rows[1][1],'1.200');
});

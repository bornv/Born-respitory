import test from 'node:test';
import assert from 'node:assert/strict';
import {number,parseUnit,parseDimensions,detectMaterial,physical,conversion,exchangeRate,priceBasis} from '../dist/core.mjs';
const close=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('Valuta: EUR-anker, kruiskoersen en ontbrekende koers',()=>{close(exchangeRate('USD','EUR',{USD:1.25}),.8);close(exchangeRate('USD','GBP',{USD:1.25,GBP:.9}),.72);assert.equal(exchangeRate('CHF','EUR',{}),null);assert.equal(exchangeRate('USD','USD',{}),1);assert.equal(exchangeRate('USD','EUR',{USD:0}),null);});
test('Nederlandse en internationale getallen, nul en ontbrekende waarden',()=>{
 close(number('€ 1.234,56'),1234.56);close(number('1,20'),1.2);close(number('1,234.56'),1234.56);close(number('2.47'),2.47);assert.equal(number(''),null);assert.equal(number(0),0);assert.equal(number('niet bekend'),null);
});
test('Prijseenheid en prijsbasis blijven afzonderlijke begrippen',()=>{
 assert.deepEqual(parseUnit('€ / 1000 KG'),{unit:'kg',basis:1000});assert.deepEqual(parseUnit('per 100 m'),{unit:'m',basis:100});assert.equal(parseUnit(1),null);assert.deepEqual(parseUnit('m²'),{unit:'m2',basis:1});
});
test('Prijsbasis in tekst en kolom wordt één keer toegepast, conflicten blijven zichtbaar',()=>{
 assert.equal(priceBasis(1,100,1).basis,100);assert.equal(priceBasis(100,100,1).basis,100);assert.equal(priceBasis('',1,1000).basis,1000);assert.equal(priceBasis('fout',1,1).basis,null);assert.equal(priceBasis(10,100,1).basis,null);
});
test('Gangbare staalbenamingen worden herkend',()=>{for(const v of ['S235JR','S355J2','C45E','ST.37K'])assert.equal(detectMaterial(v),'steel');});
test('Afmetingen uit de concrete ERP-notaties',()=>{
 assert.equal(parseDimensions('round','ROND  10.H9 1.4301 304 BLANK').diameter,10);
 assert.deepEqual(parseDimensions('flat','PLAT 30X10 L=3000 PE500 NAT'),{width:30,thickness:10,length:3000});
 assert.deepEqual(parseDimensions('plate','PLAAT 3MM 520X105 PC'),{thickness:3,width:520,length:105});
 assert.equal(detectMaterial('BASE MATERIAL'),null);assert.equal(detectMaterial('ROND 10 1.4401 316'),'rvs316');
});
test('Rondstaf Ø20 staal, prijs en hoeveelheden in beide richtingen',()=>{
 const p=physical({type:'round',density:7850,diameter:20,length:6000});close(p.kgm,2.4661502330679874);
 close(conversion({price:1.2,basis:1,unit:'kg'},p).prices.m,2.959380279681585);
 const r=conversion({price:2.959380279681585,basis:1,unit:'m',quantity:6,quantityUnit:'m'},p);close(r.prices.kg,1.2);close(r.quantities.kg,14.796901398407925);close(r.quantities.stuk,1);
});
test('Plaat: 2 mm aluminium 1250×2500 mm, volledige plaat naar m² en kg',()=>{
 const p=physical({type:'plate',density:2700,thickness:2,width:1250,length:2500});close(p.kgm2,5.4);close(p.piece,16.875);
 const r=conversion({price:100,basis:1,unit:'stuk'},p);close(r.prices.m2,32);close(r.prices.kg,100/16.875);close(r.prices.stuk,100);
});
test('100 kg en 1000 kg worden correct genormaliseerd',()=>{
 const p=physical({type:'flat',density:7850,width:40,thickness:8});close(p.kgm,2.512);
 close(conversion({price:120,basis:100,unit:'kg'},p).prices.m,3.0144);
 close(conversion({price:1200,basis:1000,unit:'kg'},p).prices.m,3.0144);
});
test('Vierkant, zeskant (sleutelmaat), buis en koker',()=>{
 close(physical({type:'square',density:7900,width:20}).kgm,3.16);
 close(physical({type:'hex',density:8000,width:20}).kgm,2.7712812921102037);
 close(physical({type:'tube',density:7850,diameter:30,wall:2}).kgm,1.381044130518073);
 close(physical({type:'recttube',density:7850,width:60,height:40,wall:3}).kgm,4.4274);
});
test('Ontbrekende gegevens blijven ontbrekend; nulprijs is wel geldig',()=>{
 const p=physical({type:'round',density:7850});const r=conversion({price:2,basis:1,unit:'kg'},p);assert.equal(r.prices.m,null);assert.equal(r.prices.kg,2);assert.equal(r.prices.m2,null);
 assert.equal(conversion({price:0,basis:1,unit:'kg'},p).prices.kg,0);
 assert.equal(conversion({price:2,basis:1,unit:''},p).prices.kg,null);
 assert.equal(conversion({price:2,basis:0,unit:'kg'},p).prices.kg,null);
 assert.equal(physical({type:'tube',density:7850,diameter:10,wall:6}).kgm,null);
 assert.equal(physical({type:'round',density:7850,diameter:20}).kgm2,null);
});
test('Leveranciersgewicht heeft voorrang op theoretisch gewicht',()=>{
 const p=physical({type:'round',density:7850,diameter:20,kgm:2.5,length:6000});close(p.kgm,2.5);close(p.piece,15);
 close(conversion({price:2,basis:1,unit:'kg'},p).prices.stuk,30);
});
test('Alle 25 richtingen tussen kg, ton, meter, m² en stuk rekenen terug naar dezelfde prijs',()=>{
 const p=physical({type:'plate',density:7850,thickness:3,width:1250,length:2500});
 const baseline=conversion({price:2,basis:1,unit:'kg'},p).prices;
 for(const from of Object.keys(baseline))for(const to of Object.keys(baseline)){const result=conversion({price:baseline[from]*100,basis:100,unit:from},p);close(result.prices[to],baseline[to]);}
});

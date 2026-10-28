const {test}=require('node:test');const assert=require('node:assert/strict');
const {INSTRUMENTS,parseQuote,fetchMarket}=require('../desktop/market.cjs');
const now=Date.now();
function data(symbol,price){return {chart:{result:[{meta:{symbol,currency:'USD',regularMarketPrice:price,regularMarketTime:Math.floor(now/1000),shortName:'Testcontract'}}]}};}
test('Koper USD/lb en aluminium USD/ton worden onafhankelijk naar kg omgerekend',()=>{
 assert.ok(Math.abs(parseQuote(data('HG=F',4.5359237),INSTRUMENTS[0]).usdKg-10)<1e-12);
 assert.equal(parseQuote(data('ALI=F',2500),INSTRUMENTS[1]).usdKg,2.5);
 assert.ok(Math.abs(parseQuote(data('GC=F',3110.34768),INSTRUMENTS[2]).usdKg-100000)<1e-8);
});
test('Onjuiste symbolen, valuta, prijzen en tijdstempels worden geweigerd',()=>{
 for(const patch of [{currency:'EUR'},{symbol:'UNKNOWN'},{regularMarketPrice:-1},{regularMarketPrice:NaN},{regularMarketTime:undefined},{regularMarketTime:now/1000+3600}]){const d=data('HG=F',5);Object.assign(d.chart.result[0].meta,patch);assert.throws(()=>parseQuote(d,INSTRUMENTS[0]));}
 const old=data('HG=F',5);old.chart.result[0].meta.regularMarketTime-=5*86400;assert.equal(parseQuote(old,INSTRUMENTS[0]).stale,true);
});
test('Een uitgevallen metaal blokkeert overige prijzen niet; EUR heeft controleerbare koers',async()=>{
 const fake=async url=>({ok:true,json:async()=>url.includes('frankfurter')?[{base:'USD',quote:'EUR',rate:0.9,date:'2026-10-28'}]:url.includes('ALI')?{chart:{error:{}}}:data(decodeURIComponent(url.split('/chart/')[1].split('?')[0]),4.5359237)});
 const r=await fetchMarket(fake);assert.ok(Math.abs(r.quotes[0].eurKg-9)<1e-12);assert.ok(r.quotes[1].error);assert.equal(r.fxDate,'2026-10-28');assert.ok(!r.quotes[2].error);
});
test('Geen valutakoers betekent geen verzonnen EUR-bedragen',async()=>{
 const r=await fetchMarket(async url=>{if(url.includes('frankfurter'))throw Error('Offline');return {ok:true,json:async()=>data(decodeURIComponent(url.split('/chart/')[1].split('?')[0]),10)};});assert.equal(r.fx,null);assert.equal(r.quotes[0].eurKg,null);assert.equal(r.fxError,'Offline');
});

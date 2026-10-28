const INSTRUMENTS = Object.freeze([
 {symbol:'HG=F',name:'Koper',unit:'lb',kg:0.45359237,material:'copper'},
 {symbol:'ALI=F',name:'Aluminium',unit:'ton',kg:1000,material:'aluminium'},
 {symbol:'GC=F',name:'Goud',unit:'troy oz',kg:0.0311034768,material:'custom',density:19320},
 {symbol:'SI=F',name:'Zilver',unit:'troy oz',kg:0.0311034768,material:'custom',density:10490}
]);
function parseQuote(data, instrument, now=Date.now()) {
 const m=data?.chart?.result?.[0]?.meta;
 if(!m || m.symbol!==instrument.symbol || m.currency!=='USD' || !Number.isFinite(m.regularMarketPrice) || m.regularMarketPrice<=0 || !Number.isFinite(m.regularMarketTime)) throw Error('Onvolledige of ongeldige prijsgegevens.');
 const timestamp=m.regularMarketTime*1000;
 if(timestamp>now+300000)throw Error('Prijsdatum ligt in de toekomst.');
 return {...instrument,usd:m.regularMarketPrice,usdKg:m.regularMarketPrice/instrument.kg,timestamp,contract:String(m.shortName||instrument.symbol),stale:now-timestamp>4*86400000};
}
async function getJSON(url, fetcher=fetch) {
 const response=await fetcher(url,{headers:{'User-Agent':'JBT-Marel-Materiaalprijs-Converter/2.0','Accept':'application/json'},signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw Error(`Prijsbron antwoordt met HTTP ${response.status}.`);
 return response.json();
}
async function fetchMarket(fetcher=fetch) {
 const results=await Promise.allSettled(INSTRUMENTS.map(async i=>parseQuote(await getJSON('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(i.symbol)+'?interval=1d&range=5d',fetcher),i)));
 let fx=null,fxDate='',fxError='';
 try {const rows=await getJSON('https://api.frankfurter.dev/v2/providers/ecb/rates?base=USD&quotes=EUR',fetcher);const r=rows.find(x=>x.base==='USD'&&x.quote==='EUR');if(!r||!Number.isFinite(r.rate)||r.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))throw Error('Ongeldige valutakoers.');fx=r.rate;fxDate=r.date;}catch(e){fxError=e.message;}
 return {fetchedAt:Date.now(),source:'Yahoo Finance · futures (termijncontracten)',fx,fxDate,fxError,quotes:results.map((r,i)=>r.status==='fulfilled'?{...r.value,eurKg:fx===null?null:r.value.usdKg*fx}:{...INSTRUMENTS[i],error:r.reason.message})};
}
module.exports={INSTRUMENTS,parseQuote,fetchMarket};

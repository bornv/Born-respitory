export const MATERIALS={steel:{label:'Staal (S235 / C45)',density:7850},rvs304:{label:'RVS 304 / 304L',density:7900},rvs316:{label:'RVS 316 / 316L',density:8000},rvs4122:{label:'RVS 1.4122',density:7700},aluminium:{label:'Aluminium',density:2700},copper:{label:'Koper',density:8960},brass:{label:'Messing',density:8500},pe:{label:'PE / PE500 / PE1000',density:950},pom:{label:'POM',density:1410},pa:{label:'PA / nylon',density:1140},pvc:{label:'PVC',density:1400},pc:{label:'Polycarbonaat',density:1200}};
export const TYPES={round:'Rondstaf',square:'Vierkantstaf',hex:'Zeskantstaf',flat:'Platstaf / strip',plate:'Plaat',tube:'Ronde buis',recttube:'Koker',profile:'Profiel (gewicht bekend)'};
export const UNITS={kg:'kg',t:'ton',m:'m',m2:'m²',stuk:'stuk'};
export const CURRENCIES=['EUR','USD','GBP','CHF','NOK','SEK','DKK','PLN','CZK','CNY','JPY','AUD','CAD','HUF','TRY','INR','ZAR','BRL','MXN','KRW','RON','NZD','SGD','HKD'];
export function exchangeRate(from,to,rates){
 if(!from||!to)return null;if(from===to)return 1;
 const a=from==='EUR'?1:number(rates[from]),b=to==='EUR'?1:number(rates[to]);return a>0&&b>0?b/a:null;
}
export function number(v){
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 if(v===null||v===undefined)return null;
 let s=String(v).trim().replace(/[€\s\u00a0]/g,'');if(!s)return null;
 if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
 else if(s.includes(','))s=s.replace(',','.');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;
 const n=Number(s);return Number.isFinite(n)?n:null;
}
export const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/²/g,'2').replace(/[^a-z0-9]/g,'');
export function parseUnit(v){
 if(typeof v==='number')return null;
 const s=String(v??'').toLowerCase().trim().replace(/€/g,'').replace(/^\s*(per|\/)\s*/,'').replace(/\s+/g,'').replace(/²/g,'2');
 const m=s.match(/^(\d+(?:[.,]\d+)?)?(kg|kgs|kilogram|kilogrammen|kilo|ton|tonne|t|m|m1|mtr|meter|meters|m2|m\^2|stuk|stuks|st|pcs|plaat|staaf|hk)$/);
 if(!m)return null;let basis=m[1]?number(m[1]):1;let unit=m[2];
 if(['kg','kgs','kilogram','kilogrammen','kilo'].includes(unit))unit='kg';else if(['ton','tonne','t'].includes(unit))unit='t';else if(['m','m1','mtr','meter','meters'].includes(unit))unit='m';else if(['m2','m^2'].includes(unit))unit='m2';else if(unit==='hk'){unit='kg';basis*=100;}else unit='stuk';
 return basis>0?{unit,basis}:null;
}
export function priceBasis(raw,encoded,fallback){
 const present=raw!==undefined&&raw!==null&&String(raw).trim()!=='';const n=present?number(raw):null;
 if(present&&!(n>0))return {basis:null,issue:'Prijsbasis ontbreekt, is ongeldig of is niet groter dan nul.'};
 if(encoded>1&&n!==null&&n!==1&&n!==encoded)return {basis:null,issue:'Tegenstrijdige prijsbasis in eenheid en prijsbasis-kolom.'};
 return {basis:encoded>1?encoded:n??number(fallback),issue:''};
}
export function detectMaterial(text){
 const s=String(text??'').toUpperCase();
 if(/1[.,]4122/.test(s))return 'rvs4122';
 if(/1[.,]44(?:01|04)|\b316L?\b/.test(s))return 'rvs316';
 if(/1[.,]43(?:01|07)|\b304L?\b/.test(s))return 'rvs304';
 if(/\b(?:S235(?:JR|J0|J2|JRC)?|S355(?:JR|J0|J2)?|ST[ .-]*37K?|C[ .-]*45E?|STAAL|STEEL|42MNV7)\b/.test(s))return 'steel';
 if(/ALUMIN|\bALMG|\bAL[ -]?\d/.test(s))return 'aluminium';
 if(/MESSING|\bBRASS\b/.test(s))return 'brass';if(/KOPER|\bCOPPER\b/.test(s))return 'copper';
 if(/\bPE(?:HD|UHMW|500|1000)?\b/.test(s))return 'pe';if(/\bPOM\b/.test(s))return 'pom';if(/NYLON|\bPA6?\b/.test(s))return 'pa';if(/\bPVC\b/.test(s))return 'pvc';if(/\bPC\b|POLYCARB|LEXAAN/.test(s))return 'pc';return null;
}
export function detectType(text){
 const s=String(text??'').toUpperCase().trim();
 if(/^PROFIEL|^PROFILE/.test(s))return 'profile';
 if(/KOKER|RECTANGULAR TUBE|VIERKANTE BUIS|RECHTHOEKIGE BUIS/.test(s))return 'recttube';
 if(/BUIS|\bTUBE\b/.test(s))return 'tube';if(/ZESK|HEXAGON/.test(s))return 'hex';if(/VIERKANT|SQUARE/.test(s))return 'square';
 if(/PLATSTAF|\bPLAT\b|\bSTRIP\b/.test(s))return 'flat';if(/RONDSTAF|ROND STAF|^ROND\b|^ROUND\b/.test(s))return 'round';if(/^PLAAT\b|^PLATE\b/.test(s))return 'plate';return '';
}
export function parseDimensions(type,text){
 const s=String(text??'').toUpperCase().replace(/×/g,'X');const num='(\\d+(?:[.,]\\d+)?)';const out={};let m;
 if(type==='round'||type==='tube'){m=s.match(new RegExp('(?:^ROND(?:\\s+STAF)?|^ROUND|[Ø⌀]|^BUIS|^TUBE)\\s*'+num));if(m)out.diameter=number(m[1]);
 if(type==='tube'){m=s.match(new RegExp(num+'\\s*X\\s*'+num));if(m){out.diameter=number(m[1]);out.wall=number(m[2]);}}}
 if(type==='square'||type==='hex'){m=s.match(new RegExp('(?:VIERKANT|ZESK[. ]*(?:STAF)?|HEX(?:AGON)?|SW)\\s*'+num));if(m)out.width=number(m[1]);}
 if(type==='flat'||type==='recttube'){m=s.match(new RegExp(num+'\\s*X\\s*'+num+(type==='recttube'?'\\s*X\\s*'+num:'')));if(m){out.width=number(m[1]);if(type==='flat')out.thickness=number(m[2]);else{out.height=number(m[2]);out.wall=number(m[3]);}}}
 if(type==='plate'){
  m=s.match(new RegExp('(?:^PLAAT|^PLATE)\\s*'+num+'\\s*MM\\b'));if(m){out.thickness=number(m[1]);const tail=s.slice(m.index+m[0].length);const wh=tail.match(new RegExp(num+'\\s*X\\s*'+num));if(wh){out.width=number(wh[1]);out.length=number(wh[2]);}}
 }
 m=s.match(new RegExp('\\bL(?:ENGTE)?\\s*[=:]\\s*'+num));if(m)out.length=number(m[1]);return out;
}
const pos=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
export function physical(p){
 let kgm=null,kgm2=null,piece=null;const issues=[],notes=[];const rho=number(p.density);const get=k=>number(p[k]);const d=get('diameter'),b=get('width'),h=get('height'),t=get('thickness'),wall=get('wall'),length=get('length');let area=null;
 if(pos(rho)){
  if(p.type==='round'&&pos(d))area=Math.PI*d*d/4;
  if(p.type==='square'&&pos(b))area=b*b;
  if(p.type==='hex'&&pos(b)){area=Math.sqrt(3)*b*b/2;notes.push('Zeskant: maat tussen de vlakke zijden (sleutelmaat).');}
  if(p.type==='flat'&&pos(b)&&pos(t))area=b*t;
  if(['plate','flat'].includes(p.type)&&pos(t)){kgm2=rho*t/1000;if(pos(b))area=b*t;}
  if(p.type==='tube'&&pos(d)&&pos(wall)){if(wall*2>=d)issues.push('Wanddikte moet kleiner zijn dan de halve buitendiameter.');else area=Math.PI*(d*d-(d-2*wall)**2)/4;}
  if(p.type==='recttube'&&pos(b)&&pos(h)&&pos(wall)){if(wall*2>=Math.min(b,h))issues.push('Wanddikte te groot voor deze koker.');else{area=b*h-(b-2*wall)*(h-2*wall);notes.push('Kokergewicht is theoretisch, zonder hoekradii.');}}
  if(pos(area))kgm=area*rho/1e6;
 }
 for(const key of ['diameter','width','height','thickness','wall','length','density','kgm','kgm2','piece']){const v=get(key);if(v!==null&&!pos(v))issues.push(`${({diameter:'Diameter',width:'Breedte / sleutelmaat',height:'Hoogte',thickness:'Dikte',wall:'Wanddikte',length:'Lengte',density:'Dichtheid',kgm:'Gewicht per meter',kgm2:'Gewicht per m²',piece:'Stukgewicht'})[key]} moet groter dan nul zijn.`);}
 if(pos(get('kgm'))){kgm=get('kgm');notes.push('Opgegeven kg/m heeft voorrang op geometrie.');}
 if(pos(get('kgm2'))&&['plate','flat'].includes(p.type)){kgm2=get('kgm2');if(pos(b)&&!pos(get('kgm')))kgm=kgm2*b/1000;notes.push('Opgegeven kg/m² heeft voorrang op geometrie.');}
 if(pos(kgm)&&pos(length))piece=kgm*length/1000;
 if(pos(get('piece'))){piece=get('piece');notes.push('Opgegeven stukgewicht heeft voorrang op geometrie.');}
 // Invalid geometry is never presented as a valid theoretical conversion.
 if(issues.length){kgm=null;kgm2=null;piece=null;}
 return {kgm,kgm2,piece,masses:{kg:1,t:1000,m:kgm,m2:kgm2,stuk:piece},issues,notes};
}
export function conversion(input,p){
 const price=number(input.price),basis=number(input.basis),q=number(input.quantity);const prices={},quantities={};const issues=[...p.issues];
 if(price===null)issues.push('Prijs ontbreekt of is geen getal.');else if(price<0)issues.push('Prijs mag niet negatief zijn.');
 if(!pos(basis))issues.push('Prijsbasis moet groter dan nul zijn.');
 if(!UNITS[input.unit])issues.push('Kies de eenheid van de bronprijs.');
 const validPrice=price!==null&&price>=0&&pos(basis)&&!!UNITS[input.unit];const sourceMass=p.masses[input.unit];
 for(const u of Object.keys(UNITS))prices[u]=validPrice?(u===input.unit?price/basis:pos(sourceMass)&&pos(p.masses[u])?price/basis/sourceMass*p.masses[u]:null):null;
 if(validPrice&&!pos(sourceMass)&&Object.values(prices).filter(v=>v!==null).length<=1)issues.push('Gewicht of afmetingen ontbreken voor omrekening naar andere eenheden.');
 if(q!==null&&q>=0&&UNITS[input.quantityUnit]){for(const u of Object.keys(UNITS))quantities[u]=u===input.quantityUnit?q:pos(p.masses[input.quantityUnit])&&pos(p.masses[u])?q*p.masses[input.quantityUnit]/p.masses[u]:null;}
 return {prices,quantities,issues,kgPrice:prices.kg};
}

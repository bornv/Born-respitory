// Toont het JBT Marel-logo uit dist/brand/ zodra dat bestand er staat; anders blijft de tekstnaam zichtbaar.
const img=document.querySelector('.company-logo');
const sources=['./brand/jbtmarel-logo-wit.svg','./brand/jbtmarel-logo-wit.png'];
function tryNext(i){
 if(!img||i>=sources.length)return;
 img.onload=()=>{img.hidden=false;document.querySelector('.brand-company').hidden=true;};
 img.onerror=()=>tryNext(i+1);
 img.src=sources[i];
}
tryNext(0);

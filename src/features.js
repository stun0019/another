(function(root){
'use strict';
const validNumbers=a=>Array.isArray(a)&&a.length===5&&new Set(a).size===5&&a.every(n=>Number.isInteger(n)&&n>=1&&n<=39);
function validate(rows){if(!Array.isArray(rows)||!rows.length)throw Error('沒有開獎紀錄。');const dates=new Set();for(let i=0;i<rows.length;i++){const r=rows[i];if(!/^2026-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date+'T00:00:00Z').toISOString().slice(0,10)!==r.date||!/^115\d{6}$/.test(r.period)||Number(r.period)!==115000001+i||!validNumbers(r.numbers)||dates.has(r.date)||(i&&r.date<=rows[i-1].date))throw Error('需從115000001期開始，日期、期別連續無重複且每期有5個有效號碼。');dates.add(r.date)}return rows}
function parse(text){const rows=[];for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){if(!/^2026-\d{2}-\d{2}\s+[日一二三四五六]\s/.test(line))continue;const m=line.match(/^(2026-\d{2}-\d{2})\s+[日一二三四五六]\s+(115\d{6})\s+([\d ]+)\s*$/);if(!m)throw Error('TXT資料列格式錯誤：'+line);const numbers=m[3].trim().split(/\s+/).map(Number);if(!validNumbers(numbers))throw Error('TXT號碼不合法：'+line);rows.push({date:m[1],period:m[2],numbers})}if(!rows.length)throw Error('TXT沒有可辨識的紀錄。');return rows}
const KEYS=['f10','f30','f100','missing','trend','co','repeat','parity','size','segment'];
const LABELS={f10:'近10期頻率',f30:'近30期頻率',f100:'近100期頻率',missing:'當前遺漏',trend:'短期動能',co:'共現關聯',repeat:'前期重號',parity:'奇偶結構',size:'大小結構',segment:'區段分布'};
function engine(past,period){if(!/^\d{9}$/.test(period))throw Error('目標期別必須是9位數。');for(let i=0;i<past.length;i++)if(past[i].period>=period||!validNumbers(past[i].numbers)||(i&&past[i].period<=past[i-1].period))throw Error('Feature Engine只能接收按期別排序的過往紀錄。');
const windows=[10,30,100],counts={};for(const w of windows){counts[w]=Array(40).fill(0);for(const r of past.slice(-w))for(const n of r.numbers)counts[w][n]++}
const previous10=Array(40).fill(0),prior=past.slice(-20,-10);for(const r of prior)for(const n of r.numbers)previous10[n]++;
const pairs=Array.from({length:40},()=>Array(40).fill(0));for(const r of past.slice(-100))for(const a of r.numbers)for(const b of r.numbers)if(a!==b)pairs[a][b]++;
const last=past.at(-1)?.numbers||[],w30=Math.min(30,past.length),w10=Math.min(10,past.length),raw=[];
for(let n=1;n<=39;n++){let missing=0;for(let i=past.length-1;i>=0&&!past[i].numbers.includes(n);i--)missing++;const odd=n%2,small=n<=19,segment=Math.floor((n-1)/13);let parityTotal=0,sizeTotal=0,segmentTotal=0;for(let j=1;j<=39;j++){if(j%2===odd)parityTotal+=counts[30][j];if((j<=19)===small)sizeTotal+=counts[30][j];if(Math.floor((j-1)/13)===segment)segmentTotal+=counts[30][j]}
const partners=last.filter(k=>k!==n);const co=partners.length?partners.reduce((s,k)=>s+(counts[100][k]?pairs[n][k]/counts[100][k]:0),0)/partners.length:0;
raw.push({number:n,count10:counts[10][n],count30:counts[30][n],count100:counts[100][n],f10:w10?counts[10][n]/w10:0,f30:w30?counts[30][n]/w30:0,f100:past.length?counts[100][n]/Math.min(100,past.length):0,missing,missingCensored:missing===past.length,trend:prior.length&&w10?counts[10][n]/w10-previous10[n]/prior.length:0,co,repeat:last.includes(n)?1:0,odd,small,zone:segment+1,parity:w30?parityTotal/(w30*(odd?20:19)):0,size:w30?sizeTotal/(w30*(small?19:20)):0,segment:w30?segmentTotal/(w30*13):0})}
const scaled=raw.map(r=>({number:r.number}));for(const k of KEYS){const lo=Math.min(...raw.map(r=>r[k])),hi=Math.max(...raw.map(r=>r[k]));raw.forEach((r,i)=>scaled[i][k]=hi===lo?0:(r[k]-lo)/(hi-lo))}
return {period,historyCount:past.length,trainingEnd:past.at(-1)?.period||null,raw,scaled};}
const api={validNumbers,validate,parse,KEYS,LABELS,engine};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LabFeatures=api;
})(typeof window!=='undefined'?window:globalThis);

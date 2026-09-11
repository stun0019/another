(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports,F=node?require('./features.js'):root.LabFeatures,M=node?require('./models.js'):root.LabModels;
const POOLS=[5,10,15,18,20];
function hits(rank,actual,n){return rank.slice(0,n).filter(x=>actual.includes(typeof x==='number'?x:x.number)).length}
function evaluate(prediction,row,count){const models={};for(const m of M.MODELS){const ranking=prediction.rankings[m.id];models[m.id]={ranking,pools:Object.fromEntries(POOLS.map(n=>[n,hits(ranking,row.numbers,n)]))}}return {period:row.period,date:row.date,actual:[...row.numbers],historyCount:count,trainingEnd:prediction.features?.trainingEnd||null,models}}
function walkForward(rows,settings=M.DEFAULT){F.validate(rows);const cfg=M.config(settings),past=[],out=[];for(const row of rows){const prediction=M.predictions(past,row.period,cfg);out.push(evaluate(prediction,row,past.length));past.push({date:row.date,period:row.period,numbers:[...row.numbers]})}return out}
function stats(rows,model,n=5){if(!POOLS.includes(n))throw Error('Top-N不支援。');const a={count:rows.length,totalHits:0,average:null,coverage:null,rates:{2:null,3:null,4:null,5:null},distribution:Array(6).fill(0),win:0,tie:0,loss:0};for(const r of rows){const k=r.models[model].pools[n];a.totalHits+=k;a.distribution[k]++;const top5=r.models[model].pools[5];a[top5>=3?'win':top5===2?'tie':'loss']++}if(a.count){a.average=a.totalHits/a.count;a.coverage=a.average/5;for(let k=2;k<=5;k++)a.rates[k]=a.distribution.slice(k).reduce((x,y)=>x+y,0)/a.count}return a}
function compare(rows,n){const rng=stats(rows,'G',n);return M.MODELS.map(m=>{const s=stats(rows,m.id,n);return {...m,...s,delta:s.count?s.average-rng.average:null,uplift:rng.average>0?(s.average/rng.average-1)*100:null,top15:stats(rows,m.id,15).rates[3]}}).sort((a,b)=>(b.average??-1)-(a.average??-1)||(b.rates[3]??-1)-(a.rates[3]??-1)||a.id.localeCompare(b.id))}
function choose(n,k){if(k<0||k>n)return 0;let x=1;for(let j=1;j<=k;j++)x=x*(n-j+1)/j;return Math.round(x)}
function theory(n){const distribution=Array.from({length:6},(_,k)=>choose(n,k)*choose(39-n,5-k)/choose(39,5));return {average:5*n/39,coverage:n/39,distribution,atLeast:k=>distribution.slice(k).reduce((a,b)=>a+b,0)}}
function wilson(successes,count){if(!count)return null;const z=1.959963984540054,p=successes/count,d=1+z*z/count,c=(p+z*z/(2*count))/d,h=z*Math.sqrt(p*(1-p)/count+z*z/(4*count*count))/d;return [Math.max(0,c-h),Math.min(1,c+h)]}
const api={POOLS,hits,evaluate,walkForward,stats,compare,choose,theory,wilson};if(node)module.exports=api;else root.LabBacktest=api;
})(typeof window!=='undefined'?window:globalThis);

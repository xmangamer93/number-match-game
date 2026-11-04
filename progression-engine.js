"use strict";
(function(root){
const worlds=[
{id:1,name:"وادي البدايات",icon:"🌱",stages:[{target:64,name:"بوابة البداية",boss:"حارس الصفر"},{target:128,name:"وادي النبض",boss:"ملك الأربعات"},{target:256,name:"مدينة النبض",boss:"قائد 128"},{target:512,name:"المتاهة البنفسجية",boss:"ظل 256"},{target:1024,name:"قلعة الذهب",boss:"حارس 512"}]},
{id:2,name:"مجرة الطاقة",icon:"🌌",stages:[{target:2048,name:"بوابة المجرة",boss:"حارس النجم"},{target:4096,name:"سديم الأرقام",boss:"العملاق 2048"},{target:8192,name:"قلب المجرة",boss:"تنين الطاقة"},{target:16384,name:"عرش الكواكب",boss:"ملك المدارات"},{target:32768,name:"بوابة الثقب",boss:"حارس الثقب"}]},
{id:3,name:"البعد الأسطوري",icon:"💎",stages:[{target:65536,name:"الشفق الأزلي",boss:"ظل اللانهاية"},{target:131072,name:"معبد الخلود",boss:"الكاهن الأعظم"},{target:262144,name:"قلب الخلود",boss:"حارس الزمن"},{target:524288,name:"عرش الأساطير",boss:"العملاق الأزلي"},{target:1048576,name:"نهاية الرحلة",boss:"المختبر الأعظم"}]}
];
const stages=worlds.flatMap((w,wi)=>w.stages.map((s,si)=>({...s,id:wi*5+si+1,world:w.id,worldName:w.name,worldIcon:w.icon})));
const upgradeDefs=[
{id:"hammer",name:"مطرقة التكسير",icon:"🔨",description:"توسّع نطاق التكسير حول البلاطة",base:100},
{id:"shuffle",name:"إعادة الترتيب",icon:"🔀",description:"تعيد توزيع الأرقام مع مكافأة أكبر",base:120},
{id:"multiplier",name:"مضاعفة النقاط",icon:"✨",description:"تزيد النقاط المكتسبة من كل دمج",base:150}
];
const quests=[
{id:"moves",name:"خطوات ثابتة",description:"نفّذ 15 حركة صحيحة",target:15,reward:45},
{id:"merges",name:"صياد الدمج",description:"ادمج 8 بلاطات",target:8,reward:55},
{id:"score",name:"جامع النقاط",description:"اجمع 500 نقطة في الدمج",target:500,reward:60},
{id:"combo",name:"سلسلة متوهجة",description:"حقق كومبو ×4 مرة واحدة",target:1,reward:70},
{id:"coins",name:"منجم الطاقة",description:"اجمع 40 عملة",target:40,reward:50},
{id:"power",name:"خبير القوى",description:"استخدم قوة خاصة مرتين",target:2,reward:65}
];
function dayKey(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-")}
function daily(date=new Date()){const key=dayKey(date),seed=Number(key.replace(/-/g,""))||1;return{date:key,quests:Array.from({length:3},(_,i)=>{const q=quests[(seed+i*7)%quests.length];return{...q,progress:0,claimed:false}}),streak:0}}
function normalizeDaily(value,date=new Date()){return value&&value.date===dayKey(date)&&Array.isArray(value.quests)?value:daily(date)}
function upgradeCost(id,level){const d=upgradeDefs.find(x=>x.id===id);return d?d.base*(level+1)*(level+1):Infinity}
function upgrade(levels,id,coins){const current=Number(levels?.[id])||0,cost=upgradeCost(id,current);if(!upgradeDefs.some(x=>x.id===id)||current>=5||coins<cost)return{ok:false,levels:{...levels},coins};return{ok:true,levels:{...levels,[id]:current+1},coins:coins-cost,cost}}
function progressDaily(state,events){const next={...state,quests:state.quests.map(q=>({...q}))};for(const q of next.quests){if(q.claimed)continue;const amount=Number(events[q.id])||0;q.progress=Math.min(q.target,q.progress+Math.max(0,amount))}return next}
function claimDaily(state,id){const quests=state.quests.map(q=>({...q})),q=quests.find(x=>x.id===id);if(!q||q.claimed||q.progress<q.target)return{ok:false,state:{...state,quests},reward:0};q.claimed=true;return{ok:true,state:{...state,quests},reward:q.reward}}
const api={worlds,stages,upgradeDefs,quests,dayKey,daily,normalizeDaily,upgradeCost,upgrade,progressDaily,claimDaily};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.NumberLabProgression=api;
})(typeof window!=="undefined"?window:globalThis);

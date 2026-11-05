const test=require("node:test");
const assert=require("node:assert/strict");
const P=require("../progression-engine.js");

test("journey contains three worlds with five progressively harder stages each",()=>{
 assert.equal(P.worlds.length,3);assert.equal(P.stages.length,15);
 for(let i=1;i<P.stages.length;i++)assert.ok(P.stages[i].target>P.stages[i-1].target);
 assert.equal(P.stages[5].world,2);assert.equal(P.stages[10].world,3);
});
test("upgrade purchase spends coins and increases only the selected level",()=>{
 const r=P.upgrade({hammer:0,shuffle:0,multiplier:0},"hammer",100);
 assert.equal(r.ok,true);assert.equal(r.levels.hammer,1);assert.equal(r.levels.shuffle,0);assert.equal(r.coins,0);
});
test("upgrade rejects insufficient coins and maxed upgrades",()=>{
 assert.equal(P.upgrade({hammer:0},"hammer",99).ok,false);
 assert.equal(P.upgrade({hammer:5},"hammer",99999).ok,false);
});
test("upgrade costs increase by level",()=>{
 assert.equal(P.upgradeCost("hammer",0),100);
 assert.equal(P.upgradeCost("hammer",1),400);
 assert.equal(P.upgradeCost("hammer",2),900);
});
test("daily quests are stable for a date and reset on a new date",()=>{
 const a=P.daily(new Date(2026,10,4)),b=P.normalizeDaily(a,new Date(2026,10,4)),c=P.normalizeDaily(a,new Date(2026,10,5));
 assert.equal(a.date,"2026-11-04");assert.equal(b.date,a.date);assert.equal(c.date,"2026-11-05");
 assert.equal(a.quests.length,3);assert.equal(new Set(a.quests.map(q=>q.id)).size,3);
});
test("daily quest progress is capped and reward can only be claimed once",()=>{
 let state=P.daily(new Date(2026,10,4));const q=state.quests[0];
 state=P.progressDaily(state,{[q.id]:q.target+50});
 assert.equal(state.quests[0].progress,q.target);
 const first=P.claimDaily(state,q.id);assert.equal(first.ok,true);assert.equal(first.reward,q.reward);
 const second=P.claimDaily(first.state,q.id);assert.equal(second.ok,false);assert.equal(second.reward,0);
});

test("daily normalization repairs malformed saved quest data",()=>{const broken={date:"2026-11-04",quests:[{id:"unknown",progress:999,claimed:false}]};const fixed=P.normalizeDaily(broken,new Date(2026,10,4));assert.equal(fixed.quests.length,3);assert.equal(new Set(fixed.quests.map(q=>q.id)).size,3);});
test("upgrade rejects invalid coin balances and clamps malformed levels",()=>{assert.equal(P.upgrade({hammer:0},"hammer",NaN).ok,false);const r=P.upgrade({hammer:-4},"hammer",100);assert.equal(r.ok,true);assert.equal(r.levels.hammer,1);});

test("upgrade pricing rejects invalid and completed levels",()=>{assert.equal(P.upgradeCost("hammer",-1),Infinity);assert.equal(P.upgradeCost("hammer",5),Infinity);assert.equal(P.upgradeCost("unknown",0),Infinity);});
test("upgrade rejects fractional or unsafe currency balances",()=>{assert.equal(P.upgrade({hammer:0},"hammer",100.5).ok,false);assert.equal(P.upgrade({hammer:0},"hammer",Number.MAX_SAFE_INTEGER+1).ok,false);});

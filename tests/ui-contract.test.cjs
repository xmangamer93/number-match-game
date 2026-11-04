const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");

test("game page contains every required UI element and loads engines in dependency order",()=>{
 const html=fs.readFileSync(path.join(root,"game.html"),"utf8");
 const script=fs.readFileSync(path.join(root,"script.js"),"utf8");
 const match=script.match(/const required=\[([^\]]+)\]/);
 assert.ok(match,"required UI contract is declared");
 const ids=JSON.parse("["+match[1]+"]");
 for(const id of ids)assert.match(html,new RegExp('id="'+id+'"'),"missing game.html id: "+id);
 const order=["game-engine.js","mode-engine.js","mode-manager.js","progression-engine.js","script.js","legendary.js"].map(name=>html.indexOf(name));
 assert.ok(order.every(i=>i>=0));
 assert.deepEqual(order,[...order].sort((a,b)=>a-b));
});

test("home and game remain separate and responsive pages include safe-area support",()=>{
 const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const game=fs.readFileSync(path.join(root,"game.html"),"utf8");
 const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
 assert.match(home,/href="game\.html"/);
 assert.match(game,/href="index\.html"/);
 assert.match(game,/viewport-fit=cover/);
 assert.match(home,/safe-area-inset-top/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/orientation:\s*landscape/);
});

test("service worker precaches the versioned engines referenced by the game page",()=>{
 const html=fs.readFileSync(path.join(root,"game.html"),"utf8");
 const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
 for(const name of ["style.css","game-engine.js","mode-manager.js","progression-engine.js","script.js","legendary.js"]){
  const match=html.match(new RegExp(name.replace(".","\\.")+"\\?v=\\d+"));
  assert.ok(match,"missing versioned asset in game.html: "+name);
  assert.ok(sw.includes("./"+match[0]),"service worker does not precache "+match[0]);
 }
});

test("legendary progression is event-driven instead of polling the DOM",()=>{
 const source=fs.readFileSync(path.join(root,"legendary.js"),"utf8");
 assert.match(source,/addEventListener\(["']numberlab:progress/);
 assert.doesNotMatch(source,/MutationObserver|setInterval/);
});

test("mode manager resets game once and its resetRound does not recurse into game reset",()=>{
 const source=fs.readFileSync(path.join(root,"mode-manager.js"),"utf8");
 const buttons=["classic","boss","blitz"].map(mode=>({dataset:{mode},listeners:{},classList:{toggle(){}},setAttribute(){},addEventListener(name,fn){this.listeners[name]=fn}}));
 const panel={querySelectorAll:()=>buttons};
 const elements={modePanel:panel,modeObjective:{textContent:""},modeClock:{textContent:""}};
 const document={readyState:"complete",getElementById:id=>elements[id]||null};
 const window={NumberLabModeEngine:require("../mode-engine.js"),NumberLabGameReset(){this.resetCalls=(this.resetCalls||0)+1},dispatchEvent(){}};
 const context={window,document,localStorage:{getItem(){return null},setItem(){}},setInterval(){return 1},clearInterval(){},CustomEvent:function(name,init){this.type=name;this.detail=init.detail}};
 vm.runInNewContext(source,context);
 buttons.find(b=>b.dataset.mode==="boss").listeners.click();
 assert.equal(window.NumberLabModes.getMode(),"boss");
 assert.equal(window.resetCalls,1);
 window.NumberLabModes.resetRound();
 assert.equal(window.resetCalls,1);
});

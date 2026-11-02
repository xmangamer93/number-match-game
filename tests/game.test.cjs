const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {spawnSync} = require("node:child_process");
const path = require("node:path");
const Engine = require("../game-engine.js");

test("matching accepts equal values and pairs summing to ten only", () => {
  assert.equal(Engine.pairValue(5,5),true);
  assert.equal(Engine.pairValue(2,8),true);
  assert.equal(Engine.pairValue(1,9),true);
  assert.equal(Engine.pairValue(2,7),false);
  assert.equal(Engine.pairValue(null,10),false);
});

test("straight horizontal, vertical and diagonal paths work only when clear", () => {
  assert.equal(Engine.aligned([1,null,9],0,2,3),true);
  assert.equal(Engine.aligned([1,4,9],0,2,3),false);
  assert.equal(Engine.aligned([1,null,null,null,9],0,4,2),true);
  assert.equal(Engine.aligned([1,null,null,null,9],0,4,3),true);
});

test("consecutive remaining values can match across row boundaries", () => {
  const cells = Array(18).fill(null);
  cells[8]=4; cells[9]=6;
  assert.equal(Engine.sequential(cells,8,9),true);
  assert.equal(Engine.canMatch(cells,8,9,9),true);
});

test("non-consecutive values cannot match unless a clear straight path exists", () => {
  const cells=[2,null,8,3];
  assert.equal(Engine.canMatch(cells,0,2,4),true);
  const blocked=[2,7,8];
  assert.equal(Engine.canMatch(blocked,0,2,3),false);
});

test("same tile cannot match itself", () => {
  assert.equal(Engine.canMatch([5],0,0,9),false);
});

test("equal numbers match only when immediately adjacent, including diagonals", () => {
  const horizontal=[5,5,null,null,null,null];
  assert.equal(Engine.canMatch(horizontal,0,1,3),true);
  const vertical=[5,null,null,5,null,null];
  assert.equal(Engine.canMatch(vertical,0,3,3),true);
  const diagonal=[5,null,null,null,5,null];
  assert.equal(Engine.canMatch(diagonal,0,4,3),true);
  const separated=[5,null,5,null,null,null];
  assert.equal(Engine.canMatch(separated,0,2,3),false);
});

test("adjacency does not wrap across the end of a row", () => {
  assert.equal(Engine.adjacent(2,3,3),false);
  assert.equal(Engine.adjacent(0,5,3),false);
});

test("touch gesture selects tiles and commits exactly once on release", () => {
  const selected=[]; let commits=0;
  const gesture=Engine.createPointerGesture(index=>selected.push(index),()=>commits++);
  assert.equal(gesture.start(7,10),true);
  assert.equal(gesture.move(7,10),false);
  assert.equal(gesture.move(7,11),true);
  assert.equal(gesture.move(8,12),false,"another pointer cannot hijack the gesture");
  assert.equal(gesture.end(8),false,"another pointer cannot commit the gesture");
  assert.equal(gesture.end(7),true);
  assert.deepEqual(selected,[10,11]);
  assert.equal(commits,1);
  assert.equal(gesture.end(7),false,"release cannot commit twice");
  assert.equal(commits,1);
});

test("two separate taps commit the selected pair on the second release", () => {
  const selected=[]; let removals=0;
  const gesture=Engine.createPointerGesture(index=>selected.push(index),()=>{if(selected.length>=2){removals++;selected.length=0;}});
  assert.equal(gesture.start(1,20),true);
  assert.equal(gesture.end(1),true);
  assert.equal(removals,0,"the first tap only selects");
  assert.equal(gesture.start(2,21),true);
  assert.equal(gesture.end(2),true);
  assert.equal(removals,1,"the second tap releases and removes the pair");
  assert.deepEqual(selected,[]);
});

test("tap and drag both report a completed gesture", () => {
  const modes=[];
  const gesture=Engine.createPointerGesture(()=>{},moved=>modes.push(moved));
  gesture.start(1,2); gesture.end(1);
  gesture.start(2,3); gesture.move(2,4); gesture.end(2);
  assert.deepEqual(modes,[false,true]);
});

test("cancelled touch gesture never commits a deletion", () => {
  let commits=0;
  const gesture=Engine.createPointerGesture(()=>{},()=>commits++);
  assert.equal(gesture.start(3,4),true);
  assert.equal(gesture.cancel(3),true);
  assert.equal(gesture.end(3),false);
  assert.equal(commits,0);
});

test("touch gesture handlers are connected to board pointer release", () => {
  const root=path.resolve(__dirname,"..");
  const script=fs.readFileSync(path.join(root,"script.js"),"utf8");
  assert.match(script,/Engine\.createPointerGesture/);
  assert.match(script,/board\.addEventListener\("pointerup",finishPointerSelection\)/);
  assert.match(script,/document\.addEventListener\("pointermove",updatePointerSelection/);
  assert.match(script,/if\s*\(selected\.length\s*>=\s*2\)\s*removeSelected\(\)/);
  assert.match(script,/board\.addEventListener\("contextmenu",event=>event\.preventDefault\(\)/);
});

test("every generated stage has a guaranteed legal move and requested tile count", () => {
  for(let level=1;level<=30;level++){
    const count=36+Math.floor((level-1)/5)*9;
    const board=Engine.createBoard(count,level,()=>0.37);
    assert.equal(board.length,count);
    assert.ok(Engine.findMove(board,9),"stage "+level+" must start with a legal pair");
  }
});

test("application scripts parse and required HTML IDs exist", () => {
  const root=path.resolve(__dirname,"..");
  for(const file of ["script.js","game-engine.js"]){const check=spawnSync(process.execPath,["--check",path.join(root,file)],{encoding:"utf8"});assert.equal(check.status,0,check.stderr);}
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8"),js=fs.readFileSync(path.join(root,"script.js"),"utf8");
  const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
  for(const match of js.matchAll(/\$\("([^"]+)"\)/g)) assert.ok(ids.has(match[1]),"missing HTML id: "+match[1]);
  assert.match(html,/game-engine\.js/);
});

test("web app manifests and package metadata are valid JSON", () => {
  for(const file of ["manifest.webmanifest","package.json","capacitor.config.json"]) assert.doesNotThrow(()=>JSON.parse(fs.readFileSync(path.resolve(__dirname,"..",file),"utf8")),file);
});

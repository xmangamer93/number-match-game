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
  assert.equal(Engine.adjacent(0,4,3),false);
});


test("every generated stage has a guaranteed legal move and requested tile count", () => {
  for (let level=1;level<=30;level++) {
    const count=36+Math.floor((level-1)/5)*9;
    const board=Engine.createBoard(count,level,()=>0.37);
    assert.equal(board.length,count);
    assert.ok(Engine.findMove(board,9), "stage "+level+" must start with a legal pair");
  }
});

test("application scripts parse and required HTML IDs exist", () => {
  const root=path.resolve(__dirname,"..");
  for (const file of ["script.js","game-engine.js"]) {
    const check=spawnSync(process.execPath,["--check",path.join(root,file)],{encoding:"utf8"});
    assert.equal(check.status,0,check.stderr);
  }
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const js=fs.readFileSync(path.join(root,"script.js"),"utf8");
  const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
  for (const match of js.matchAll(/\$\("([^"]+)"\)/g)) assert.ok(ids.has(match[1]),"missing HTML id: "+match[1]);
  assert.match(html,/game-engine\.js/);
});

test("web app manifests and package metadata are valid JSON", () => {
  for (const file of ["manifest.webmanifest","package.json","capacitor.config.json"]) {
    assert.doesNotThrow(()=>JSON.parse(fs.readFileSync(path.resolve(__dirname,"..",file),"utf8")),file);
  }
});

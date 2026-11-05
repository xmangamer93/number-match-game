const test=require("node:test");
const assert=require("node:assert/strict");
const M=require("../mode-engine.js");
test("classic mode has no round limits",()=>{const s=M.create("classic");assert.equal(s.status,"active");assert.equal(M.applyMove(s,[2,...Array(15).fill(0)]).finished,false);});
test("boss wins when target tile is created",()=>{const s=M.create("boss",{target:512,moves:3});const r=M.applyMove(s,[512,...Array(15).fill(0)]);assert.equal(r.finished,true);assert.equal(r.result,"won");assert.equal(r.state.status,"won");});
test("boss consumes one move and loses exactly at zero",()=>{let s=M.create("boss",{moves:2});let r=M.applyMove(s,Array(16).fill(2));assert.equal(r.state.movesLeft,1);r=M.applyMove(r.state,Array(16).fill(2));assert.equal(r.finished,true);assert.equal(r.result,"lost");});
test("boss does not consume moves after the round ends",()=>{const s={...M.create("boss"),status:"won"};assert.equal(M.applyMove(s,Array(16).fill(2)).state.movesLeft,s.movesLeft);});
test("blitz accumulates merge score",()=>{const s=M.create("blitz",{seconds:10});const r=M.applyMove(s,Array(16).fill(2),24);assert.equal(r.state.score,24);assert.equal(r.state.secondsLeft,10);});
test("blitz timer ends at zero and never goes negative",()=>{let s=M.create("blitz",{seconds:2});let r=M.tick(s);assert.equal(r.state.secondsLeft,1);r=M.tick(r.state,5);assert.equal(r.finished,true);assert.equal(r.result,"time-up");assert.equal(r.state.secondsLeft,0);});
test("invalid modes are rejected",()=>{assert.throws(()=>M.create("unknown"),/Unknown game mode/);});

test("boss and blitz configuration reject invalid limits and use safe defaults",()=>{const boss=M.create("boss",{target:-1,moves:0});assert.equal(boss.target,512);assert.equal(boss.movesLeft,30);const blitz=M.create("blitz",{seconds:NaN});assert.equal(blitz.secondsLeft,120);});
test("blitz score ignores non-finite and negative gains",()=>{const s=M.create("blitz");assert.equal(M.applyMove(s,[],Infinity).state.score,0);assert.equal(M.applyMove(s,[],-20).state.score,0);});
test("blitz timer ignores invalid elapsed values without corrupting state",()=>{const s=M.create("blitz",{seconds:5});const r=M.tick(s,NaN);assert.equal(r.state.secondsLeft,5);assert.equal(r.finished,false);});
test("boss rejects a missing board rather than crashing later",()=>{assert.throws(()=>M.applyMove(M.create("boss"),null),/board/);});

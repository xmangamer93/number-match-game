const test=require("node:test");
const assert=require("node:assert/strict");
const G=require("../game-engine.js");

test("new game starts with two tiles",()=>{const b=G.initial(()=>0);assert.equal(b.length,16);assert.equal(b.filter(Boolean).length,2);assert.deepEqual(b.filter(Boolean),[2,2]);});
test("equal tiles merge and score on left",()=>{const r=G.move([2,2,0,0,...Array(12).fill(0)],"left");assert.deepEqual(r.board.slice(0,4),[4,0,0,0]);assert.equal(r.score,4);assert.equal(r.changed,true);assert.deepEqual(r.merged,[0]);});
test("each tile merges only once in a move",()=>{const r=G.move([2,2,4,0,...Array(12).fill(0)],"left");assert.deepEqual(r.board.slice(0,4),[4,4,0,0]);assert.equal(r.score,4);});
test("right move compresses toward right edge",()=>{assert.deepEqual(G.move([2,0,2,0,...Array(12).fill(0)],"right").board.slice(0,4),[0,0,0,4]);});
test("up and down merge vertically",()=>{const b=[2,0,0,0,2,...Array(11).fill(0)];assert.deepEqual(G.move(b,"up").board.slice(0,4),[4,0,0,0]);const c=[0,0,0,0,2,...Array(11).fill(0)];assert.equal(G.move(c,"down").board[12],2);});
test("unchanged moves do not create a turn",()=>{assert.equal(G.move([2,...Array(15).fill(0)],"left").changed,false);});
test("moves do not mutate their input board",()=>{const b=[2,2,...Array(14).fill(0)],copy=b.slice();G.move(b,"left");assert.deepEqual(b,copy);});
test("spawn adds exactly one tile and preserves existing tiles",()=>{const b=Array(16).fill(0);b[5]=8;let calls=0;const out=G.spawn(b,()=>{calls++;return 0});assert.equal(calls,2);assert.equal(out.filter(Boolean).length,2);assert.equal(out[0],2);assert.equal(out[5],8);assert.equal(b[0],0);});
test("spawn can generate a 4 when value roll is high",()=>{const b=Array(16).fill(0);const seq=[0,.95];let i=0;const out=G.spawn(b,()=>seq[i++]);assert.equal(out[0],4);});
test("spawn returns a copy when board is full",()=>{const b=Array(16).fill(2),out=G.spawn(b);assert.notEqual(out,b);assert.deepEqual(out,b);});
test("win and no-move detection work",()=>{assert.equal(G.won([2048,...Array(15).fill(0)]),true);assert.equal(G.canMove(Array(16).fill(0)),true);assert.equal(G.canMove(Array.from({length:16},(_,i)=>(Math.floor(i/4)+i%4)%2?4:2)),false);});
test("invalid direction and malformed boards are rejected",()=>{assert.throws(()=>G.move(Array(16).fill(0),"diagonal"),/Direction/);assert.throws(()=>G.move([2,2],"left"),/Board/);});
test("random generator values are safely clamped",()=>{const b=Array(16).fill(0);assert.equal(G.spawn(b,()=>-10)[0],2);const c=Array(16).fill(0);assert.equal(G.spawn(c,()=>10)[15],4);});
test("tile movement metadata maps each source tile to its exact destination",()=>{const input=[0,2,0,2,...Array(12).fill(0)];const r=G.move(input,"left");assert.deepEqual(r.board.slice(0,4),[4,0,0,0]);assert.deepEqual(r.tileMoves,[{sources:[1,3],destination:0,merged:true,value:4}]);});
test("tile movement metadata preserves distinct source mapping when compressing",()=>{const input=[0,2,4,0,...Array(12).fill(0)];const r=G.move(input,"left");assert.deepEqual(r.tileMoves,[{sources:[1],destination:0,merged:false,value:2},{sources:[2],destination:1,merged:false,value:4}]);});

test("special tile effects follow exact movement and never collide",()=>{const r=G.move([0,2,0,2,...Array(12).fill(0)],"left");const effects=G.mapTileEffects({1:"hammer",3:"bomb"},r.tileMoves);assert.deepEqual(effects,{0:"hammer"});});
test("special tile effects keep separate destinations after compression",()=>{const r=G.move([0,2,4,0,...Array(12).fill(0)],"left");assert.deepEqual(G.mapTileEffects({1:"hammer",2:"ice"},r.tileMoves),{0:"hammer",1:"ice"});});

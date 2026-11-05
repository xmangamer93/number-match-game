"use strict";
(function(root){
 const MODES={classic:"classic",boss:"boss",blitz:"blitz"};
 function positiveInt(value,fallback,max=100000){const n=Number(value);return Number.isSafeInteger(n)&&n>0&&n<=max?n:fallback;}
 function create(mode="classic",options={}){
  if(!Object.values(MODES).includes(mode))throw new TypeError("Unknown game mode");
  if(mode==="boss"){const moves=positiveInt(options.moves,30,10000),target=positiveInt(options.target,512,Number.MAX_SAFE_INTEGER);return{mode,status:"active",target,movesLeft:moves,totalMoves:moves};}
  if(mode==="blitz"){const seconds=positiveInt(options.seconds,120,86400);return{mode,status:"active",secondsLeft:seconds,totalSeconds:seconds,score:0};}
  return{mode,status:"active"};
 }
 function applyMove(state,board,mergeScore=0){
  if(!state||state.status!=="active")return{state:{...state},finished:false};
  const next={...state};
  if(state.mode==="boss"){
   if(!Array.isArray(board))throw new TypeError("Boss move requires a board");
   if(board.some(v=>Number.isFinite(v)&&v>=state.target)){next.status="won";return{state:next,finished:true,result:"won"};}
   next.movesLeft=Math.max(0,positiveInt(state.movesLeft,0,10000)-1);
   if(next.movesLeft===0){next.status="lost";return{state:next,finished:true,result:"lost"};}
  }else if(state.mode==="blitz"){
   const gain=Number(mergeScore);
   next.score=Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Number(state.score)||0)+(Number.isFinite(gain)?Math.max(0,gain):0));
  }
  return{state:next,finished:false};
 }
 function tick(state,seconds=1){
  if(!state||state.mode!=="blitz"||state.status!=="active")return{state:{...state},finished:false};
  const elapsed=Number(seconds),decrement=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
  const current=positiveInt(state.secondsLeft,0,86400);
  const next={...state,secondsLeft:Math.max(0,current-decrement)};
  if(next.secondsLeft===0){next.status="finished";return{state:next,finished:true,result:"time-up"};}
  return{state:next,finished:false};
 }
 const api={MODES,create,applyMove,tick};root.NumberLabModeEngine=api;return api;
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=(typeof window!=="undefined"?window.NumberLabModeEngine:globalThis.NumberLabModeEngine);

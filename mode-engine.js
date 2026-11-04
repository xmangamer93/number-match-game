"use strict";
(function(root){
 const MODES={classic:"classic",boss:"boss",blitz:"blitz"},DEFAULTS={boss:{target:512,moves:30},blitz:{seconds:120}};
 function create(mode="classic",options={}){if(!Object.values(MODES).includes(mode))throw new TypeError("Unknown game mode");if(mode==="boss"){const moves=options.moves??30;return{mode,status:"active",target:options.target??512,movesLeft:moves,totalMoves:moves};}if(mode==="blitz"){const seconds=options.seconds??120;return{mode,status:"active",secondsLeft:seconds,totalSeconds:seconds,score:0};}return{mode,status:"active"};}
 function applyMove(state,board,mergeScore=0){if(!state||state.status!=="active")return{state:{...state},finished:false};const next={...state};if(state.mode==="boss"){if(board.some(v=>v>=state.target)){next.status="won";return{state:next,finished:true,result:"won"};}next.movesLeft=Math.max(0,state.movesLeft-1);if(next.movesLeft===0){next.status="lost";return{state:next,finished:true,result:"lost"};}}else if(state.mode==="blitz")next.score+=Math.max(0,mergeScore);return{state:next,finished:false};}
 function tick(state,seconds=1){if(!state||state.mode!=="blitz"||state.status!=="active")return{state:{...state},finished:false};const next={...state,secondsLeft:Math.max(0,state.secondsLeft-Math.max(0,seconds))};if(next.secondsLeft===0){next.status="finished";return{state:next,finished:true,result:"time-up"};}return{state:next,finished:false};}
 const api={MODES,create,applyMove,tick};root.NumberLabModeEngine=api;return api;
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=(typeof window!=="undefined"?window.NumberLabModeEngine:globalThis.NumberLabModeEngine);

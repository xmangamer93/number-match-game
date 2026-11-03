"use strict";
(function(root){
 const DIRECTIONS=["left","right","up","down"];
 function validate(board){if(!Array.isArray(board)||board.length!==16||board.some(v=>!Number.isInteger(v)||v<0||(v!==0&&(v&(v-1))!==0))){throw new TypeError("Board must contain 16 non-negative power-of-two integers");}}
 function randomUnit(random){const value=Number(random());return Number.isFinite(value)?Math.min(.999999,Math.max(0,value)):0;}
 function spawn(board,random=Math.random){validate(board);const free=[];board.forEach((v,i)=>{if(v===0)free.push(i)});if(!free.length)return board.slice();const out=board.slice();const pick=Math.floor(randomUnit(random)*free.length);out[free[pick]]=randomUnit(random)<.9?2:4;return out;}
 function empty(){return Array(16).fill(0);}
 function initial(random=Math.random){return spawn(spawn(empty(),random),random);}
 function move(board,direction){validate(board);if(!DIRECTIONS.includes(direction))throw new TypeError("Direction must be left, right, up, or down");const out=board.slice();let gained=0,merged=[];for(let line=0;line<4;line++){const ids=[];for(let p=0;p<4;p++)ids.push(direction==="left"?line*4+p:direction==="right"?line*4+(3-p):direction==="up"?p*4+line:(3-p)*4+line);const vals=ids.map(i=>board[i]).filter(Boolean),next=[];for(let i=0;i<vals.length;i++){if(vals[i]===vals[i+1]){next.push(vals[i]*2);gained+=vals[i]*2;merged.push(ids[next.length-1]);i++;}else next.push(vals[i]);}ids.forEach((id,j)=>out[id]=next[j]||0);}return{board:out,score:gained,changed:out.some((v,i)=>v!==board[i]),merged};}
 function canMove(board){validate(board);return board.some(v=>!v)||board.some((v,i)=>i%4<3&&v===board[i+1])||board.some((v,i)=>i<12&&v===board[i+4]);}
 function won(board){validate(board);return board.some(v=>v>=2048);}
 const api={empty,spawn,initial,move,canMove,won};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.Number2048=api;
})(typeof window!=="undefined"?window:globalThis);
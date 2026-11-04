"use strict";
(function(root){
 const DIRECTIONS=["left","right","up","down"];
 function validate(board){if(!Array.isArray(board)||board.length!==16||board.some(v=>!Number.isInteger(v)||v<0||(v!==0&&(v&(v-1))!==0))){throw new TypeError("Board must contain 16 non-negative power-of-two integers");}}
 function randomUnit(random){const value=Number(random());return Number.isFinite(value)?Math.min(.999999,Math.max(0,value)):0;}
 function spawn(board,random=Math.random){validate(board);const free=[];board.forEach((v,i)=>{if(v===0)free.push(i)});if(!free.length)return board.slice();const out=board.slice();const pick=Math.floor(randomUnit(random)*free.length);out[free[pick]]=randomUnit(random)<.9?2:4;return out;}
 function empty(){return Array(16).fill(0);}
 function initial(random=Math.random){return spawn(spawn(empty(),random),random);}
 function move(board,direction){
  validate(board);if(!DIRECTIONS.includes(direction))throw new TypeError("Direction must be left, right, up, or down");
  const out=board.slice();let gained=0,merged=[],merges=[],tileMoves=[];
  for(let line=0;line<4;line++){
   const ids=[];for(let p=0;p<4;p++)ids.push(direction==="left"?line*4+p:direction==="right"?line*4+(3-p):direction==="up"?p*4+line:(3-p)*4+line);
   const tiles=ids.map(id=>({id,value:board[id]})).filter(tile=>tile.value),next=[];
   for(let i=0;i<tiles.length;i++){
    const dest=ids[next.length];
    if(tiles[i].value===tiles[i+1]?.value){const value=tiles[i].value*2;next.push(value);gained+=value;merged.push(dest);merges.push({value,sourceValues:[tiles[i].value,tiles[i+1].value],destination:dest});tileMoves.push({sources:[tiles[i].id,tiles[i+1].id],destination:dest,merged:true,value});i++;}
    else{next.push(tiles[i].value);tileMoves.push({sources:[tiles[i].id],destination:dest,merged:false,value:tiles[i].value});}
   }
   ids.forEach((id,j)=>out[id]=next[j]||0);
  }
  return{board:out,score:gained,changed:out.some((v,i)=>v!==board[i]),merged,merges,tileMoves};
 }
 function neighbors(index,diagonal=false){if(!Number.isInteger(index)||index<0||index>=16)throw new RangeError("Cell index must be between 0 and 15");const row=Math.floor(index/4),col=index%4,dirs=diagonal?[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]:[[0,1],[0,-1],[1,0],[-1,0]];return dirs.map(([dr,dc])=>[row+dr,col+dc]).filter(([r,c])=>r>=0&&r<4&&c>=0&&c<4).map(([r,c])=>r*4+c);}
 function mapTileEffects(effects,tileMoves){const next={};for(const move of tileMoves||[]){const source=(move.sources||[]).find(index=>Object.prototype.hasOwnProperty.call(effects||{},index));if(source!==undefined&&Number.isInteger(move.destination)&&move.destination>=0&&move.destination<16&&!Object.prototype.hasOwnProperty.call(next,move.destination))next[move.destination]=effects[source]}return next;}
 function canMove(board){validate(board);return board.some(v=>!v)||board.some((v,i)=>i%4<3&&v===board[i+1])||board.some((v,i)=>i<12&&v===board[i+4]);}
 function won(board,target=2048){validate(board);return board.some(v=>v>=target);}
 const api={empty,spawn,initial,move,neighbors,mapTileEffects,canMove,won};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.Number2048=api;
})(typeof window!=="undefined"?window:globalThis);

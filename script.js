(()=>{
"use strict";
const $=id=>document.getElementById(id);
const G=window.Number2048;
if(!G) throw new Error("تعذر تحميل محرك اللعبة");
const ar=n=>new Intl.NumberFormat("ar-EG").format(n);
const safeGet=()=>{try{return Math.max(0,Number(localStorage.getItem("journey2048Best"))||0)}catch(_){return 0}};
const safeSet=n=>{try{localStorage.setItem("journey2048Best",String(n))}catch(_){}};
let board=G.initial(),score=0,best=safeGet(),moves=0,undoState=null,wonShown=false,over=false,touchStart=null,cells=[],animating=false;
const required=["board","score","best","moves","undo","progressBar","progressPercent","progressLabel","overlay","continueGame","overlayTitle","overlayText","overlayRestart","newGame","hint","themeToggle"];
if(required.some(id=>!$(id))) throw new Error("عناصر واجهة اللعبة غير مكتملة");
function ensureCells(){
 const host=$("board");
 if(cells.length===16&&cells.every(c=>c.parentNode===host))return;
 host.replaceChildren();
 cells=Array.from({length:16},(_,i)=>{
  const cell=document.createElement("div");cell.className="cell";cell.dataset.v="";cell.dataset.index=i;cell.setAttribute("role","gridcell");host.append(cell);return cell;
 });
}
function updateCell(cell,value){cell.dataset.v=value||"";cell.setAttribute("aria-label",value?String(value):"فارغ");cell.textContent=value?ar(value):"";}
function animateMove(previous,spawned,merged){
 const rects=cells.map(c=>c.getBoundingClientRect());
 const used=new Set();
 for(let dest=0;dest<16;dest++){
  const value=board[dest];if(!value||dest===spawned)continue;
  let source=-1;
  if(previous[dest]===value&&!used.has(dest))source=dest;
  if(source<0){
   let bestDistance=Infinity;
   for(let i=0;i<16;i++){
    if(used.has(i)||!previous[i])continue;
    if(previous[i]!==value&&previous[i]*2!==value)continue;
    const distance=Math.abs(rects[i].left-rects[dest].left)+Math.abs(rects[i].top-rects[dest].top);
    if(distance<bestDistance){bestDistance=distance;source=i;}
   }
  }
  if(source<0||source===dest){if(source===dest)used.add(source);continue;}
  used.add(source);
  const dx=rects[source].left-rects[dest].left,dy=rects[source].top-rects[dest].top,cell=cells[dest];
  cell.classList.add("tile-moving");cell.style.transition="none";cell.style.transform=`translate3d(${dx}px,${dy}px,0)`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{cell.style.transition="transform 145ms cubic-bezier(.2,.8,.2,1)";cell.style.transform="translate3d(0,0,0)";}));
  cell.addEventListener("transitionend",()=>{cell.style.removeProperty("transition");cell.style.removeProperty("transform");cell.classList.remove("tile-moving");},{once:true});
 }
 if(spawned>=0){const cell=cells[spawned];requestAnimationFrame(()=>cell.classList.add("pop"));cell.addEventListener("animationend",()=>cell.classList.remove("pop"),{once:true});}
 if(merged.length)setTimeout(()=>merged.forEach(i=>{const cell=cells[i];if(!cell)return;cell.classList.remove("pop");void cell.offsetWidth;cell.classList.add("pop");cell.addEventListener("animationend",()=>cell.classList.remove("pop"),{once:true});}),150);
}
function render(merged=[],previous=null,spawned=-1){
 ensureCells();
 cells.forEach((cell,i)=>{cell.classList.remove("pop","tile-moving");cell.style.removeProperty("transform");cell.style.removeProperty("transition");updateCell(cell,board[i]);});
 $("score").textContent=ar(score);$("best").textContent=ar(best);$("moves").textContent=ar(moves);$("undo").disabled=!undoState;
 const max=Math.max(0,...board),pct=Math.min(100,max/2048*100);
 $("progressBar").style.width=pct+"%";$("progressPercent").textContent=Math.floor(pct)+"%";$("progressLabel").textContent=max?"أعلى بلاطة: "+ar(max):"ابدأ رحلتك الآن";
 if(previous)animateMove(previous,spawned,merged);
}
function showOverlay(title,message,canContinue){
 $("continueGame").textContent="متابعة اللعب ←";$("overlayTitle").textContent=title;$("overlayText").textContent=message;
 $("continueGame").classList.toggle("hidden",!canContinue);$("overlayRestart").classList.remove("hidden");$("overlay").classList.remove("hidden");
}
function endGame(){over=true;showOverlay("انتهت الحركات","نتيجتك "+ar(score)+" نقطة. جرب مرة أخرى وحاول تحطيم رقمك القياسي.",false);}
function move(direction){
 if(over||animating)return;
 const result=G.move(board,direction);if(!result.changed)return;
 const previous=board.slice();
 undoState={board:previous.slice(),score,moves,wonShown};
 board=G.spawn(result.board);
 const spawned=board.findIndex((v,i)=>result.board[i]===0&&v!==0);
 score+=result.score;moves++;
 if(score>best){best=score;safeSet(best);}
 animating=true;render(result.merged,previous,spawned);
 window.setTimeout(()=>{animating=false;},170);
 if(G.won(board)&&!wonShown){wonShown=true;over=true;showOverlay("وصلت إلى 2048!","إنجاز رائع! يمكنك متابعة اللعب وتحطيم رقمك القياسي.",true);}
 else if(!G.canMove(board))window.setTimeout(endGame,175);
}
function reset(){
 board=G.initial();score=0;moves=0;undoState=null;wonShown=false;over=false;touchStart=null;animating=false;
 $("overlay").classList.add("hidden");render();
}
function direction(dx,dy){if(Math.abs(dx)>Math.abs(dy))move(dx>0?"right":"left");else if(Math.abs(dy)>0)move(dy>0?"down":"up");}
document.addEventListener("keydown",e=>{
 const map={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
 if(map[e.key]&&!e.target.closest("button,input,textarea,select")){e.preventDefault();move(map[e.key]);}
});
const surface=$("board");
surface.addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse"&&e.button!==0)return;
 touchStart={x:e.clientX,y:e.clientY,id:e.pointerId};
 if(surface.setPointerCapture)surface.setPointerCapture(e.pointerId);
});
surface.addEventListener("pointerup",e=>{
 if(!touchStart||touchStart.id!==e.pointerId)return;
 const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;
 if(Math.max(Math.abs(dx),Math.abs(dy))>=24)direction(dx,dy);
});
surface.addEventListener("pointercancel",()=>{touchStart=null;});
$("newGame").addEventListener("click",reset);$("overlayRestart").addEventListener("click",reset);
$("continueGame").addEventListener("click",()=>{$("overlay").classList.add("hidden");over=false;});
$("undo").addEventListener("click",()=>{
 if(!undoState||animating)return;
 board=undoState.board;score=undoState.score;moves=undoState.moves;wonShown=undoState.wonShown;undoState=null;over=false;
 $("overlay").classList.add("hidden");render();
});
$("hint").addEventListener("click",()=>showOverlay("نصيحة سريعة","حافظ على أكبر رقم في أحد أركان اللوحة، وحاول ترتيب الأرقام حوله. لا تملأ المساحات الفارغة بسرعة!",true));
$("themeToggle").addEventListener("click",()=>{
 document.body.classList.toggle("light");const light=document.body.classList.contains("light");
 try{localStorage.setItem("numberLabTheme",light?"light":"dark")}catch(_){}
 $("themeToggle").textContent=light?"☾":"☼";
});
try{if(localStorage.getItem("numberLabTheme")==="light"){document.body.classList.add("light");$("themeToggle").textContent="☾";}}catch(_){}
render();
})();
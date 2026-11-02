(()=>{
"use strict";
const $=id=>document.getElementById(id),G=window.Number2048,ar=n=>new Intl.NumberFormat("ar-EG").format(n);
const safeGet=()=>{try{return Math.max(0,Number(localStorage.getItem("journey2048Best"))||0)}catch(_){return 0}};
const safeSet=n=>{try{localStorage.setItem("journey2048Best",String(n))}catch(_){}};
let board=G.initial(),score=0,best=safeGet(),undoState=null,wonShown=false,over=false,start=null;
function render(merged=[]){const host=$("board");host.replaceChildren();board.forEach((v,i)=>{const cell=document.createElement("div");cell.className="cell"+(merged.includes(i)?" pop":"");cell.dataset.v=v||"";cell.setAttribute("role","gridcell");cell.setAttribute("aria-label",v?String(v):"فارغ");cell.textContent=v?ar(v):"";host.append(cell);});$("score").textContent=ar(score);$("best").textContent=ar(best);$("undo").disabled=!undoState;$("message").textContent=over?"لا توجد حركات متاحة":"حرّك المربعات لدمج الأرقام المتساوية";}
function showOverlay(title,message,canContinue){$("overlayTitle").textContent=title;$("overlayText").textContent=message;$("continueGame").classList.toggle("hidden",!canContinue);$("overlay").classList.remove("hidden");}
function endGame(){over=true;showOverlay("انتهت اللعبة","نتيجتك "+ar(score)+" نقطة. جرب مرة أخرى وحاول الوصول إلى 2048!",false);}
function move(dir){if(over)return;const result=G.move(board,dir);if(!result.changed)return;undoState={board:board.slice(),score,wonShown};board=G.spawn(result.board);score+=result.score;if(score>best){best=score;safeSet(best);}render(result.merged);if(G.won(board)&&!wonShown){wonShown=true;showOverlay("وصلت إلى 2048! 🎉","إنجاز رائع! تقدر تتابع اللعب وتحاول تحطم رقمك القياسي.",true);}else if(!G.canMove(board))endGame();}
function reset(){board=G.initial();score=0;undoState=null;wonShown=false;over=false;start=null;$("overlay").classList.add("hidden");render();}
function direction(dx,dy){if(Math.abs(dx)>Math.abs(dy))move(dx>0?"right":"left");else if(Math.abs(dy)>0)move(dy>0?"down":"up");}
document.addEventListener("keydown",e=>{const map={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};if(map[e.key]&&!e.target.closest("button,input,textarea,select")){e.preventDefault();move(map[e.key]);}});
const surface=$("board");
surface.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};if(surface.setPointerCapture)surface.setPointerCapture(e.pointerId);});
surface.addEventListener("pointerup",e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))>=24)direction(dx,dy);});
surface.addEventListener("pointercancel",()=>{start=null;});
$("newGame").addEventListener("click",reset);$("overlayRestart").addEventListener("click",reset);
$("continueGame").addEventListener("click",()=>{$("overlay").classList.add("hidden");});
$("undo").addEventListener("click",()=>{if(!undoState)return;board=undoState.board;score=undoState.score;wonShown=undoState.wonShown;undoState=null;over=false;$("overlay").classList.add("hidden");render();});
$("hint").addEventListener("click",()=>{$("message").textContent="اسحب لأعلى أو لأسفل أو لليمين أو لليسار. الأرقام المتساوية تندمج!";});
render();
})();
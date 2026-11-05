(()=>{
"use strict";
const E=window.NumberLabModeEngine;if(!E)throw new Error("تعذر تحميل محرك أنماط اللعب");
const $=id=>document.getElementById(id),KEY="numberLabSelectedModeV1";
let mode="classic",state=E.create(mode),timer=null;
try{const saved=localStorage.getItem(KEY);if(E.MODES[saved])mode=saved;}catch(_){}
state=E.create(mode);
function dispatchEnd(result){stopTimer();window.dispatchEvent(new CustomEvent("numberlab:modeend",{detail:{mode,result,state:{...state}}}));}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
function render(){const panel=$("modePanel");if(!panel)return;panel.querySelectorAll("[data-mode]").forEach(b=>{b.classList.toggle("active",b.dataset.mode===mode);b.setAttribute("aria-pressed",String(b.dataset.mode===mode));});const title=$("modeObjective"),time=$("modeClock");if(mode==="classic"){title.textContent="العب بلا مؤقت، وواصل تحطيم رقمك القياسي.";time.textContent="∞";}if(mode==="boss"){title.textContent=state.status==="active"?"اهزم حارس الصفر: كوّن "+state.target+" قبل نفاد الحركات.":(state.status==="won"?"تم إسقاط حارس الصفر!":"انتهت الحركات — حاول من جديد.");time.textContent=state.movesLeft+" / "+state.totalMoves+" حركة";}if(mode==="blitz"){title.textContent=state.status==="active"?"ادمج بأسرع ما تستطيع قبل انتهاء الوقت.":"انتهى الوقت! نقاط الجولة: "+state.score;time.textContent=Math.floor(state.secondsLeft/60)+":"+String(state.secondsLeft%60).padStart(2,"0");}}
function startTimer(){stopTimer();if(mode!=="blitz"||state.status!=="active")return;timer=setInterval(()=>{const r=E.tick(state);state=r.state;render();if(r.finished)dispatchEnd(r.result);},1000);}
function resetRound(){state=E.create(mode);render();startTimer();}
function select(next){if(!E.MODES[next]||next===mode)return;mode=next;try{localStorage.setItem(KEY,mode);}catch(_){}if(typeof window.NumberLabGameReset==="function")window.NumberLabGameReset();else resetRound();}
function onMove(board,mergeScore){const r=E.applyMove(state,board,mergeScore);state=r.state;render();if(r.finished)dispatchEnd(r.result);return r;}
function init(){const panel=$("modePanel");if(!panel)return;panel.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>select(b.dataset.mode)));render();startTimer();}
window.NumberLabModes={getMode:()=>mode,onMove,resetRound,stopTimer};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
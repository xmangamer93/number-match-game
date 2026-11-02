(() => {
"use strict";
const $=id=>document.getElementById(id), COLS=9, MAX_ROWS=18, TOTAL=30;
const STORE="numberJourneyProgressV2";
const worlds=[{name:"عالم الحلوى",icon:"🍭",from:1,to:10},{name:"جزيرة الفضاء",icon:"🚀",from:11,to:20},{name:"مملكة الكريستال",icon:"💎",from:21,to:30}];
let progress=loadProgress(),level=1,cells=[],selected=[],score=0,moves=0,history=[],over=false,hintPair=null;
const digits=n=>new Intl.NumberFormat("ar-EG").format(n);
function loadProgress(){try{return JSON.parse(localStorage.getItem(STORE))||{unlocked:1,stars:{},best:{}}}catch{return{unlocked:1,stars:{},best:{}}}}
function saveProgress(){localStorage.setItem(STORE,JSON.stringify(progress));}
function cfg(n){return{goal:60+Math.floor((n-1)/5)*20,limit:22-Math.floor((n-1)/10)*2,count:36+Math.floor((n-1)/5)*9};}
function worldFor(n){return worlds.find(w=>n>=w.from&&n<=w.to);}
function show(id){$("mapScreen").classList.toggle("hidden",id!=="map");$("gameScreen").classList.toggle("hidden",id!=="game");}
function totalStars(){return Object.values(progress.stars).reduce((a,b)=>a+b,0);}
function renderMap(){
 $("totalStars").textContent=digits(totalStars());$("progressText").textContent="المرحلة "+digits(Math.min(progress.unlocked,TOTAL))+" من "+digits(TOTAL);
 $("progressBar").style.width=((progress.unlocked-1)/TOTAL*100)+"%";
 const host=$("levels");host.replaceChildren();
 worlds.forEach(w=>{
  const heading=document.createElement("div");heading.className="world-divider";heading.textContent=w.icon+" "+w.name;host.append(heading);
  for(let n=w.from;n<=w.to;n++){
   const b=document.createElement("button"),stars=progress.stars[n]||0,locked=n>progress.unlocked;
   b.className="level-card"+(locked?" locked":"")+(stars?" done":"")+(n===progress.unlocked?" current":"");b.disabled=locked;
   b.innerHTML='<span class="level-icon">'+(locked?"🔒":stars===3?"🏆":w.icon)+'</span><strong>مرحلة '+digits(n)+'</strong><small>'+(locked?"مقفولة":"★".repeat(stars)+"☆".repeat(3-stars))+'</small>';
   b.addEventListener("click",()=>startLevel(n));host.append(b);
  }
 });
}
function setStatus(s,error=false){$("status").textContent=s;$("status").classList.toggle("error",error);}
function snapshot(){return{cells:cells.slice(),score,moves};}
function saveHistory(){history.push(snapshot());if(history.length>80)history.shift();}
const pairValue=(a,b)=>a!=null&&b!=null&&(a===b||a+b===10);
const coords=i=>[Math.floor(i/COLS),i%COLS];
function aligned(a,b){
 const [r1,c1]=coords(a),[r2,c2]=coords(b),dr=r2-r1,dc=c2-c1;
 if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return false;
 const sr=Math.sign(dr),sc=Math.sign(dc);let r=r1+sr,c=c1+sc;
 while(r!==r2||c!==c2){const v=cells[r*COLS+c];if(v!=null)return false;r+=sr;c+=sc;}return true;
}
function sequential(a,b){const used=cells.map((v,i)=>v==null?-1:i).filter(i=>i>=0);return used.indexOf(b)===used.indexOf(a)+1||used.indexOf(a)===used.indexOf(b)+1;}
function canMatch(a,b){return a!==b&&pairValue(cells[a],cells[b])&&(aligned(a,b)||sequential(a,b));}
function findMove(){const used=cells.map((v,i)=>v==null?-1:i).filter(i=>i>=0);for(let x=0;x<used.length;x++)for(let y=x+1;y<used.length;y++){const a=used[x],b=used[y];if(pairValue(cells[a],cells[b])&&(aligned(a,b)||y===x+1))return[a,b];}return null;}
function render(){
 const host=$("board");host.replaceChildren();
 cells.forEach((v,i)=>{const b=document.createElement("button");b.type="button";b.className="tile";b.setAttribute("aria-label",v==null?"فارغ":"الرقم "+v);if(v==null){b.classList.add("empty");b.disabled=true;}else{b.textContent=digits(v);b.addEventListener("click",()=>choose(i));}if(selected.includes(i))b.classList.add("selected");if(hintPair&&hintPair.includes(i))b.classList.add("hinted");host.append(b);});
 const c=cfg(level),best=progress.best[level]||0,pct=Math.min(100,Math.round(score/c.goal*100));
 $("score").textContent=digits(score);$("best").textContent=digits(best);$("moves").textContent=digits(c.limit-moves)+" / "+digits(c.limit);
 $("goalText").textContent="اجمع "+digits(c.goal)+" نقطة";$("goalProgress").textContent=digits(pct)+"٪";$("goalBar").style.width=pct+"%";
 $("undoBtn").disabled=!history.length;$("levelStars").textContent="★".repeat(progress.stars[level]||0)+"☆".repeat(3-(progress.stars[level]||0));
}
function finish(win){
 if(over)return;over=true;
 const stars=win?(moves<=Math.ceil(cfg(level).limit*.45)?3:moves<=Math.ceil(cfg(level).limit*.75)?2:1):0;
 if(win){progress.stars[level]=Math.max(progress.stars[level]||0,stars);progress.best[level]=Math.max(progress.best[level]||0,score);progress.unlocked=Math.max(progress.unlocked,Math.min(TOTAL,level+1));saveProgress();}
 $("resultEmoji").textContent=win?["","🌟","🏆","🎉"][stars]:"💪";$("resultTitle").textContent=win?"مبروك! خلصت المرحلة":"حاول مرة تانية!";
 $("resultText").textContent=win?"جمعت "+digits(score)+" نقطة وفتحت المرحلة التالية.":"وصلت إلى "+digits(score)+" نقطة. جرّب خطة مختلفة وهتقدر!";
 $("earnedStars").textContent=win?"⭐".repeat(stars)+"☆".repeat(3-stars):"⭐☆☆";
 $("nextBtn").classList.toggle("hidden",!win||level===TOTAL);$("nextBtn").textContent=level===TOTAL?"أنهيت الرحلة! 🎊":"المرحلة التالية ⟵";
 $("nextBtn").disabled=!win||level===TOTAL;$("resultDialog").showModal();render();
}
function checkState(){
 if(score>=cfg(level).goal){finish(true);return;}
 if(moves>=cfg(level).limit){finish(false);return;}
 if(!findMove()&&cells.length<COLS*MAX_ROWS)setStatus("مفيش حركة متاحة؛ استخدم زر إضافة أرقام أو التلميح.");
}
function choose(i){
 if(over)return;hintPair=null;
 if(!selected.length){selected=[i];render();return;}
 if(selected[0]===i){selected=[];render();return;}
 const a=selected[0];
 if(canMatch(a,i)){saveHistory();cells[a]=cells[i]=null;score+=10;moves++;while(cells.length&&cells[cells.length-1]==null)cells.pop();selected=[];setStatus("برافو! +١٠ نقاط 🎈");render();checkState();}
 else{selected=[i];setStatus("اختار رقمين متوافقين والطريق بينهم فاضي.",true);render();}
}
function startLevel(n){
 level=n;const c=cfg(n);cells=Array.from({length:c.count},()=>Math.floor(Math.random()*9)+1);
 // Add a guaranteed opening pair, while keeping the board randomized.
 cells[0]=5;cells[1]=5;selected=[];score=0;moves=0;history=[];over=false;hintPair=null;
 const w=worldFor(n);$("worldName").textContent=w.icon+" "+w.name;$("levelTitle").textContent="المرحلة "+digits(n);
 setStatus("اختار رقمين متساويين أو مجموعهما ١٠. بالتوفيق!");show("game");render();
}
function addNumbers(){
 if(over)return;const values=cells.filter(v=>v!=null),c=cfg(level);
 if(!values.length){setStatus("اللوحة فاضية! ابدأ من جديد.",true);return;}
 if(cells.length+values.length>COLS*MAX_ROWS){finish(false);return;}
 saveHistory();cells.push(...values);moves++;selected=[];hintPair=null;setStatus("اتضاف صف جديد! كمل التحدي 💫");render();checkState();
}
$("backBtn").addEventListener("click",()=>{if($("resultDialog").open)$("resultDialog").close();show("map");renderMap();});
$("mapBtn").addEventListener("click",()=>{$("resultDialog").close();show("map");renderMap();});
$("nextBtn").addEventListener("click",()=>{if(level<TOTAL){$("resultDialog").close();startLevel(level+1);}});
$("restartBtn").addEventListener("click",()=>startLevel(level));
$("hintBtn").addEventListener("click",()=>{const p=findMove();if(!p){setStatus("مفيش حركة ظاهرة؛ أضف أرقام جديدة.",true);return;}selected=[];hintPair=p;setStatus("التلميح: الرقمين اللي عليهم لمعة ينفع يتشالوا 💡");render();});
$("addBtn").addEventListener("click",addNumbers);
$("undoBtn").addEventListener("click",()=>{const s=history.pop();if(!s)return;cells=s.cells;score=s.score;moves=s.moves;selected=[];hintPair=null;over=false;if($("resultDialog").open)$("resultDialog").close();setStatus("رجعنا آخر حركة. جرّب تاني!");render();});
renderMap();show("map");
})();
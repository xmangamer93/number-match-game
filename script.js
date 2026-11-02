(() => {
"use strict";
const $ = id => document.getElementById(id);
const Engine = window.NumberGameEngine;
const COLS = 9, MAX_CELLS = 9 * 24, TOTAL = 30;
const STORE = "numberJourneyProgressV2";
const worlds = [
  {name:"عالم الحلوى",icon:"🍭",from:1,to:10},
  {name:"جزيرة الفضاء",icon:"🚀",from:11,to:20},
  {name:"مملكة الكريستال",icon:"💎",from:21,to:30}
];
let progress = loadProgress(), level = 1, cells = [], selected = [], score = 0;
let moves = 0, history = [], over = false, hintPair = null;

const digits = n => new Intl.NumberFormat("ar-EG").format(n);

function loadProgress() {
  const empty = {unlocked:1,stars:{},best:{}};
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (!saved || typeof saved !== "object") return empty;
    const unlocked = Number.isInteger(saved.unlocked) ? Math.min(TOTAL,Math.max(1,saved.unlocked)) : 1;
    const cleanMap = source => {
      const result = {};
      if (source && typeof source === "object") {
        for (const [key,value] of Object.entries(source)) {
          const n = Number(key), v = Number(value);
          if (Number.isInteger(n) && n >= 1 && n <= TOTAL && Number.isFinite(v) && v >= 0) {
            result[n] = Math.floor(v);
          }
        }
      }
      return result;
    };
    const stars = cleanMap(saved.stars);
    for (const key of Object.keys(stars)) stars[key] = Math.min(3,stars[key]);
    return {unlocked,stars,best:cleanMap(saved.best)};
  } catch (_) {
    return empty;
  }
}
function saveProgress() {
  try { localStorage.setItem(STORE,JSON.stringify(progress)); }
  catch (_) { setStatus("تعذر حفظ التقدم على هذا الجهاز، لكن تقدر تكمل اللعب.",true); }
}
function cfg(n) {
  return {
    goal:60 + Math.floor((n-1)/5)*20,
    limit:22 - Math.floor((n-1)/10)*2,
    count:36 + Math.floor((n-1)/5)*9
  };
}
function worldFor(n) { return worlds.find(w => n >= w.from && n <= w.to); }
function show(id) {
  $("mapScreen").classList.toggle("hidden",id !== "map");
  $("gameScreen").classList.toggle("hidden",id !== "game");
}
function totalStars() { return Object.values(progress.stars).reduce((a,b)=>a+b,0); }

function renderMap() {
  $("totalStars").textContent = digits(totalStars());
  $("progressText").textContent = "المرحلة " + digits(Math.min(progress.unlocked,TOTAL)) + " من " + digits(TOTAL);
  $("progressBar").style.width = ((progress.unlocked-1)/(TOTAL-1)*100) + "%";
  const host = $("levels");
  host.replaceChildren();
  worlds.forEach(w => {
    const heading = document.createElement("div");
    heading.className = "world-divider";
    heading.textContent = w.icon + " " + w.name;
    host.append(heading);
    for (let n=w.from;n<=w.to;n++) {
      const b = document.createElement("button");
      const stars = progress.stars[n] || 0, locked = n > progress.unlocked;
      b.type = "button";
      b.className = "level-card" + (locked?" locked":"") + (stars?" done":"") + (n===progress.unlocked?" current":"");
      b.disabled = locked;
      b.innerHTML = '<span class="level-icon">'+(locked?"🔒":stars===3?"🏆":w.icon)+'</span><strong>مرحلة '+digits(n)+'</strong><small>'+(locked?"مقفولة":"★".repeat(stars)+"☆".repeat(3-stars))+'</small>';
      b.addEventListener("click",()=>startLevel(n));
      host.append(b);
    }
  });
}

function setStatus(message,error) {
  $("status").textContent = message;
  $("status").classList.toggle("error",!!error);
}
function snapshot() { return {cells:cells.slice(),score,moves}; }
function saveHistory() {
  history.push(snapshot());
  if (history.length > 100) history.shift();
}
function findMove() { return Engine.findMove(cells,COLS); }

function render() {
  const host = $("board");
  host.replaceChildren();
  cells.forEach((value,index) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    b.setAttribute("aria-label",value==null?"خانة فارغة":"الرقم "+value);
    if (value == null) {
      b.classList.add("empty");
      b.disabled = true;
      b.tabIndex = -1;
    } else {
      b.textContent = digits(value);
      b.addEventListener("click",()=>choose(index));
    }
    if (selected.includes(index)) b.classList.add("selected");
    if (hintPair && hintPair.includes(index)) b.classList.add("hinted");
    host.append(b);
  });
  const c = cfg(level), best = progress.best[level] || 0;
  const pct = Math.min(100,Math.round(score/c.goal*100));
  $("score").textContent = digits(score);
  $("best").textContent = digits(best);
  $("moves").textContent = digits(Math.max(0,c.limit-moves)) + " / " + digits(c.limit);
  $("goalText").textContent = "اجمع " + digits(c.goal) + " نقطة";
  $("goalProgress").textContent = digits(pct) + "٪";
  $("goalBar").style.width = pct + "%";
  $("undoBtn").disabled = !history.length;\n  $("removeBtn").disabled = selected.length < 2;
  $("levelStars").textContent = "★".repeat(progress.stars[level]||0) + "☆".repeat(3-(progress.stars[level]||0));
}

function finish(win) {
  if (over) return;
  over = true;
  const c = cfg(level), requiredPairs = Math.ceil(c.goal/10);
  const stars = win
    ? (moves <= requiredPairs+1 ? 3 : moves <= requiredPairs+Math.ceil(c.limit*.25) ? 2 : 1)
    : 0;
  if (win) {
    progress.stars[level] = Math.max(progress.stars[level]||0,stars);
    progress.best[level] = Math.max(progress.best[level]||0,score);
    progress.unlocked = Math.max(progress.unlocked,Math.min(TOTAL,level+1));
    saveProgress();
  }
  $("resultEmoji").textContent = win ? ["","🌟","🏆","🎉"][stars] : "💪";
  $("resultTitle").textContent = win ? (level===TOTAL?"أنهيت الرحلة كلها!":"مبروك! خلصت المرحلة") : "حاول مرة تانية!";
  $("resultText").textContent = win
    ? "جمعت "+digits(score)+" نقطة"+(level===TOTAL?" وأكملت كل المراحل!":" وفتحت المرحلة التالية.")
    : "وصلت إلى "+digits(score)+" نقطة. جرّب خطة مختلفة وهتقدر!";
  $("earnedStars").textContent = win ? "⭐".repeat(stars)+"☆".repeat(3-stars) : "☆☆☆";
  $("nextBtn").classList.toggle("hidden",!win || level===TOTAL);
  $("nextBtn").disabled = !win || level===TOTAL;
  $("resultDialog").showModal();
  render();
  if (win) renderMap();
}

function checkState() {
  if (score >= cfg(level).goal) { finish(true); return; }
  if (moves >= cfg(level).limit) { finish(false); return; }
  if (!findMove()) {
    if (cells.length >= MAX_CELLS) {
      finish(false);
    } else {
      setStatus("مفيش حركة متاحة؛ اضغط «أرقام» لإضافة صف وفرصة جديدة.");
    }
  }
}

function choose(index) {
  if (over || cells[index] == null) return;
  hintPair = null;
  if (selected.includes(index)) {
    selected = selected.filter(i => i !== index);
    render();
    return;
  }
  if (!selected.length) {
    selected = [index];
    setStatus("اختار أرقامًا متساوية ومتجاورة، أو زوجًا مجموعهما ١٠.");
    render();
    return;
  }
  const first = selected[0];
  const sameGroup = selected.every(i => cells[i] === cells[first]) &&
    cells[index] === cells[first] &&
    selected.some(i => Engine.adjacent(i,index,COLS));
  const validPair = selected.length === 1 &&
    Engine.canMatch(cells,first,index,COLS);
  if (sameGroup || validPair) {
    selected.push(index);
    setStatus(selected.length > 2
      ? "مجموعة ممتازة! اضغط «حذف المحدد» لإزالتها."
      : "تم التحديد. تقدر تضيف رقمًا مجاورًا مطابقًا أو تحذف المحدد.");
  } else {
    selected = [index];
    setStatus("لازم الرقم يكون مطابقًا ومجاورًا للمجموعة، أو زوجًا صالحًا.",true);
  }
  render();
}

function removeSelected() {
  if (over || selected.length < 2) return;
  const removed = selected.length;
  saveHistory();
  selected.forEach(index => { cells[index] = null; });
  score += (removed - 1) * 10;
  moves++;
  while (cells.length && cells[cells.length-1] == null) cells.pop();
  selected = [];
  hintPair = null;
  setStatus("برافو! أزلت " + digits(removed) + " أرقام وكسبت " +
    digits((removed-1)*10) + " نقطة 🎈");
  render();
  checkState();
}

function startLevel(n) {
  if (!Number.isInteger(n) || n < 1 || n > progress.unlocked || n > TOTAL) return;
  level = n;
  const c = cfg(n);
  cells = Engine.createBoard(c.count,n);
  selected = [];
  score = 0;
  moves = 0;
  history = [];
  over = false;
  hintPair = null;
  const w = worldFor(n);
  $("worldName").textContent = w.icon + " " + w.name;
  $("levelTitle").textContent = "المرحلة " + digits(n);
  setStatus("اختار رقمين متساويين أو أكتر متجاورين (حتى قطريًا)، أو زوجًا مجموعهما ١٠.");
  show("game");
  render();
}

function addNumbers() {
  if (over) return;
  const values = cells.filter(v=>v!=null);
  if (!values.length) { setStatus("اللوحة فاضية! ابدأ من جديد.",true); return; }
  // Copy the remaining sequence and append a guaranteed pair so a dead board can recover.
  if (cells.length + values.length + 2 > MAX_CELLS) {
    finish(false);
    return;
  }
  saveHistory();
  cells.push(...values,5,5);
  moves++;
  selected = [];
  hintPair = null;
  setStatus("اتضاف صف جديد ومعاه زوج أرقام مساعد! 💫");
  render();
  checkState();
}

$("backBtn").addEventListener("click",()=>{
  if ($("resultDialog").open) $("resultDialog").close();
  show("map");
  renderMap();
});
$("mapBtn").addEventListener("click",()=>{
  $("resultDialog").close();
  show("map");
  renderMap();
});
$("nextBtn").addEventListener("click",()=>{
  if (level < TOTAL) {
    $("resultDialog").close();
    startLevel(level+1);
  }
});
$("restartBtn").addEventListener("click",()=>startLevel(level));
$("hintBtn").addEventListener("click",()=>{
  const pair = findMove();
  if (!pair) {
    setStatus("مفيش حركة ظاهرة؛ أضف صف أرقام جديد.",true);
    return;
  }
  selected = [];
  hintPair = pair;
  setStatus("التلميح: الرقمين اللي عليهم لمعة ينفع يتشالوا 💡");
  render();
});
$("addBtn").addEventListener("click",addNumbers);
$("undoBtn").addEventListener("click",()=>{
  const previous = history.pop();
  if (!previous) return;
  cells = previous.cells;
  score = previous.score;
  moves = previous.moves;
  selected = [];
  hintPair = null;
  over = false;
  if ($("resultDialog").open) $("resultDialog").close();
  setStatus("رجعنا آخر حركة. جرّب تاني!");
  render();
});

renderMap();
show("map");
})();

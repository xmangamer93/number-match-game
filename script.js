(() => {
  "use strict";
  const COLS = 9, MAX_ROWS = 18;
  const $ = id => document.getElementById(id);
  const boardEl = $("board"), statusEl = $("status");
  let cells = [], selected = [], score = 0, history = [], over = false, hintPair = null;
  let best = Number(localStorage.getItem("numberMatchBest") || 0);
  const digits = n => new Intl.NumberFormat("ar-EG").format(n);
  const setStatus = (message, error = false) => { statusEl.textContent = message; statusEl.classList.toggle("error", error); };
  const snapshot = () => ({cells: cells.slice(), score});
  const saveHistory = () => { history.push(snapshot()); if (history.length > 100) history.shift(); $("undoBtn").disabled = false; };
  const pairValue = (a,b) => a !== null && b !== null && (a === b || a + b === 10);
  const coords = i => [Math.floor(i / COLS), i % COLS];
  function alignedPath(a,b) {
    const [r1,c1] = coords(a), [r2,c2] = coords(b), dr = r2-r1, dc = c2-c1;
    if (dr === 0 && dc === 0) return false;
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return false;
    const sr = Math.sign(dr), sc = Math.sign(dc);
    let r = r1 + sr, c = c1 + sc;
    while (r !== r2 || c !== c2) {
      const i = r * COLS + c;
      if (cells[i] !== null && cells[i] !== undefined) return false;
      r += sr; c += sc;
    }
    return true;
  }
  function sequencePath(a,b) {
    const occupied = cells.map((v,i) => v === null || v === undefined ? -1 : i).filter(i => i >= 0);
    const x = occupied.indexOf(a), y = occupied.indexOf(b);
    return x >= 0 && y === x + 1;
  }
  function canMatch(a,b) {
    return a !== b && pairValue(cells[a],cells[b]) && (alignedPath(a,b) || sequencePath(a,b));
  }
  function findMove() {
    const occupied = cells.map((v,i) => v === null || v === undefined ? -1 : i).filter(i => i >= 0);
    for (let x=0;x<occupied.length;x++) for (let y=x+1;y<occupied.length;y++) {
      const a=occupied[x], b=occupied[y];
      if (pairValue(cells[a],cells[b]) && (alignedPath(a,b) || y===x+1)) return [a,b];
    }
    return null;
  }
  function render() {
    boardEl.replaceChildren();
    cells.forEach((value,i) => {
      const tile = document.createElement("button");
      tile.type="button"; tile.className="tile"; tile.setAttribute("aria-label", value == null ? "فارغ" : "الرقم "+value);
      if (value == null) { tile.classList.add("empty"); tile.disabled=true; tile.textContent=""; }
      else { tile.textContent=digits(value); tile.addEventListener("click",()=>choose(i)); }
      if (selected.includes(i)) tile.classList.add("selected");
      if (hintPair && hintPair.includes(i)) tile.classList.add("hinted");
      boardEl.append(tile);
    });
    $("score").textContent=digits(score); $("best").textContent=digits(best);
    $("undoBtn").disabled=!history.length;
    const move=findMove(); $("moves").textContent="الحركات المتاحة: "+(move ? "نعم" : "لا");
  }
  function checkEnd() {
    if (findMove()) return;
    if (cells.filter(v=>v!=null).length && cells.length < COLS*MAX_ROWS) {
      setStatus("لا توجد حركة الآن. اضغط «إضافة أرقام» لمتابعة اللعب.");
    } else if (cells.length >= COLS*MAX_ROWS) {
      over=true; $("endTitle").textContent="انتهت اللعبة"; $("endText").textContent="لا توجد حركات أخرى. نتيجتك "+digits(score);
      $("endDialog").showModal();
    }
  }
  function choose(i) {
    if (over) return;
    hintPair=null;
    if (selected.length===0) { selected=[i]; render(); return; }
    if (selected[0]===i) { selected=[]; render(); return; }
    const a=selected[0];
    if (canMatch(a,i)) {
      saveHistory(); cells[a]=null; cells[i]=null; score+=10;
      while(cells.length && cells[cells.length-1]==null) cells.pop();
      selected=[]; setStatus("ممتاز! تم حذف الرقمين وإضافة ١٠ نقاط."); render(); checkEnd();
    } else {
      selected=[i]; setStatus("هذان الرقمان غير متوافقين أو لا يوجد اتصال بينهما.",true); render();
    }
  }
  function addNumbers() {
    if(over) return;
    const values=cells.filter(v=>v!=null);
    if(!values.length) { setStatus("لا توجد أرقام لإضافتها.",true); return; }
    if(cells.length + values.length > COLS*MAX_ROWS) { setStatus("لا توجد مساحة كافية لإضافة صفوف أخرى.",true); checkEnd(); return; }
    saveHistory(); cells.push(...values); selected=[]; hintPair=null;
    setStatus("أُضيفت الأرقام الموجودة إلى نهاية اللوحة."); render(); checkEnd();
  }
  function newGame() {
    cells=Array.from({length:36},()=>Math.floor(Math.random()*9)+1);
    selected=[]; score=0; history=[]; over=false; hintPair=null;
    $("undoBtn").disabled=true; setStatus("ابدأ بمطابقة رقمين متساويين أو مجموعهما ١٠.");
    if(!findMove()) { cells[0]=5; cells[1]=5; }
    render();
  }
  $("newGame").addEventListener("click",newGame);
  $("playAgain").addEventListener("click",()=>{ $("endDialog").close(); newGame(); });
  $("addBtn").addEventListener("click",addNumbers);
  $("hintBtn").addEventListener("click",()=>{
    const pair=findMove();
    if(!pair) { setStatus(cells.length>=COLS*MAX_ROWS ? "لا توجد حركات ولا مساحة إضافية." : "لا توجد حركة؛ جرّب إضافة الأرقام.",true); return; }
    selected=[]; hintPair=pair; setStatus("تلميح: الرقمين المحددين يمكن حذفهُما."); render();
  });
  $("undoBtn").addEventListener("click",()=>{
    const previous=history.pop(); if(!previous) return;
    cells=previous.cells; score=previous.score; selected=[]; hintPair=null; over=false;
    if($("endDialog").open) $("endDialog").close();
    setStatus("تم التراجع عن آخر حركة."); render();
  });
  newGame();
})();
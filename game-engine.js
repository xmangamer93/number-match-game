(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NumberGameEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function pairValue(a, b) {
    return a != null && b != null && (a === b || a + b === 10);
  }

  function aligned(cells, a, b, columns) {
    const r1 = Math.floor(a / columns), c1 = a % columns;
    const r2 = Math.floor(b / columns), c2 = b % columns;
    const dr = r2 - r1, dc = c2 - c1;
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return false;
    const sr = Math.sign(dr), sc = Math.sign(dc);
    let r = r1 + sr, c = c1 + sc;
    while (r !== r2 || c !== c2) {
      const index = r * columns + c;
      if (index < 0 || index >= cells.length || cells[index] != null) return false;
      r += sr;
      c += sc;
    }
    return true;
  }

  function sequential(cells, a, b) {
    const active = [];
    for (let i = 0; i < cells.length; i++) if (cells[i] != null) active.push(i);
    const ia = active.indexOf(a), ib = active.indexOf(b);
    return ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1;
  }

  function adjacent(a, b, columns) {
    if (a === b) return false;
    const r1 = Math.floor(a / columns), c1 = a % columns;
    const r2 = Math.floor(b / columns), c2 = b % columns;
    return Math.abs(r1-r2) <= 1 && Math.abs(c1-c2) <= 1;
  }

  function canMatch(cells, a, b, columns) {
    if (a === b || !pairValue(cells[a], cells[b])) return false;
    if (cells[a] === cells[b]) return adjacent(a, b, columns);
    return aligned(cells, a, b, columns) || sequential(cells, a, b);
  }

  function findMove(cells, columns) {
    const active = [];
    for (let i = 0; i < cells.length; i++) if (cells[i] != null) active.push(i);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (canMatch(cells, active[i], active[j], columns)) return [active[i], active[j]];
      }
    }
    return null;
  }

  function createBoard(count, level, random) {
    const rng = typeof random === "function" ? random : Math.random;
    const pairs = [];
    const patterns = [[1,9],[2,8],[3,7],[4,6],[5,5]];
    for (let i = 0; i < Math.floor(count / 2); i++) {
      const pair = patterns[(i + level - 1) % patterns.length].slice();
      if (rng() < 0.5) pair.reverse();
      pairs.push(pair);
    }
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    const board = pairs.flat();
    if (count % 2) board.push(1 + Math.floor(rng() * 9));
    return board;
  }

  return { pairValue, aligned, sequential, adjacent, canMatch, findMove, createBoard };
});

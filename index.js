// Sudoku : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Sudoku</span><span class=\"hint\" id=\"sdInfo\"></span><div class=\"agNav\"><select class=\"f gSel\" id=\"sdLevel\"><option value=\"facile\">Facile</option><option value=\"moyen\" selected>Moyen</option><option value=\"difficile\">Difficile</option><option value=\"expert\">Expert</option><option value=\"diabolique\">Diabolique</option></select><button class=\"btn px\" id=\"sdNew\">NOUVELLE GRILLE</button></div></div>\n      <div class=\"sdMain\"><div id=\"sdGrid\" class=\"px\"></div><div class=\"sdSide\"><div class=\"sdTime\" id=\"sdTime\">0:00</div><div id=\"sdPad\"></div><div class=\"row\"><button class=\"btn px\" id=\"sdNoteBtn\">Notes : non</button><button class=\"btn px\" id=\"sdErase\">Effacer</button></div><div class=\"row\"><button class=\"btn px\" id=\"sdUndoBtn\">Annuler</button><button class=\"btn px\" id=\"sdHint\">Indice</button></div><label class=\"check\"><input type=\"checkbox\" id=\"sdErrors\" checked> Montrer les erreurs</label></div></div>\n      <div class=\"hint\">Clavier : chiffres pour remplir, Maj + chiffre (ou N) pour les notes, flèches pour bouger, Retour arrière pour effacer, Ctrl + Z pour annuler. La grille en cours est gardée.</div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.gSel{width:auto;font-size:14px;padding:6px 10px;margin-right:8px}
.sdMain{display:flex;gap:28px;align-items:flex-start;flex-wrap:wrap}
#sdGrid{--fill:var(--line2);display:grid;grid-template-columns:repeat(9,58px);gap:1px;padding:3px}
.sdCell{border:0;padding:0;width:58px;height:58px;background:var(--win);color:#fff;font:600 28px var(--text);cursor:var(--cp,pointer);position:relative}
.sdCell.br{margin-right:3px}
.sdCell.bb{margin-bottom:3px}
.sdCell.given{color:var(--lilac)}
.sdCell.user{color:var(--pink)}
.sdCell.near{background:#1a1038}
.sdCell.same{background:#2b1a5a}
.sdCell.sel{background:#3e2a7a;box-shadow:inset 0 0 0 3px var(--pink)}
.sdCell.wrong{color:var(--red);background:#2a0b1a}
.sdNotes{position:absolute;inset:3px;display:grid;grid-template-columns:repeat(3,1fr);font:12px var(--text);color:var(--muted)}
.sdNotes span{display:grid;place-items:center}
.sdNotes .hl{color:#fff;background:rgba(var(--pkr),.35)}
.sdSide{display:flex;flex-direction:column;gap:14px;width:260px}
.sdTime{font:22px var(--title);color:#fff}
#sdPad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.sdKey{height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.sdKey b{font:22px var(--title)}
.sdKey small{font-size:12px;color:var(--muted)}
.sdKey.full{opacity:.45}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "sudokuApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  const LEGACY_GAMES = {"top":["sudokuStats","sudoku"],"best":"^sudoku"};
  let games = await doc('games');
  if (games == null) {  // première ouverture : tu retrouves tes records et tes parties d'avant
    const old = legacy.api ? await legacy.api('games').catch(() => null) : null; games = { best: {} };
    if (old) { const re = new RegExp(LEGACY_GAMES.best); for (const [k, v] of Object.entries(old.best || {})) if (re.test(k)) games.best[k] = v; for (const k of LEGACY_GAMES.top) if (old[k] !== undefined) games[k] = old[k]; await folder.write('games', games); }
  }
  games = { best: {}, ...games };
  let gamesTimer = null;
  const saveGames = () => { clearTimeout(gamesTimer); gamesTimer = setTimeout(() => { gamesTimer = null; folder.write('games', games).catch(() => {}); }, 500); };
  const best = (k, v, higher = true) => { const b = games.best[k]; if (b == null || (higher ? v > b : v < b)) { games.best[k] = v; saveGames(); return true; } return false; };
  const gstore = (k, init) => (games[k] ??= init);  // la section d'un jeu
function gameLoop(st, appKey, update, draw) {
  cancelAnimationFrame(st.raf);
  const STEP = 1000 / 60; let acc = 0, last = performance.now();
  const frame = t => {
    if (!view.classList.contains('on')) { st.raf = 0; if (st.mode === 'play') st.mode = 'pause'; return; }  // leaving the tab pauses the game
    st.raf = requestAnimationFrame(frame);
    acc += Math.min(200, t - last); last = t;
    while (acc >= STEP) { if (st.mode === 'play') update(); st.tick++; acc -= STEP; }
    draw();
  };
  st.raf = requestAnimationFrame(frame);
}
function gameText(g, w, lines, y0) {  // centred pixel-font lines over a dark band
  g.fillStyle = 'rgba(11,3,28,.72)'; g.fillRect(0, y0 - 14, w, lines.length * 14 + 14);
  g.textAlign = 'center';
  lines.forEach(([text, color, size], i) => { g.fillStyle = color; g.font = (size || 8) + 'px "Press Start 2P", monospace'; g.fillText(text, w / 2, y0 + i * 14); });
  g.textAlign = 'left';
}
const px = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
function sprite(g, rows, x, y, pal) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(g, c, x + i, y + j); } }); }
  // ---- ton code d'origine ----
const anyOf = a => a[Math.floor(Math.random() * a.length)];
const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

/* ---------- Sudoku: unique-solution grids in 5 levels, pencil notes, undo, hints; the game in progress is saved ---------- */
const SD_LEVELS = {facile: 40, moyen: 32, difficile: 27, expert: 23, diabolique: 21};  // clues left
function sdSolve(g, limit = 2) {  // number of solutions (stops at limit); g = 81 numbers, 0 = empty. Bit masks per row / column / box
  const row = Array(9).fill(0), col = Array(9).fill(0), box = Array(9).fill(0), b = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);
  for (let i = 0; i < 81; i++) if (g[i]) { const m = 1 << g[i]; if ((row[Math.floor(i / 9)] | col[i % 9] | box[b(i)]) & m) return 0; row[Math.floor(i / 9)] |= m; col[i % 9] |= m; box[b(i)] |= m; }
  let count = 0;
  const go = () => {
    let bestI = -1, bestM = 0, bestN = 10;  // the empty cell with the fewest candidates
    for (let i = 0; i < 81; i++) if (!g[i]) {
      const m = ~(row[Math.floor(i / 9)] | col[i % 9] | box[b(i)]) & 0x3fe; let n = 0; for (let v = m; v; v &= v - 1) n++;
      if (n < bestN) { bestN = n; bestI = i; bestM = m; if (!n) return; }
    }
    if (bestI < 0) { count++; return; }
    const r = Math.floor(bestI / 9), c = bestI % 9, bx = b(bestI);
    for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) if (bestM & (1 << v)) {
      g[bestI] = v; row[r] |= 1 << v; col[c] |= 1 << v; box[bx] |= 1 << v;
      go(); if (count >= limit) return;
      g[bestI] = 0; row[r] &= ~(1 << v); col[c] &= ~(1 << v); box[bx] &= ~(1 << v);
    }
  };
  go(); return count;
}
function sdGenerate(clues) {  // very few clues are not always reachable from one grid: new grids are tried, the sparsest kept
  let best = null;
  for (let tries = 0; tries < (clues < 23 ? 40 : 1) && !(best && best.left <= clues); tries++) {
    const sol = Array(81).fill(0); sdSolve(sol, 1);  // a random full grid (the solver tries values in random order and stops at 1, leaving it filled)
    const puz = sol.slice();
    let left = 81;
    for (const i of shuffled([...Array(81).keys()])) {
      if (left <= clues) break;
      const v = puz[i]; puz[i] = 0;
      if (sdSolve(puz.slice()) !== 1) puz[i] = v; else left--;
    }
    if (!best || left < best.left) best = {puz, sol, left};
  }
  return {puz: best.puz, sol: best.sol};
}
let sd = null;
function sdNew() {
  const lvl = $('sdLevel').value, {puz, sol} = sdGenerate(SD_LEVELS[lvl]);
  games.sudoku = sd = {lvl, puz, sol, cur: puz.slice(), notes: Array(81).fill(0), secs: 0, mistakes: 0, hints: 0, done: false};
  sdSel = puz.indexOf(0); sdUndo = []; saveGames(); sdRender();
}
let sdSel = 0, sdNotes = false, sdUndo = [], sdTimer = null;
function sdOpen() {
  sd = games.sudoku?.puz ? games.sudoku : null;
  if (!sd) return sdNew();
  $('sdLevel').value = sd.lvl; sdRender();
}
setInterval(() => { if (sd && !sd.done && view.classList.contains('on')) { sd.secs++; $('sdTime').textContent = clock(sd.secs); if (sd.secs % 10 === 0) saveGames(); } }, 1000);
function sdSet(v, note = sdNotes) {
  const i = sdSel; if (!sd || sd.done || sd.puz[i]) return;
  sdUndo.push([i, sd.cur[i], sd.notes[i]]); if (sdUndo.length > 300) sdUndo.shift();
  if (note && v) { sd.cur[i] = 0; sd.notes[i] ^= 1 << v; }
  else {
    sd.cur[i] = sd.cur[i] === v ? 0 : v; sd.notes[i] = 0;
    if (v && sd.cur[i] && v !== sd.sol[i]) { sd.mistakes++; sfx('error'); }
    if (v && sd.cur[i] === sd.sol[i]) {  // a right number removes it from the notes of its row, column and box
      for (let j = 0; j < 81; j++) if (Math.floor(j / 9) === Math.floor(i / 9) || j % 9 === i % 9 || (Math.floor(j / 27) === Math.floor(i / 27) && Math.floor(j % 9 / 3) === Math.floor(i % 9 / 3))) sd.notes[j] &= ~(1 << v);
    }
  }
  if (sd.cur.every((v, k) => v === sd.sol[k])) { sd.done = true; const st = gstore('sudokuStats', {}); st[sd.lvl] = (st[sd.lvl] || 0) + 1; if (best('sudoku' + sd.lvl, sd.secs, false)) toast('Nouveau record : ' + clock(sd.secs)); sfx('launch'); }
  saveGames(); sdRender();
}
function sdRender() {
  const show = $('sdErrors').checked, sel = sdSel, sv = sd.cur[sel];
  $('sdGrid').replaceChildren(...sd.cur.map((v, i) => {
    const r = Math.floor(i / 9), c = i % 9, same = Math.floor(r / 3) === Math.floor(sel / 27) && Math.floor(c / 3) === Math.floor(sel % 9 / 3);
    const cls = ['sdCell', sd.puz[i] ? 'given' : 'user', i === sel ? 'sel' : (r === Math.floor(sel / 9) || c === sel % 9 || same) ? 'near' : '', v && v === sv ? 'same' : '', show && v && !sd.puz[i] && v !== sd.sol[i] ? 'wrong' : '', c % 3 === 2 && c < 8 ? 'br' : '', r % 3 === 2 && r < 8 ? 'bb' : ''];
    const d = el('button', cls.filter(Boolean).join(' '));
    if (v) d.textContent = v;
    else if (sd.notes[i]) { const n = el('div', 'sdNotes'); for (let k = 1; k <= 9; k++) n.append(el('span', sv === k ? 'hl' : '', sd.notes[i] & (1 << k) ? String(k) : '')); d.append(n); }
    d.onclick = () => { sdSel = i; sdRender(); };
    return d;
  }));
  $('sdPad').replaceChildren(...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => {
    const left = 9 - sd.cur.filter((v, i) => v === k && v === sd.sol[i]).length, b = el('button', 'btn px sdKey' + (left ? '' : ' full'));
    b.append(el('b', '', String(k)), el('small', '', left ? String(left) : '✓')); b.onclick = () => sdSet(k); return b;
  }));
  $('sdNoteBtn').classList.toggle('main', sdNotes); $('sdNoteBtn').textContent = 'Notes : ' + (sdNotes ? 'oui' : 'non');
  $('sdTime').textContent = clock(sd.secs);
  const rec = games.best['sudoku' + sd.lvl];
  $('sdInfo').textContent = (sd.done ? 'Grille résolue en ' + clock(sd.secs) + ' ! ' : '') + 'Erreurs : ' + sd.mistakes + ' · indices : ' + sd.hints + ' · record ' + (rec ? clock(rec) : '—');
}
$('sdNew').onclick = sdNew;
$('sdLevel').onchange = sdNew;
$('sdErrors').onchange = () => sdRender();
$('sdNoteBtn').onclick = () => { sdNotes = !sdNotes; sdRender(); };
$('sdErase').onclick = () => { if (sd.puz[sdSel] || sd.done) return; sdUndo.push([sdSel, sd.cur[sdSel], sd.notes[sdSel]]); sd.cur[sdSel] = 0; sd.notes[sdSel] = 0; saveGames(); sdRender(); };
$('sdUndoBtn').onclick = () => { const u = sdUndo.pop(); if (!u || sd.done) return; [sdSel, sd.cur[u[0]], sd.notes[u[0]]] = u; saveGames(); sdRender(); };
$('sdHint').onclick = () => {
  if (sd.done) return;
  let i = sdSel; if (sd.cur[i] === sd.sol[i]) i = shuffled([...Array(81).keys()]).find(k => sd.cur[k] !== sd.sol[k]);
  if (i == null) return; sdSel = i; sd.hints++; sdSet(sd.sol[i], false);
};
document.addEventListener('keydown', e => {
  if (!view.classList.contains('on') || !sd || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const k = e.key, mv = {ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1}[k];
  if (mv) { e.preventDefault(); sdSel = (sdSel + mv + 81) % 81; return sdRender(); }
  if (/^[1-9]$/.test(k)) return sdSet(+k, sdNotes !== e.shiftKey);
  if (['Backspace', 'Delete', '0'].includes(k)) return $('sdErase').click();
  if (k.toLowerCase() === 'n') return $('sdNoteBtn').click();
  if (e.ctrlKey && k.toLowerCase() === 'z') return $('sdUndoBtn').click();
});  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { sd ? sdRender() : sdOpen(); });
}

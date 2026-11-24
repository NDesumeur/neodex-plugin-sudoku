// Sudoku : des grilles à solution unique en cinq niveaux, avec notes, annulation et indices ; la grille en cours est gardée.
// Appli NeoDex habillée en pixel art (police bitmap, cadres et boutons en pixels). Elle tourne dans le bac à sable de NeoDex.
const HTML = `<div class="appWrap wide">
  <div class="agHead"><span class="label">Sudoku</span><span class="hint" id="sdInfo"></span></div>
  <div class="sdMain"><div id="sdGrid" data-pxskip></div>
    <div class="sdSide">
      <div class="sysCard"><b>TEMPS</b><div class="sdTime" id="sdTime" data-pxskip>0:00</div></div>
      <label class="row">Niveau <select class="f gSel" id="sdLevel"><option value="facile">Facile</option><option value="moyen" selected>Moyen</option><option value="difficile">Difficile</option><option value="expert">Expert</option><option value="diabolique">Diabolique</option></select></label>
      <div class="row"><button class="btn main" id="sdNew">NOUVELLE GRILLE</button></div>
      <div id="sdPad" data-pxskip></div>
      <div class="row"><button class="btn" id="sdNoteBtn">Notes : non</button><button class="btn" id="sdErase">Effacer</button></div>
      <div class="row"><button class="btn" id="sdUndoBtn">Annuler</button><button class="btn" id="sdHint">Indice</button></div>
      <div class="sdTip" id="sdTip"></div>
      <label class="check"><input type="checkbox" id="sdErrors" checked> Montrer les erreurs</label>
    </div></div>
  <div class="hint">Clavier : chiffres pour remplir, Maj + chiffre (ou N) pour les notes, flèches pour bouger, Retour arrière pour effacer, Ctrl + Z pour annuler. La grille en cours est gardée.</div>
</div>`;
const CSS = `.sdMain{display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap}
#sdGrid{--cs:clamp(32px,min(calc((100vh - 230px) / 9.5),calc((100vw - 460px) / 9.5)),88px);display:grid;grid-template-columns:repeat(9,var(--cs));gap:2px;padding:5px;background:#2a2140;box-shadow:0 0 0 3px #05010b,0 0 0 6px var(--line2)}
.sdCell{border:0;padding:0;width:var(--cs);height:var(--cs);background:#f4eedf;color:#1c1430;font:calc(var(--cs) * .56) var(--text);line-height:1;cursor:var(--cp,pointer);position:relative}
.sdCell.br{margin-right:4px}
.sdCell.bb{margin-bottom:4px}
.sdCell.given{color:#1c1430}
.sdCell.user{color:#3346c8}
.sdCell.near{background:#e4dcf2}
.sdCell.same{background:#cbbcf2}
.sdCell.sel{background:#ffe08a;box-shadow:inset 0 0 0 3px #ff8a3a}
.sdCell.wrong{color:#d4143c;background:#ffd6d6}
.sdCell.hintC{background:#bfe8c8}
.sdCell.hintT{background:#7fd890;box-shadow:inset 0 0 0 3px #2a8a3a}
.sdTip{background:#1c1430;color:#f4eedf;border-left:4px solid #7fd890;padding:8px 10px;line-height:20px}
.sdTip:empty{display:none}
.sdNotes{position:absolute;inset:2px;display:grid;grid-template-columns:repeat(3,1fr);font:calc(var(--cs) * .24) var(--text);color:#6a5a8a}
.sdNotes span{display:grid;place-items:center}
.sdNotes .hl{color:#1c1430;background:rgba(255,90,217,.35)}
.sdSide{display:flex;flex-direction:column;gap:14px;width:290px;max-width:100%}
.sdSide .sysCard{display:flex;align-items:center;justify-content:space-between}
.sdTime{font:26px var(--text);color:#fff}
#sdPad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sdKey{height:clamp(44px,calc((100vh - 300px) / 8),64px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.sdKey b{font:24px var(--text)}
.sdKey small{font:13px var(--text);color:var(--muted)}
.sdKey.full{opacity:.45}`;
/* ---------- l'habillage pixel art, dessiné à la main : police bitmap (accents compris), cadres, boutons, icônes ----------
   Tout est en pixels pleins, agrandis par 2 sans lissage : aucun dégradé, aucune ombre floue. */
const PXK = (() => {
  // chaque lettre : ses lignes, de haut en bas, à partir de la ligne 2 de la case (0-1 : accents des majuscules, 9-10 : jambages)
  const S = {
    A: '.###. #...# #...# ##### #...# #...# #...#', B: '####. #...# #...# ####. #...# #...# ####.', C: '.###. #...# #.... #.... #.... #...# .###.',
    D: '####. #...# #...# #...# #...# #...# ####.', E: '##### #.... #.... ####. #.... #.... #####', F: '##### #.... #.... ####. #.... #.... #....',
    G: '.###. #...# #.... #.### #...# #...# .####', H: '#...# #...# #...# ##### #...# #...# #...#', I: '### .#. .#. .#. .#. .#. ###',
    J: '..### ...#. ...#. ...#. #..#. #..#. .##..', K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#', L: '#.... #.... #.... #.... #.... #.... #####',
    M: '#...# ##.## #.#.# #.#.# #...# #...# #...#', N: '#...# ##..# #.#.# #..## #...# #...# #...#', O: '.###. #...# #...# #...# #...# #...# .###.',
    P: '####. #...# #...# ####. #.... #.... #....', Q: '.###. #...# #...# #...# #.#.# #..#. .##.#', R: '####. #...# #...# ####. #.#.. #..#. #...#',
    S: '.#### #.... #.... .###. ....# ....# ####.', T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', U: '#...# #...# #...# #...# #...# #...# .###.',
    V: '#...# #...# #...# #...# #...# .#.#. ..#..', W: '#...# #...# #...# #.#.# #.#.# ##.## #...#', X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
    Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', Z: '##### ....# ...#. ..#.. .#... #.... #####',
    a: '..... ..... .###. ....# .#### #...# .####', b: '#.... #.... ####. #...# #...# #...# ####.', c: '..... ..... .###. #.... #.... #.... .###.',
    d: '....# ....# .#### #...# #...# #...# .####', e: '..... ..... .###. #...# ##### #.... .###.', f: '..## .#.. #### .#.. .#.. .#.. .#..',
    g: '..... ..... .#### #...# #...# #...# .#### ....# .###.', h: '#.... #.... ####. #...# #...# #...# #...#', i: '.#. ... ##. .#. .#. .#. ###',
    'ı': '... ... ##. .#. .#. .#. ###', j: '...# .... ..## ...# ...# ...# ...# #..# .##.', k: '#... #... #..# #.#. ##.. #.#. #..#',
    l: '##. .#. .#. .#. .#. .#. ###', m: '..... ..... ##.#. #.#.# #.#.# #.#.# #...#', n: '..... ..... ####. #...# #...# #...# #...#',
    o: '..... ..... .###. #...# #...# #...# .###.', p: '..... ..... ####. #...# #...# #...# ####. #.... #....', q: '..... ..... .#### #...# #...# #...# .#### ....# ....#',
    r: '.... .... #.## ##.. #... #... #...', s: '..... ..... .#### #.... .###. ....# ####.', t: '.#.. .#.. #### .#.. .#.. .#.. ..##',
    u: '..... ..... #...# #...# #...# #..## .##.#', v: '..... ..... #...# #...# #...# .#.#. ..#..', w: '..... ..... #...# #...# #.#.# #.#.# .#.#.',
    x: '..... ..... #...# .#.#. ..#.. .#.#. #...#', y: '..... ..... #...# #...# #...# #...# .#### ....# .###.', z: '..... ..... ##### ...#. ..#.. .#... #####',
    0: '.###. #...# #..## #.#.# ##..# #...# .###.', 1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.', 2: '.###. #...# ....# ...#. ..#.. .#... #####',
    3: '####. ....# ....# .###. ....# ....# ####.', 4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.', 5: '##### #.... ####. ....# ....# #...# .###.',
    6: '.###. #.... #.... ####. #...# #...# .###.', 7: '##### ....# ...#. ..#.. .#... .#... .#...', 8: '.###. #...# #...# .###. #...# #...# .###.',
    9: '.###. #...# #...# .#### ....# ....# .###.',
    '.': '. . . . . . #', ',': '.. .. .. .. .. .# .# #.', ':': '. . # . . . #', ';': '.. .. .# .. .. .# .# #.', '!': '# # # # # . #',
    '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', "'": '# # . . . . .', '"': '#.# #.# ... ... ... ... ...', '-': '... ... ... ### ... ... ...',
    '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....', '/': '....# ...#. ...#. ..#.. .#... .#... #....', '(': '.# #. #. #. #. #. .#', ')': '#. .# .# .# .# .# #.',
    '%': '##..# ##.#. ...#. ..#.. .#... .#.## #..##', '·': '. . . # . . .', '×': '..... ..... #...# .#.#. ..#.. .#.#. #...#',
    '<': '...# ..#. .#.. #... .#.. ..#. ...#', '>': '#... .#.. ..#. ...# ..#. .#.. #...', '=': '.... .... #### .... #### .... ....',
    '_': '..... ..... ..... ..... ..... ..... #####', '#': '.#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.', '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#',
    '…': '..... ..... ..... ..... ..... ..... #.#.#', '«': '..... ..#.# .#.#. #.#.. .#.#. ..#.# .....', '»': '..... #.#.. .#.#. ..#.# .#.#. #.#.. .....',
    '◀': '...# ..## .### #### .### ..## ...#', '▶': '#... ##.. ###. #### ###. ##.. #...', '→': '..... ..#.. ...#. ##### ...#. ..#.. .....',
    '←': '..... ..#.. .#... ##### .#... ..#.. .....', '↑': '..#.. .###. #.#.# ..#.. ..#.. ..#.. ..#..', '↓': '..#.. ..#.. ..#.. ..#.. #.#.# .###. ..#..',
    '*': '..... #.#.# .###. ##### .###. #.#.# .....', '[': '## #. #. #. #. #. ##', ']': '## .# .# .# .# .# ##', '|': '# # # # # # #',
    '@': '.###. #...# #.### #.#.# #.### #.... .###.', '€': '..### .#... ####. .#... ####. .#... ..###', '$': '..#.. .#### #.#.. .###. ..#.# ####. ..#..',
    '°': '.#. #.# .#. ... ... ... ...', '~': '..... ..... .#..# #.##. ..... ..... .....', '♪': '..##. ..#.# ..#.. ..#.. .##.. ###.. .#...',
  };
  const ACC = { a: ['..#', '.#.'], g: ['#..', '.#.'], c: ['.#.', '#.#'], d: ['...', '#.#'], t: ['.#.#', '#.#.'], z: ['.#.', '##.'] };  // aigu, grave, circonflexe, tréma, tilde, cédille
  const COMP = { é: 'ea', è: 'eg', ê: 'ec', ë: 'ed', á: 'aa', à: 'ag', â: 'ac', ä: 'ad', í: 'ıa', ì: 'ıg', î: 'ıc', ï: 'ıd', ó: 'oa', ò: 'og', ô: 'oc', ö: 'od',
    ú: 'ua', ù: 'ug', û: 'uc', ü: 'ud', ÿ: 'yd', ñ: 'nt', ç: 'cz', É: 'Ea', È: 'Eg', Ê: 'Ec', Ë: 'Ed', Á: 'Aa', À: 'Ag', Â: 'Ac', Ä: 'Ad', Í: 'Ia', Î: 'Ic', Ï: 'Id',
    Ó: 'Oa', Ô: 'Oc', Ö: 'Od', Ú: 'Ua', Ù: 'Ug', Û: 'Uc', Ü: 'Ud', Ñ: 'Nt', Ç: 'Cz' };
  const SUB = { 'œ': 'oe', 'Œ': 'OE', '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', ' ': ' ', ' ': ' ', '•': '·', '✓': 'v', 'ᐸ': '<', 'ᐳ': '>', '＜': '<', '＞': '>', '｜': '|', '／': '/', '！': '!', '？': '?', '（': '(', '）': ')', '：': ':', '　': ' ' };  // ᐸ ᐳ : les < > des titres YouTube
  const H = 11, glyphs = new Map(); let raster;
  function glyph(ch) {
    let g = glyphs.get(ch); if (g) return g;
    const px = [], add = (rows, ox, oy) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') px.push([ox + x, oy + y]); });
    const c = COMP[ch], src = S[c ? c[0] : ch]; let w = 3;
    if (src) {
      const rows = src.split(' '); w = Math.max(...rows.map(r => r.length)); add(rows, 0, 2);
      if (c) { const a = ACC[c[1]]; add(a, Math.floor((w - a[0].length) / 2), c[1] === 'z' ? 9 : /[A-Z]/.test(c[0]) ? 0 : 1); }
    } else if (ch !== ' ') {  // japonais, emoji… : la lettre du système, réduite à des pixels nets (sans lissage) sur la même hauteur que la police
      const q = (raster ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })), RW = 16;
      q.canvas.width = RW; q.canvas.height = H; q.font = '11px "MS Gothic", "Yu Gothic UI", Meiryo, "Segoe UI Symbol", sans-serif'; q.fillStyle = '#000'; q.fillText(ch, 0, 10);
      const d = q.getImageData(0, 0, RW, H).data; let mx = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < RW; x++) if (d[(y * RW + x) * 4 + 3] > 110) { px.push([x, y]); mx = Math.max(mx, x + 1); }
      w = mx || 3;
      if (!px.length) { w = 5; add(['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'], 0, 2); }  // vraiment inconnue : une petite case
    }
    g = { w, px }; glyphs.set(ch, g); return g;
  }
  function layout(text) {
    let x = 0; const items = [];
    for (const ch of String(text)) for (const c of SUB[ch] ?? ch) { const g = glyph(c); items.push([g, x]); x += g.w + 1; }
    return { w: Math.max(0, x - 1), items };
  }
  function draw(g, text, x, y, color, s = 1) {  // (x, y) : coin haut gauche de la case
    const L = layout(text); g.fillStyle = color;
    for (const [gl, ox] of L.items) for (const [px, py] of gl.px) g.fillRect(x + (ox + px) * s, y + py * s, s, s);
    return L.w * s;
  }
  const bmp = new Map();
  function sprite(text, color, s = 1) {  // le texte tout prêt, gardé pour les images suivantes du jeu
    const k = text + '|' + color + '|' + s; let c = bmp.get(k); if (c) return c;
    c = document.createElement('canvas'); c.width = Math.max(1, layout(text).w * s); c.height = H * s; draw(c.getContext('2d'), text, 0, 0, color, s);
    if (bmp.size > 400) bmp.delete(bmp.keys().next().value);
    bmp.set(k, c); return c;
  }
  // comme fillText : (x, y) sur la ligne de base, aligné à gauche, au centre ou à droite
  function fill(g, text, x, y, color, s = 1, align = 'left') {
    const c = sprite(String(text), color, s), dx = align === 'center' ? -c.width / 2 : align === 'right' ? -c.width : 0;
    g.drawImage(c, Math.round(x + dx), Math.round(y - 9 * s));
  }
  const scale = size => Math.max(1, Math.round((size || 8) / 8));
  function art(rows, pal, s = 1) {  // un dessin en lignes de caractères, chaque caractère une couleur de la palette (« . » : transparent)
    const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)) * s; c.height = rows.length * s;
    const g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x * s, y * s, s, s); } } });
    return c;
  }
  return { H, layout, draw, sprite, fill, scale, art };
})();

// les pièces de l'interface, pixel par pixel (K : contour, les autres lettres : la palette du jeu)
const PX_PANEL = ['..KKKKKKKKKKKK..', '.KAAAAAAAAAAAAK.', 'KALAAAAAAAAAALSK', 'KAAKKKKKKKKKKSSK', 'KAAKHHHHHHHHKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK',
  'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKKKKKKKKKKSSK', 'KALSSSSSSSSSSLSK', '.KSSSSSSSSSSSSK.', '..KKKKKKKKKKKK..'];
const PX_CARD = ['.KKKKKKKKKK.', 'KFFFFFFFFFFK', 'KFHHHHHHHHFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFSSSSSSSSFK', 'KFFFFFFFFFFK', '.KKKKKKKKKK.'];
const PX_BTN = ['.KKKKKKKKKK.', 'KWWWWWWWWWWK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KBBBBBBBBBBK', 'KKKKKKKKKKKK', 'KDDDDDDDDDDK', '.KKKKKKKKKK.'];
const PX_BTN_DOWN = ['............', '............', '.KKKKKKKKKK.', 'KBBBBBBBBBBK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KWWWWWWWWWWK', '.KKKKKKKKKK.'];
const PX_TRACK = ['.KKKKKKKKKK.', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KHHHHHHHHHHK', '.KKKKKKKKKK.'];
const PX_KNOB = ['.KKKKK.', 'KWWWWWK', 'KWAAABK', 'KWAAABK', 'KKKKKKK', 'KWAAABK', 'KWAAABK', 'KBBBBBK', 'KDDDDDK', '.KKKKK.'];
const PX_RAIL = ['KDDDDDDK', 'KDDDDDDK', 'KDDDDDDK', 'KDDHHDDK'];
const PX_ICONS = {
  play: ['kk......', 'kakk....', 'kaaakk..', 'kaaaaakk', 'kaaaaaak', 'kaaaaakk', 'kaaakk..', 'kakk....', 'kk......'],
  full: ['www...www', 'w.......w', 'w.......w', '.........', '....a....', '.........', 'w.......w', 'w.......w', 'www...www'],
  note: ['...aaaaaa', '...aaaaaa', '...a....a', '...a....a', '...a....a', '.aaa..aaa', 'aaaa.aaaa', 'aaaa.aaaa', '.aa...aa.'],
  star: ['....g....', '....g....', '...ggg...', 'ggggwgggg', '.ggwwwgg.', '..ggggg..', '..oo.oo..', '.oo...oo.', '.o.....o.'],
  crown: ['g...g...g', 'gg.ggg.gg', 'ggggggggg', 'grgggggrg', 'ggggggggg', 'ooooooooo'],
  folder: ['oooo.....', 'oggoooooo', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ooooooooo'],
  vol: ['....w....', '...ww..b.', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', '...ww..b.', '....w....'],
  clock: ['..wwwww..', '.w.....w.', 'w...a...w', 'w...a...w', 'w...aaa.w', 'w.......w', 'w.......w', '.w.....w.', '..wwwww..'],
  cursor: ['....a....', '..aaaaa..', '.a..a..a.', '.a.....a.', 'aaa.w.aaa', '.a.....a.', '.a..a..a.', '..aaaaa..', '....a....'],
  plus: ['...b...', '...b...', '...b...', 'bbbbbbb', '...b...', '...b...', '...b...'],
  down: ['wwwwwww', '.wwwww.', '..www..', '...w...'],
};

/* habille la page du jeu : root = son conteneur, T = sa palette, icons = [motif du texte, icône] pour les boutons et libellés */
function pxSkin(root, { T, icons = [], emblem, title }) {
  root.classList.add('pxk'); const s = 2, url = c => c.toDataURL();
  const btnPal = (M, W, B, D) => ({ K: T.k, W, M, B, D });
  const BN = btnPal(T.btn, T.btnHi, T.btnLo, T.k2), BH = btnPal(T.btnHov, T.btnHovHi, T.btnLo, T.k2);
  const BA = btnPal(T.acc, T.accL, T.accS, T.accD), BAH = btnPal(T.accL, '#ffffff', T.acc, T.accD);
  const img = { panel: PXK.art(PX_PANEL, { K: T.k, A: T.acc, S: T.accS, L: T.rivet, H: T.hl, D: T.fill }, s),
    card: PXK.art(PX_CARD, { K: T.k, F: T.line, H: T.hl, D: T.fill, S: T.k2 }, s), cardOn: PXK.art(PX_CARD, { K: T.k, F: T.acc, H: T.accS, D: T.fillOn, S: T.accD }, s),
    btn: PXK.art(PX_BTN, BN, s), btnH: PXK.art(PX_BTN, BH, s), btnD: PXK.art(PX_BTN_DOWN, BH, s),
    main: PXK.art(PX_BTN, BA, s), mainH: PXK.art(PX_BTN, BAH, s), mainD: PXK.art(PX_BTN_DOWN, BA, s),
    track: PXK.art(PX_TRACK, { K: T.k, D: T.k2, H: T.line }, s), knob: PXK.art(PX_KNOB, { K: T.k, W: T.accL, A: T.acc, B: T.accS, D: T.accD }, s),
    rail: PXK.art(PX_RAIL, { K: T.k, D: T.k2, H: T.line }, s), tile: PXK.art(T.tile, { x: T.bgDot, ':': T.bgDot2, '+': T.spark, '*': T.spark2 }, s) };
  const u = Object.fromEntries(Object.entries(img).map(([k, c]) => [k, url(c)]));
  const nine = (k, sl) => `border-style:solid;border-width:${sl * s}px;border-image:url(${u[k]}) ${sl * s} fill / ${sl * s}px stretch`;
  const IP = { k: T.k, w: T.text, a: T.acc, b: T.acc2, g: T.gold, o: T.orange, r: T.red, n: T.green, N: T.green2, m: T.muted, s: T.accS };
  const iconUrl = new Map(), icon = name => {
    let v = iconUrl.get(name); if (!v) { const c = PXK.art(PX_ICONS[name] || emblem, IP, s); v = { u: url(c), w: c.width, h: c.height }; iconUrl.set(name, v); }
    const b = document.createElement('b'); b.className = 'pxI'; b.setAttribute('aria-hidden', 'true'); b.style.cssText = `width:${v.w}px;height:${v.h}px;background-image:url(${v.u})`; return b;
  };
  const R = '.pxk.pxk';
  const css = document.createElement('style');
  css.textContent = `html,html body{background:${T.bg} url(${u.tile}) 0 0/${img.tile.width}px ${img.tile.height}px repeat!important}
::-webkit-scrollbar{width:16px;height:16px} ::-webkit-scrollbar-track{background:url(${u.rail}) 0 0/16px 8px repeat-y} ::-webkit-scrollbar-thumb{${nine('main', 4)}} ::-webkit-scrollbar-corner{background:none}
${R}{color:${T.text}}
${R} .px{box-shadow:none;background:none}
${R} .agHead{gap:18px;margin:0}
${R} .agHead .label{display:flex;align-items:center;gap:12px}
${R} .btn,${R} .tab{${nine('btn', 4)};height:auto;min-height:0;padding:0 6px 4px;margin:0;color:${T.text};font:12px/1 monospace;display:inline-flex;align-items:center;gap:6px;filter:none;text-shadow:none;letter-spacing:0;cursor:var(--cp,pointer)}
${R} .btn:hover,${R} .tab:hover{border-image-source:url(${u.btnH})}
${R} .btn:active,${R} .tab:active{border-image-source:url(${u.btnD});padding:4px 6px 0}
${R} .btn.main,${R} .tab.on{border-image-source:url(${u.main});color:${T.k}}
${R} .btn.main:hover,${R} .tab.on:hover{border-image-source:url(${u.mainH})}
${R} .btn.main:active,${R} .tab.on:active{border-image-source:url(${u.mainD})}
${R} .btn:focus-visible,${R} .tab:focus-visible{outline:2px dashed ${T.acc2};outline-offset:2px}
${R} .btn .pxV,${R} .tab .pxV{white-space:nowrap}
${R} .sysCard{${nine('card', 4)};padding:4px 6px;gap:8px;background:none}
${R} .sysCard.on{border-image-source:url(${u.cardOn})}
${R} .sysCard.on>b{color:${T.acc}}
${R} .sysCard>b{color:${T.text}}
${R} .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
${R} .gameBox,${R} .thBox{${nine('panel', 5)};box-shadow:none;background:none;padding:2px;gap:8px;grid-template-rows:auto auto}
${R} .gameBox canvas,${R} .thBox canvas{display:block;background:#05010b}
${R} .gameBox:fullscreen,${R} .thBox:fullscreen{border:0;padding:0;background:#000}
${R} .rhFs{position:static;opacity:1;justify-self:end;margin:0 6px 6px 0}
${R} .rhTabs{gap:8px;flex-wrap:wrap}
${R} .hint{color:${T.muted};line-height:24px}
${R} label{color:${T.muted};display:inline-flex;align-items:center;gap:8px}
${R} .rhDel{color:${T.red};top:6px;right:8px}
${R} input[type=range]{-webkit-appearance:none;appearance:none;background:none;height:20px;width:150px}
${R} input[type=range]::-webkit-slider-runnable-track{height:12px;${nine('track', 2)}}
${R} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:20px;border:0;background:url(${u.knob}) 0 0/100% 100%;margin-top:-8px;cursor:var(--cp,pointer)}
${R} .pxSel{justify-content:space-between;gap:10px;max-width:100%;overflow:hidden}
${R} .rhImport .pxSel{flex:1;min-width:0}
.pxMenu{position:fixed;z-index:50;${nine('card', 4)};padding:2px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;color:${T.text}}
.pxMenu button{all:unset;padding:3px 8px;cursor:var(--cp,pointer);white-space:nowrap}
.pxMenu button:hover,.pxMenu button:focus-visible,.pxMenu button.on{background:${T.btnHov};color:${T.text}}
.pxMenu button.on{color:${T.acc}}
.pxT{position:relative;white-space:normal;font:12px/1 monospace;letter-spacing:0;text-transform:none}
.pxT i{display:inline-block;vertical-align:middle;background:currentColor;-webkit-mask:var(--m) 0 0/100% 100% no-repeat;mask:var(--m) 0 0/100% 100% no-repeat;image-rendering:pixelated}
.pxI{display:inline-block;vertical-align:middle;background:0 0/100% 100% no-repeat;image-rendering:pixelated;margin-right:6px}
.pxV>.pxI+.pxI{margin-left:-4px}
.pxSr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;
  document.head.append(css);
  // un mot = une image (en masque : sa couleur suit celle du texte), une règle par mot pour ne pas répéter l'image
  const words = new Map(), sheet = document.head.appendChild(document.createElement('style')).sheet;
  const word = w => {
    let k = words.get(w);
    if (!k) { const c = PXK.sprite(w, '#fff', s); k = 'pw' + words.size; words.set(w, k); sheet.insertRule(`.${k}{--m:url(${c.toDataURL()});width:${c.width}px;height:${c.height}px}`, sheet.cssRules.length); }
    const i = document.createElement('i'); i.className = k; return i;
  };
  function render(vis, text, lead) {
    const parts = [], ic = lead && icons.find(([re]) => re.test(text.trim()));
    if (ic) parts.push(icon(ic[1]));
    for (const m of text.matchAll(/(★+)|(\s+)|([^\s★]+)/g)) {
      if (m[1]) for (const _ of m[1]) parts.push(icon('star'));
      else if (m[2]) parts.push(document.createTextNode(' '));
      else parts.push(word(m[3]));
    }
    vis.replaceChildren(...parts);
  }
  const lead = node => node.parentElement?.matches('button,label,.tab,.btn') && !node.previousSibling;
  function pixText(node) {  // le texte reste dans la page (lecteur d'écran, copier) ; on voit ses lettres en pixels
    const wrap = document.createElement('span'), sr = document.createElement('span'), vis = document.createElement('span');
    wrap.className = 'pxT'; sr.className = 'pxSr'; vis.className = 'pxV'; vis.setAttribute('aria-hidden', 'true');
    const first = lead(node); node.replaceWith(wrap); sr.append(node); wrap.append(sr, vis); render(vis, node.data, first);
  }
  function pxSelect(sel) {  // une liste déroulante en pixels ; la vraie reste cachée et garde sa valeur et ses événements
    sel.dataset.px = '1'; sel.style.display = 'none';
    const b = document.createElement('button'), lab = document.createElement('span'); b.type = 'button'; b.className = 'btn pxSel'; b.append(lab, icon('down')); sel.after(b);
    const sync = () => { const t = sel.selectedOptions[0]?.textContent || '—'; if (lab.dataset.t !== t) { lab.dataset.t = t; lab.textContent = t; } };
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(sel, 'value', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v); sync(); } });
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, characterData: true, attributes: true });
    sel.addEventListener('change', sync);
    b.onclick = () => {
      document.querySelector('.pxMenu')?.remove();
      const m = document.createElement('div'), r = b.getBoundingClientRect(); m.className = 'pxMenu'; m.setAttribute('role', 'listbox');
      for (const o of sel.options) {
        const it = document.createElement('button'); it.type = 'button'; it.textContent = o.textContent; it.className = o.selected ? 'on' : ''; it.setAttribute('role', 'option');
        it.onclick = () => { sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); close(); b.focus(); };
        m.append(it);
      }
      root.append(m);
      const below = innerHeight - r.bottom; m.style.minWidth = r.width + 'px'; m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 4) + 'px';
      m.style.top = (below > m.offsetHeight + 8 || below > r.top ? r.bottom + 2 : r.top - m.offsetHeight - 2) + 'px';
      const close = () => { m.remove(); removeEventListener('pointerdown', out, true); removeEventListener('keydown', key, true); removeEventListener('blur', close); };
      const out = e => { if (!m.contains(e.target) && e.target !== b && !b.contains(e.target)) close(); };
      const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); b.focus(); } };
      addEventListener('pointerdown', out, true); addEventListener('keydown', key, true); addEventListener('blur', close);
      (m.querySelector('.on') || m.firstChild)?.focus();
    };
    sync();
  }
  const SKIP = 'select,option,textarea,script,style,canvas,.pxT,[data-pxskip]';
  let queued = false;
  function pass() {
    queued = false;
    root.querySelectorAll('select.gSel:not([data-px])').forEach(pxSelect);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), todo = [];
    for (let n; (n = w.nextNode());) if (n.data.trim() && n.parentElement && !n.parentElement.closest(SKIP)) todo.push(n);
    todo.forEach(pixText);
  }
  new MutationObserver(ms => {
    for (const m of ms) if (m.type === 'characterData') { const wrap = m.target.parentNode?.closest?.('.pxT'); if (wrap) render(wrap.lastChild, m.target.data, false); }
    if (!queued) { queued = true; queueMicrotask(pass); }
  }).observe(root, { childList: true, subtree: true, characterData: true });
  // le titre : grosses lettres à contour, trois tons, et l'emblème du jeu
  const lab = root.querySelector('.agHead .label');
  if (lab) {
    const L = PXK.layout(title), c = document.createElement('canvas'), g = c.getContext('2d'), on = [];
    c.width = L.w + 3; c.height = PXK.H + 3;
    for (const [gl, ox] of L.items) for (const [x, y] of gl.px) on.push([ox + x + 1, y + 1]);
    g.fillStyle = T.k; for (const [x, y] of on) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [2, 2], [1, 2], [2, 1]]) g.fillRect(x + dx, y + dy, 1, 1);
    for (const [x, y] of on) { g.fillStyle = y <= 5 ? T.accL : y <= 7 ? T.acc : T.accS; g.fillRect(x, y, 1, 1); }
    const big = document.createElement('canvas'), z = 4; big.width = c.width * z; big.height = c.height * z;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
    const t = document.createElement('b'); t.className = 'pxI'; t.style.cssText = `width:${big.width}px;height:${big.height}px;background-image:url(${big.toDataURL()})`;
    const e = PXK.art(emblem, IP, 3), em = document.createElement('b'); em.className = 'pxI'; em.style.cssText = `width:${e.width}px;height:${e.height}px;background-image:url(${e.toDataURL()})`;
    const sr = document.createElement('span'); sr.className = 'pxSr'; sr.textContent = lab.textContent;
    lab.dataset.pxskip = '1'; lab.replaceChildren(em, t, sr);
  }
  pass();
}

export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  pxSkin(view.querySelector('.appWrap'), { title: "SUDOKU", T: {"k": "#050c06", "k2": "#0c1a0e", "fill": "#142a18", "fillOn": "#1c3a22", "hl": "#24482a", "line": "#3a6a40", "acc": "#3fe0ff", "accL": "#c8f8ff", "accS": "#1a9ac0", "accD": "#06304a", "rivet": "#c8f8ff", "btn": "#24482a", "btnHi": "#5a9a5a", "btnLo": "#0c1a0e", "btnHov": "#2a5430", "btnHovHi": "#7aba7a", "text": "#f0fff0", "muted": "#b0d0a8", "acc2": "#ff4fa8", "gold": "#ffd84a", "orange": "#ffa030", "red": "#ff4a5a", "green": "#7ee07a", "green2": "#2f8a3a", "bg": "#060e08", "bgDot": "#142a18", "bgDot2": "#0c1a0e", "spark": "#3a6a40", "spark2": "#ff4fa8", "tile": ["................", "...:............", "................", "..........+.....", "................", "................", ".....:..........", "................", "................", ".............:..", "................", "..+.............", "................", ".........:......", "................", "................"]},
  emblem: ["kkkkkkkkkkkk", "kwwwkwwwkwwk", "kwawkwwwkwwk", "kwwwkwwakwwk", "kkkkkkkkkkkk", "kwwwkawwkwwk", "kwwwkwwwkwak", "kkkkkkkkkkkk", "kwawkwwwkwwk", "kwwwkwwwkwwk", "kwwwkwakkwwk", "kkkkkkkkkkkk"],
  icons: [[/^NOUVELLE/, "play"], [/^TEMPS/, "clock"], [/^Notes/, "note"], [/^Indice/, "star"]] });
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
// les indices qui expliquent : on cherche le pas suivant comme un joueur, par la technique la plus simple qui marche
const SD_UNITS = [...Array(9).keys()].flatMap(k => [
  {n: 'la ligne ' + (k + 1), c: [...Array(9).keys()].map(j => k * 9 + j)}, {n: 'la colonne ' + (k + 1), c: [...Array(9).keys()].map(j => j * 9 + k)},
  {n: 'le carré ' + (k + 1), c: [...Array(9).keys()].map(j => (Math.floor(k / 3) * 3 + Math.floor(j / 3)) * 9 + k % 3 * 3 + j % 3)}]);
const sdBits = m => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => m & (1 << d));
function sdCands(g) { return g.map((v, i) => { if (v) return 0; let m = 1022; for (const u of SD_UNITS) if (u.c.includes(i)) for (const j of u.c) if (g[j]) m &= ~(1 << g[j]); return m; }); }
function sdSingle(g, cd) {  // une case trouvée sans rien éliminer de plus
  for (const u of SD_UNITS) { const e = u.c.filter(i => !g[i]); if (e.length === 1) return {i: e[0], v: sdBits(cd[e[0]])[0], tech: 'dernière', cells: u.c, text: 'Dernière case libre dans ' + u.n + ' : il ne manque que le ' + sdBits(cd[e[0]])[0] + '.'}; }
  for (let i = 0; i < 81; i++) if (!g[i] && sdBits(cd[i]).length === 1) { const v = sdBits(cd[i])[0]; return {i, v, tech: 'seul', cells: SD_UNITS.filter(u => u.c.includes(i)).flatMap(u => u.c), text: 'Cette case voit déjà tous les autres chiffres dans sa ligne, sa colonne et son carré : il ne reste que le ' + v + '.'}; }
  for (const u of SD_UNITS) for (let d = 1; d <= 9; d++) { const p = u.c.filter(i => cd[i] & (1 << d)); if (p.length === 1) return {i: p[0], v: d, tech: 'place', cells: u.c, text: 'Dans ' + u.n + ', le ' + d + ' ne peut aller qu’ici : les autres cases libres le voient déjà.'}; }
  return null;
}
function sdTech(g) {
  const cd = sdCands(g); let s = sdSingle(g, cd); if (s) return s;
  for (let round = 0; round < 12; round++) {
    let ev = null;
    for (const u of SD_UNITS) {  // paire nue : deux cases d'une zone qui ne peuvent être que les deux mêmes chiffres
      const e = u.c.filter(i => !g[i] && sdBits(cd[i]).length === 2);
      for (let a = 0; a < e.length && !ev; a++) for (let b = a + 1; b < e.length && !ev; b++) if (cd[e[a]] === cd[e[b]]) {
        const m = cd[e[a]], hit = u.c.filter(i => i !== e[a] && i !== e[b] && cd[i] & m); if (!hit.length) continue;
        hit.forEach(i => cd[i] &= ~m); const [x, y] = sdBits(m); ev = {cells: [e[a], e[b]], text: 'Paire nue dans ' + u.n + ' : ces deux cases ne peuvent être que ' + x + ' ou ' + y + ', donc aucune autre case de la zone ne peut les avoir.'};
      }
      if (ev) break;
    }
    if (!ev) for (const u of SD_UNITS.filter(u => u.n.startsWith('le carré'))) {  // le chiffre d'un carré coincé sur une ligne ou une colonne
      for (let d = 1; d <= 9 && !ev; d++) { const p = u.c.filter(i => cd[i] & (1 << d)); if (p.length < 2) continue;
        for (const L of SD_UNITS.filter(v => !v.n.startsWith('le carré') && p.every(i => v.c.includes(i)))) { const hit = L.c.filter(i => !u.c.includes(i) && cd[i] & (1 << d)); if (!hit.length) continue;
          hit.forEach(i => cd[i] &= ~(1 << d)); ev = {cells: p, text: 'Dans ' + u.n + ', le ' + d + ' est forcément sur ' + L.n + ' : on l’enlève du reste de ' + L.n + '.'}; break; } }
      if (ev) break;
    }
    if (!ev) return null;
    s = sdSingle(g, cd); if (s) return {...s, tech: 'technique', cells: [...ev.cells, s.i], text: ev.text + ' Ensuite : ' + s.text};
  }
  return null;
}
let sdHelp = null;  // l'indice expliqué en cours : {i, v, cells}
function sdNew() {
  const lvl = $('sdLevel').value, {puz, sol} = sdGenerate(SD_LEVELS[lvl]);
  games.sudoku = sd = {lvl, puz, sol, cur: puz.slice(), notes: Array(81).fill(0), secs: 0, mistakes: 0, hints: 0, done: false};
  sdSel = puz.indexOf(0); sdUndo = []; sdHelp = null; $('sdTip').textContent = ''; saveGames(); sdRender();
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
  if (sdHelp && !note) { sdHelp = null; $('sdTip').textContent = ''; }
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
    const cls = ['sdCell', sdHelp?.i === i ? 'hintT' : sdHelp?.cells.includes(i) ? 'hintC' : '', sd.puz[i] ? 'given' : 'user', i === sel ? 'sel' : (r === Math.floor(sel / 9) || c === sel % 9 || same) ? 'near' : '', v && v === sv ? 'same' : '', show && v && !sd.puz[i] && v !== sd.sol[i] ? 'wrong' : '', c % 3 === 2 && c < 8 ? 'br' : '', r % 3 === 2 && r < 8 ? 'bb' : ''];
    const d = el('button', cls.filter(Boolean).join(' '));
    if (v) d.textContent = v;
    else if (sd.notes[i]) { const n = el('div', 'sdNotes'); for (let k = 1; k <= 9; k++) n.append(el('span', sv === k ? 'hl' : '', sd.notes[i] & (1 << k) ? String(k) : '')); d.append(n); }
    d.onclick = () => { sdSel = i; sdRender(); };
    return d;
  }));
  $('sdPad').replaceChildren(...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => {
    const left = 9 - sd.cur.filter((v, i) => v === k && v === sd.sol[i]).length, b = el('button', 'btn sdKey' + (left ? '' : ' full'));
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
  // une case fausse d'abord ; un indice déjà expliqué : on pose le chiffre ; sinon on explique le pas suivant
  const bad = sd.cur.findIndex((v, k) => v && v !== sd.sol[k]);
  if (bad >= 0) { sdSel = bad; sdHelp = null; $('sdTip').textContent = 'Cette case est fausse : efface-la d’abord.'; return sdRender(); }
  if (sdHelp && !sd.cur[sdHelp.i]) { sdSel = sdHelp.i; const v = sdHelp.v; sdHelp = null; $('sdTip').textContent = ''; return sdSet(v, false); }
  const t = sdTech(sd.cur); sd.hints++;
  if (t) { sdHelp = t; sdSel = t.i; $('sdTip').textContent = t.text + ' (Indice encore une fois pour le poser.)'; }
  else { const i = sd.cur.findIndex((v, k) => !v); if (i < 0) return; sdHelp = {i, v: sd.sol[i], cells: []}; sdSel = i; $('sdTip').textContent = 'Il faut ici une technique plus avancée. La case en vert vaut ' + sd.sol[i] + ' (Indice encore une fois pour la poser).'; }
  saveGames(); sdRender();
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
{
  const g = [...'530070000600195000098000060800060003400803001700020006060000280000419005000080079'].map(Number), seen = new Set(); let ok = true, n = 0;
  for (let t; (t = sdTech(g)); n++) { g[t.i] = t.v; seen.add(t.tech); if (sdSolve(g.slice()) !== 1) { ok = false; break; } }
  const pair = Array(81).fill(0); [1, 2, 3, 4, 5, 6, 7].forEach((d, k) => pair[2 + k] = d);  // ligne 1 : 1 à 7 posés ; restent 8 et 9 pour deux cases
  const cp = sdCands(pair); const pairOk = sdBits(cp[0]).join() === '8,9' && sdBits(cp[1]).join() === '8,9';
  const res = ok && n === 51 && !g.includes(0) && seen.has('dernière') && pairOk ? 'ok' : 'raté ' + [ok, n, [...seen]].join(' ');
  $('sdGrid').dataset.techcheck = res; console.assert(res === 'ok', 'sudoku indices', res);
}
$('sdGrid').__sd = {tech: () => sdTech(sd.cur), help: () => sdHelp, st: () => sd, sel: i => { sdSel = i; sdRender(); }, set: (v, n) => sdSet(v, n)};  // pour le test « local »
  // ---- fin ----
  ctx.onOpen(() => { sd ? sdRender() : sdOpen(); });
}

// lancé par le test « local » de NeoDex : remplit une case juste et une fausse, pose une note, demande un indice,
// puis vérifie que la grille tient dans la fenêtre et grandit avec elle
module.exports = async ({ pj, sleep }) => {
  const S = js => pj(`(() => { const T = document.getElementById('sdGrid').__sd; ${js} })()`);
  await pj(`window.__e = []; addEventListener('error', e => __e.push(e.message)); 0`);
  await sleep(800);
  await pj(`document.getElementById('sdNew').click(), 0`); await sleep(1500);
  const r = await S(`const s = T.st(), i = s.puz.indexOf(0), j = s.puz.indexOf(0, i + 1), k = s.puz.indexOf(0, j + 1);
    T.sel(i); T.set(s.sol[i], false); T.sel(j); T.set(s.sol[j] % 9 + 1, false); T.sel(k); T.set(3, true); T.set(7, true);
    return [s.cur[i] === s.sol[i], document.querySelectorAll('.sdCell.wrong').length, s.notes[k] === ((1 << 3) | (1 << 7)), document.querySelectorAll('.sdCell').length].join(',');`);
  if (r !== 'true,1,true,81') throw new Error('remplir, erreur, notes : ' + r);
  // l'indice qui explique : on efface la case fausse, un clic montre la technique (texte et cases en vert), un second pose le chiffre
  const tc = await pj(`document.getElementById('sdGrid').dataset.techcheck`); if (tc !== 'ok') throw new Error('indices : ' + tc);
  await S(`const s = T.st(); s.cur.forEach((v, k) => { if (v && v !== s.sol[k]) { T.sel(k); document.getElementById('sdErase').click(); } }); return 0;`);
  const t1 = await S(`const s = T.st(); document.getElementById('sdHint').click(); const h = T.help(); return h ? [h.i, s.cur[h.i], document.querySelectorAll('.sdCell.hintT').length, document.getElementById('sdTip').textContent].join('|') : 'rien';`);
  const [hi, hv0, hn, tip] = t1.split('|'); if (hv0 !== '0' || hn !== '1' || tip.length < 30) throw new Error('indice expliqué : ' + t1);
  await sleep(300); if (process.env.NEO_SHOTS) { /* image de la page entière par le test local */ }
  const t2 = await S(`const s = T.st(); document.getElementById('sdHint').click(); return s.cur[${hi}] === s.sol[${hi}] && !T.help() && !document.getElementById('sdTip').textContent;`);
  if (!t2) throw new Error('le second clic devait poser le chiffre');
  await pj(`document.querySelector('.sdCell.user:not(.wrong)')?.click(), 0`); await sleep(300);
  const L = await pj(`(() => { const r = document.getElementById('sdGrid').getBoundingClientRect(), c = document.querySelector('.sdCell').getBoundingClientRect(); let s = 0; for (let e = document.getElementById('sdGrid').parentElement; e; e = e.parentElement) s += e.scrollTop; return { bottom: Math.round(r.bottom + s), h: Math.round(r.height), cell: Math.round(c.width), wh: innerHeight, ww: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  if (L.bottom > L.wh + 1 || L.sw > L.ww + 1 || L.h < 300) throw new Error('la grille dépasse la fenêtre ou reste petite : ' + JSON.stringify(L));
  const errs = await pj(`window.__e.join(' | ')`); if (errs) throw new Error('erreur : ' + errs);
  return 'remplir, erreur, notes, indice expliqué (« ' + tip.slice(0, 60) + '… ») · cases de ' + L.cell + ' px dans ' + L.ww + '×' + L.wh;
};

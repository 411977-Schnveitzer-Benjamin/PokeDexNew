/**
 * Pokédex Nacional - Página de detalle de cada Pokémon (#/pokemon/:uid)
 * Habilidades, datos, stats + calculadora, matchups de tipos, evolución y movimientos.
 */
(function () {
  'use strict';
  const { $, pad, esc, TYPE_COLORS, TYPE_NAMES, GENERATIONS, STAT_KEYS, STAT_LABELS, NATURES } = PKX;
  const S = PKX.state;
  const detail = (PKX.detail = {});
  const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

  let current = null;
  let shinyView = false;

  // ---------- Carga perezosa de movimientos ----------
  let movesPromise = null;
  function loadMoves() {
    if (window.MOVES) return Promise.resolve();
    if (!movesPromise) {
      movesPromise = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'moves-data.js';
        s.onload = res;
        s.onerror = () => { movesPromise = null; rej(new Error('No se pudo cargar moves-data.js')); };
        document.head.appendChild(s);
      });
    }
    return movesPromise;
  }

  const CLASS_INFO = [
    { n: 'Físico', c: '#e8452c', i: '💥' },
    { n: 'Especial', c: '#3b82f6', i: '🌀' },
    { n: 'Estado', c: '#94a3b8', i: '✨' }
  ];

  function formLabel(p) {
    if (!p.isMega) return 'Normal';
    const suffix = p.name.replace('Mega-' + p.base.name, '').trim();
    return 'Mega' + (suffix ? ' ' + suffix : '');
  }

  // ---------- Secciones ----------
  function statsSection(p) {
    const rows = STAT_KEYS.map((k, i) => {
      const v = p.stats[k];
      const pct = Math.min(100, Math.round((v / 200) * 100));
      let c = '#ef4444';
      if (v >= 100) c = '#22c55e'; else if (v >= 70) c = '#eab308'; else if (v >= 45) c = '#f97316';
      const min = PKX.calcStat(v, 0, 0, 100, 0.9, i === 0);
      const max = PKX.calcStat(v, 31, 252, 100, 1.1, i === 0);
      return `
      <div class="stat-row2">
        <span class="stat-name">${STAT_LABELS[i]}</span>
        <span class="stat-number">${v}</span>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:${c};"></div></div>
        <span class="stat-minmax">${min}</span><span class="stat-minmax">${max}</span>
      </div>`;
    }).join('');
    return `
    <section class="d-card">
      <h3 class="d-title"><span>Estadísticas base</span><span class="total-bst-badge">Total: ${p.stats.total}</span></h3>
      <div class="stat-row2 head"><span></span><span></span><span></span><span class="stat-minmax">Mín. Nv.100</span><span class="stat-minmax">Máx. Nv.100</span></div>
      ${rows}
    </section>`;
  }

  function abilitiesSection(p) {
    const items = p.abilities.map(a => {
      const info = PKX.abilityInfo(a.slug);
      return `
      <div class="ability-item ${a.hidden ? 'hidden-ability' : ''}">
        <div class="ability-head">
          <strong>${info.n}</strong>
          <span class="ability-badge ${a.hidden ? 'hid' : ''}">${a.hidden ? 'Oculta' : 'Normal'}</span>
        </div>
        <p>${esc(info.d || 'Sin descripción.')}${info.e ? ' <em class="en-note">(en inglés)</em>' : ''}</p>
      </div>`;
    }).join('');
    return `<section class="d-card"><h3 class="d-title"><span>Habilidades</span></h3>${items}</section>`;
  }

  function dataSection(p) {
    const x = PKX.info(p);
    const kind = PKX.kind(p);
    const gr = x.gr;
    let gender = 'Sin género';
    if (gr !== undefined && gr >= 0) {
      const f = gr * 12.5;
      gender = `<div class="gender-bar"><span class="gm" style="width:${100 - f}%"></span><span class="gf" style="width:${f}%"></span></div>
        <small>♂ ${100 - f}% · ♀ ${f}%</small>`;
    }
    const ev = (p.base.ev || []).map((v, i) => (v ? `+${v} ${STAT_LABELS[i]}` : '')).filter(Boolean).join(', ') || '—';
    const catchPct = x.cr ? ((x.cr / 3 / 255) * 100).toFixed(1) : null;
    const row = (k, v) => `<div class="data-row"><span>${k}</span><div>${v}</div></div>`;
    return `
    <section class="d-card">
      <h3 class="d-title"><span>Datos</span></h3>
      <div class="data-list">
        ${row('Altura', `${p.height.toFixed(1)} m`)}
        ${row('Peso', `${p.weight.toFixed(1)} kg`)}
        ${row('Categoría', PKX.KINDS[kind] || 'Normal')}
        ${x.cr !== undefined ? row('Ratio de captura', `${x.cr} <small>(≈ ${catchPct}% con Poké Ball a PS máx.)</small>`) : ''}
        ${row('Género', gender)}
        ${x.eg ? row('Grupos huevo', x.eg.map(g => `<span class="egg-chip">${g}</span>`).join('')) : ''}
        ${x.hc !== undefined ? row('Eclosión', `${x.hc} ciclos <small>(≈ ${(x.hc * 257).toLocaleString('es')} pasos)</small>`) : ''}
        ${x.bh !== undefined ? row('Amistad base', x.bh) : ''}
        ${x.gw ? row('Crecimiento', x.gw) : ''}
        ${row('Exp. base', p.baseExp || p.base.baseExp || '—')}
        ${row('EVs que otorga', ev)}
      </div>
    </section>`;
  }

  function calcSection(p) {
    return `
    <section class="d-card calc-card" id="calc-card">
      <h3 class="d-title"><span>Calculadora de estadísticas</span></h3>
      <div class="calc-top">
        <label>Nivel <input type="number" id="calc-level" min="1" max="100" value="50"></label>
        <label>Naturaleza
          <select id="calc-nature">${NATURES.map((n, i) => {
            const plus = n[1] >= 0 ? `+${PKX.STAT_SHORT[n[1]]} −${PKX.STAT_SHORT[n[2]]}` : 'neutra';
            return `<option value="${i}">${n[0]} (${plus})</option>`;
          }).join('')}</select>
        </label>
        <div class="calc-presets">
          <button type="button" data-preset="iv31">IVs 31</button>
          <button type="button" data-preset="iv0">IVs 0</button>
          <button type="button" data-preset="ev0">EVs 0</button>
          <button type="button" data-preset="ev85">EVs 85 c/u</button>
        </div>
      </div>
      <div class="calc-grid">
        <div class="calc-head"><span>Stat</span><span>Base</span><span>IV</span><span>EV</span><span>Resultado</span></div>
        ${STAT_KEYS.map((k, i) => `
        <div class="calc-row" data-i="${i}">
          <span class="stat-name">${STAT_LABELS[i]}</span>
          <span class="calc-base">${p.stats[k]}</span>
          <input type="number" class="calc-iv" min="0" max="31" value="31" aria-label="IV ${STAT_LABELS[i]}">
          <input type="number" class="calc-ev" min="0" max="252" value="0" aria-label="EV ${STAT_LABELS[i]}">
          <strong class="calc-res">—</strong>
        </div>`).join('')}
      </div>
      <div class="calc-foot" id="calc-foot"></div>
    </section>`;
  }

  function matchupSection(p) {
    const def = PKX.defense(p.types);
    const cells = PKX.TYPES.map(t => {
      const m = def[t];
      const cls = m === 0 ? 'm0' : m === 0.25 ? 'm025' : m === 0.5 ? 'm05' : m === 2 ? 'm2' : m === 4 ? 'm4' : 'm1';
      return `<div class="mu-cell"><span class="mu-type" style="background:${TYPE_COLORS[t]}" title="${TYPE_NAMES[t]}">${TYPE_NAMES[t].slice(0, 3).toUpperCase()}</span><span class="mu-val ${cls}">${m === 1 ? '' : PKX.fmtMult(m)}</span></div>`;
    }).join('');
    return `
    <section class="d-card">
      <h3 class="d-title"><span>Efectividad de tipos (defensa)</span></h3>
      <div class="mu-grid">${cells}</div>
      <div class="mu-legend"><span class="mu-val m4">4</span><span class="mu-val m2">2</span><span class="mu-val m05">½</span><span class="mu-val m025">¼</span><span class="mu-val m0">0</span> daño recibido por tipo atacante</div>
    </section>`;
  }

  function evoSection(p) {
    const ch = p.base.x && window.EVO_CHAINS && window.EVO_CHAINS[p.base.x.ch];
    if (!ch) return '';
    if (!ch.c.length) {
      return `<section class="d-card"><h3 class="d-title"><span>Cadena evolutiva</span></h3><p class="muted">${p.base.name} no tiene evoluciones ni preevoluciones.</p></section>`;
    }
    function node(n) {
      const sp = PKX.SPECIES[n.s];
      if (!sp) return '';
      const me = n.s === p.id;
      const self = `
        <a class="evo-node ${me ? 'current' : ''}" href="#/pokemon/${sp.uid}" style="--c:${TYPE_COLORS[sp.types[0]]}">
          <img src="${sp.sprite}" alt="${sp.name}" loading="lazy" onerror="this.style.visibility='hidden'">
          <span class="evo-name">${sp.name}</span>
          <span class="evo-id">${pad(sp.id)}</span>
          <span class="evo-types">${sp.types.map(t => `<i style="background:${TYPE_COLORS[t]}" title="${TYPE_NAMES[t]}"></i>`).join('')}</span>
        </a>`;
      if (!n.c.length) return `<div class="evo-branch">${self}</div>`;
      const kids = n.c.map(c => `
        <div class="evo-link">
          <div class="evo-arrow"><span>${esc(c.e || '—')}</span><b>→</b></div>
          ${node(c)}
        </div>`).join('');
      return `<div class="evo-branch">${self}<div class="evo-kids">${kids}</div></div>`;
    }
    return `<section class="d-card"><h3 class="d-title"><span>Cadena evolutiva</span></h3><div class="evo-tree">${node(ch)}</div></section>`;
  }

  function movesShell(p) {
    return `
    <section class="d-card moves-card" id="moves-card">
      <h3 class="d-title"><span>Movimientos</span><span class="muted small" id="moves-source"></span></h3>
      <div id="moves-body"><p class="muted">Cargando movimientos…</p></div>
    </section>`;
  }

  function renderMoves(p) {
    const body = $('moves-body');
    if (!body) return;
    const ls = window.LEARNSETS[p.uid] || window.LEARNSETS[p.id];
    if (!ls) { body.innerHTML = '<p class="muted">No hay datos de movimientos para esta forma.</p>'; return; }
    $('moves-source').textContent = 'Según ' + (window.VG_NAMES[ls.vg] || ls.vg);

    const tabs = [
      ['l', 'Por nivel', ls.l.map(([id, lv]) => ({ id, lv }))],
      ['m', 'MT/MO', ls.m.map(id => ({ id, lv: 0 }))],
      ['e', 'Huevo', ls.e.map(id => ({ id, lv: 0 }))],
      ['t', 'Tutor', ls.t.map(id => ({ id, lv: 0 }))]
    ].map(([k, n, arr]) => [k, n, arr.filter(m => window.MOVES[m.id])]).filter(t => t[2].length);

    if (!tabs.length) { body.innerHTML = '<p class="muted">Sin movimientos registrados.</p>'; return; }

    let tab = tabs[0][0], query = '', sortKey = 'lv', sortDir = 1;

    body.innerHTML = `
      <div class="moves-toolbar">
        <div class="moves-tabs" id="moves-tabs">${tabs.map(([k, n, a]) => `<button data-t="${k}" class="${k === tab ? 'active' : ''}">${n} <span>${a.length}</span></button>`).join('')}</div>
        <input type="search" id="moves-search" placeholder="Buscar movimiento o tipo…">
      </div>
      <div class="moves-table-wrap"><table class="moves-table"><thead id="moves-head"></thead><tbody id="moves-rows"></tbody></table></div>`;

    function draw() {
      const arr = tabs.find(t => t[0] === tab)[2];
      const q = PKX.norm(query);
      let rows = arr.filter(m => {
        const mv = window.MOVES[m.id];
        return !q || PKX.norm(mv.n).includes(q) || PKX.norm(TYPE_NAMES[mv.t]).includes(q);
      });
      const val = m => {
        const mv = window.MOVES[m.id];
        if (sortKey === 'lv') return m.lv;
        if (sortKey === 'n') return mv.n;
        if (sortKey === 't') return TYPE_NAMES[mv.t];
        if (sortKey === 'c') return mv.c;
        return mv[sortKey] == null ? -1 : mv[sortKey];
      };
      rows = rows.slice().sort((a, b) => {
        const x = val(a), y = val(b);
        const c = typeof x === 'string' ? x.localeCompare(y, 'es') : x - y;
        return c * sortDir || window.MOVES[a.id].n.localeCompare(window.MOVES[b.id].n, 'es');
      });
      const cols = [['lv', tab === 'l' ? 'Nv.' : ''], ['n', 'Movimiento'], ['t', 'Tipo'], ['c', 'Cat.'], ['p', 'Poder'], ['a', 'Prec.'], ['pp', 'PP']];
      $('moves-head').innerHTML = '<tr>' + cols.map(([k, l]) => (k === 'lv' && tab !== 'l' ? '' : `<th class="sortable ${k === sortKey ? 'sorted' : ''}" data-k="${k}">${l}<i>${k === sortKey ? (sortDir > 0 ? '▲' : '▼') : ''}</i></th>`)).join('') + '</tr>';
      $('moves-rows').innerHTML = rows.map(m => {
        const mv = window.MOVES[m.id];
        const ci = CLASS_INFO[mv.c];
        return `
        <tr class="move-row" data-id="${m.id}">
          ${tab === 'l' ? `<td class="num">${m.lv || '—'}</td>` : ''}
          <td class="mv-name">${mv.n}</td>
          <td>${PKX.typePill(mv.t)}</td>
          <td><span class="cls-chip" style="--c:${ci.c}" title="${ci.n}">${ci.i} ${ci.n}</span></td>
          <td class="num">${mv.p == null ? '—' : mv.p}</td>
          <td class="num">${mv.a == null ? '—' : mv.a + '%'}</td>
          <td class="num">${mv.pp == null ? '—' : mv.pp}</td>
        </tr>
        <tr class="move-desc" hidden><td colspan="${tab === 'l' ? 7 : 6}">${esc(mv.d || 'Sin descripción.')}</td></tr>`;
      }).join('') || `<tr><td colspan="7" class="muted">Sin resultados.</td></tr>`;
    }
    draw();

    $('moves-tabs').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      tab = b.dataset.t;
      sortKey = tab === 'l' ? 'lv' : 'n'; sortDir = 1;
      $('moves-tabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
    $('moves-search').addEventListener('input', e => { query = e.target.value; draw(); });
    $('moves-head').addEventListener('click', e => {
      const th = e.target.closest('th.sortable');
      if (!th) return;
      const k = th.dataset.k;
      if (k === sortKey) sortDir *= -1; else { sortKey = k; sortDir = k === 'p' || k === 'a' || k === 'pp' ? -1 : 1; }
      draw();
    });
    $('moves-rows').addEventListener('click', e => {
      const tr = e.target.closest('.move-row');
      if (tr && tr.nextElementSibling) tr.nextElementSibling.hidden = !tr.nextElementSibling.hidden;
    });
  }

  // ---------- Calculadora ----------
  function initCalc(p) {
    const card = $('calc-card');
    if (!card) return;
    const lvl = $('calc-level'), nat = $('calc-nature'), foot = $('calc-foot');
    const rows = [...card.querySelectorAll('.calc-row')];
    function clamp(el, max) { let v = parseInt(el.value, 10); if (isNaN(v)) v = 0; v = Math.max(0, Math.min(max, v)); return v; }
    function calc() {
      const L = Math.max(1, Math.min(100, parseInt(lvl.value, 10) || 1));
      const n = NATURES[+nat.value];
      let evTotal = 0;
      rows.forEach((r, i) => {
        const iv = clamp(r.querySelector('.calc-iv'), 31);
        const ev = clamp(r.querySelector('.calc-ev'), 252);
        evTotal += ev;
        const mult = i === n[1] ? 1.1 : i === n[2] ? 0.9 : 1;
        const res = PKX.calcStat(p.stats[STAT_KEYS[i]], iv, ev, L, mult, i === 0);
        const out = r.querySelector('.calc-res');
        out.textContent = res;
        out.className = 'calc-res' + (i === n[1] ? ' up' : i === n[2] ? ' down' : '');
        r.querySelector('.stat-name').innerHTML = STAT_LABELS[i] + (i === n[1] ? ' <b class="up">▲</b>' : i === n[2] ? ' <b class="down">▼</b>' : '');
      });
      foot.innerHTML = `EVs totales: <strong class="${evTotal > 510 ? 'over' : ''}">${evTotal}/510</strong>${evTotal > 510 ? ' · supera el máximo permitido' : ''}`;
    }
    card.addEventListener('input', calc);
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-preset]');
      if (!b) return;
      const pr = b.dataset.preset;
      rows.forEach(r => {
        if (pr === 'iv31') r.querySelector('.calc-iv').value = 31;
        if (pr === 'iv0') r.querySelector('.calc-iv').value = 0;
        if (pr === 'ev0') r.querySelector('.calc-ev').value = 0;
        if (pr === 'ev85') r.querySelector('.calc-ev').value = 85;
      });
      calc();
    });
    calc();
  }

  // ---------- Render principal ----------
  detail.show = function (uid) {
    const root = $('view-detail');
    const p = PKX.BY_UID[uid];
    if (!p) {
      root.innerHTML = `<div class="d-card"><h2>Pokémon no encontrado</h2><p class="muted">El Pokémon solicitado no existe.</p><a class="btn-primary inline" href="#/">Volver a la Pokédex</a></div>`;
      return;
    }
    current = p;
    shinyView = S.shiny;
    const color = TYPE_COLORS[p.types[0]] || '#3b4cca';
    const i = PKX.ORDERED.indexOf(p);
    const prev = PKX.ORDERED[(i - 1 + PKX.ORDERED.length) % PKX.ORDERED.length];
    const next = PKX.ORDERED[(i + 1) % PKX.ORDERED.length];
    const g = GENERATIONS[p.gen];
    const forms = PKX.formsOf(p);
    const kind = PKX.kind(p);
    const tags = (p.isMega ? `<span class="mega-tag">⚡ MEGA</span>${p.isZA ? '<span class="mega-tag za">Z-A</span>' : ''}` : '') +
      (kind ? `<span class="kind-tag kind-${kind}">${PKX.KINDS[kind]}</span>` : '');
    const descEn = !p.isMega && p.base.x && p.base.x.de;

    root.style.setProperty('--d-color', color);
    root.style.setProperty('--d-glow', color + '55');
    root.style.setProperty('--d-light', color + '33');

    root.innerHTML = `
    <div class="detail-bar">
      <button class="back-btn" id="d-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> Volver</button>
      <div class="detail-nav">
        <a href="#/pokemon/${prev.uid}" title="Anterior" class="nav-arrow-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg><span>${pad(prev.id)}${prev.isMega ? ' M' : ''}</span></a>
        <a href="#/pokemon/${next.uid}" title="Siguiente" class="nav-arrow-btn"><span>${pad(next.id)}${next.isMega ? ' M' : ''}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
      </div>
    </div>

    <section class="d-hero">
      <div class="d-hero-art">
        <div class="d-halo"></div>
        <img id="d-img" src="${PKX.artworkOf(p, shinyView)}" alt="${p.name}" onerror="this.onerror=null;this.src='${p.sprite}'">
        <button id="d-shiny" class="shiny-toggle-btn ${shinyView ? 'active' : ''}">✨ ${shinyView ? 'Shiny activo' : 'Ver Shiny'}</button>
      </div>
      <div class="d-hero-info">
        <span class="modal-id-badge">${pad(p.id)} · Gen ${g.roman} · ${g.region}</span>
        <h2 class="modal-name-title">${p.name}</h2>
        <span class="modal-genus-tag">${p.category}</span>
        ${tags ? `<div class="modal-tags">${tags}</div>` : ''}
        <div class="modal-types-list">${p.types.map(t => PKX.typePill(t, true)).join('')}</div>
        ${forms.length > 1 ? `<div class="form-tabs">${forms.map(f => `<a href="#/pokemon/${f.uid}" class="${f.uid === p.uid ? 'active' : ''}">${formLabel(f)}</a>`).join('')}</div>` : ''}
        <div class="d-actions">
          <button class="d-btn" id="d-cry"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>Grito</button>
          <button class="d-btn ${S.favorites.has(p.uid) ? 'on-fav' : ''}" id="d-fav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>${S.favorites.has(p.uid) ? 'Favorito' : 'Favorito'}</span></button>
          <button class="d-btn ${S.compare.includes(p.uid) ? 'on-cmp' : ''}" id="d-cmp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Comparar</button>
          <button class="d-btn ${S.team.includes(p.uid) ? 'on-team' : ''}" id="d-team"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Al equipo</button>
          <button class="d-btn" id="d-share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Compartir</button>
        </div>
      </div>
    </section>

    <section class="d-card d-desc">
      <p>"${esc(PKX.descriptionOf(p))}"</p>
      ${descEn ? '<span class="en-note">Esta descripción solo está disponible en inglés en PokéAPI.</span>' : ''}
    </section>

    <div class="detail-grid">
      <div class="detail-col">${statsSection(p)}${calcSection(p)}</div>
      <div class="detail-col">${abilitiesSection(p)}${dataSection(p)}</div>
    </div>
    ${matchupSection(p)}
    ${evoSection(p)}
    ${movesShell(p)}`;

    // Eventos
    $('d-back').addEventListener('click', () => PKX.back());
    $('d-cry').addEventListener('click', e => PKX.playCry(p.uid, e.currentTarget));
    $('d-fav').addEventListener('click', () => PKX.toggleFav(p.uid));
    $('d-cmp').addEventListener('click', () => PKX.toggleCompare(p.uid));
    $('d-team').addEventListener('click', () => PKX.teamAdd(p.uid));
    $('d-share').addEventListener('click', () => {
      const url = location.origin + location.pathname + '#/pokemon/' + p.uid;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
        () => PKX.toast('Enlace copiado al portapapeles'),
        () => PKX.toast(url));
    });
    $('d-shiny').addEventListener('click', e => {
      shinyView = !shinyView;
      $('d-img').src = PKX.artworkOf(p, shinyView);
      e.currentTarget.classList.toggle('active', shinyView);
      e.currentTarget.textContent = shinyView ? '✨ Shiny activo' : '✨ Ver Shiny';
    });
    initCalc(p);
    loadMoves().then(() => { if (current === p) renderMoves(p); })
      .catch(() => { const b = $('moves-body'); if (b) b.innerHTML = '<p class="muted">No se pudieron cargar los movimientos.</p>'; });

    // Estado de botones al cambiar favoritos/comparador/equipo
    detail.syncButtons = () => {
      if (current !== p) return;
      $('d-fav') && $('d-fav').classList.toggle('on-fav', S.favorites.has(p.uid));
      $('d-cmp') && $('d-cmp').classList.toggle('on-cmp', S.compare.includes(p.uid));
      $('d-team') && $('d-team').classList.toggle('on-team', S.team.includes(p.uid));
    };
  };

  PKX.onChange(() => detail.syncButtons && detail.syncButtons());

  // Flechas del teclado para recorrer Pokémon
  window.addEventListener('keydown', e => {
    if ($('view-detail').hidden || !current) return;
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const i = PKX.ORDERED.indexOf(current);
    if (e.key === 'ArrowLeft') location.hash = '#/pokemon/' + PKX.ORDERED[(i - 1 + PKX.ORDERED.length) % PKX.ORDERED.length].uid;
    if (e.key === 'ArrowRight') location.hash = '#/pokemon/' + PKX.ORDERED[(i + 1) % PKX.ORDERED.length].uid;
  });
})();

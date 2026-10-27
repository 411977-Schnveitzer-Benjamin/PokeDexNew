/**
 * Pokédex Nacional - Vista de inicio: generaciones, búsqueda, filtros (básicos y avanzados),
 * tarjetas y tabla ordenable.
 */
(function () {
  'use strict';
  const { $, pad, norm, TYPE_COLORS, TYPE_NAMES, GENERATIONS, STAT_KEYS } = PKX;
  const S = PKX.state;

  const home = (PKX.home = {});

  // ---------- Estado de la vista ----------
  const st = {
    gen: 1, // 0 = todas
    showMegas: true,
    query: '',
    type: null,
    onlyFav: false,
    sortBy: 'id-asc',
    view: 'cards',
    adv: { ability: '', kind: '', dual: '', form: '', ranges: {} }
  };
  home.state = st;
  let lastShiny = S.shiny;

  const RANGE_FIELDS = [
    ['hp', 'PS', 255], ['attack', 'Ataque', 255], ['defense', 'Defensa', 255],
    ['spAttack', 'Atq. Esp.', 255], ['spDefense', 'Def. Esp.', 255], ['speed', 'Velocidad', 255], ['total', 'Total (BST)', 800]
  ];

  const el = {
    grid: $('pokemon-grid'), tableWrap: $('pokemon-table-wrap'),
    search: $('search-input'), clear: $('clear-search-btn'),
    chips: $('type-chips-container'), genButtons: $('gen-buttons'),
    favBtn: $('favorites-toggle-btn'), favBadge: $('fav-counter-badge'),
    megaBtn: $('mega-toggle-btn'), megaBadge: $('mega-counter-badge'),
    advBtn: $('adv-toggle-btn'), advBadge: $('adv-counter-badge'), advPanel: $('adv-panel'),
    random: $('random-pokemon-btn'), sort: $('sort-select'),
    visible: $('visible-count'), total: $('gen-total-count'), genLabel: $('results-gen-label'),
    regionBadge: $('region-badge-text'), totalBadge: $('total-badge-text'),
    reset: $('reset-filters-btn'), empty: $('empty-state'), emptyReset: $('empty-reset-btn'),
    viewCards: $('view-cards-btn'), viewTable: $('view-table-btn')
  };

  // ---------- Filtros ----------
  function abilitySlugSet() {
    const q = norm(st.adv.ability.trim());
    if (!q) return null;
    const set = new Set();
    Object.entries(window.ABILITIES || {}).forEach(([slug, a]) => { if (norm(a.n).includes(q) || slug.includes(q)) set.add(slug); });
    return set;
  }

  function forceMegas() { return st.adv.form === 'mega' || st.adv.form === 'za'; }

  function genPool(gen) {
    const megas = st.showMegas || forceMegas();
    return PKX.ALL.filter(p => (gen === 0 || p.gen === gen) && (megas || !p.isMega));
  }

  function advCount() {
    const a = st.adv;
    let n = 0;
    if (a.ability.trim()) n++;
    if (a.kind) n++;
    if (a.dual) n++;
    if (a.form) n++;
    Object.values(a.ranges).forEach(r => { if (r && (r[0] !== '' || r[1] !== '')) n++; });
    return n;
  }

  function getFiltered() {
    let r = genPool(st.gen);

    if (st.query) {
      const q = norm(st.query.replace('#', ''));
      r = r.filter(p =>
        p.search.includes(q) || String(p.id) === q || String(p.id).padStart(3, '0').includes(q) ||
        (q === 'mega' && p.isMega) || (q === 'za' && p.isZA));
    }
    if (st.type) r = r.filter(p => p.types.includes(st.type));
    if (st.onlyFav) r = r.filter(p => S.favorites.has(p.uid));

    const a = st.adv;
    const slugs = abilitySlugSet();
    if (slugs) r = r.filter(p => p.abilities.some(x => slugs.has(x.slug)));
    if (a.kind) {
      r = r.filter(p => {
        const k = PKX.kind(p);
        return a.kind === 'L' ? k === 3 || k === 4 : k === +a.kind;
      });
    }
    if (a.dual) r = r.filter(p => p.types.length === +a.dual);
    if (a.form === 'base') r = r.filter(p => !p.isMega);
    if (a.form === 'mega') r = r.filter(p => p.isMega);
    if (a.form === 'za') r = r.filter(p => p.isZA);
    Object.entries(a.ranges).forEach(([key, rg]) => {
      if (!rg) return;
      const min = rg[0] === '' ? -Infinity : +rg[0];
      const max = rg[1] === '' ? Infinity : +rg[1];
      if (min === -Infinity && max === Infinity) return;
      r = r.filter(p => p.stats[key] >= min && p.stats[key] <= max);
    });

    const [key, dir] = st.sortBy.split('-');
    const mul = dir === 'desc' ? -1 : 1;
    r.sort((x, y) => {
      let c;
      if (key === 'id') c = x.order - y.order;
      else if (key === 'name') c = x.name.localeCompare(y.name, 'es');
      else c = x.stats[key] - y.stats[key];
      return c * mul || x.order - y.order;
    });
    return r;
  }

  // ---------- Generaciones y tipos ----------
  function renderGenButtons() {
    let html = `
      <button class="gen-btn ${st.gen === 0 ? 'active' : ''}" data-gen="0" style="--gen-c1:#3b4cca;--gen-c2:#1f2a80;--gen-glow:rgba(59,76,202,0.45)">
        <span class="gen-roman">TODAS</span><span class="gen-region">Nacional</span><span class="gen-count">${genPool(0).length} Pokémon</span>
      </button>`;
    Object.entries(GENERATIONS).forEach(([g, i]) => {
      html += `
      <button class="gen-btn ${st.gen === +g ? 'active' : ''}" data-gen="${g}" style="--gen-c1:${i.c1};--gen-c2:${i.c2};--gen-glow:${i.c1}66">
        <span class="gen-roman">GEN ${i.roman}</span><span class="gen-region">${i.region}</span><span class="gen-count">${genPool(+g).length} Pokémon</span>
      </button>`;
    });
    el.genButtons.innerHTML = html;
  }

  function renderTypeChips() {
    const pool = genPool(st.gen);
    const counts = {};
    PKX.TYPES.forEach(t => (counts[t] = 0));
    pool.forEach(p => p.types.forEach(t => counts[t]++));
    if (st.type && !counts[st.type]) st.type = null;
    let html = `<button class="type-chip ${st.type === null ? 'active' : ''}" data-type="all"><span>Todos</span><span class="type-chip-count">${pool.length}</span></button>`;
    PKX.TYPES.forEach(t => {
      if (!counts[t]) return;
      const c = TYPE_COLORS[t];
      html += `<button class="type-chip ${st.type === t ? 'active' : ''}" data-type="${t}" style="--type-bg:${c};--type-glow:${c}66;"><span>${TYPE_NAMES[t]}</span><span class="type-chip-count">${counts[t]}</span></button>`;
    });
    el.chips.innerHTML = html;
  }

  function updateHeader() {
    const info = GENERATIONS[st.gen];
    const pool = genPool(st.gen);
    el.regionBadge.textContent = info ? `${info.region} · Gen ${info.roman}` : 'Nacional · Gen I-IX';
    el.totalBadge.textContent = `${pool.length} Pokémon`;
    el.genLabel.textContent = info ? `Generación ${info.roman} (${info.region})` : 'Todas las generaciones';
    el.total.textContent = pool.length;
    el.megaBadge.textContent = PKX.ALL.filter(p => p.isMega && (st.gen === 0 || p.gen === st.gen)).length;
    el.favBadge.textContent = S.favorites.size;
    const n = advCount();
    el.advBadge.hidden = !n;
    el.advBadge.textContent = n;
    el.advBtn.classList.toggle('active', n > 0 || !el.advPanel.hidden);
  }

  // ---------- Tarjetas ----------
  function megaTags(p) {
    return p.isMega ? `<span class="mega-tag">⚡ MEGA</span>${p.isZA ? '<span class="mega-tag za">Z-A</span>' : ''}` : '';
  }
  function kindTag(p) {
    const k = PKX.kind(p);
    return k ? `<span class="kind-tag kind-${k}">${PKX.KINDS[k]}</span>` : '';
  }

  function cardHTML(p) {
    const color = TYPE_COLORS[p.types[0]] || '#3b4cca';
    const fav = S.favorites.has(p.uid);
    const cmp = S.compare.includes(p.uid);
    const fid = pad(p.id);
    const tags = megaTags(p) + kindTag(p);
    return `
    <article class="pokemon-card ${p.isMega ? 'is-mega' : ''}" data-uid="${p.uid}" tabindex="0"
      style="--card-color:${color};--card-glow:${color}66;--card-color-light:${color}22;">
      <span class="card-watermark">${fid}</span>
      <div class="card-top">
        <span class="card-id-badge">${fid}</span>
        <div class="card-actions-row">
          <button class="card-cry-btn" data-act="cry" title="Escuchar sonido" aria-label="Reproducir sonido de ${p.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
          </button>
          <button class="card-cmp-btn ${cmp ? 'on' : ''}" data-act="cmp" title="Agregar al comparador" aria-label="Comparar ${p.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </button>
          <button class="card-fav-btn ${fav ? 'favorited' : ''}" data-act="fav" title="${fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" aria-label="Favorito">
            <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        </div>
      </div>
      <div class="card-image-box">
        <div class="card-image-bg-circle"></div>
        <img class="pokemon-card-img" src="${PKX.artworkOf(p, S.shiny)}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${p.sprite}'">
      </div>
      <div class="card-info">
        <div class="card-name-row"><h2 class="pokemon-card-name">${p.name}</h2></div>
        <span class="pokemon-card-genus">${p.category}</span>
        <div class="card-types-row">${p.types.map(t => PKX.typePill(t)).join('')}</div>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        <div class="card-mini-stats">
          <div class="mini-stat-item"><span class="mini-stat-label">PS</span><span class="mini-stat-value">${p.stats.hp}</span></div>
          <div class="mini-stat-item"><span class="mini-stat-label">ATQ</span><span class="mini-stat-value">${p.stats.attack}</span></div>
          <div class="mini-stat-item"><span class="mini-stat-label">DEF</span><span class="mini-stat-value">${p.stats.defense}</span></div>
        </div>
      </div>
    </article>`;
  }

  // ---------- Tabla ----------
  const COLS = [
    ['id', '#'], ['name', 'Nombre'], [null, 'Tipos'],
    ['hp', 'PS'], ['attack', 'ATQ'], ['defense', 'DEF'], ['spAttack', 'AE'], ['spDefense', 'DE'], ['speed', 'VEL'], ['total', 'Total'],
    [null, 'Habilidades']
  ];
  function heat(v, max) {
    const pct = Math.min(100, Math.round((v / max) * 100));
    const hue = Math.round(Math.min(120, (v / max) * 150));
    return `<td class="num"><div class="heat" style="--w:${pct}%;--h:${hue}"><span>${v}</span></div></td>`;
  }
  function tableHTML(list) {
    const [key, dir] = st.sortBy.split('-');
    const head = COLS.map(([k, label]) => {
      if (!k) return `<th>${label}</th>`;
      const active = k === key;
      return `<th class="sortable ${active ? 'sorted' : ''}" data-key="${k}">${label}<i>${active ? (dir === 'desc' ? '▼' : '▲') : ''}</i></th>`;
    }).join('');
    const rows = list.map(p => `
      <tr data-uid="${p.uid}">
        <td class="num dim">${pad(p.id)}</td>
        <td class="name-cell"><img src="${p.sprite}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <span>${p.name}</span>${p.isMega ? `<span class="mega-tag mini">${p.isZA ? 'Z-A' : 'MEGA'}</span>` : ''}</td>
        <td class="types-cell">${p.types.map(t => PKX.typePill(t)).join('')}</td>
        ${heat(p.stats.hp, 200)}${heat(p.stats.attack, 200)}${heat(p.stats.defense, 200)}
        ${heat(p.stats.spAttack, 200)}${heat(p.stats.spDefense, 200)}${heat(p.stats.speed, 200)}
        ${heat(p.stats.total, 700)}
        <td class="abil-cell">${p.abilities.map(a => `<span class="${a.hidden ? 'hidden-ab' : ''}" title="${PKX.esc(PKX.abilityInfo(a.slug).d)}">${PKX.abilityInfo(a.slug).n}${a.hidden ? ' (oculta)' : ''}</span>`).join('')}</td>
      </tr>`).join('');
    return `<table class="poke-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ---------- Render ----------
  function render() {
    const list = getFiltered();
    el.visible.textContent = list.length;
    updateHeader();
    const hasFilters = Boolean(st.query || st.type || st.onlyFav || advCount());
    el.reset.style.display = hasFilters ? 'inline-block' : 'none';

    if (!list.length) {
      el.grid.style.display = 'none'; el.grid.innerHTML = '';
      el.tableWrap.hidden = true; el.tableWrap.innerHTML = '';
      el.empty.style.display = 'flex';
      return;
    }
    el.empty.style.display = 'none';

    if (st.view === 'table') {
      el.grid.style.display = 'none'; el.grid.innerHTML = '';
      el.tableWrap.hidden = false;
      el.tableWrap.innerHTML = tableHTML(list);
    } else {
      el.tableWrap.hidden = true; el.tableWrap.innerHTML = '';
      el.grid.style.display = 'grid';
      el.grid.innerHTML = list.map(cardHTML).join('');
    }
    el.sort.value = [...el.sort.options].some(o => o.value === st.sortBy) ? st.sortBy : '';
    lastShiny = S.shiny;
  }

  function refreshAll() {
    renderGenButtons();
    renderTypeChips();
    render();
  }
  home.refresh = refreshAll;

  function resetAll() {
    st.query = ''; st.type = null; st.onlyFav = false; st.sortBy = 'id-asc';
    st.adv = { ability: '', kind: '', dual: '', form: '', ranges: {} };
    el.search.value = ''; el.clear.style.display = 'none';
    el.favBtn.classList.remove('active');
    syncAdvInputs();
    refreshAll();
  }

  // ---------- Filtros avanzados (UI) ----------
  function buildAdvUI() {
    $('adv-stats').innerHTML = RANGE_FIELDS.map(([k, label, max]) => `
      <div class="range-field">
        <span>${label}</span>
        <input type="number" min="0" max="${max}" placeholder="Mín" data-rk="${k}" data-ri="0" aria-label="${label} mínimo">
        <em>–</em>
        <input type="number" min="0" max="${max}" placeholder="Máx" data-rk="${k}" data-ri="1" aria-label="${label} máximo">
      </div>`).join('');
    const names = [...new Set(Object.values(window.ABILITIES || {}).map(a => a.n))].sort((a, b) => a.localeCompare(b, 'es'));
    $('ability-list').innerHTML = names.map(n => `<option value="${PKX.esc(n)}"></option>`).join('');
  }
  function syncAdvInputs() {
    $('adv-ability').value = st.adv.ability;
    $('adv-kind').value = st.adv.kind;
    $('adv-dual').value = st.adv.dual;
    $('adv-form').value = st.adv.form;
    document.querySelectorAll('#adv-stats input').forEach(i => {
      const r = st.adv.ranges[i.dataset.rk];
      i.value = r ? r[+i.dataset.ri] : '';
    });
  }

  // ---------- Eventos ----------
  function initEvents() {
    el.genButtons.addEventListener('click', e => {
      const b = e.target.closest('.gen-btn');
      if (!b) return;
      st.gen = +b.dataset.gen;
      st.type = null;
      refreshAll();
    });
    el.chips.addEventListener('click', e => {
      const c = e.target.closest('.type-chip');
      if (!c) return;
      st.type = c.dataset.type === 'all' ? null : c.dataset.type;
      renderTypeChips(); render();
    });

    let timer;
    el.search.addEventListener('input', e => {
      st.query = e.target.value.trim();
      el.clear.style.display = st.query ? 'flex' : 'none';
      clearTimeout(timer);
      timer = setTimeout(render, 150);
    });
    el.clear.addEventListener('click', () => {
      el.search.value = ''; st.query = ''; el.clear.style.display = 'none'; el.search.focus(); render();
    });

    el.favBtn.addEventListener('click', () => { st.onlyFav = !st.onlyFav; el.favBtn.classList.toggle('active', st.onlyFav); render(); });
    el.megaBtn.addEventListener('click', () => { st.showMegas = !st.showMegas; el.megaBtn.classList.toggle('active', st.showMegas); refreshAll(); });
    el.advBtn.addEventListener('click', () => {
      el.advPanel.hidden = !el.advPanel.hidden;
      el.advBtn.setAttribute('aria-expanded', String(!el.advPanel.hidden));
      updateHeader();
    });
    el.random.addEventListener('click', () => {
      const pool = getFiltered();
      const list = pool.length ? pool : genPool(st.gen);
      const pick = list[Math.floor(Math.random() * list.length)];
      location.hash = '#/pokemon/' + pick.uid;
    });
    el.sort.addEventListener('change', e => { st.sortBy = e.target.value; render(); });
    el.reset.addEventListener('click', resetAll);
    el.emptyReset.addEventListener('click', resetAll);

    el.viewCards.addEventListener('click', () => setView('cards'));
    el.viewTable.addEventListener('click', () => setView('table'));

    // Filtros avanzados
    $('adv-ability').addEventListener('input', e => { st.adv.ability = e.target.value; render(); });
    $('adv-kind').addEventListener('change', e => { st.adv.kind = e.target.value; render(); });
    $('adv-dual').addEventListener('change', e => { st.adv.dual = e.target.value; render(); });
    $('adv-form').addEventListener('change', e => { st.adv.form = e.target.value; refreshAll(); });
    $('adv-stats').addEventListener('input', e => {
      const i = e.target.closest('input');
      if (!i) return;
      const k = i.dataset.rk;
      const r = st.adv.ranges[k] || ['', ''];
      r[+i.dataset.ri] = i.value;
      st.adv.ranges[k] = r;
      clearTimeout(timer);
      timer = setTimeout(render, 200);
    });
    $('adv-clear-btn').addEventListener('click', () => {
      st.adv = { ability: '', kind: '', dual: '', form: '', ranges: {} };
      syncAdvInputs(); refreshAll();
    });

    // Tarjetas
    el.grid.addEventListener('click', e => {
      const card = e.target.closest('.pokemon-card');
      if (!card) return;
      const uid = +card.dataset.uid;
      const act = e.target.closest('[data-act]');
      if (act) {
        e.stopPropagation();
        if (act.dataset.act === 'cry') PKX.playCry(uid, act);
        else if (act.dataset.act === 'fav') PKX.toggleFav(uid);
        else if (act.dataset.act === 'cmp') PKX.toggleCompare(uid);
        return;
      }
      location.hash = '#/pokemon/' + uid;
    });
    el.grid.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
      const card = e.target.closest('.pokemon-card');
      if (card) location.hash = '#/pokemon/' + card.dataset.uid;
    });

    // Tabla
    el.tableWrap.addEventListener('click', e => {
      const th = e.target.closest('th.sortable');
      if (th) {
        const [key, dir] = st.sortBy.split('-');
        const k = th.dataset.key;
        st.sortBy = k === key ? `${k}-${dir === 'asc' ? 'desc' : 'asc'}` : `${k}-${k === 'name' || k === 'id' ? 'asc' : 'desc'}`;
        render();
        return;
      }
      const tr = e.target.closest('tr[data-uid]');
      if (tr) location.hash = '#/pokemon/' + tr.dataset.uid;
    });

    // Cambios de estado globales (favoritos, comparador, shiny)
    PKX.onChange(() => {
      el.favBadge.textContent = S.favorites.size;
      if (S.shiny !== lastShiny || st.onlyFav) { render(); return; }
      el.grid.querySelectorAll('.pokemon-card').forEach(c => {
        const uid = +c.dataset.uid;
        const f = S.favorites.has(uid);
        const fb = c.querySelector('.card-fav-btn');
        fb.classList.toggle('favorited', f);
        fb.title = f ? 'Quitar de favoritos' : 'Agregar a favoritos';
        c.querySelector('.card-cmp-btn').classList.toggle('on', S.compare.includes(uid));
      });
    });

    // Atajo "/" para buscar
    window.addEventListener('keydown', e => {
      if (e.key === '/' && !$('view-home').hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
        e.preventDefault(); el.search.focus();
      }
    });

    // Sensor
    $('main-sensor').addEventListener('click', e => {
      const s = e.currentTarget;
      s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse');
      const pool = genPool(st.gen);
      PKX.playCry(pool[Math.floor(Math.random() * pool.length)].uid);
    });
  }

  function setView(v) {
    st.view = v;
    el.viewCards.classList.toggle('active', v === 'cards');
    el.viewTable.classList.toggle('active', v === 'table');
    render();
  }

  /** API para otras vistas: mostrar un tipo concreto en la Pokédex. */
  home.showType = function (type) {
    st.gen = 0; st.type = type; st.query = ''; el.search.value = ''; el.clear.style.display = 'none';
    refreshAll();
  };

  home.init = function () {
    buildAdvUI();
    syncAdvInputs();
    refreshAll();
    initEvents();
  };
})();

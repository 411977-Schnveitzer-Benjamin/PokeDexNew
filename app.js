/**
 * Pokédex Nacional - Lógica principal
 * Generaciones I-IX, Megaevoluciones (incl. Z-A), búsqueda, filtros, favoritos, gritos y modal.
 */
(function () {
  'use strict';

  // ==========================================
  // CONSTANTES
  // ==========================================
  const TYPE_COLORS = {
    normal: '#9fa19f', fire: '#e62829', water: '#2980ef', grass: '#3fa129', electric: '#fac000',
    ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#81b9ef',
    psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1',
    dark: '#50413f', steel: '#60a1b8', fairy: '#ef70ef'
  };

  const TYPE_NAMES_ES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
  };

  const GENERATIONS = {
    1: { roman: 'I',    region: 'Kanto',   c1: '#ee1515', c2: '#b80d0d' },
    2: { roman: 'II',   region: 'Johto',   c1: '#d4a017', c2: '#8a6a0a' },
    3: { roman: 'III',  region: 'Hoenn',   c1: '#1fa37a', c2: '#0d6b4e' },
    4: { roman: 'IV',   region: 'Sinnoh',  c1: '#4f6bed', c2: '#2a3fa8' },
    5: { roman: 'V',    region: 'Teselia', c1: '#6b7280', c2: '#374151' },
    6: { roman: 'VI',   region: 'Kalos',   c1: '#e0559c', c2: '#9b2a68' },
    7: { roman: 'VII',  region: 'Alola',   c1: '#f08a24', c2: '#b35a0a' },
    8: { roman: 'VIII', region: 'Galar',   c1: '#9b5de5', c2: '#5e2fa8' },
    9: { roman: 'IX',   region: 'Paldea',  c1: '#e8452c', c2: '#8f9a14' }
  };

  const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
  const CRIES = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/';

  // Tabla de tipos: TYPE_CHART[defensor][atacante] = multiplicador
  const TYPE_CHART = {
    normal:   { fighting: 2, ghost: 0 },
    fire:     { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
    water:    { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    grass:    { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, grass: 0.5, electric: 0.5, ground: 0.5 },
    electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
    ice:      { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
    fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
    poison:   { ground: 2, psychic: 2, grass: 0.5, fighting: 0.5, poison: 0.5, bug: 0.5, fairy: 0.5 },
    ground:   { water: 2, grass: 2, ice: 2, electric: 0, poison: 0.5, rock: 0.5 },
    flying:   { electric: 2, ice: 2, rock: 2, ground: 0, grass: 0.5, fighting: 0.5, bug: 0.5 },
    psychic:  { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
    bug:      { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
    rock:     { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
    ghost:    { ghost: 2, dark: 2, normal: 0, fighting: 0, poison: 0.5, bug: 0.5 },
    dragon:   { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, grass: 0.5, electric: 0.5 },
    dark:     { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
    steel:    { fire: 2, fighting: 2, ground: 2, poison: 0, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5 },
    fairy:    { poison: 2, steel: 2, dragon: 0, fighting: 0.5, bug: 0.5, dark: 0.5 }
  };

  function calculateTypeEffectiveness(types) {
    const weaknesses = [];
    const resistances = [];
    Object.keys(TYPE_NAMES_ES).forEach(atk => {
      let mult = 1;
      types.forEach(def => {
        if (TYPE_CHART[def] && TYPE_CHART[def][atk] !== undefined) mult *= TYPE_CHART[def][atk];
      });
      if (mult > 1) weaknesses.push({ type: atk, mult });
      else if (mult < 1) resistances.push({ type: atk, mult });
    });
    weaknesses.sort((a, b) => b.mult - a.mult);
    resistances.sort((a, b) => a.mult - b.mult);
    return { weaknesses, resistances };
  }

  // ==========================================
  // DATOS: normalización del dataset compacto
  // ==========================================
  const ALL_POKEMON = (window.POKEMON_RAW || []).map((r, idx) => {
    const isMega = r.m > 0;
    return {
      uid: r.u,
      id: r.i,
      gen: r.g,
      name: r.n,
      displayName: r.n,
      category: r.c,
      description: r.d,
      types: r.t,
      height: r.h.toFixed(1),
      weight: r.w.toFixed(1),
      abilities: r.a,
      stats: {
        hp: r.s[0], attack: r.s[1], defense: r.s[2], spAttack: r.s[3], spDefense: r.s[4], speed: r.s[5],
        total: r.s.reduce((a, b) => a + b, 0)
      },
      isMega,
      isZA: r.m === 2,
      order: idx, // los megas ya vienen después de las bases; se reordena abajo
      artwork: `${SPRITES}other/official-artwork/${r.u}.png`,
      shinyArtwork: `${SPRITES}other/official-artwork/shiny/${r.u}.png`,
      sprite: `${SPRITES}${r.u}.png`
    };
  });

  // Orden Pokédex: cada mega aparece justo después de su especie base
  ALL_POKEMON.forEach((p, i) => { p.order = p.id * 100 + (p.isMega ? 1 + (i % 50) : 0); });
  const MEGA_TOTAL = ALL_POKEMON.filter(p => p.isMega).length;

  // ==========================================
  // ESTADO
  // ==========================================
  const state = {
    selectedGen: 1,          // 0 = todas
    showMegas: true,
    searchQuery: '',
    selectedType: null,
    onlyFavorites: false,
    sortBy: 'id-asc',
    favorites: new Set(),
    activeModalUid: null,
    modalList: [],
    isModalShiny: false
  };

  function loadFavorites() {
    try {
      const stored = localStorage.getItem('pokedex_kanto_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) state.favorites = new Set(parsed);
      }
    } catch (e) {
      console.warn('No se pudieron cargar los favoritos', e);
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem('pokedex_kanto_favorites', JSON.stringify([...state.favorites]));
    } catch (e) {
      console.warn('No se pudieron guardar los favoritos', e);
    }
  }

  // ==========================================
  // DOM
  // ==========================================
  const $ = id => document.getElementById(id);
  const elements = {
    grid: $('pokemon-grid'),
    searchInput: $('search-input'),
    clearSearchBtn: $('clear-search-btn'),
    typeChipsContainer: $('type-chips-container'),
    genButtons: $('gen-buttons'),
    favoritesToggleBtn: $('favorites-toggle-btn'),
    favCounterBadge: $('fav-counter-badge'),
    megaToggleBtn: $('mega-toggle-btn'),
    megaCounterBadge: $('mega-counter-badge'),
    randomPokemonBtn: $('random-pokemon-btn'),
    sortSelect: $('sort-select'),
    visibleCount: $('visible-count'),
    genTotalCount: $('gen-total-count'),
    resultsGenLabel: $('results-gen-label'),
    regionBadgeText: $('region-badge-text'),
    totalBadgeText: $('total-badge-text'),
    resetFiltersBtn: $('reset-filters-btn'),
    emptyState: $('empty-state'),
    emptyResetBtn: $('empty-reset-btn'),
    modal: $('pokemon-modal'),
    modalBody: $('modal-body-content'),
    modalPrevBtn: $('modal-prev-btn'),
    modalNextBtn: $('modal-next-btn'),
    modalPrevText: $('modal-prev-text'),
    modalNextText: $('modal-next-text'),
    modalFavBtn: $('modal-fav-btn'),
    modalCloseBtn: $('modal-close-btn'),
    scrollTopBtn: $('scroll-top-btn'),
    audioPlayer: $('cry-audio-player'),
    mainSensor: $('main-sensor')
  };

  const pad = n => '#' + n.toString().padStart(3, '0');

  // ==========================================
  // AUDIO
  // ==========================================
  let currentlyPlayingBtn = null;

  function stopPlayingState() {
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.classList.remove('playing');
      currentlyPlayingBtn = null;
    }
  }

  function playCry(uid, triggerBtn = null) {
    if (!elements.audioPlayer) return;
    stopPlayingState();

    const p = ALL_POKEMON.find(x => x.uid === uid);
    elements.audioPlayer.src = `${CRIES}${uid}.ogg`;

    if (triggerBtn) {
      triggerBtn.classList.add('playing');
      currentlyPlayingBtn = triggerBtn;
    }

    // Si el grito de la forma (mega) no existe, usa el de la especie base
    elements.audioPlayer.onerror = () => {
      if (p && p.isMega && !elements.audioPlayer.dataset.fallback) {
        elements.audioPlayer.dataset.fallback = '1';
        elements.audioPlayer.src = `${CRIES}${p.id}.ogg`;
        elements.audioPlayer.play().catch(stopPlayingState);
      } else {
        stopPlayingState();
      }
    };
    delete elements.audioPlayer.dataset.fallback;
    elements.audioPlayer.onended = stopPlayingState;
    elements.audioPlayer.play().catch(stopPlayingState);
  }

  // ==========================================
  // SELECTOR DE GENERACIONES
  // ==========================================
  function genPool(gen) {
    return ALL_POKEMON.filter(p => (gen === 0 || p.gen === gen) && (state.showMegas || !p.isMega));
  }

  function renderGenButtons() {
    const allCount = genPool(0).length;
    let html = `
      <button class="gen-btn ${state.selectedGen === 0 ? 'active' : ''}" data-gen="0"
        style="--gen-c1:#3b4cca; --gen-c2:#1f2a80; --gen-glow:rgba(59,76,202,0.45)">
        <span class="gen-roman">TODAS</span>
        <span class="gen-region">Nacional</span>
        <span class="gen-count">${allCount} Pokémon</span>
      </button>`;

    Object.entries(GENERATIONS).forEach(([g, info]) => {
      const gen = +g;
      html += `
      <button class="gen-btn ${state.selectedGen === gen ? 'active' : ''}" data-gen="${gen}"
        style="--gen-c1:${info.c1}; --gen-c2:${info.c2}; --gen-glow:${info.c1}66">
        <span class="gen-roman">GEN ${info.roman}</span>
        <span class="gen-region">${info.region}</span>
        <span class="gen-count">${genPool(gen).length} Pokémon</span>
      </button>`;
    });

    elements.genButtons.innerHTML = html;
  }

  function updateHeaderInfo() {
    const info = GENERATIONS[state.selectedGen];
    const pool = genPool(state.selectedGen);
    if (elements.regionBadgeText) {
      elements.regionBadgeText.textContent = info ? `${info.region} · Gen ${info.roman}` : 'Nacional · Gen I-IX';
    }
    if (elements.totalBadgeText) elements.totalBadgeText.textContent = `${pool.length} Pokémon`;
    if (elements.resultsGenLabel) {
      elements.resultsGenLabel.textContent = info ? `Generación ${info.roman} (${info.region})` : 'Todas las generaciones';
    }
    if (elements.genTotalCount) elements.genTotalCount.textContent = pool.length;
  }

  // ==========================================
  // CHIPS DE TIPO
  // ==========================================
  function renderTypeChips() {
    const pool = genPool(state.selectedGen);
    const counts = {};
    Object.keys(TYPE_NAMES_ES).forEach(t => (counts[t] = 0));
    pool.forEach(p => p.types.forEach(t => { if (counts[t] !== undefined) counts[t]++; }));

    if (state.selectedType && counts[state.selectedType] === 0) state.selectedType = null;

    let html = `
      <button class="type-chip ${state.selectedType === null ? 'active' : ''}" data-type="all">
        <span>Todos</span><span class="type-chip-count">${pool.length}</span>
      </button>`;

    Object.entries(TYPE_NAMES_ES).forEach(([key, name]) => {
      if (!counts[key]) return;
      const color = TYPE_COLORS[key];
      html += `
        <button class="type-chip ${state.selectedType === key ? 'active' : ''}" data-type="${key}"
          style="--type-bg:${color}; --type-glow:${color}66;">
          <span>${name}</span><span class="type-chip-count">${counts[key]}</span>
        </button>`;
    });

    elements.typeChipsContainer.innerHTML = html;
  }

  // ==========================================
  // FILTRADO Y ORDEN
  // ==========================================
  function getFilteredAndSortedPokemon() {
    let result = genPool(state.selectedGen);

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase().replace('#', '');
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toString() === q ||
        p.id.toString().padStart(3, '0').includes(q) ||
        (q === 'mega' && p.isMega) ||
        (q === 'za' && p.isZA)
      );
    }
    if (state.selectedType) result = result.filter(p => p.types.includes(state.selectedType));
    if (state.onlyFavorites) result = result.filter(p => state.favorites.has(p.uid));

    const byName = (a, b) => a.name.localeCompare(b.name, 'es');
    switch (state.sortBy) {
      case 'id-asc':    result.sort((a, b) => a.order - b.order); break;
      case 'id-desc':   result.sort((a, b) => b.order - a.order); break;
      case 'name-asc':  result.sort(byName); break;
      case 'name-desc': result.sort((a, b) => byName(b, a)); break;
      case 'stats-desc': result.sort((a, b) => b.stats.total - a.stats.total); break;
      case 'speed-desc': result.sort((a, b) => b.stats.speed - a.stats.speed); break;
    }
    return result;
  }

  // ==========================================
  // GRID
  // ==========================================
  function megaTags(p) {
    if (!p.isMega) return '';
    return `<span class="mega-tag">⚡ MEGA</span>${p.isZA ? '<span class="mega-tag za">Z-A</span>' : ''}`;
  }

  function renderGrid() {
    const filtered = getFilteredAndSortedPokemon();
    state.modalList = filtered;

    elements.visibleCount.textContent = filtered.length;
    elements.favCounterBadge.textContent = state.favorites.size;
    elements.megaCounterBadge.textContent = ALL_POKEMON.filter(p => p.isMega && (state.selectedGen === 0 || p.gen === state.selectedGen)).length;

    const hasActiveFilters = Boolean(state.searchQuery || state.selectedType || state.onlyFavorites);
    elements.resetFiltersBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';

    if (filtered.length === 0) {
      elements.grid.style.display = 'none';
      elements.emptyState.style.display = 'flex';
      elements.grid.innerHTML = '';
      return;
    }
    elements.grid.style.display = 'grid';
    elements.emptyState.style.display = 'none';

    elements.grid.innerHTML = filtered.map(p => {
      const typeColor = TYPE_COLORS[p.types[0]] || '#3b4cca';
      const isFav = state.favorites.has(p.uid);
      const fid = pad(p.id);
      const pills = p.types.map(t =>
        `<span class="type-pill" style="background:${TYPE_COLORS[t]};">${TYPE_NAMES_ES[t]}</span>`).join('');

      return `
        <article class="pokemon-card ${p.isMega ? 'is-mega' : ''}" data-uid="${p.uid}"
          style="--card-color:${typeColor}; --card-glow:${typeColor}66; --card-color-light:${typeColor}22;">
          <span class="card-watermark">${fid}</span>
          <div class="card-top">
            <span class="card-id-badge">${fid}</span>
            <div class="card-actions-row">
              <button class="card-cry-btn" data-cry-id="${p.uid}" title="Escuchar sonido de ${p.name}" aria-label="Reproducir sonido de ${p.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>
              <button class="card-fav-btn ${isFav ? 'favorited' : ''}" data-fav-id="${p.uid}"
                title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" aria-label="Favorito">
                <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="card-image-box">
            <div class="card-image-bg-circle"></div>
            <img class="pokemon-card-img" src="${p.artwork}" alt="${p.name}" loading="lazy"
              onerror="this.onerror=null;this.src='${p.sprite}'">
          </div>
          <div class="card-info">
            <div class="card-name-row">
              <h2 class="pokemon-card-name">${p.name}</h2>
            </div>
            <span class="pokemon-card-genus">${p.category}</span>
            <div class="card-types-row">${pills}</div>
            ${p.isMega ? `<div class="card-tags">${megaTags(p)}</div>` : ''}
            <div class="card-mini-stats">
              <div class="mini-stat-item"><span class="mini-stat-label">PS</span><span class="mini-stat-value">${p.stats.hp}</span></div>
              <div class="mini-stat-item"><span class="mini-stat-label">ATQ</span><span class="mini-stat-value">${p.stats.attack}</span></div>
              <div class="mini-stat-item"><span class="mini-stat-label">DEF</span><span class="mini-stat-value">${p.stats.defense}</span></div>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function refreshAll() {
    renderGenButtons();
    renderTypeChips();
    updateHeaderInfo();
    renderGrid();
  }

  // ==========================================
  // MODAL
  // ==========================================
  function currentNavList() {
    // Si el abierto no está en la lista visible (ej. aleatorio), navega por la generación completa
    return state.modalList.some(p => p.uid === state.activeModalUid) ? state.modalList : genPool(state.selectedGen);
  }

  function openModal(uid) {
    const p = ALL_POKEMON.find(x => x.uid === uid);
    if (!p) return;

    state.activeModalUid = uid;
    state.isModalShiny = false;

    const typeColor = TYPE_COLORS[p.types[0]] || '#3b4cca';
    const isFav = state.favorites.has(p.uid);

    elements.modal.style.setProperty('--modal-color', typeColor);
    elements.modal.style.setProperty('--modal-glow', `${typeColor}55`);
    elements.modal.style.setProperty('--modal-color-light', `${typeColor}33`);

    const list = currentNavList();
    const idx = list.findIndex(x => x.uid === uid);
    const prev = list[(idx - 1 + list.length) % list.length];
    const next = list[(idx + 1) % list.length];
    elements.modalPrevText.textContent = pad(prev.id) + (prev.isMega ? ' M' : '');
    elements.modalNextText.textContent = pad(next.id) + (next.isMega ? ' M' : '');
    elements.modalFavBtn.classList.toggle('favorited', isFav);

    const { weaknesses, resistances } = calculateTypeEffectiveness(p.types);
    const weaknessBadges = weaknesses.length
      ? weaknesses.map(w => `<span class="effect-chip" style="background:${TYPE_COLORS[w.type]};">${TYPE_NAMES_ES[w.type]} ${w.mult}x</span>`).join('')
      : '<span style="color:var(--text-dim);font-size:0.82rem;">Ninguna debilidad notable</span>';
    const resistanceBadges = resistances.length
      ? resistances.map(r => {
          const m = r.mult === 0 ? 'Inmune' : `${r.mult}x`;
          return `<span class="effect-chip" style="background:${TYPE_COLORS[r.type]};">${TYPE_NAMES_ES[r.type]} (${m})</span>`;
        }).join('')
      : '<span style="color:var(--text-dim);font-size:0.82rem;">Ninguna resistencia particular</span>';

    const typePills = p.types.map(t =>
      `<span class="type-pill" style="background:${TYPE_COLORS[t]};font-size:0.85rem;padding:0.35rem 0.85rem;">${TYPE_NAMES_ES[t]}</span>`).join('');

    const abilitiesStr = p.abilities.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ') || 'Estándar';
    const genInfo = GENERATIONS[p.gen];

    function statBar(label, val, max = 200) {
      const pct = Math.min(100, Math.round((val / max) * 100));
      let c = '#ef4444';
      if (val >= 100) c = '#22c55e';
      else if (val >= 70) c = '#eab308';
      else if (val >= 45) c = '#f97316';
      return `
        <div class="stat-row">
          <span class="stat-name">${label}</span><span class="stat-number">${val}</span>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:${c};"></div></div>
        </div>`;
    }

    elements.modalBody.innerHTML = `
      <section class="modal-hero">
        <div class="modal-image-display">
          <div class="modal-artwork-wrapper">
            <div class="modal-artwork-halo"></div>
            <img id="modal-artwork-img" class="modal-hero-img" src="${p.artwork}" alt="${p.name}"
              onerror="this.onerror=null;this.src='${p.sprite}'">
          </div>
          <button id="modal-shiny-toggle" class="shiny-toggle-btn" title="Alternar versión variocolor (Shiny)">✨ Ver Shiny</button>
        </div>
        <div class="modal-hero-info">
          <span class="modal-id-badge">${pad(p.id)} · Gen ${genInfo.roman} · ${genInfo.region}</span>
          <h2 class="modal-name-title">${p.name}</h2>
          <span class="modal-genus-tag">${p.category}</span>
          ${p.isMega ? `<div class="modal-tags">${megaTags(p)}</div>` : ''}
          <div class="modal-types-list">${typePills}</div>
          <button id="modal-cry-btn" class="modal-cry-player">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            <span>Escuchar Grito Oficial</span>
          </button>
        </div>
      </section>

      <section class="modal-desc-card"><p>"${p.description}"</p></section>

      <section class="modal-measurements-grid">
        <div class="measure-box"><div class="measure-label">Altura</div><div class="measure-val">${p.height} m</div></div>
        <div class="measure-box"><div class="measure-label">Peso</div><div class="measure-val">${p.weight} kg</div></div>
        <div class="measure-box"><div class="measure-label">Habilidad</div><div class="measure-val" style="font-size:0.95rem;text-transform:capitalize;">${abilitiesStr}</div></div>
      </section>

      <section class="modal-stats-section">
        <div class="modal-section-title"><span>Estadísticas Base</span><span class="total-bst-badge">Total: ${p.stats.total} BST</span></div>
        <div class="stats-bars-container">
          ${statBar('PS (Salud)', p.stats.hp)}
          ${statBar('Ataque', p.stats.attack)}
          ${statBar('Defensa', p.stats.defense)}
          ${statBar('Atq. Esp.', p.stats.spAttack)}
          ${statBar('Def. Esp.', p.stats.spDefense)}
          ${statBar('Velocidad', p.stats.speed)}
        </div>
      </section>

      <section class="effectiveness-section">
        <div class="effect-card">
          <div class="effect-title weakness-title">Débil Contra (Recibe más daño)</div>
          <div class="effect-chips-wrap">${weaknessBadges}</div>
        </div>
        <div class="effect-card">
          <div class="effect-title resistance-title">Resistente Contra (Recibe menos daño)</div>
          <div class="effect-chips-wrap">${resistanceBadges}</div>
        </div>
      </section>`;

    const shinyBtn = $('modal-shiny-toggle');
    const img = $('modal-artwork-img');
    shinyBtn.addEventListener('click', () => {
      state.isModalShiny = !state.isModalShiny;
      shinyBtn.classList.toggle('active', state.isModalShiny);
      shinyBtn.innerHTML = state.isModalShiny ? '✨ Modo Shiny Activo' : '✨ Ver Shiny';
      img.src = state.isModalShiny ? p.shinyArtwork : p.artwork;
    });

    const cryBtn = $('modal-cry-btn');
    cryBtn.addEventListener('click', () => playCry(p.uid, cryBtn));

    elements.modalBody.scrollTop = 0;
    elements.modal.classList.add('open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elements.modal.classList.remove('open');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.activeModalUid = null;
  }

  function navigateModal(direction) {
    if (state.activeModalUid === null) return;
    const list = currentNavList();
    const idx = list.findIndex(x => x.uid === state.activeModalUid);
    openModal(list[(idx + direction + list.length) % list.length].uid);
  }

  // ==========================================
  // EVENTOS
  // ==========================================
  function resetAllFilters() {
    state.searchQuery = '';
    state.selectedType = null;
    state.onlyFavorites = false;
    state.sortBy = 'id-asc';
    elements.searchInput.value = '';
    elements.clearSearchBtn.style.display = 'none';
    elements.favoritesToggleBtn.classList.remove('active');
    elements.sortSelect.value = 'id-asc';
    refreshAll();
  }

  function initEvents() {
    // Botones de generación
    elements.genButtons.addEventListener('click', e => {
      const btn = e.target.closest('.gen-btn');
      if (!btn) return;
      state.selectedGen = parseInt(btn.dataset.gen, 10);
      state.selectedType = null;
      refreshAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Chips de tipo
    elements.typeChipsContainer.addEventListener('click', e => {
      const chip = e.target.closest('.type-chip');
      if (!chip) return;
      state.selectedType = chip.dataset.type === 'all' ? null : chip.dataset.type;
      renderTypeChips();
      renderGrid();
    });

    // Búsqueda
    let timer;
    elements.searchInput.addEventListener('input', e => {
      clearTimeout(timer);
      const val = e.target.value.trim();
      state.searchQuery = val;
      elements.clearSearchBtn.style.display = val ? 'flex' : 'none';
      timer = setTimeout(renderGrid, 150);
    });
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      elements.searchInput.focus();
      renderGrid();
    });

    // Favoritos
    elements.favoritesToggleBtn.addEventListener('click', () => {
      state.onlyFavorites = !state.onlyFavorites;
      elements.favoritesToggleBtn.classList.toggle('active', state.onlyFavorites);
      renderGrid();
    });

    // Megas on/off
    elements.megaToggleBtn.addEventListener('click', () => {
      state.showMegas = !state.showMegas;
      elements.megaToggleBtn.classList.toggle('active', state.showMegas);
      refreshAll();
    });

    // Aleatorio (dentro de la selección actual)
    elements.randomPokemonBtn.addEventListener('click', () => {
      const pool = genPool(state.selectedGen);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      openModal(pick.uid);
      playCry(pick.uid);
    });

    elements.sortSelect.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderGrid();
    });

    elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
    elements.emptyResetBtn.addEventListener('click', resetAllFilters);

    // Delegación en la grilla
    elements.grid.addEventListener('click', e => {
      const cryBtn = e.target.closest('.card-cry-btn');
      if (cryBtn) {
        e.stopPropagation();
        playCry(parseInt(cryBtn.dataset.cryId, 10), cryBtn);
        return;
      }
      const favBtn = e.target.closest('.card-fav-btn');
      if (favBtn) {
        e.stopPropagation();
        const uid = parseInt(favBtn.dataset.favId, 10);
        if (state.favorites.has(uid)) { state.favorites.delete(uid); favBtn.classList.remove('favorited'); }
        else { state.favorites.add(uid); favBtn.classList.add('favorited'); }
        saveFavorites();
        elements.favCounterBadge.textContent = state.favorites.size;
        if (state.onlyFavorites) renderGrid();
        return;
      }
      const card = e.target.closest('.pokemon-card');
      if (card) openModal(parseInt(card.dataset.uid, 10));
    });

    // Modal
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalPrevBtn.addEventListener('click', () => navigateModal(-1));
    elements.modalNextBtn.addEventListener('click', () => navigateModal(1));
    elements.modalFavBtn.addEventListener('click', () => {
      const uid = state.activeModalUid;
      if (uid === null) return;
      if (state.favorites.has(uid)) { state.favorites.delete(uid); elements.modalFavBtn.classList.remove('favorited'); }
      else { state.favorites.add(uid); elements.modalFavBtn.classList.add('favorited'); }
      saveFavorites();
      renderGrid();
    });
    elements.modal.addEventListener('click', e => { if (e.target === elements.modal) closeModal(); });

    window.addEventListener('keydown', e => {
      if (elements.modal.classList.contains('open')) {
        if (e.key === 'Escape') closeModal();
        else if (e.key === 'ArrowLeft') navigateModal(-1);
        else if (e.key === 'ArrowRight') navigateModal(1);
        return;
      }
      if (e.key === '/' && document.activeElement !== elements.searchInput) {
        e.preventDefault();
        elements.searchInput.focus();
      }
    });

    window.addEventListener('scroll', () => {
      elements.scrollTopBtn.classList.toggle('visible', window.scrollY > 350);
    }, { passive: true });
    elements.scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    if (elements.mainSensor) {
      elements.mainSensor.addEventListener('click', () => {
        elements.mainSensor.classList.remove('pulse');
        void elements.mainSensor.offsetWidth;
        elements.mainSensor.classList.add('pulse');
        const pool = genPool(state.selectedGen);
        playCry(pool[Math.floor(Math.random() * pool.length)].uid);
      });
    }
  }

  function init() {
    loadFavorites();
    refreshAll();
    initEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

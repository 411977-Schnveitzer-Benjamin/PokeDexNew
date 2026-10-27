/**
 * Pokédex Nacional - Núcleo compartido (datos, estado, utilidades)
 * Expone window.PKX para el resto de módulos.
 */
(function () {
  'use strict';
  const PKX = (window.PKX = {});

  // ==========================================
  // CONSTANTES
  // ==========================================
  PKX.TYPE_COLORS = {
    normal: '#9fa19f', fire: '#e62829', water: '#2980ef', grass: '#3fa129', electric: '#fac000',
    ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#81b9ef',
    psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1',
    dark: '#50413f', steel: '#60a1b8', fairy: '#ef70ef'
  };
  PKX.TYPE_NAMES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
  };
  PKX.TYPES = Object.keys(PKX.TYPE_NAMES);

  PKX.GENERATIONS = {
    1: { roman: 'I', region: 'Kanto', c1: '#ee1515', c2: '#b80d0d' },
    2: { roman: 'II', region: 'Johto', c1: '#d4a017', c2: '#8a6a0a' },
    3: { roman: 'III', region: 'Hoenn', c1: '#1fa37a', c2: '#0d6b4e' },
    4: { roman: 'IV', region: 'Sinnoh', c1: '#4f6bed', c2: '#2a3fa8' },
    5: { roman: 'V', region: 'Teselia', c1: '#6b7280', c2: '#374151' },
    6: { roman: 'VI', region: 'Kalos', c1: '#e0559c', c2: '#9b2a68' },
    7: { roman: 'VII', region: 'Alola', c1: '#f08a24', c2: '#b35a0a' },
    8: { roman: 'VIII', region: 'Galar', c1: '#9b5de5', c2: '#5e2fa8' },
    9: { roman: 'IX', region: 'Paldea', c1: '#e8452c', c2: '#8f9a14' }
  };

  PKX.STAT_KEYS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
  PKX.STAT_LABELS = ['PS', 'Ataque', 'Defensa', 'Atq. Esp.', 'Def. Esp.', 'Velocidad'];
  PKX.STAT_SHORT = ['PS', 'ATQ', 'DEF', 'AE', 'DE', 'VEL'];

  // Naturalezas competitivas completas (25)
  PKX.NATURES = [
    { name: 'Fuerte', en: 'Hardy', plus: null, minus: null, label: 'Fuerte (Hardy) — Neutra' },
    { name: 'Huraña', en: 'Lonely', plus: 1, minus: 2, label: 'Huraña (Lonely) — +10% Ataque / -10% Defensa' },
    { name: 'Audaz', en: 'Brave', plus: 1, minus: 5, label: 'Audaz (Brave) — +10% Ataque / -10% Velocidad' },
    { name: 'Firme', en: 'Adamant', plus: 1, minus: 3, label: 'Firme (Adamant) — +10% Ataque / -10% Atq. Especial' },
    { name: 'Pícara', en: 'Naughty', plus: 1, minus: 4, label: 'Pícara (Naughty) — +10% Ataque / -10% Def. Especial' },
    { name: 'Osada', en: 'Bold', plus: 2, minus: 1, label: 'Osada (Bold) — +10% Defensa / -10% Ataque' },
    { name: 'Dócil', en: 'Docile', plus: null, minus: null, label: 'Dócil (Docile) — Neutra' },
    { name: 'Plácida', en: 'Relaxed', plus: 2, minus: 5, label: 'Plácida (Relaxed) — +10% Defensa / -10% Velocidad' },
    { name: 'Agitada', en: 'Impish', plus: 2, minus: 3, label: 'Agitada (Impish) — +10% Defensa / -10% Atq. Especial' },
    { name: 'Floja', en: 'Lax', plus: 2, minus: 4, label: 'Floja (Lax) — +10% Defensa / -10% Def. Especial' },
    { name: 'Miedosa', en: 'Timid', plus: 5, minus: 1, label: 'Miedosa (Timid) — +10% Velocidad / -10% Ataque' },
    { name: 'Activa', en: 'Hasty', plus: 5, minus: 2, label: 'Activa (Hasty) — +10% Velocidad / -10% Defensa' },
    { name: 'Seria', en: 'Serious', plus: null, minus: null, label: 'Seria (Serious) — Neutra' },
    { name: 'Alegre', en: 'Jolly', plus: 5, minus: 3, label: 'Alegre (Jolly) — +10% Velocidad / -10% Atq. Especial' },
    { name: 'Ingenua', en: 'Naive', plus: 5, minus: 4, label: 'Ingenua (Naive) — +10% Velocidad / -10% Def. Especial' },
    { name: 'Modesta', en: 'Modest', plus: 3, minus: 1, label: 'Modesta (Modest) — +10% Atq. Especial / -10% Ataque' },
    { name: 'Afable', en: 'Mild', plus: 3, minus: 2, label: 'Afable (Mild) — +10% Atq. Especial / -10% Defensa' },
    { name: 'Mansa', en: 'Quiet', plus: 3, minus: 5, label: 'Mansa (Quiet) — +10% Atq. Especial / -10% Velocidad' },
    { name: 'Tímida', en: 'Bashful', plus: null, minus: null, label: 'Tímida (Bashful) — Neutra' },
    { name: 'Alocada', en: 'Rash', plus: 3, minus: 4, label: 'Alocada (Rash) — +10% Atq. Especial / -10% Def. Especial' },
    { name: 'Serena', en: 'Calm', plus: 4, minus: 1, label: 'Serena (Calm) — +10% Def. Especial / -10% Ataque' },
    { name: 'Amable', en: 'Gentle', plus: 4, minus: 2, label: 'Amable (Gentle) — +10% Def. Especial / -10% Defensa' },
    { name: 'Grosera', en: 'Sassy', plus: 4, minus: 5, label: 'Grosera (Sassy) — +10% Def. Especial / -10% Velocidad' },
    { name: 'Cauta', en: 'Careful', plus: 4, minus: 3, label: 'Cauta (Careful) — +10% Def. Especial / -10% Atq. Especial' },
    { name: 'Rara', en: 'Quirky', plus: null, minus: null, label: 'Rara (Quirky) — Neutra' }
  ];
  PKX.NATURES.forEach(n => { n[0] = n.name; n[1] = n.plus ?? -1; n[2] = n.minus ?? -1; });

  PKX.KINDS = { 0: '', 1: 'Bebé', 2: 'Pseudolegendario', 3: 'Legendario', 4: 'Mítico' };

  PKX.COMPETITIVE_ITEMS = [
    'Restos (Leftovers)', 'Vidasfera (Life Orb)', 'Banda Focus (Focus Sash)',
    'Pañuelo Elegido (Choice Scarf)', 'Cinta Elegida (Choice Band)', 'Gafas Elegidas (Choice Specs)',
    'Chaleco Asalto (Assault Vest)', 'Botas Gruesas (Heavy-Duty Boots)', 'Mineral Evolutivo (Eviolite)',
    'Casco Dentado (Rocky Helmet)', 'Baya Zidra (Sitrus Berry)', 'Baya Ripaf (Lum Berry)',
    'Hierba Blanca (White Herb)', 'Hierba Única (Power Herb)', 'Hierba Mental (Mental Herb)',
    'Seguro Debilidad (Weakness Policy)', 'Dados Trucados (Loaded Dice)', 'Energía Potenciadora (Booster Energy)',
    'Lupa (Wide Lens)', 'Toxisfera (Toxic Orb)', 'Llamasfera (Flame Orb)',
    'Globo Helio (Air Balloon)', 'Banda Atadura (Binding Band)', 'Hierba Copia (Mirror Herb)',
    'Capa Furtiva (Covert Cloak)', 'Paraguas Universal (Utility Umbrella)', 'Lodo Negro (Black Sludge)',
    'Raíz Grande (Big Root)', 'Roca Lluvia (Damp Rock)', 'Roca Calor (Heat Rock)',
    'Roca Suave (Smooth Rock)', 'Roca Helada (Icy Rock)', 'Baya Aslac (Salac Berry)',
    'Baya Lichi (Liechi Berry)', 'Baya Gonlan (Ganlon Berry)', 'Baya Petaya (Petaya Berry)'
  ];

  const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
  const CRIES = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/';

  // Tabla de tipos: TYPE_CHART[defensor][atacante] = multiplicador
  PKX.TYPE_CHART = {
    normal: { fighting: 2, ghost: 0 },
    fire: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
    water: { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    grass: { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, grass: 0.5, electric: 0.5, ground: 0.5 },
    electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
    ice: { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
    fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
    poison: { ground: 2, psychic: 2, grass: 0.5, fighting: 0.5, poison: 0.5, bug: 0.5, fairy: 0.5 },
    ground: { water: 2, grass: 2, ice: 2, electric: 0, poison: 0.5, rock: 0.5 },
    flying: { electric: 2, ice: 2, rock: 2, ground: 0, grass: 0.5, fighting: 0.5, bug: 0.5 },
    psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
    bug: { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
    rock: { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
    ghost: { ghost: 2, dark: 2, normal: 0, fighting: 0, poison: 0.5, bug: 0.5 },
    dragon: { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, grass: 0.5, electric: 0.5 },
    dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
    steel: { fire: 2, fighting: 2, ground: 2, poison: 0, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5 },
    fairy: { poison: 2, steel: 2, dragon: 0, fighting: 0.5, bug: 0.5, dark: 0.5 }
  };

  /** Multiplicador con el que `atk` golpea a un defensor de tipos `types`. */
  PKX.multiplier = function (types, atk) {
    let m = 1;
    types.forEach(d => {
      const v = PKX.TYPE_CHART[d] && PKX.TYPE_CHART[d][atk];
      if (v !== undefined) m *= v;
    });
    return m;
  };
  /** Mapa tipoAtacante -> multiplicador para unos tipos defensores. */
  PKX.defense = function (types) {
    const out = {};
    PKX.TYPES.forEach(t => (out[t] = PKX.multiplier(types, t)));
    return out;
  };

  // ==========================================
  // UTILIDADES
  // ==========================================
  PKX.$ = id => document.getElementById(id);
  PKX.pad = n => '#' + String(n).padStart(3, '0');
  PKX.norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  PKX.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PKX.fmtMult = m => (m === 0 ? '0' : m === 0.25 ? '¼' : m === 0.5 ? '½' : String(m));
  PKX.typePill = (t, big) =>
    `<span class="type-pill${big ? ' big' : ''}" style="background:${PKX.TYPE_COLORS[t]};">${PKX.TYPE_NAMES[t]}</span>`;

  PKX.toast = function (msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(PKX.toast._t);
    PKX.toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  };

  // ==========================================
  // DATOS
  // ==========================================
  const raw = (window.POKEMON_RAW || []).concat(window.FORMS_RAW || []);
  const megaCount = {};
  // m: 0 base | 1 mega | 2 mega Z-A | 3 Gigamax | 4 regional | 5 primigenia
  PKX.FORM_LABELS = { 1: 'MEGA', 2: 'MEGA', 3: 'GIGAMAX', 4: 'REGIONAL', 5: 'PRIMIGENIA' };
  PKX.ALL = raw.map(r => {
    const isMega = r.m === 1 || r.m === 2;
    const idx = r.m > 0 ? (megaCount[r.i] = (megaCount[r.i] || 0) + 1) : 0;
    const s = r.s;
    return {
      uid: r.u, id: r.i, gen: r.g, name: r.n, category: r.c, description: r.d,
      types: r.t, height: r.h, weight: r.w,
      abilities: r.a.map(a => ({ slug: a[0], hidden: !!a[1] })),
      statsArr: s,
      stats: { hp: s[0], attack: s[1], defense: s[2], spAttack: s[3], spDefense: s[4], speed: s[5], total: s.reduce((a, b) => a + b, 0) },
      isMega, isZA: r.m === 2, formKind: r.m || 0, isForm: r.m > 0,
      isGmax: r.m === 3, isRegional: r.m === 4, isPrimal: r.m === 5,
      // Formas que no se eligen directamente en un equipo (se activan en combate con objeto/mecánica)
      battleOnly: r.m === 1 || r.m === 2 || r.m === 3 || r.m === 5,
      baseExp: r.be, ev: r.ev, x: r.x || null,
      order: r.i * 100 + idx,
      search: PKX.norm(r.n),
      artwork: `${SPRITES}other/official-artwork/${r.u}.png`,
      shinyArtwork: `${SPRITES}other/official-artwork/shiny/${r.u}.png`,
      sprite: `${SPRITES}${r.u}.png`
    };
  });
  PKX.BY_UID = {};
  PKX.SPECIES = {}; // id de especie -> entrada base
  PKX.ALL.forEach(p => {
    PKX.BY_UID[p.uid] = p;
    if (!p.isForm) PKX.SPECIES[p.id] = p;
  });
  PKX.ALL.forEach(p => { p.base = PKX.SPECIES[p.id] || p; });
  PKX.ORDERED = PKX.ALL.slice().sort((a, b) => a.order - b.order);
  PKX.MEGA_TOTAL = PKX.ALL.filter(p => p.isMega).length;
  PKX.FORMS_TOTAL = PKX.ALL.filter(p => p.isForm).length;

  // Megapiedras / orbes: uid de la forma -> { n, en }
  PKX.MEGA_STONES = window.MEGA_STONES || {};
  PKX.stoneOf = p => PKX.MEGA_STONES[p.uid] || null;
  // Objetos que activan una forma de este Pokémon base (ej: Charizard -> Charizardita X / Y)
  PKX.stonesForSpecies = id => PKX.ALL
    .filter(q => q.id === id && (q.isMega || q.isPrimal) && PKX.MEGA_STONES[q.uid])
    .map(q => ({ form: q, stone: PKX.MEGA_STONES[q.uid] }));
  // Dado un objeto equipado, devuelve la forma que activa (o null)
  PKX.formFromItem = (id, item) => {
    if (!item) return null;
    const it = PKX.norm(item);
    const hit = PKX.stonesForSpecies(id).find(s => it.includes(PKX.norm(s.stone.n)) || it.includes(PKX.norm(s.stone.en)));
    return hit ? hit.form : null;
  };

  PKX.abilityInfo = slug => (window.ABILITIES || {})[slug] || { n: slug, d: '' };
  PKX.kind = p => (p.base.x ? p.base.x.k : 0);
  PKX.info = p => p.base.x || {};
  PKX.formsOf = p => PKX.ORDERED.filter(q => q.id === p.id);
  PKX.artworkOf = (p, shiny) => (shiny ? p.shinyArtwork : p.artwork);

  PKX.descriptionOf = function (p) {
    if (!p.isForm) return p.description;
    const b = p.base;
    if (!p.isMega) {
      const ab0 = p.abilities.map(a => PKX.abilityInfo(a.slug).n).join(' / ');
      let t0;
      if (p.isGmax) t0 = `Forma Gigamax de ${b.name}, alcanzada al dinamaxizarse en la región de Galar. Adquiere un aspecto colosal y accede a sus exclusivos movimientos G-Max.`;
      else if (p.isPrimal) t0 = `Regresión Primigenia de ${b.name}, que recupera su poder ancestral al sostener el ${(PKX.stoneOf(p) || {}).n || 'orbe'}. Sus estadísticas totales pasan de ${b.stats.total} a ${p.stats.total}.`;
      else t0 = `Variante regional de ${b.name} (${p.name.replace(b.name, '').trim()}), adaptada al entorno de su región con un aspecto y estadísticas propias (total ${p.stats.total}).`;
      if (p.types.join() !== b.types.join()) t0 += ` Su tipo es ${p.types.map(t => PKX.TYPE_NAMES[t]).join('/')}.`;
      return `${t0} Habilidades: ${ab0}.`;
    }
    const ab = p.abilities.map(a => PKX.abilityInfo(a.slug).n).join(' / ');
    let txt = `Forma Megaevolucionada de ${b.name}. Sus estadísticas totales pasan de ${b.stats.total} a ${p.stats.total}`;
    if (p.types.join() !== b.types.join()) txt += ` y su tipo cambia a ${p.types.map(t => PKX.TYPE_NAMES[t]).join('/')}`;
    txt += `. Su habilidad es ${ab}.`;
    if (p.isZA) txt += ' Esta Megaevolución debutó en Leyendas Pokémon: Z-A.';
    return txt;
  };

  // ==========================================
  // ESTADO PERSISTENTE & GESTIÓN DE EQUIPOS (SHOWDOWN STYLE)
  // ==========================================
  function load(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* noop */ }
  }

  // Una forma de combate (Mega, Gigamax, Primigenia) no se elige directamente:
  // se usa el Pokémon base y, si corresponde, se le equipa la megapiedra / orbe.
  PKX.resolveTeamForm = function (uid) {
    const p = PKX.BY_UID[uid];
    if (!p || !p.battleOnly) return { uid, item: '' };
    const stone = PKX.stoneOf(p);
    return { uid: p.base.uid, item: stone ? stone.n : '' };
  };

  PKX.createDefaultMember = function (uidIn) {
    const resolved = PKX.resolveTeamForm(uidIn);
    const uid = resolved.uid;
    const p = PKX.BY_UID[uid];
    const firstAb = (p && p.abilities && p.abilities[0] && p.abilities[0].slug) || '';
    // Auto populate up to 4 moves from learnset if available
    const moves = [];
    if (window.LEARNSETS) {
      const ls = window.LEARNSETS[uid] || window.LEARNSETS[p ? p.id : 0];
      if (ls && ls.l && ls.l.length) {
        // Grab up to 4 distinct powerful/latest level-up or machine moves
        const allM = [...ls.l.map(x => x[0]), ...(ls.m || [])];
        for (const mId of allM) {
          if (!moves.includes(mId) && window.MOVES && window.MOVES[mId]) {
            moves.push(mId);
            if (moves.length >= 4) break;
          }
        }
      }
    }
    return {
      uid: uid,
      level: 50,
      item: resolved.item,
      ability: firstAb,
      nature: 0, // Fuerte (neutra)
      moves: moves, // up to 4 move IDs
      ivs: [31, 31, 31, 31, 31, 31],
      evs: [0, 0, 0, 0, 0, 0],
      shiny: false
    };
  };

  // Migración de equipos: aseguramos array de equipos
  function initTeams() {
    let savedTeams = load('pokedex_teams', null);
    if (!savedTeams || !Array.isArray(savedTeams) || savedTeams.length === 0) {
      // Mirar si había un equipo viejo 'pokedex_team'
      const oldTeam = load('pokedex_team', []);
      const defaultMembers = [];
      if (Array.isArray(oldTeam)) {
        oldTeam.forEach(u => {
          if (PKX.BY_UID[u]) defaultMembers.push(PKX.createDefaultMember(u));
        });
      }
      savedTeams = [
        {
          id: 'team_default',
          name: 'Mi Equipo 1',
          members: defaultMembers.slice(0, 6)
        }
      ];
      save('pokedex_teams', savedTeams);
    }
    // Migración: miembros guardados como Mega/Gigamax pasan a su forma base + piedra
    savedTeams.forEach(t => (t.members || []).forEach(m => {
      const p = PKX.BY_UID[m.uid];
      if (!p || !p.battleOnly) return;
      const r = PKX.resolveTeamForm(m.uid);
      m.uid = r.uid;
      if (!m.item) m.item = r.item;
      const base = PKX.BY_UID[r.uid];
      if (base && !base.abilities.some(a => a.slug === m.ability)) m.ability = base.abilities[0].slug;
    }));
    return savedTeams;
  }

  const initialTeams = initTeams();
  let activeTeamId = load('pokedex_active_team_id', initialTeams[0].id);
  if (!initialTeams.some(t => t.id === activeTeamId)) {
    activeTeamId = initialTeams[0].id;
  }

  PKX.state = {
    favorites: new Set(load('pokedex_kanto_favorites', [])),
    teams: initialTeams,
    activeTeamId: activeTeamId,
    compare: [],
    shiny: !!load('pokedex_shiny', false),
    theme: load('pokedex_theme', null)
  };

  // Property getter for PKX.state.team for backwards compatibility
  Object.defineProperty(PKX.state, 'team', {
    get() {
      const active = PKX.getActiveTeam();
      return (active && active.members) ? active.members.map(m => m.uid) : [];
    }
  });

  const listeners = [];
  PKX.onChange = fn => listeners.push(fn);
  PKX.emit = () => listeners.forEach(fn => fn());

  PKX.getTeams = () => PKX.state.teams;
  PKX.getActiveTeam = () => {
    return PKX.state.teams.find(t => t.id === PKX.state.activeTeamId) || PKX.state.teams[0];
  };

  PKX.saveTeams = () => {
    save('pokedex_teams', PKX.state.teams);
    save('pokedex_active_team_id', PKX.state.activeTeamId);
    PKX.emit();
  };

  PKX.setActiveTeam = id => {
    if (PKX.state.teams.some(t => t.id === id)) {
      PKX.state.activeTeamId = id;
      PKX.saveTeams();
    }
  };

  PKX.createTeam = (name = 'Nuevo Equipo') => {
    const newTeam = {
      id: 'team_' + Date.now(),
      name: name.trim() || 'Nuevo Equipo',
      members: []
    };
    PKX.state.teams.push(newTeam);
    PKX.state.activeTeamId = newTeam.id;
    PKX.saveTeams();
    PKX.toast(`Equipo "${newTeam.name}" creado`);
    return newTeam;
  };

  PKX.renameTeam = (teamId, newName) => {
    const t = PKX.state.teams.find(x => x.id === teamId);
    if (t && newName && newName.trim()) {
      t.name = newName.trim();
      PKX.saveTeams();
      PKX.toast('Equipo renombrado');
    }
  };

  PKX.duplicateTeam = teamId => {
    const t = PKX.state.teams.find(x => x.id === teamId);
    if (!t) return;
    const cloned = {
      id: 'team_' + Date.now(),
      name: t.name + ' (Copia)',
      members: JSON.parse(JSON.stringify(t.members))
    };
    PKX.state.teams.push(cloned);
    PKX.state.activeTeamId = cloned.id;
    PKX.saveTeams();
    PKX.toast(`Equipo duplicado como "${cloned.name}"`);
  };

  PKX.deleteTeam = teamId => {
    if (PKX.state.teams.length <= 1) {
      PKX.toast('No puedes borrar el único equipo');
      return;
    }
    const idx = PKX.state.teams.findIndex(x => x.id === teamId);
    if (idx >= 0) {
      const removed = PKX.state.teams.splice(idx, 1)[0];
      if (PKX.state.activeTeamId === teamId) {
        PKX.state.activeTeamId = PKX.state.teams[0].id;
      }
      PKX.saveTeams();
      PKX.toast(`Equipo "${removed.name}" eliminado`);
    }
  };

  PKX.teamSetMember = (slotIndex, uid) => {
    const team = PKX.getActiveTeam();
    if (!team) return;
    const newMember = PKX.createDefaultMember(uid);
    if (slotIndex < team.members.length) {
      team.members[slotIndex] = newMember;
    } else {
      team.members.push(newMember);
    }
    PKX.saveTeams();
    PKX.toast(`${PKX.BY_UID[newMember.uid].name}${newMember.item ? ' @ ' + newMember.item : ''} asignado al espacio ${slotIndex + 1}`);
  };

  PKX.teamRemoveSlot = slotIndex => {
    const team = PKX.getActiveTeam();
    if (!team || !team.members[slotIndex]) return;
    const removed = team.members.splice(slotIndex, 1)[0];
    PKX.saveTeams();
    PKX.toast(`${PKX.BY_UID[removed.uid].name} quitado del equipo`);
  };

  PKX.teamUpdateMember = (slotIndex, updates) => {
    const team = PKX.getActiveTeam();
    if (!team || !team.members[slotIndex]) return;
    Object.assign(team.members[slotIndex], updates);
    PKX.saveTeams();
  };

  PKX.teamAdd = uidIn => {
    const team = PKX.getActiveTeam();
    if (!team) return false;
    const uid = PKX.resolveTeamForm(uidIn).uid;
    if (team.members.some(m => m.uid === uid)) {
      PKX.toast('Ya está en este equipo');
      return false;
    }
    if (team.members.length >= 6) {
      PKX.toast('El equipo ya tiene 6 Pokémon');
      return false;
    }
    const nm = PKX.createDefaultMember(uidIn);
    team.members.push(nm);
    PKX.saveTeams();
    PKX.toast(`${PKX.BY_UID[uid].name}${nm.item ? ' @ ' + nm.item : ''} se unió a "${team.name}"`);
    return true;
  };

  PKX.teamRemove = uid => {
    const team = PKX.getActiveTeam();
    if (!team) return;
    const idx = team.members.findIndex(m => m.uid === uid);
    if (idx >= 0) {
      team.members.splice(idx, 1);
      PKX.saveTeams();
    }
  };

  PKX.toggleFav = uid => {
    const f = PKX.state.favorites;
    f.has(uid) ? f.delete(uid) : f.add(uid);
    save('pokedex_kanto_favorites', [...f]);
    PKX.emit();
  };

  PKX.toggleCompare = uid => {
    const c = PKX.state.compare;
    const i = c.indexOf(uid);
    if (i >= 0) c.splice(i, 1);
    else if (c.length >= 3) { PKX.toast('Máximo 3 Pokémon para comparar'); return; }
    else c.push(uid);
    PKX.emit();
  };

  PKX.setCompare = list => { PKX.state.compare = list.slice(0, 3); PKX.emit(); };
  PKX.setShiny = v => { PKX.state.shiny = v; save('pokedex_shiny', v); PKX.emit(); };
  PKX.setTheme = t => {
    PKX.state.theme = t;
    save('pokedex_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#f3f5fa' : '#0a0d14');
  };

  // ==========================================
  // STATS FORMULA (Gen 3 - Gen 9)
  // ==========================================
  PKX.calcStat = function (base, iv, ev, level, natureMult, isHp) {
    const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
    if (isHp) return base === 1 ? 1 : core + level + 10;
    return Math.floor((core + 5) * natureMult);
  };

  PKX.calculateMemberStats = function (member) {
    if (!member) return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, total: 0 };
    const p = PKX.BY_UID[member.uid];
    if (!p) return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, total: 0 };
    const natIdx = typeof member.nature === 'number' ? member.nature : 0;
    const n = PKX.NATURES[natIdx] || PKX.NATURES[0];
    const L = Math.max(1, Math.min(100, parseInt(member.level, 10) || 50));
    const ivs = Array.isArray(member.ivs) ? member.ivs : [31, 31, 31, 31, 31, 31];
    const evs = Array.isArray(member.evs) ? member.evs : [0, 0, 0, 0, 0, 0];

    const vals = PKX.STAT_KEYS.map((k, i) => {
      const base = (p.statsArr && p.statsArr[i] !== undefined) ? p.statsArr[i] : (p.stats[k] || 0);
      let mult = 1.0;
      if (n.plus === i && n.minus !== i) mult = 1.1;
      else if (n.minus === i && n.plus !== i) mult = 0.9;
      return PKX.calcStat(base, ivs[i] !== undefined ? ivs[i] : 31, evs[i] !== undefined ? evs[i] : 0, L, mult, i === 0);
    });

    const total = vals.reduce((a, b) => a + b, 0);
    return {
      hp: vals[0],
      atk: vals[1],
      def: vals[2],
      spa: vals[3],
      spd: vals[4],
      spe: vals[5],
      total: total,
      0: vals[0],
      1: vals[1],
      2: vals[2],
      3: vals[3],
      4: vals[4],
      5: vals[5]
    };
  };

  // ==========================================
  // SHOWDOWN EXPORT / IMPORT
  // ==========================================
  PKX.exportTeamShowdown = function (team) {
    if (!team || !team.members || !team.members.length) return '';
    const statLabelsShowdown = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

    return team.members.map(m => {
      const p = PKX.BY_UID[m.uid];
      if (!p) return '';
      let out = p.name;
      if (m.item) {
        // Limpiar traducción entre paréntesis si está presente
        const itemClean = m.item.replace(/\s*\(.*?\)/, '').trim();
        out += ` @ ${itemClean}`;
      }
      out += '\n';

      if (m.ability) {
        const abInfo = PKX.abilityInfo(m.ability);
        out += `Ability: ${abInfo.n || m.ability}\n`;
      }
      if (m.level && m.level !== 100) {
        out += `Level: ${m.level}\n`;
      }
      if (m.shiny) {
        out += `Shiny: Yes\n`;
      }

      // EVs
      if (m.evs && m.evs.some(v => v > 0)) {
        const evParts = [];
        m.evs.forEach((v, i) => {
          if (v > 0) evParts.push(`${v} ${statLabelsShowdown[i]}`);
        });
        if (evParts.length) out += `EVs: ${evParts.join(' / ')}\n`;
      }

      // Nature
      const natIdx = m.nature !== undefined ? m.nature : 0;
      const nat = PKX.NATURES[natIdx] || PKX.NATURES[0];
      out += `${nat.en || 'Hardy'} Nature\n`;

      // IVs (solo mostrar si alguno no es 31)
      if (m.ivs && m.ivs.some(v => v < 31)) {
        const ivParts = [];
        m.ivs.forEach((v, i) => {
          if (v < 31) ivParts.push(`${v} ${statLabelsShowdown[i]}`);
        });
        if (ivParts.length) out += `IVs: ${ivParts.join(' / ')}\n`;
      }

      // Moves
      if (m.moves && m.moves.length) {
        m.moves.forEach(mId => {
          const mv = window.MOVES && window.MOVES[mId];
          if (mv) out += `- ${mv.n}\n`;
        });
      }

      return out.trim();
    }).filter(Boolean).join('\n\n');
  };

  PKX.importTeamShowdown = function (text, newTeamName) {
    if (!text || !text.trim()) return null;
    const blocks = text.trim().split(/\n\s*\n+/);
    const members = [];
    const statMap = { hp: 0, atk: 1, def: 2, spa: 3, spd: 4, spe: 5 };

    for (const b of blocks) {
      if (members.length >= 6) break;
      const lines = b.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      const first = lines[0];
      let pkmPart = first;
      let item = '';
      if (first.includes('@')) {
        const parts = first.split('@');
        pkmPart = parts[0].trim();
        item = parts.slice(1).join('@').trim();
      }

      let speciesName = pkmPart;
      const parenMatch = pkmPart.match(/\(([^)]+)\)/);
      if (parenMatch) speciesName = parenMatch[1].trim();

      const cleanName = PKX.norm(speciesName);
      const compact = s => PKX.norm(s).replace(/[^a-z0-9]/g, '');
      let foundPkm = PKX.ORDERED.find(p => PKX.norm(p.name) === cleanName);
      if (!foundPkm) {
        foundPkm = PKX.ORDERED.find(p => compact(p.name) === compact(speciesName));
      }
      // Formato Showdown de formas de combate: "Charizard-Mega-X", "Kyogre-Primal", "Snorlax-Gmax"
      if (!foundPkm) {
        const fm = speciesName.match(/^(.+?)-(Mega(?:-[XYZ])?|Primal|Gmax)$/i);
        if (fm) {
          const base = PKX.ORDERED.find(p => !p.isForm && compact(p.name) === compact(fm[1]));
          if (base) {
            const suf = (fm[2].split('-')[1] || '').toUpperCase();
            const kind = fm[2].toLowerCase().split('-')[0];
            foundPkm = PKX.ALL.find(q => q.id === base.id && (kind === 'mega' ? q.isMega && (suf ? q.name.endsWith(' ' + suf) : !/ [XYZ]$/.test(q.name)) : kind === 'primal' ? q.isPrimal : q.isGmax)) || base;
          }
        }
      }
      if (!foundPkm) continue;
      // Las formas de combate se guardan como base + megapiedra/orbe
      if (foundPkm.battleOnly) {
        const r = PKX.resolveTeamForm(foundPkm.uid);
        if (!item) item = r.item;
        foundPkm = PKX.BY_UID[r.uid];
      }

      let level = 100;
      let shiny = false;
      let ability = (foundPkm.abilities && foundPkm.abilities[0] && foundPkm.abilities[0].slug) || '';
      let nature = 0;
      const evs = [0, 0, 0, 0, 0, 0];
      const ivs = [31, 31, 31, 31, 31, 31];
      const moves = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^Ability:/i.test(line)) {
          const abStr = line.replace(/^Ability:\s*/i, '').trim();
          const abSlug = Object.keys(window.ABILITIES || {}).find(s => {
            const inf = window.ABILITIES[s];
            return PKX.norm(inf.n) === PKX.norm(abStr) || PKX.norm(s) === PKX.norm(abStr);
          });
          if (abSlug) ability = abSlug;
          else if (foundPkm.abilities) {
            const m = foundPkm.abilities.find(a => PKX.norm(a.slug) === PKX.norm(abStr));
            if (m) ability = m.slug;
          }
        } else if (/^Level:/i.test(line)) {
          level = parseInt(line.replace(/^Level:\s*/i, ''), 10) || 100;
        } else if (/^Shiny:\s*Yes/i.test(line)) {
          shiny = true;
        } else if (/^EVs:/i.test(line)) {
          const parts = line.replace(/^EVs:\s*/i, '').split('/');
          parts.forEach(p => {
            const m = p.trim().match(/^(\d+)\s+([A-Za-z]+)$/);
            if (m) {
              const val = parseInt(m[1], 10) || 0;
              const k = m[2].toLowerCase();
              if (statMap[k] !== undefined) evs[statMap[k]] = val;
            }
          });
        } else if (/^IVs:/i.test(line)) {
          const parts = line.replace(/^IVs:\s*/i, '').split('/');
          parts.forEach(p => {
            const m = p.trim().match(/^(\d+)\s+([A-Za-z]+)$/);
            if (m) {
              const val = parseInt(m[1], 10) || 0;
              const k = m[2].toLowerCase();
              if (statMap[k] !== undefined) ivs[statMap[k]] = val;
            }
          });
        } else if (/Nature$/i.test(line)) {
          const natName = line.replace(/\s*Nature$/i, '').trim();
          const nIdx = PKX.NATURES.findIndex(n => PKX.norm(n.en) === PKX.norm(natName) || PKX.norm(n.name) === PKX.norm(natName));
          if (nIdx >= 0) nature = nIdx;
        } else if (line.startsWith('-')) {
          const moveName = line.replace(/^-\s*/, '').trim();
          if (window.MOVES) {
            const mId = Object.keys(window.MOVES).find(id => {
              const mv = window.MOVES[id];
              return PKX.norm(mv.n) === PKX.norm(moveName);
            });
            if (mId && moves.length < 4) moves.push(mId);
          }
        }
      }

      members.push({
        uid: foundPkm.uid,
        level: Math.max(1, Math.min(100, level)),
        item: item,
        ability: ability,
        nature: nature,
        moves: moves,
        evs: evs,
        ivs: ivs,
        shiny: shiny
      });
    }

    if (!members.length) {
      PKX.toast('No se reconocieron Pokémon en el texto ingresado');
      return null;
    }

    if (newTeamName) {
      const newTeam = {
        id: 'team_' + Date.now(),
        name: newTeamName.trim() || 'Equipo Importado',
        members: members
      };
      PKX.state.teams.push(newTeam);
      PKX.state.activeTeamId = newTeam.id;
    } else {
      const active = PKX.getActiveTeam();
      if (active) active.members = members;
    }

    PKX.saveTeams();
    PKX.toast(`¡Equipo importado (${members.length}/6 Pokémon)!`);
    return members;
  };

  // ==========================================
  // AUDIO
  // ==========================================
  let playingBtn = null;
  function stopState() { if (playingBtn) { playingBtn.classList.remove('playing'); playingBtn = null; } }
  PKX.playCry = function (uid, btn) {
    const audio = PKX.$('cry-audio-player');
    if (!audio) return;
    stopState();
    const p = PKX.BY_UID[uid];
    let fallback = false;
    audio.src = `${CRIES}${uid}.ogg`;
    if (btn) { btn.classList.add('playing'); playingBtn = btn; }
    audio.onerror = () => {
      if (p && p.isMega && !fallback) { fallback = true; audio.src = `${CRIES}${p.id}.ogg`; audio.play().catch(stopState); }
      else stopState();
    };
    audio.onended = stopState;
    audio.play().catch(stopState);
  };

  // ==========================================
  // SELECTOR (buscador desplegable de Pokémon)
  // ==========================================
  PKX.picker = function (onSelect, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'picker';
    wrap.innerHTML = `
      <input type="text" class="picker-input" placeholder="${opts.placeholder || 'Buscar Pokémon por nombre o número…'}" autocomplete="off" spellcheck="false">
      <div class="picker-results" hidden></div>`;
    const input = wrap.querySelector('input');
    const box = wrap.querySelector('.picker-results');
    function render() {
      const q = PKX.norm(input.value.trim().replace('#', ''));
      if (!q) { box.hidden = true; return; }
      const res = PKX.ORDERED.filter(p => !(opts.teamMode && p.battleOnly) && (p.search.includes(q) || String(p.id) === q || String(p.id).padStart(3, '0').startsWith(q))).slice(0, 8);
      box.innerHTML = res.length
        ? res.map(p => `
          <button type="button" class="picker-item" data-uid="${p.uid}">
            <img src="${p.sprite}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
            <span class="pi-name">${p.name}</span>
            <span class="pi-id">${PKX.pad(p.id)}</span>
            <span class="pi-types">${p.types.map(t => `<i style="background:${PKX.TYPE_COLORS[t]}"></i>`).join('')}</span>
          </button>`).join('')
        : '<div class="picker-empty">Sin resultados</div>';
      box.hidden = false;
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    box.addEventListener('mousedown', e => {
      const b = e.target.closest('.picker-item');
      if (!b) return;
      e.preventDefault();
      onSelect(+b.dataset.uid);
      input.value = '';
      box.hidden = true;
    });
    input.addEventListener('blur', () => setTimeout(() => (box.hidden = true), 120));
    return wrap;
  };

  // Modal Picker for Slot selection
  PKX.openSlotPickerModal = function (onPick) {
    let modal = document.getElementById('slot-picker-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'slot-picker-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-card slot-picker-card">
          <div class="modal-header">
            <h3 class="modal-title-clean">Elegir Pokémon para el Equipo</h3>
            <button class="modal-icon-btn close-icon-btn" id="slot-picker-close">✕</button>
          </div>
          <div class="slot-picker-search-bar" style="margin:0.8rem 0 0.4rem;">
            <input type="text" id="slot-picker-input" placeholder="Buscar por nombre o número (ej. Gengar, #094, Lucario)…" autocomplete="off">
          </div>
          <div class="slot-picker-filter-chips" id="slot-picker-chips">
            <button type="button" class="sp-chip active" data-sp-gen="0">Todas (1-IX)</button>
            <button type="button" class="sp-chip" data-sp-gen="1">Gen I (Kanto)</button>
            <button type="button" class="sp-chip" data-sp-gen="2">Gen II (Johto)</button>
            <button type="button" class="sp-chip" data-sp-gen="3">Gen III (Hoenn)</button>
            <button type="button" class="sp-chip" data-sp-gen="4">Gen IV (Sinnoh)</button>
            <button type="button" class="sp-chip" data-sp-gen="5">Gen V (Teselia)</button>
            <button type="button" class="sp-chip" data-sp-gen="6">Gen VI (Kalos)</button>
            <button type="button" class="sp-chip" data-sp-gen="7">Gen VII (Alola)</button>
            <button type="button" class="sp-chip" data-sp-gen="8">Gen VIII (Galar)</button>
            <button type="button" class="sp-chip" data-sp-gen="9">Gen IX (Paldea)</button>
            <button type="button" class="sp-chip" data-sp-gen="regional">🗺️ Regionales</button>
          </div>
          <div class="slot-picker-grid" id="slot-picker-grid"></div>
        </div>`;
      document.body.appendChild(modal);

      const close = () => { modal.classList.remove('open'); modal.hidden = true; };
      modal.querySelector('#slot-picker-close').addEventListener('click', close);
      modal.addEventListener('click', e => { if (e.target === modal) close(); });
    }

    const input = modal.querySelector('#slot-picker-input');
    const grid = modal.querySelector('#slot-picker-grid');
    const chipsWrap = modal.querySelector('#slot-picker-chips');
    input.value = '';
    let selectedGen = '0';
    let currentEntries = [];
    let visibleCount = 80;

    chipsWrap.querySelectorAll('.sp-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.spGen === '0');
    });

    chipsWrap.onclick = e => {
      const btn = e.target.closest('.sp-chip');
      if (!btn) return;
      chipsWrap.querySelectorAll('.sp-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      selectedGen = btn.dataset.spGen;
      visibleCount = 80;
      updateEntries();
    };

    function renderItemHTML({ p, item, via }) {
      return `
        <button type="button" class="slot-pick-item ${via ? 'with-stone' : ''}" data-uid="${via ? via.uid : p.uid}" style="--c:${PKX.TYPE_COLORS[p.types[0]]}" title="${via ? `${p.name} con ${item} (megaevoluciona en combate)` : p.name}">
          <img src="${p.sprite}" alt="${p.name}" loading="lazy" onerror="this.style.visibility='hidden'">
          <span class="spi-name">${p.name}</span>
          <span class="spi-id">${via ? `💎 ${PKX.esc(item)}` : PKX.pad(p.id)}</span>
        </button>`;
    }

    function updateEntries() {
      const q = PKX.norm(input.value.trim().replace('#', ''));
      const match = p => !q || p.search.includes(q) || String(p.id) === q || String(p.id).padStart(3, '0').startsWith(q);
      
      let pool = PKX.ORDERED.filter(p => !p.battleOnly);
      if (selectedGen === 'regional') {
        pool = pool.filter(p => p.isRegional);
      } else if (selectedGen !== '0') {
        const gNum = +selectedGen;
        pool = pool.filter(p => p.gen === gNum && !p.isRegional);
      }
      
      currentEntries = pool.filter(match).map(p => ({ p, item: '' }));

      // Si se busca explícitamente una Mega o Primigenia, se ofrece la especie base con la piedra
      if (q) {
        PKX.ORDERED.filter(p => (p.isMega || p.isPrimal) && p.search.includes(q)).forEach(f => {
          const st = PKX.stoneOf(f);
          if (st) currentEntries.push({ p: f.base, item: st.n, via: f });
        });
      }

      grid.scrollTop = 0;
      if (!currentEntries.length) {
        grid.innerHTML = '<p class="muted" style="grid-column:1/-1;text-align:center;padding:2rem;">Sin resultados para esta búsqueda</p>';
        return;
      }

      const chunk = currentEntries.slice(0, visibleCount);
      grid.innerHTML = chunk.map(renderItemHTML).join('');
    }

    grid.onscroll = () => {
      if (grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 160) {
        if (visibleCount < currentEntries.length) {
          const nextChunk = currentEntries.slice(visibleCount, visibleCount + 80);
          visibleCount += 80;
          const temp = document.createElement('div');
          temp.innerHTML = nextChunk.map(renderItemHTML).join('');
          while (temp.firstChild) {
            grid.appendChild(temp.firstChild);
          }
        }
      }
    };

    updateEntries();
    input.oninput = () => { visibleCount = 80; updateEntries(); };

    grid.onclick = e => {
      const b = e.target.closest('.slot-pick-item');
      if (!b) return;
      const uid = +b.dataset.uid;
      modal.classList.remove('open');
      modal.hidden = true;
      onPick(uid);
    };

    modal.hidden = false;
    modal.classList.add('open');
    setTimeout(() => input.focus(), 50);
  };

  // Tema inicial
  PKX.setTheme(PKX.state.theme || 'dark');
})();

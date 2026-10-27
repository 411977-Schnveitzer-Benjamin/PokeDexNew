/**
 * Pokédex Nacional - Herramientas: Comparador, Tabla de tipos y Creador de equipos.
 */
(function () {
  'use strict';
  const { $, pad, esc, TYPE_COLORS, TYPE_NAMES, TYPES, STAT_KEYS, STAT_LABELS } = PKX;
  const S = PKX.state;
  const tools = (PKX.tools = {});

  const mcls = m => (m === 0 ? 'm0' : m === 0.25 ? 'm025' : m === 0.5 ? 'm05' : m === 2 ? 'm2' : m === 4 ? 'm4' : 'm1');
  const miniType = t => `<span class="mu-type" style="background:${TYPE_COLORS[t]}" title="${TYPE_NAMES[t]}">${TYPE_NAMES[t].slice(0, 3).toUpperCase()}</span>`;
  const statColor = v => (v >= 100 ? '#22c55e' : v >= 70 ? '#eab308' : v >= 45 ? '#f97316' : '#ef4444');

  // =====================================================
  // COMPARADOR
  // =====================================================
  tools.compare = function (idsFromHash) {
    const root = $('view-compare');
    if (idsFromHash && idsFromHash.length) {
      const ids = idsFromHash.filter(u => PKX.BY_UID[u]).slice(0, 3);
      S.compare = ids;
    }
    const list = S.compare.map(u => PKX.BY_UID[u]).filter(Boolean);

    root.innerHTML = `
      <div class="page-head">
        <h2 class="page-title">Comparador</h2>
        <p class="muted">Compará hasta 3 Pokémon lado a lado. Resaltamos el mejor valor de cada estadística.</p>
      </div>
      <div class="picker-row" id="cmp-picker-slot"></div>
      <div id="cmp-body"></div>`;

    const slot = $('cmp-picker-slot');
    slot.appendChild(PKX.picker(uid => {
      if (S.compare.includes(uid)) { PKX.toast('Ya está en el comparador'); return; }
      if (S.compare.length >= 3) { PKX.toast('Máximo 3 Pokémon'); return; }
      S.compare.push(uid);
      PKX.emit();
    }, { placeholder: 'Agregar Pokémon al comparador…' }));

    const body = $('cmp-body');
    if (!list.length) {
      body.innerHTML = `<div class="d-card center"><p class="muted">Todavía no elegiste Pokémon. Buscalos arriba o tocá el ícono 📊 en cualquier tarjeta de la Pokédex.</p><a href="#/" class="btn-primary inline">Ir a la Pokédex</a></div>`;
      return;
    }

    const best = key => Math.max(...list.map(p => p.stats[key]));
    const cols = `style="--n:${list.length}"`;

    const head = list.map(p => {
      const c = TYPE_COLORS[p.types[0]];
      return `
      <div class="cmp-card" style="--c:${c}">
        <button class="cmp-remove" data-rm="${p.uid}" title="Quitar" aria-label="Quitar ${p.name}">✕</button>
        <a href="#/pokemon/${p.uid}" class="cmp-art"><img src="${PKX.artworkOf(p, S.shiny)}" alt="${p.name}" onerror="this.onerror=null;this.src='${p.sprite}'"></a>
        <a href="#/pokemon/${p.uid}" class="cmp-name">${p.name}</a>
        <span class="muted small">${pad(p.id)} · ${p.category}</span>
        <div class="cmp-types">${p.types.map(t => PKX.typePill(t)).join('')}</div>
      </div>`;
    }).join('');

    const statRows = STAT_KEYS.concat('total').map((k, i) => {
      const label = k === 'total' ? 'Total (BST)' : STAT_LABELS[i];
      const max = best(k);
      const scale = k === 'total' ? 720 : 200;
      const cells = list.map(p => {
        const v = p.stats[k];
        const isBest = v === max && list.length > 1 && list.some(q => q.stats[k] !== v);
        return `<div class="cmp-cell ${isBest ? 'best' : ''}">
          <div class="cmp-bar"><span style="width:${Math.min(100, (v / scale) * 100)}%;background:${k === 'total' ? 'linear-gradient(90deg,#3b4cca,#00d2ff)' : statColor(v)}"></span></div>
          <strong>${v}</strong>
        </div>`;
      }).join('');
      return `<div class="cmp-row"><div class="cmp-label">${label}</div><div class="cmp-cells" ${cols}>${cells}</div></div>`;
    }).join('');

    const extra = (label, fn) =>
      `<div class="cmp-row"><div class="cmp-label">${label}</div><div class="cmp-cells" ${cols}>${list.map(p => `<div class="cmp-cell left">${fn(p)}</div>`).join('')}</div></div>`;

    const weakFn = p => {
      const d = PKX.defense(p.types);
      const w = TYPES.filter(t => d[t] > 1);
      return w.length ? w.map(t => `${miniType(t)}<small class="${mcls(d[t])} wm">${PKX.fmtMult(d[t])}</small>`).join(' ') : '<span class="muted">—</span>';
    };
    const resFn = p => {
      const d = PKX.defense(p.types);
      const r = TYPES.filter(t => d[t] < 1);
      return r.length ? r.map(t => `${miniType(t)}<small class="${mcls(d[t])} wm">${PKX.fmtMult(d[t])}</small>`).join(' ') : '<span class="muted">—</span>';
    };

    body.innerHTML = `
      <div class="cmp-grid">
        <div class="cmp-row head"><div class="cmp-label"></div><div class="cmp-cells" ${cols}>${head}</div></div>
        ${statRows}
        ${extra('Altura', p => p.height.toFixed(1) + ' m')}
        ${extra('Peso', p => p.weight.toFixed(1) + ' kg')}
        ${extra('Habilidades', p => p.abilities.map(a => `<div class="cmp-ab ${a.hidden ? 'hid' : ''}" title="${esc(PKX.abilityInfo(a.slug).d)}">${PKX.abilityInfo(a.slug).n}${a.hidden ? ' <em>(oculta)</em>' : ''}</div>`).join(''))}
        ${extra('Débil contra', weakFn)}
        ${extra('Resiste', resFn)}
      </div>`;

    body.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
      const i = S.compare.indexOf(+b.dataset.rm);
      if (i >= 0) S.compare.splice(i, 1);
      PKX.emit();
    }));
  };

  // =====================================================
  // TABLA DE TIPOS
  // =====================================================
  let selectedType = null;

  function groupFor(types) {
    const d = PKX.defense(types);
    const g = { m4: [], m2: [], m05: [], m025: [], m0: [] };
    TYPES.forEach(t => { const m = d[t]; if (m !== 1) g[mcls(m)].push(t); });
    return g;
  }
  function chipGroup(label, arr, cls, mult) {
    if (!arr.length) return '';
    return `<div class="tp-group"><span class="tp-label ${cls}">${label}</span><div>${arr.map(t => `<span class="type-pill" style="background:${TYPE_COLORS[t]}">${TYPE_NAMES[t]}${mult ? ` <b>${mult}</b>` : ''}</span>`).join('')}</div></div>`;
  }

  function typePanel(t) {
    if (!t) return '<p class="muted">Tocá un tipo en la tabla (en la fila o columna) para ver su detalle.</p>';
    const off = { m2: [], m05: [], m0: [] };
    TYPES.forEach(d => {
      const m = PKX.TYPE_CHART[d][t];
      if (m === 2) off.m2.push(d); else if (m === 0.5) off.m05.push(d); else if (m === 0) off.m0.push(d);
    });
    const def = groupFor([t]);
    const count = PKX.ALL.filter(p => !p.isMega && p.types.includes(t)).length;
    return `
      <div class="tp-head" style="--c:${TYPE_COLORS[t]}">
        ${PKX.typePill(t, true)}
        <span class="muted">${count} Pokémon de este tipo (formas base)</span>
        <button class="btn-primary inline" id="tp-show">Ver Pokémon de tipo ${TYPE_NAMES[t]}</button>
      </div>
      <div class="tp-cols">
        <div><h4>Como atacante</h4>
          ${chipGroup('Súper efectivo (×2) contra', off.m2, 'm2')}
          ${chipGroup('Poco efectivo (×½) contra', off.m05, 'm05')}
          ${chipGroup('Sin efecto (×0) contra', off.m0, 'm0')}
        </div>
        <div><h4>Como defensor</h4>
          ${chipGroup('Débil (×2) contra', def.m2, 'm2')}
          ${chipGroup('Resiste (×½) a', def.m05, 'm05')}
          ${chipGroup('Inmune (×0) a', def.m0, 'm0')}
        </div>
      </div>`;
  }

  tools.types = function () {
    const root = $('view-types');
    const head = TYPES.map(t => `<th data-t="${t}" class="th-type" title="Defensor: ${TYPE_NAMES[t]}">${miniType(t)}</th>`).join('');
    const rows = TYPES.map((atk, r) => `
      <tr>
        <th data-t="${atk}" class="th-type row" title="Atacante: ${TYPE_NAMES[atk]}">${miniType(atk)}</th>
        ${TYPES.map((def, c) => {
          const m = PKX.TYPE_CHART[def][atk];
          const v = m === undefined ? 1 : m;
          return `<td data-r="${r}" data-c="${c}" class="tc ${mcls(v)}" title="${TYPE_NAMES[atk]} → ${TYPE_NAMES[def]}: ×${v}">${v === 1 ? '' : PKX.fmtMult(v)}</td>`;
        }).join('')}
      </tr>`).join('');

    const opts = '<option value="">—</option>' + TYPES.map(t => `<option value="${t}">${TYPE_NAMES[t]}</option>`).join('');

    root.innerHTML = `
      <div class="page-head">
        <h2 class="page-title">Tabla de tipos</h2>
        <p class="muted">Filas: tipo del <b>ataque</b>. Columnas: tipo del <b>defensor</b>. Pasá el mouse para resaltar, tocá un tipo para ver detalle.</p>
      </div>
      <div class="d-card types-card">
        <div class="types-scroll">
          <table class="type-table" id="type-table"><thead><tr><th class="corner"><small>ATQ ↓ / DEF →</small></th>${head}</tr></thead><tbody>${rows}</tbody></table>
        </div>
        <div class="mu-legend"><span class="mu-val m2">2</span> súper efectivo <span class="mu-val m05">½</span> poco efectivo <span class="mu-val m0">0</span> sin efecto</div>
      </div>
      <div class="d-card" id="type-panel">${typePanel(selectedType)}</div>
      <div class="d-card">
        <h3 class="d-title"><span>Calculadora de tipo doble</span></h3>
        <div class="dual-calc">
          <label>Tipo 1 <select id="dc-1">${opts}</select></label>
          <label>Tipo 2 <select id="dc-2">${opts}</select></label>
        </div>
        <div id="dc-result"><p class="muted">Elegí uno o dos tipos para ver cómo defienden.</p></div>
      </div>`;

    const table = $('type-table');
    table.addEventListener('mouseover', e => {
      const td = e.target.closest('td.tc');
      table.querySelectorAll('.hl-row,.hl-col').forEach(x => x.classList.remove('hl-row', 'hl-col'));
      if (!td) return;
      const r = td.dataset.r, c = td.dataset.c;
      table.querySelectorAll(`td[data-r="${r}"]`).forEach(x => x.classList.add('hl-row'));
      table.querySelectorAll(`td[data-c="${c}"]`).forEach(x => x.classList.add('hl-col'));
    });
    table.addEventListener('mouseleave', () => table.querySelectorAll('.hl-row,.hl-col').forEach(x => x.classList.remove('hl-row', 'hl-col')));
    table.addEventListener('click', e => {
      const th = e.target.closest('th.th-type');
      if (!th) return;
      selectedType = th.dataset.t;
      $('type-panel').innerHTML = typePanel(selectedType);
      bindPanel();
      $('type-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    function bindPanel() {
      const b = $('tp-show');
      if (b) b.addEventListener('click', () => { PKX.home.showType(selectedType); location.hash = '#/'; });
    }
    bindPanel();

    function dual() {
      const t = [$('dc-1').value, $('dc-2').value].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
      const out = $('dc-result');
      if (!t.length) { out.innerHTML = '<p class="muted">Elegí uno o dos tipos para ver cómo defienden.</p>'; return; }
      const g = groupFor(t);
      out.innerHTML = `<div class="tp-head">${t.map(x => PKX.typePill(x, true)).join('')}</div>` +
        chipGroup('Débil ×4 contra', g.m4, 'm4') + chipGroup('Débil ×2 contra', g.m2, 'm2') +
        chipGroup('Resiste ×½ a', g.m05, 'm05') + chipGroup('Resiste ×¼ a', g.m025, 'm025') + chipGroup('Inmune ×0 a', g.m0, 'm0') +
        `<p class="muted small">${PKX.ALL.filter(p => !p.isMega && t.every(x => p.types.includes(x)) && p.types.length === t.length).length} Pokémon con esta combinación.</p>`;
    }
    $('dc-1').addEventListener('change', dual);
    $('dc-2').addEventListener('change', dual);
  };

  // =====================================================
  // EQUIPO & TEAMBUILDER SHOWDOWN
  // =====================================================
  tools.team = function () {
    const root = $('view-team');
    const activeTeam = PKX.getActiveTeam() || PKX.getTeams()[0];
    const allTeams = PKX.getTeams();
    const members = (activeTeam && activeTeam.members) ? activeTeam.members : [];

    root.innerHTML = `
      <div class="page-head">
        <div class="team-header-row">
          <div>
            <h2 class="page-title">Creador de Equipos <span class="nav-count">${members.length}/6</span></h2>
            <p class="muted">Diseña tus equipos competitivos estilo Pokémon Showdown: personaliza IVs, EVs, naturalezas, habilidades y movimientos.</p>
          </div>
        </div>
      </div>

      <!-- Barra de gestión de múltiples equipos -->
      <div class="team-manager-bar d-card">
        <div class="team-select-group">
          <label for="team-select" class="team-label">Equipo:</label>
          <select id="team-select" class="team-select-dropdown">
            ${allTeams.map(t => `<option value="${t.id}" ${t.id === activeTeam.id ? 'selected' : ''}>${esc(t.name)} (${t.members.length}/6)</option>`).join('')}
          </select>
        </div>
        <div class="team-actions-row">
          <button id="team-new-btn" class="team-btn" title="Crear un nuevo equipo">➕ Nuevo</button>
          <button id="team-rename-btn" class="team-btn" title="Renombrar este equipo">✏️ Renombrar</button>
          <button id="team-dup-btn" class="team-btn" title="Duplicar este equipo">📋 Duplicar</button>
          <button id="team-del-btn" class="team-btn danger" title="Eliminar este equipo" ${allTeams.length <= 1 ? 'disabled' : ''}>🗑️ Borrar</button>
          <button id="team-export-btn" class="team-btn primary" title="Exportar a formato Showdown">📤 Exportar Showdown</button>
          <button id="team-import-btn" class="team-btn secondary" title="Importar texto de Showdown">📥 Importar</button>
        </div>
      </div>

      <!-- Buscador rápido para añadir al equipo -->
      <div class="picker-row" id="team-picker-slot"></div>

      <!-- 6 Espacios interactivos del equipo -->
      <div class="team-slots-grid" id="team-slots"></div>

      <!-- Análisis y debilidades del equipo -->
      <div id="team-analysis"></div>`;

    // Buscador rápido
    $('team-picker-slot').appendChild(PKX.picker(uid => PKX.teamAdd(uid), { placeholder: 'Buscar y agregar Pokémon al equipo…' }));

    // Eventos de barra de equipos
    $('team-select').addEventListener('change', e => PKX.setActiveTeam(e.target.value));
    
    $('team-new-btn').addEventListener('click', () => {
      const name = prompt('Nombre para el nuevo equipo:', `Equipo ${allTeams.length + 1}`);
      if (name && name.trim()) PKX.createTeam(name.trim());
    });

    $('team-rename-btn').addEventListener('click', () => {
      const newName = prompt('Nuevo nombre del equipo:', activeTeam.name);
      if (newName && newName.trim()) PKX.renameTeam(activeTeam.id, newName.trim());
    });

    $('team-dup-btn').addEventListener('click', () => PKX.duplicateTeam(activeTeam.id));

    $('team-del-btn').addEventListener('click', () => {
      if (allTeams.length <= 1) {
        PKX.toast('No puedes eliminar el único equipo');
        return;
      }
      if (confirm(`¿Seguro que deseas eliminar el equipo "${activeTeam.name}"?`)) {
        PKX.deleteTeam(activeTeam.id);
      }
    });

    $('team-export-btn').addEventListener('click', () => openShowdownExportModal(activeTeam));
    $('team-import-btn').addEventListener('click', () => openShowdownImportModal());

    // Renderizado de los 6 espacios interactivos
    const slotsContainer = $('team-slots');
    slotsContainer.innerHTML = Array.from({ length: 6 }, (_, i) => {
      const member = members[i];
      if (!member || !PKX.BY_UID[member.uid]) {
        // Espacio vacío interactivo que abre el selector
        return `
          <button type="button" class="team-slot-card empty interactive" data-slot="${i}" aria-label="Espacio ${i + 1} vacío, clic para elegir Pokémon">
            <div class="slot-add-circle">+</div>
            <strong class="slot-slot-title">Espacio ${i + 1}</strong>
            <span class="slot-sub-hint">Toca para elegir Pokémon</span>
          </button>`;
      }

      const p = PKX.BY_UID[member.uid];
      const stats = PKX.calculateMemberStats(member);
      const nature = PKX.NATURES[member.nature || 0] || PKX.NATURES[0];
      const abilityName = (p.abilities && p.abilities.find(a => a.slug === member.ability)?.name) || member.ability || 'Habilidad';
      const c = TYPE_COLORS[p.types[0]];
      const isShiny = member.shiny || false;

      // Obtener nombres de movimientos
      const moveChips = (member.moves || []).slice(0, 4).map(mId => {
        const mObj = window.MOVES ? window.MOVES[mId] : null;
        if (!mObj) return `<span class="slot-move-chip empty">—</span>`;
        return `<span class="slot-move-chip" style="--mc:${TYPE_COLORS[mObj.type]}">${esc(mObj.name)}</span>`;
      });
      while (moveChips.length < 4) {
        moveChips.push(`<span class="slot-move-chip empty">—</span>`);
      }

      return `
        <div class="team-slot-card filled" style="--c:${c}" data-slot-card="${i}">
          <div class="slot-top-bar">
            <span class="slot-badge-idx">#${i + 1}</span>
            <div class="slot-top-actions">
              <button class="slot-icon-action" data-change-slot="${i}" title="Cambiar este Pokémon">⇄</button>
              <button class="slot-icon-action danger" data-rm-slot="${i}" title="Quitar del equipo">✕</button>
            </div>
          </div>

          <div class="slot-main-info">
            <div class="slot-avatar-wrap">
              <img src="${PKX.artworkOf(p, isShiny)}" alt="${p.name}" class="slot-avatar" onerror="this.onerror=null;this.src='${p.sprite}'">
              ${isShiny ? '<span class="slot-shiny-sparkle" title="Shiny">✨</span>' : ''}
            </div>
            <div class="slot-meta">
              <a href="#/pokemon/${p.uid}" class="slot-pk-name">${p.name}</a>
              <div class="slot-types">${p.types.map(t => PKX.typePill(t)).join('')}</div>
              <div class="slot-item-line"><small>Objeto:</small> <b>${member.item || 'Ninguno'}</b></div>
              <div class="slot-detail-line"><small>Nv. ${member.level || 50}</small> · <small>${esc(nature.name)}</small></div>
              <div class="slot-detail-line"><small>Hab:</small> <b>${esc(abilityName)}</b></div>
            </div>
          </div>

          <div class="slot-moves-section">
            <div class="slot-moves-label">Movimientos:</div>
            <div class="slot-moves-grid">${moveChips.join('')}</div>
          </div>

          <div class="slot-stats-preview">
            <div class="s-prev-item" title="Puntos de Salud"><small>PS</small><b>${stats.hp}</b></div>
            <div class="s-prev-item" title="Ataque"><small>Atq</small><b>${stats.atk}</b></div>
            <div class="s-prev-item" title="Defensa"><small>Def</small><b>${stats.def}</b></div>
            <div class="s-prev-item" title="Ataque Especial"><small>At.Esp</small><b>${stats.spa}</b></div>
            <div class="s-prev-item" title="Defensa Especial"><small>Def.Esp</small><b>${stats.spd}</b></div>
            <div class="s-prev-item" title="Velocidad"><small>Vel</small><b>${stats.spe}</b></div>
          </div>

          <div class="slot-bottom-actions">
            <button class="btn-primary slot-edit-btn" data-edit-slot="${i}">
              ⚙️ Personalizar (Showdown)
            </button>
          </div>
        </div>`;
    }).join('');

    // Eventos de los espacios
    // 1. Clic en espacio vacío: abre modal de elección para esa posición exacta
    slotsContainer.querySelectorAll('.team-slot-card.empty').forEach(b => {
      b.addEventListener('click', () => {
        const slotIdx = +b.dataset.slot;
        PKX.openSlotPickerModal(uid => PKX.teamSetMember(slotIdx, uid));
      });
    });

    // 2. Clic en cambiar Pokémon de un espacio ocupado
    slotsContainer.querySelectorAll('[data-change-slot]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        const slotIdx = +b.dataset.changeSlot;
        PKX.openSlotPickerModal(uid => PKX.teamSetMember(slotIdx, uid));
      });
    });

    // 3. Clic en quitar Pokémon de un espacio ocupado
    slotsContainer.querySelectorAll('[data-rm-slot]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        const slotIdx = +b.dataset.rmSlot;
        PKX.teamRemoveSlot(slotIdx);
      });
    });

    // 4. Clic en personalizar Pokémon (abre modal Showdown)
    slotsContainer.querySelectorAll('[data-edit-slot]').forEach(b => {
      b.addEventListener('click', () => {
        const slotIdx = +b.dataset.editSlot;
        openShowdownEditorModal(slotIdx);
      });
    });

    // ==========================================
    // ANÁLISIS DEL EQUIPO (Debilidades y Coberturas)
    // ==========================================
    const analysisRoot = $('team-analysis');
    const validPokemon = members.map(m => PKX.BY_UID[m.uid]).filter(Boolean);

    if (!validPokemon.length) {
      analysisRoot.innerHTML = `
        <div class="d-card center">
          <p class="muted">Tu equipo está vacío. Toca cualquier <b>Espacio 1 al 6</b> o busca arriba para añadir Pokémon.</p>
        </div>`;
      return;
    }

    const defs = validPokemon.map(p => PKX.defense(p.types));
    const rows = TYPES.map(t => {
      const ms = defs.map(d => d[t]);
      const weak = ms.filter(m => m > 1).length;
      const res = ms.filter(m => m < 1).length;
      return { t, ms, weak, res };
    });

    const table = `
      <div class="types-scroll"><table class="team-table">
        <thead><tr><th>Tipo atacante</th>${validPokemon.map(p => `<th><img src="${p.sprite}" alt="${p.name}" title="${p.name}" onerror="this.style.visibility='hidden'"></th>`).join('')}<th class="w">Débiles</th><th class="r">Resisten</th></tr></thead>
        <tbody>${rows.map(r => `
          <tr class="${r.weak > r.res ? 'danger' : r.weak === 0 && r.res > 0 ? 'safe' : ''}">
            <td>${miniType(r.t)} ${TYPE_NAMES[r.t]}</td>
            ${r.ms.map(m => `<td class="tc ${mcls(m)}">${m === 1 ? '' : PKX.fmtMult(m)}</td>`).join('')}
            <td class="num w">${r.weak || ''}</td><td class="num r">${r.res || ''}</td>
          </tr>`).join('')}</tbody>
      </table></div>`;

    const bad = rows.filter(r => r.weak >= 3 || (r.weak > r.res && r.weak >= 2)).sort((a, b) => b.weak - a.weak);
    const safe = rows.filter(r => r.res >= 2 && r.weak === 0);
    const alerts = `
      <div class="team-alerts">
        ${bad.length ? `<div class="alert danger"><strong>⚠ Puntos débiles del equipo</strong><div>${bad.map(r => `${miniType(r.t)} <small>${r.weak} débiles / ${r.res} resisten</small>`).join(' ')}</div></div>` : '<div class="alert safe"><strong>✓ Sin debilidades compartidas graves</strong></div>'}
        ${safe.length ? `<div class="alert safe"><strong>🛡 Bien cubierto contra</strong><div>${safe.map(r => miniType(r.t)).join(' ')}</div></div>` : ''}
      </div>`;

    const teamTypes = [...new Set(validPokemon.flatMap(p => p.types))];
    const covered = TYPES.filter(def => teamTypes.some(atk => PKX.TYPE_CHART[def][atk] >= 2));
    const uncovered = TYPES.filter(t => !covered.includes(t));
    const cover = `
      <div class="d-card">
        <h3 class="d-title"><span>Cobertura ofensiva (STAB)</span><span class="total-bst-badge">${covered.length}/18 tipos</span></h3>
        <p class="muted small">Tipos a los que tu equipo golpea súper efectivo con los tipos base de sus Pokémon.</p>
        <div class="cover-row">${covered.map(t => `<span class="type-pill" style="background:${TYPE_COLORS[t]}">${TYPE_NAMES[t]}</span>`).join('')}</div>
        ${uncovered.length ? `<p class="muted small" style="margin-top:0.75rem;">Sin cobertura súper efectiva contra:</p><div class="cover-row dim">${uncovered.map(t => `<span class="type-pill" style="background:${TYPE_COLORS[t]}">${TYPE_NAMES[t]}</span>`).join('')}</div>` : ''}
      </div>`;

    // Estadísticas promedio de combate (con stats reales calculadas)
    const calcStatsList = members.map(m => PKX.calculateMemberStats(m));
    const avgCalc = statName => Math.round(calcStatsList.reduce((acc, curr) => acc + (curr[statName] || 0), 0) / calcStatsList.length);
    const avgBST = Math.round(calcStatsList.reduce((acc, curr) => acc + (curr.total || 0), 0) / calcStatsList.length);

    const statsHTML = `
      <div class="d-card">
        <h3 class="d-title"><span>Estadísticas de combate promedio</span><span class="total-bst-badge">BST medio: ${avgBST}</span></h3>
        <p class="muted small">Calculadas al nivel y con los IVs/EVs configurados en cada Pokémon.</p>
        ${['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((k, i) => {
          const v = avgCalc(k);
          return `
            <div class="stat-row">
              <span class="stat-name">${STAT_LABELS[i]}</span>
              <span class="stat-number">${v}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width:${Math.min(100, (v / 220) * 100)}%;background:${statColor(v > 100 ? 100 : v * 0.7)}"></div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    analysisRoot.innerHTML = `
      <div class="d-card"><h3 class="d-title"><span>Debilidades y resistencias en conjunto</span></h3>${alerts}${table}</div>
      <div class="detail-grid">${cover}${statsHTML}</div>`;
  };

  // =====================================================
  // MODAL SHOWDOWN CUSTOMIZER (IVs, EVs, Moves, Nature...)
  // =====================================================
  function openShowdownEditorModal(slotIndex) {
    const activeTeam = PKX.getActiveTeam();
    if (!activeTeam || !activeTeam.members[slotIndex]) return;
    const member = activeTeam.members[slotIndex];
    const p = PKX.BY_UID[member.uid];
    if (!p) return;

    // Asegurar estructura
    if (!member.ivs) member.ivs = [31, 31, 31, 31, 31, 31];
    if (!member.evs) member.evs = [0, 0, 0, 0, 0, 0];
    if (!member.moves) member.moves = [];

    let modal = $('showdown-customizer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'showdown-customizer-modal';
      modal.className = 'modal-backdrop showdown-modal-backdrop';
      document.body.appendChild(modal);
    }

    // Movimientos que el Pokémon aprende
    const learnsetIds = [];
    if (window.LEARNSETS) {
      const ls = window.LEARNSETS[p.uid] || window.LEARNSETS[p.id];
      if (ls) {
        if (ls.l) ls.l.forEach(x => { if (!learnsetIds.includes(x[0])) learnsetIds.push(x[0]); });
        if (ls.m) ls.m.forEach(x => { if (!learnsetIds.includes(x)) learnsetIds.push(x); });
        if (ls.e) ls.e.forEach(x => { if (!learnsetIds.includes(x)) learnsetIds.push(x); });
        if (ls.t) ls.t.forEach(x => { if (!learnsetIds.includes(x)) learnsetIds.push(x); });
      }
    }
    // Si no hay learnset o faltan, fallback con moves conocidos
    const availableMoves = learnsetIds.map(mId => window.MOVES ? window.MOVES[mId] : null).filter(Boolean);
    availableMoves.sort((a, b) => a.name.localeCompare(b.name));

    // Renderizado del modal
    modal.innerHTML = `
      <div class="modal-card showdown-modal-card">
        <div class="showdown-modal-header">
          <div class="sd-header-info">
            <span class="sd-pkm-id">${pad(p.id)}</span>
            <h3 class="sd-pkm-name">${p.name}</h3>
            <div class="sd-pkm-types">${p.types.map(t => PKX.typePill(t)).join('')}</div>
          </div>
          <button class="modal-icon-btn close-icon-btn" id="sd-modal-close">✕</button>
        </div>

        <div class="showdown-modal-body">
          <!-- Columna 1: General (Sprite, Nivel, Shiny, Objeto, Habilidad, Naturaleza) -->
          <div class="sd-col sd-general-col">
            <div class="sd-artwork-box" style="--c:${TYPE_COLORS[p.types[0]]}">
              <img id="sd-art-img" src="${PKX.artworkOf(p, member.shiny)}" alt="${p.name}">
              <button type="button" id="sd-shiny-toggle" class="sd-shiny-btn ${member.shiny ? 'active' : ''}">
                ✨ Shiny: <b>${member.shiny ? 'SÍ' : 'NO'}</b>
              </button>
            </div>

            <div class="sd-form-group">
              <label for="sd-level-input">Nivel (1-100):</label>
              <input type="number" id="sd-level-input" min="1" max="100" value="${member.level || 50}" class="sd-input">
            </div>

            <div class="sd-form-group">
              <label for="sd-item-input">Objeto equipado:</label>
              <input type="text" id="sd-item-input" list="sd-items-list" value="${esc(member.item || '')}" placeholder="Ej: Leftovers, Choice Band..." class="sd-input">
              <datalist id="sd-items-list">
                ${PKX.COMPETITIVE_ITEMS.map(it => `<option value="${it}">`).join('')}
              </datalist>
            </div>

            <div class="sd-form-group">
              <label for="sd-ability-select">Habilidad:</label>
              <select id="sd-ability-select" class="sd-select">
                ${(p.abilities || []).map(ab => `
                  <option value="${ab.slug}" ${ab.slug === member.ability ? 'selected' : ''}>
                    ${esc(ab.name)} ${ab.is_hidden ? '(Oculta)' : ''}
                  </option>`).join('')}
              </select>
              <div id="sd-ability-desc" class="sd-desc-box"></div>
            </div>

            <div class="sd-form-group">
              <label for="sd-nature-select">Naturaleza:</label>
              <select id="sd-nature-select" class="sd-select">
                ${PKX.NATURES.map((nat, nIdx) => {
                  let hint = 'Neutra';
                  if (nat.plus !== null) {
                    const statsShort = ['PS', 'Atq', 'Def', 'At.Esp', 'Def.Esp', 'Vel'];
                    hint = `+${statsShort[nat.plus]} / -${statsShort[nat.minus]}`;
                  }
                  return `<option value="${nIdx}" ${nIdx === (member.nature || 0) ? 'selected' : ''}>${esc(nat.name)} (${hint})</option>`;
                }).join('')}
              </select>
            </div>
          </div>

          <!-- Columna 2: Movimientos (4 slots con learnset) -->
          <div class="sd-col sd-moves-col">
            <h4 class="sd-section-title">Movimientos (hasta 4)</h4>
            <p class="muted small">Selecciona de los movimientos que ${p.name} puede aprender en los juegos oficiales.</p>
            
            <div class="sd-moves-selectors">
              ${[0, 1, 2, 3].map(mIdx => {
                const currentMoveId = (member.moves && member.moves[mIdx]) || '';
                return `
                  <div class="sd-move-slot-row" data-move-idx="${mIdx}">
                    <span class="sd-m-badge">#${mIdx + 1}</span>
                    <select class="sd-select sd-move-picker" data-slot="${mIdx}">
                      <option value="">— Sin movimiento —</option>
                      ${availableMoves.map(m => `
                        <option value="${m.id}" ${m.id === currentMoveId ? 'selected' : ''}>
                          ${esc(m.name)} [${TYPE_NAMES[m.type] || m.type}] (${m.category}) - Pot: ${m.power || '—'}
                        </option>`).join('')}
                    </select>
                    <div class="sd-move-detail" id="sd-move-detail-${mIdx}"></div>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Columna 3: IVs y EVs (Sliders interactivos y stats calculadas en vivo) -->
          <div class="sd-col sd-stats-col">
            <div class="sd-stats-header">
              <h4 class="sd-section-title">Valores de Esfuerzo (EVs) y Genéticos (IVs)</h4>
              <div class="sd-ev-budget" id="sd-ev-budget">
                EVs restantes: <strong id="sd-ev-left">510</strong> / 510
              </div>
            </div>

            <!-- Presets de EVs e IVs -->
            <div class="sd-presets-bar">
              <span class="muted small">Presets de EVs:</span>
              <button type="button" class="sd-preset-chip" id="preset-phys-atk">Atacante Físico (252 Atq / 252 Vel)</button>
              <button type="button" class="sd-preset-chip" id="preset-spec-atk">Atacante Especial (252 At.Esp / 252 Vel)</button>
              <button type="button" class="sd-preset-chip" id="preset-phys-def">Tanque Físico (252 PS / 252 Def)</button>
              <button type="button" class="sd-preset-chip" id="preset-spec-def">Tanque Especial (252 PS / 252 Def.Esp)</button>
              <button type="button" class="sd-preset-chip danger" id="preset-zero-evs">Limpiar EVs (0)</button>
            </div>
            <div class="sd-presets-bar" style="margin-top:0.35rem;">
              <span class="muted small">Presets de IVs:</span>
              <button type="button" class="sd-preset-chip" id="preset-all-31">31 en todo (Perfecto)</button>
              <button type="button" class="sd-preset-chip" id="preset-zero-atk">0 Atq (Anti Foul-Play)</button>
              <button type="button" class="sd-preset-chip" id="preset-zero-spe">0 Vel (Trick Room)</button>
            </div>

            <div class="sd-stats-table">
              <div class="sd-st-head">
                <span>Stat</span>
                <span>Base</span>
                <span>EVs (0-252)</span>
                <span>IVs (0-31)</span>
                <span>Total</span>
              </div>
              ${['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((stKey, i) => {
                const baseVal = p.stats[stKey] || 0;
                return `
                  <div class="sd-st-row" data-stat-idx="${i}" data-stat-key="${stKey}">
                    <div class="sd-st-name" id="sd-name-${i}">
                      <strong>${STAT_LABELS[i]}</strong>
                      <span class="sd-nat-mod" id="sd-nat-mod-${i}"></span>
                    </div>
                    <div class="sd-st-base">${baseVal}</div>
                    <div class="sd-st-ev">
                      <input type="range" min="0" max="252" step="4" value="${member.evs[i]}" class="sd-range" id="sd-ev-range-${i}">
                      <input type="number" min="0" max="252" step="4" value="${member.evs[i]}" class="sd-num-sm" id="sd-ev-num-${i}">
                    </div>
                    <div class="sd-st-iv">
                      <input type="number" min="0" max="31" value="${member.ivs[i]}" class="sd-num-sm" id="sd-iv-num-${i}">
                    </div>
                    <div class="sd-st-total" id="sd-total-${i}">—</div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="showdown-modal-footer">
          <button type="button" class="btn-primary" id="sd-save-btn">Guardar y Cerrar</button>
        </div>
      </div>`;

    // Helpers de actualización reactiva en vivo dentro del modal
    function updateAbilityDesc() {
      const slug = $('sd-ability-select').value;
      const ab = (p.abilities || []).find(a => a.slug === slug);
      const descEl = $('sd-ability-desc');
      if (ab && ab.desc) {
        descEl.textContent = ab.desc;
        descEl.style.display = 'block';
      } else {
        descEl.style.display = 'none';
      }
    }

    function updateMoveDetails() {
      [0, 1, 2, 3].forEach(idx => {
        const sel = modal.querySelector(`.sd-move-picker[data-slot="${idx}"]`);
        const mId = sel.value;
        const detEl = $(`sd-move-detail-${idx}`);
        if (!mId || !window.MOVES || !window.MOVES[mId]) {
          detEl.innerHTML = '';
          return;
        }
        const m = window.MOVES[mId];
        detEl.innerHTML = `
          <span class="type-pill" style="background:${TYPE_COLORS[m.type]}">${TYPE_NAMES[m.type] || m.type}</span>
          <span class="sd-move-cat">${m.category}</span>
          <span>Pot: <b>${m.power || '—'}</b></span>
          <span>Prec: <b>${m.accuracy ? m.accuracy + '%' : '—'}</b></span>
          <span>PP: <b>${m.pp}</b></span>
          ${m.desc ? `<div class="sd-m-desc">${esc(m.desc)}</div>` : ''}
        `;
      });
    }

    function syncAndRecalculate() {
      // Leer valores
      const level = Math.max(1, Math.min(100, parseInt($('sd-level-input').value, 10) || 50));
      const natureIdx = parseInt($('sd-nature-select').value, 10) || 0;
      const nat = PKX.NATURES[natureIdx] || PKX.NATURES[0];

      let totalEvs = 0;
      const evs = [];
      const ivs = [];

      for (let i = 0; i < 6; i++) {
        const evVal = Math.max(0, Math.min(252, parseInt($(`sd-ev-num-${i}`).value, 10) || 0));
        const ivVal = Math.max(0, Math.min(31, parseInt($(`sd-iv-num-${i}`).value, 10) || 0));
        evs.push(evVal);
        ivs.push(ivVal);
        totalEvs += evVal;

        // Indicador de naturaleza
        const modEl = $(`sd-nat-mod-${i}`);
        if (nat.plus === i && nat.minus !== i) {
          modEl.textContent = '▲ (+10%)';
          modEl.className = 'sd-nat-mod plus';
        } else if (nat.minus === i && nat.plus !== i) {
          modEl.textContent = '▼ (-10%)';
          modEl.className = 'sd-nat-mod minus';
        } else {
          modEl.textContent = '';
          modEl.className = 'sd-nat-mod';
        }
      }

      // Presupuesto de EVs
      const remainingEvs = 510 - totalEvs;
      const leftEl = $('sd-ev-left');
      const budgetBox = $('sd-ev-budget');
      leftEl.textContent = remainingEvs;
      if (remainingEvs < 0) {
        budgetBox.classList.add('over-budget');
        leftEl.textContent = `¡Excedido por ${Math.abs(remainingEvs)}!`;
      } else {
        budgetBox.classList.remove('over-budget');
      }

      // Calcular stats usando PKX.calculateMemberStats
      const tempMember = {
        uid: member.uid,
        level: level,
        nature: natureIdx,
        ivs: ivs,
        evs: evs
      };
      const calculated = PKX.calculateMemberStats(tempMember);
      const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
      keys.forEach((k, i) => {
        $(`sd-total-${i}`).textContent = calculated[k];
      });
    }

    // Vincular inputs
    for (let i = 0; i < 6; i++) {
      const range = $(`sd-ev-range-${i}`);
      const num = $(`sd-ev-num-${i}`);
      const ivNum = $(`sd-iv-num-${i}`);

      range.addEventListener('input', () => {
        num.value = range.value;
        syncAndRecalculate();
      });
      num.addEventListener('input', () => {
        range.value = num.value;
        syncAndRecalculate();
      });
      ivNum.addEventListener('input', syncAndRecalculate);
    }

    $('sd-level-input').addEventListener('input', syncAndRecalculate);
    $('sd-nature-select').addEventListener('change', syncAndRecalculate);
    $('sd-ability-select').addEventListener('change', updateAbilityDesc);

    modal.querySelectorAll('.sd-move-picker').forEach(sel => {
      sel.addEventListener('change', updateMoveDetails);
    });

    // Shiny toggle
    $('sd-shiny-toggle').addEventListener('click', () => {
      member.shiny = !member.shiny;
      const btn = $('sd-shiny-toggle');
      btn.classList.toggle('active', member.shiny);
      btn.innerHTML = `✨ Shiny: <b>${member.shiny ? 'SÍ' : 'NO'}</b>`;
      $('sd-art-img').src = PKX.artworkOf(p, member.shiny);
    });

    // Presets de EVs
    function setEvPreset(evArray) {
      for (let i = 0; i < 6; i++) {
        $(`sd-ev-range-${i}`).value = evArray[i];
        $(`sd-ev-num-${i}`).value = evArray[i];
      }
      syncAndRecalculate();
    }

    function setIvPreset(ivArray) {
      for (let i = 0; i < 6; i++) {
        $(`sd-iv-num-${i}`).value = ivArray[i];
      }
      syncAndRecalculate();
    }

    $('preset-phys-atk').addEventListener('click', () => setEvPreset([4, 252, 0, 0, 0, 252]));
    $('preset-spec-atk').addEventListener('click', () => setEvPreset([4, 0, 0, 252, 0, 252]));
    $('preset-phys-def').addEventListener('click', () => setEvPreset([252, 0, 252, 0, 4, 0]));
    $('preset-spec-def').addEventListener('click', () => setEvPreset([252, 0, 4, 0, 252, 0]));
    $('preset-zero-evs').addEventListener('click', () => setEvPreset([0, 0, 0, 0, 0, 0]));

    $('preset-all-31').addEventListener('click', () => setIvPreset([31, 31, 31, 31, 31, 31]));
    $('preset-zero-atk').addEventListener('click', () => setIvPreset([31, 0, 31, 31, 31, 31]));
    $('preset-zero-spe').addEventListener('click', () => setIvPreset([31, 31, 31, 31, 31, 0]));

    // Guardar cambios al cerrar
    function saveMemberData() {
      const level = Math.max(1, Math.min(100, parseInt($('sd-level-input').value, 10) || 50));
      const item = $('sd-item-input').value.trim();
      const ability = $('sd-ability-select').value;
      const nature = parseInt($('sd-nature-select').value, 10) || 0;
      const evs = [];
      const ivs = [];
      for (let i = 0; i < 6; i++) {
        evs.push(Math.max(0, Math.min(252, parseInt($(`sd-ev-num-${i}`).value, 10) || 0)));
        ivs.push(Math.max(0, Math.min(31, parseInt($(`sd-iv-num-${i}`).value, 10) || 0)));
      }
      const moves = [];
      modal.querySelectorAll('.sd-move-picker').forEach(sel => {
        if (sel.value && !moves.includes(sel.value)) moves.push(sel.value);
      });

      PKX.teamUpdateMember(slotIndex, {
        level: level,
        item: item,
        ability: ability,
        nature: nature,
        evs: evs,
        ivs: ivs,
        moves: moves,
        shiny: member.shiny
      });

      closeModal();
      PKX.toast(`${p.name} actualizado`);
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.hidden = true;
    }

    $('sd-save-btn').addEventListener('click', saveMemberData);
    $('sd-modal-close').addEventListener('click', saveMemberData);
    modal.addEventListener('click', e => { if (e.target === modal) saveMemberData(); });

    // Inicializar vistas
    updateAbilityDesc();
    updateMoveDetails();
    syncAndRecalculate();

    modal.hidden = false;
    modal.classList.add('open');
  }

  // =====================================================
  // MODAL EXPORTAR SHOWDOWN
  // =====================================================
  function openShowdownExportModal(team) {
    let modal = $('showdown-export-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'showdown-export-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const showdownText = PKX.exportTeamShowdown(team);

    modal.innerHTML = `
      <div class="modal-card showdown-io-card">
        <div class="modal-header">
          <h3 class="modal-title-clean">Exportar a Pokémon Showdown</h3>
          <button class="modal-icon-btn close-icon-btn" id="sd-export-close">✕</button>
        </div>
        <p class="muted small">Copia este formato estándar para importarlo directamente en Pokémon Showdown o compartirlo.</p>
        <textarea id="sd-export-textarea" class="sd-io-textarea" readonly>${esc(showdownText)}</textarea>
        <div class="modal-footer-btns">
          <button class="btn-primary" id="sd-copy-clipboard-btn">📋 Copiar al portapapeles</button>
          <button class="d-btn" id="sd-download-txt-btn">💾 Descargar .txt</button>
        </div>
      </div>`;

    const close = () => { modal.classList.remove('open'); modal.hidden = true; };
    modal.querySelector('#sd-export-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    modal.querySelector('#sd-copy-clipboard-btn').addEventListener('click', () => {
      const area = modal.querySelector('#sd-export-textarea');
      area.select();
      (navigator.clipboard ? navigator.clipboard.writeText(area.value) : Promise.reject())
        .then(() => PKX.toast('¡Equipo Showdown copiado al portapapeles!'))
        .catch(() => {
          document.execCommand('copy');
          PKX.toast('¡Equipo Showdown copiado al portapapeles!');
        });
    });

    modal.querySelector('#sd-download-txt-btn').addEventListener('click', () => {
      const blob = new Blob([showdownText], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${team.name.replace(/[^a-z0-9_-]/gi, '_')}_showdown.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      PKX.toast('Archivo .txt descargado');
    });

    modal.hidden = false;
    modal.classList.add('open');
  }

  // =====================================================
  // MODAL IMPORTAR SHOWDOWN
  // =====================================================
  function openShowdownImportModal() {
    let modal = $('showdown-import-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'showdown-import-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card showdown-io-card">
        <div class="modal-header">
          <h3 class="modal-title-clean">Importar de Pokémon Showdown</h3>
          <button class="modal-icon-btn close-icon-btn" id="sd-import-close">✕</button>
        </div>
        <p class="muted small">Pega el texto de tu equipo en formato Showdown. Crearemos un nuevo equipo automáticamente.</p>
        <div class="sd-form-group" style="margin-bottom:0.75rem;">
          <label for="sd-import-name">Nombre del nuevo equipo:</label>
          <input type="text" id="sd-import-name" value="Equipo Showdown" class="sd-input">
        </div>
        <textarea id="sd-import-textarea" class="sd-io-textarea" placeholder="Pikachu @ Light Ball
Ability: Lightning Rod
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Thunderbolt
- Volt Switch
- Grass Knot
- Protect"></textarea>
        <div class="modal-footer-btns">
          <button class="btn-primary" id="sd-do-import-btn">📥 Crear e importar equipo</button>
        </div>
      </div>`;

    const close = () => { modal.classList.remove('open'); modal.hidden = true; };
    modal.querySelector('#sd-import-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    modal.querySelector('#sd-do-import-btn').addEventListener('click', () => {
      const text = modal.querySelector('#sd-import-textarea').value.trim();
      const teamName = modal.querySelector('#sd-import-name').value.trim() || 'Equipo Showdown';
      if (!text) {
        PKX.toast('Pega el texto de Showdown primero');
        return;
      }
      const imported = PKX.importTeamShowdown(text, teamName);
      if (imported) {
        close();
      }
    });

    modal.hidden = false;
    modal.classList.add('open');
  }
})();

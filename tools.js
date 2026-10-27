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
          <button id="team-export-btn" class="team-btn" style="background:#dc2626;color:#fff;border-color:#ef4444;" title="Exportar equipo a formato Pokémon Showdown">📤 Exportar Showdown</button>
          <button id="team-import-btn" class="team-btn primary" title="Importar equipo desde Pokémon Showdown o archivo .txt">📥 Importar (.txt)</button>
        </div>
      </div>

      <!-- Buscador rápido para añadir al equipo -->
      <div class="picker-row" id="team-picker-slot"></div>

      <!-- 6 Espacios interactivos del equipo -->
      <div class="team-slots-grid" id="team-slots"></div>

      <!-- Análisis y debilidades del equipo -->
      <div id="team-analysis"></div>`;

    // Buscador rápido
    $('team-picker-slot').appendChild(PKX.picker(uid => {
      if (PKX.teamAdd(uid)) {
        tools.team();
      }
    }, { placeholder: 'Buscar y agregar Pokémon al equipo…', teamMode: true }));

    // Eventos de barra de equipos
    $('team-select').addEventListener('change', e => {
      PKX.setActiveTeam(e.target.value);
      tools.team();
    });
    
    // ABM con diálogos integrados (sin prompt ni confirm del navegador)
    $('team-new-btn').addEventListener('click', () => {
      openTeamDialog('new', `Equipo ${allTeams.length + 1}`, name => {
        PKX.createTeam(name);
        tools.team();
      });
    });

    $('team-rename-btn').addEventListener('click', () => {
      openTeamDialog('rename', activeTeam.name, newName => {
        PKX.renameTeam(activeTeam.id, newName);
        tools.team();
      });
    });

    $('team-dup-btn').addEventListener('click', () => {
      PKX.duplicateTeam(activeTeam.id);
      tools.team();
    });

    $('team-del-btn').addEventListener('click', () => {
      if (allTeams.length <= 1) {
        PKX.toast('No puedes eliminar el único equipo');
        return;
      }
      openTeamDialog('delete', activeTeam.name, () => {
        PKX.deleteTeam(activeTeam.id);
        tools.team();
      });
    });

    $('team-export-btn').addEventListener('click', () => openShowdownModal(activeTeam, 'export'));
    $('team-import-btn').addEventListener('click', () => openShowdownModal(activeTeam, 'import'));

    // Renderizado de los 6 espacios interactivos
    const slotsContainer = $('team-slots');
    slotsContainer.innerHTML = Array.from({ length: 6 }, (_, i) => {
      const member = members[i];
      if (!member || !PKX.BY_UID[member.uid]) {
        // Espacio vacío interactivo
        return `
          <button type="button" class="team-slot-card empty interactive" data-slot="${i}" aria-label="Espacio ${i + 1} vacío, clic para elegir Pokémon">
            <div class="slot-add-circle">+</div>
            <strong class="slot-slot-title">Espacio ${i + 1}</strong>
            <span class="slot-sub-hint">Toca para elegir Pokémon</span>
          </button>`;
      }

      const p = PKX.BY_UID[member.uid];
      const stats = PKX.calculateMemberStats(member);
      const natIdx = typeof member.nature === 'number' ? member.nature : 0;
      const nature = PKX.NATURES[natIdx] || PKX.NATURES[0];
      const abInfo = PKX.abilityInfo(member.ability);
      const abilityName = abInfo.n || member.ability || '---';
      const c = TYPE_COLORS[p.types[0]];
      const isShiny = member.shiny || false;

      // Obtener nombres de movimientos (sin undefined)
      const moveChips = [0, 1, 2, 3].map(mIdx => {
        const mId = member.moves && member.moves[mIdx];
        const mObj = (mId && window.MOVES) ? window.MOVES[mId] : null;
        if (!mObj) return `<span class="slot-move-chip empty">---</span>`;
        return `<span class="slot-move-chip" style="--mc:${TYPE_COLORS[mObj.t]}">${esc(mObj.n)}</span>`;
      });

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
              <div class="slot-item-line"><small>Objeto:</small> <b>${esc(member.item || '---')}</b></div>
              ${(() => { const f = PKX.formFromItem(p.id, member.item); return f ? `<div class="slot-detail-line"><span class="mega-tag mini">💎 ${f.isPrimal ? 'Regresión' : 'Mega'}: ${esc(f.name)}</span></div>` : ''; })()}
              <div class="slot-detail-line"><small>Nv. ${member.level || 50}</small> · <small>${esc(nature.name || '---')}</small></div>
              <div class="slot-detail-line"><small>Hab:</small> <b>${esc(abilityName)}</b></div>
            </div>
          </div>

          <div class="slot-moves-section">
            <div class="slot-moves-label">Movimientos:</div>
            <div class="slot-moves-grid">${moveChips.join('')}</div>
          </div>

          <div class="slot-stats-preview">
            <div class="s-prev-item" title="Puntos de Salud"><small>PS</small><b>${stats.hp !== undefined ? stats.hp : '---'}</b></div>
            <div class="s-prev-item" title="Ataque"><small>ATQ</small><b>${stats.atk !== undefined ? stats.atk : '---'}</b></div>
            <div class="s-prev-item" title="Defensa"><small>DEF</small><b>${stats.def !== undefined ? stats.def : '---'}</b></div>
            <div class="s-prev-item" title="Ataque Especial"><small>AT.ESP</small><b>${stats.spa !== undefined ? stats.spa : '---'}</b></div>
            <div class="s-prev-item" title="Defensa Especial"><small>DEF.ESP</small><b>${stats.spd !== undefined ? stats.spd : '---'}</b></div>
            <div class="s-prev-item" title="Velocidad"><small>VEL</small><b>${stats.spe !== undefined ? stats.spe : '---'}</b></div>
          </div>

          <div class="slot-bottom-actions">
            <button class="btn-primary slot-edit-btn" data-edit-slot="${i}">
              ⚙️ Personalizar (Showdown)
            </button>
          </div>
        </div>`;
    }).join('');

    // Eventos de los espacios
    // 1. Clic en espacio vacío: abre modal de elección
    slotsContainer.querySelectorAll('.team-slot-card.empty').forEach(b => {
      b.addEventListener('click', () => {
        const slotIdx = +b.dataset.slot;
        PKX.openSlotPickerModal(uid => {
          PKX.teamSetMember(slotIdx, uid);
          tools.team();
        });
      });
    });

    // 2. Clic en cambiar Pokémon
    slotsContainer.querySelectorAll('[data-change-slot]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        const slotIdx = +b.dataset.changeSlot;
        PKX.openSlotPickerModal(uid => {
          PKX.teamSetMember(slotIdx, uid);
          tools.team();
        });
      });
    });

    // 3. Clic en quitar Pokémon
    slotsContainer.querySelectorAll('[data-rm-slot]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        const slotIdx = +b.dataset.rmSlot;
        PKX.teamRemoveSlot(slotIdx);
        tools.team();
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
  // DIÁLOGOS DE EQUIPO (Nuevo, Renombrar, Eliminar)
  // =====================================================
  function openTeamDialog(action, initialValue, onConfirm) {
    let modal = $('team-dialog-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'team-dialog-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const isDelete = action === 'delete';
    const title = action === 'new' ? 'Crear Nuevo Equipo' : action === 'rename' ? 'Renombrar Equipo' : 'Eliminar Equipo';
    const placeholder = action === 'new' ? 'Nombre del nuevo equipo' : 'Nuevo nombre';

    modal.innerHTML = `
      <div class="modal-card" style="max-width:440px;width:90vw;">
        <div class="modal-header">
          <h3 class="modal-title-clean">${title}</h3>
          <button class="modal-icon-btn close-icon-btn" id="td-close">✕</button>
        </div>
        <div style="padding:1rem 0;">
          ${isDelete
            ? `<p>¿Estás seguro de que deseas eliminar el equipo <strong>"${esc(initialValue)}"</strong>? Esta acción no se puede deshacer.</p>`
            : `<label style="display:block;margin-bottom:0.5rem;font-size:0.82rem;font-weight:700;color:var(--text-dim);">NOMBRE DEL EQUIPO:</label>
               <input type="text" id="td-input" value="${esc(initialValue)}" placeholder="${placeholder}" class="sd-input" style="font-size:1rem;padding:0.75rem;">`
          }
        </div>
        <div class="modal-footer-btns">
          <button type="button" class="d-btn" id="td-cancel">Cancelar</button>
          <button type="button" class="btn-primary ${isDelete ? 'danger' : ''}" id="td-confirm">
            ${isDelete ? 'Sí, Eliminar' : action === 'new' ? 'Crear Equipo' : 'Guardar Nombre'}
          </button>
        </div>
      </div>`;

    const close = () => { modal.classList.remove('open'); modal.hidden = true; };
    modal.querySelector('#td-close').addEventListener('click', close);
    modal.querySelector('#td-cancel').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    const confirmBtn = modal.querySelector('#td-confirm');
    const input = modal.querySelector('#td-input');

    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') confirmBtn.click();
      });
    }

    confirmBtn.addEventListener('click', () => {
      if (isDelete) {
        close();
        onConfirm();
      } else {
        const val = input.value.trim();
        if (!val) {
          PKX.toast('Ingresa un nombre para el equipo');
          return;
        }
        close();
        onConfirm(val);
      }
    });

    modal.hidden = false;
    modal.classList.add('open');
    if (input) setTimeout(() => { input.focus(); input.select(); }, 50);
  }

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

    // Habilidades con nombre y descripción en español
    const pAbilities = (p.abilities || []).map(a => {
      const info = PKX.abilityInfo(a.slug);
      return {
        slug: a.slug,
        name: info.n || a.slug,
        desc: info.d || '',
        hidden: a.hidden
      };
    });

    // Movimientos aprendibles
    const ls = (window.LEARNSETS && (window.LEARNSETS[p.uid] || window.LEARNSETS[p.id])) || { l: [], m: [] };
    let learnsetIds = [];
    if (ls.l) ls.l.forEach(x => { const sid = String(x[0]); if (!learnsetIds.includes(sid)) learnsetIds.push(sid); });
    if (ls.m) ls.m.forEach(x => { const sid = String(x); if (!learnsetIds.includes(sid)) learnsetIds.push(sid); });
    if (ls.e) ls.e.forEach(x => { const sid = String(x); if (!learnsetIds.includes(sid)) learnsetIds.push(sid); });
    if (ls.t) ls.t.forEach(x => { const sid = String(x); if (!learnsetIds.includes(sid)) learnsetIds.push(sid); });

    // Fallback de seguridad si faltaran datos
    if (learnsetIds.length < 5 && window.MOVES) {
      learnsetIds = Object.keys(window.MOVES);
    }

    const availableMoves = learnsetIds.map(mId => {
      const m = window.MOVES ? window.MOVES[mId] : null;
      if (!m) return null;
      const catName = m.c === 0 ? 'Físico' : m.c === 1 ? 'Especial' : 'Estado';
      const powStr = m.p !== null && m.p !== undefined ? `Pot: ${m.p}` : 'Estado';
      return {
        id: String(mId),
        name: m.n,
        type: m.t,
        category: catName,
        power: m.p,
        accuracy: m.a,
        pp: m.pp,
        desc: m.d || '',
        label: `${m.n} [${PKX.TYPE_NAMES[m.t] || m.t}] (${catName}) - ${powStr}`
      };
    }).filter(Boolean);

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
              <input type="text" id="sd-item-input" list="sd-items-list" value="${esc(member.item || '')}" placeholder="Ej: Restos (Leftovers), Vidasfera..." class="sd-input">
              <datalist id="sd-items-list">
                ${PKX.stonesForSpecies(p.id).map(s => `<option value="${esc(s.stone.n)}">💎 Activa ${esc(s.form.name)}</option>`).join('')}
                ${PKX.COMPETITIVE_ITEMS.map(it => `<option value="${it}">`).join('')}
              </datalist>
              ${PKX.stonesForSpecies(p.id).length ? `<div class="sd-stone-chips">${PKX.stonesForSpecies(p.id).map(s => `<button type="button" class="sd-preset-chip sd-stone-chip" data-stone="${esc(s.stone.n)}">💎 ${esc(s.stone.n)} → ${esc(s.form.name)}</button>`).join('')}</div>` : ''}
            </div>

            <div class="sd-form-group">
              <label for="sd-ability-select">Habilidad:</label>
              <select id="sd-ability-select" class="sd-select">
                ${pAbilities.map(ab => `
                  <option value="${ab.slug}" ${ab.slug === member.ability ? 'selected' : ''}>
                    ${esc(ab.name)}${ab.hidden ? ' (Habilidad Oculta)' : ''}
                  </option>`).join('')}
              </select>
              <div id="sd-ability-desc" class="sd-desc-box"></div>
            </div>

            <div class="sd-form-group">
              <label for="sd-nature-select">Naturaleza:</label>
              <select id="sd-nature-select" class="sd-select">
                ${PKX.NATURES.map((nat, nIdx) => `
                  <option value="${nIdx}" ${nIdx === (member.nature || 0) ? 'selected' : ''}>
                    ${esc(nat.label)}
                  </option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Columna 2: Movimientos (4 slots con learnset) -->
          <div class="sd-col sd-moves-col">
            <h4 class="sd-section-title">Movimientos (hasta 4)</h4>
            <p class="muted small">Selecciona entre los movimientos oficiales que ${p.name} puede aprender:</p>
            
            <div class="sd-moves-selectors">
              ${[0, 1, 2, 3].map(mIdx => {
                const currentMoveId = (member.moves && member.moves[mIdx]) ? String(member.moves[mIdx]) : '';
                return `
                  <div class="sd-move-slot-row" data-move-idx="${mIdx}">
                    <span class="sd-m-badge">#${mIdx + 1}</span>
                    <select class="sd-select sd-move-picker" data-slot="${mIdx}">
                      <option value="">— Ninguno (---) —</option>
                      ${availableMoves.map(m => `
                        <option value="${m.id}" ${m.id === currentMoveId ? 'selected' : ''}>
                          ${esc(m.label)}
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
              ${PKX.STAT_KEYS.map((stKey, i) => {
                const baseVal = (p.statsArr && p.statsArr[i] !== undefined) ? p.statsArr[i] : (p.stats[stKey] || 0);
                return `
                  <div class="sd-st-row" data-stat-idx="${i}" data-stat-key="${stKey}">
                    <div class="sd-st-name" id="sd-name-${i}">
                      <strong>${STAT_LABELS[i]}</strong>
                      <span class="sd-nat-mod" id="sd-nat-mod-${i}"></span>
                    </div>
                    <div class="sd-st-base">${baseVal}</div>
                    <div class="sd-st-ev">
                      <input type="range" min="0" max="252" step="4" value="${member.evs[i] || 0}" class="sd-range" id="sd-ev-range-${i}">
                      <input type="number" min="0" max="252" step="4" value="${member.evs[i] || 0}" class="sd-num-sm" id="sd-ev-num-${i}">
                    </div>
                    <div class="sd-st-iv">
                      <input type="number" min="0" max="31" value="${member.ivs[i] !== undefined ? member.ivs[i] : 31}" class="sd-num-sm" id="sd-iv-num-${i}">
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
      const abInfo = PKX.abilityInfo(slug);
      const descEl = $('sd-ability-desc');
      if (abInfo && abInfo.d) {
        descEl.textContent = abInfo.d;
        descEl.style.display = 'block';
      } else {
        descEl.style.display = 'none';
      }
    }

    function updateMoveDetails() {
      [0, 1, 2, 3].forEach(idx => {
        const sel = modal.querySelector(`.sd-move-picker[data-slot="${idx}"]`);
        const mId = sel ? sel.value : '';
        const detEl = $(`sd-move-detail-${idx}`);
        if (!detEl) return;
        if (!mId || !window.MOVES || !window.MOVES[mId]) {
          detEl.innerHTML = '<span class="muted small">Sin movimiento asignado (---)</span>';
          return;
        }
        const m = window.MOVES[mId];
        const catName = m.c === 0 ? 'Físico' : m.c === 1 ? 'Especial' : 'Estado';
        detEl.innerHTML = `
          <span class="type-pill" style="background:${TYPE_COLORS[m.t]}">${TYPE_NAMES[m.t] || m.t}</span>
          <span class="sd-move-cat">${catName}</span>
          <span>Pot: <b>${m.p !== null && m.p !== undefined ? m.p : '—'}</b></span>
          <span>Prec: <b>${m.a ? m.a + '%' : '—'}</b></span>
          <span>PP: <b>${m.pp}</b></span>
          ${m.d ? `<div class="sd-m-desc">${esc(m.d)}</div>` : ''}
        `;
      });
    }

    function syncAndRecalculate() {
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
        const el = $(`sd-total-${i}`);
        if (el) el.textContent = calculated[k] !== undefined ? calculated[k] : '---';
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
    modal.querySelectorAll('.sd-stone-chip').forEach(b => {
      b.addEventListener('click', () => { $('sd-item-input').value = b.dataset.stone; });
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
      tools.team();
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
  // MODAL UNIFICADO SHOWDOWN (IMPORTAR / EXPORTAR / CARGAR TXT)
  // =====================================================
  function openShowdownModal(team, mode = 'export') {
    let modal = $('showdown-io-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'showdown-io-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const currentText = mode === 'import' ? '' : PKX.exportTeamShowdown(team);
    const titleText = mode === 'import'
      ? '📥 Importar Equipo desde Pokémon Showdown (.txt)'
      : '📤 Exportar Equipo para Pokémon Showdown';

    modal.innerHTML = `
      <div class="modal-card showdown-io-card" style="max-width:760px;width:95vw;">
        <div class="modal-header">
          <h3 class="modal-title-clean">${titleText}</h3>
          <button class="modal-icon-btn close-icon-btn" id="sd-io-close">✕</button>
        </div>
        <p class="muted small">Pega el formato estándar de Pokémon Showdown o carga directamente un archivo <code>.txt</code> desde tu computadora.</p>

        <!-- Barra de herramientas de texto y archivo -->
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin:0.8rem 0 0.4rem;">
          <input type="file" id="sd-file-input" accept=".txt,text/plain" style="display:none;">
          <button type="button" class="team-btn primary" id="sd-upload-file-btn">📁 Cargar archivo .txt</button>
          <button type="button" class="team-btn" id="sd-download-file-btn">💾 Descargar .txt</button>
          <button type="button" class="team-btn" id="sd-copy-btn">📋 Copiar texto</button>
          <button type="button" class="team-btn danger" id="sd-clear-btn">🧹 Limpiar</button>
        </div>

        <textarea id="sd-main-textarea" class="sd-io-textarea" placeholder="Pega aquí el formato de Pokémon Showdown o presiona '📁 Cargar archivo .txt'...
Ejemplo:
Charizard @ Leftovers
Ability: Blaze
Level: 100
Shiny: Yes
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Flamethrower
- Air Slash
- Roost
- Dragon Pulse">${esc(currentText)}</textarea>

        <div style="margin: 0.5rem 0 1rem; display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
          <label for="sd-new-name-input" style="font-size:0.82rem;font-weight:700;color:var(--text-dim);">Nombre si creas equipo nuevo:</label>
          <input type="text" id="sd-new-name-input" value="Equipo Showdown" class="sd-input" style="max-width:240px;">
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="d-btn" id="sd-cancel-btn">Cerrar</button>
          <button type="button" class="btn-primary" id="sd-import-current-btn" title="Reemplaza los Pokémon de este equipo actual">
            📥 Guardar en "${esc(team.name)}"
          </button>
          <button type="button" class="btn-primary" id="sd-import-new-btn" style="background:linear-gradient(135deg,#3b82f6,#2563eb);">
            ➕ Crear como Nuevo Equipo
          </button>
        </div>
      </div>`;

    const close = () => { modal.classList.remove('open'); modal.hidden = true; };
    modal.querySelector('#sd-io-close').addEventListener('click', close);
    modal.querySelector('#sd-cancel-btn').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    const textarea = modal.querySelector('#sd-main-textarea');
    const fileInput = modal.querySelector('#sd-file-input');

    // Cargar archivo .txt del disco
    modal.querySelector('#sd-upload-file-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        textarea.value = ev.target.result || '';
        PKX.toast(`Archivo "${file.name}" cargado`);
      };
      reader.readAsText(file);
    });

    // Copiar
    modal.querySelector('#sd-copy-btn').addEventListener('click', () => {
      textarea.select();
      (navigator.clipboard ? navigator.clipboard.writeText(textarea.value) : Promise.reject())
        .then(() => PKX.toast('¡Texto Showdown copiado!'))
        .catch(() => {
          document.execCommand('copy');
          PKX.toast('¡Texto Showdown copiado!');
        });
    });

    // Descargar .txt
    modal.querySelector('#sd-download-file-btn').addEventListener('click', () => {
      const txt = textarea.value.trim();
      if (!txt) { PKX.toast('No hay texto para descargar'); return; }
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${team.name.replace(/[^a-z0-9_-]/gi, '_')}_showdown.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      PKX.toast('Archivo descargado');
    });

    // Limpiar
    modal.querySelector('#sd-clear-btn').addEventListener('click', () => {
      textarea.value = '';
      textarea.focus();
    });

    // Importar al equipo actual
    modal.querySelector('#sd-import-current-btn').addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text) { PKX.toast('Ingresa o pega un equipo primero'); return; }
      const res = PKX.importTeamShowdown(text, null);
      if (res) {
        close();
        tools.team();
      }
    });

    // Importar como nuevo equipo
    modal.querySelector('#sd-import-new-btn').addEventListener('click', () => {
      const text = textarea.value.trim();
      const newName = modal.querySelector('#sd-new-name-input').value.trim() || 'Equipo Showdown';
      if (!text) { PKX.toast('Ingresa o pega un equipo primero'); return; }
      const res = PKX.importTeamShowdown(text, newName);
      if (res) {
        close();
        tools.team();
      }
    });

    modal.hidden = false;
    modal.classList.add('open');
  }
})();

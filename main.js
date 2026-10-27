/**
 * Pokédex Nacional - Arranque: rutas por hash, tema, shiny global, bandeja del comparador y PWA.
 */
(function () {
  'use strict';
  const { $, pad } = PKX;
  const S = PKX.state;

  const VIEWS = ['home', 'detail', 'compare', 'types', 'team'];
  let navDepth = 0;
  let currentView = 'home';
  const homeScroll = { y: 0 };

  PKX.back = function () {
    if (navDepth > 1) history.back();
    else location.hash = '#/';
  };

  function showView(name) {
    if (currentView === 'home' && name !== 'home') homeScroll.y = window.scrollY;
    VIEWS.forEach(v => { $('view-' + v).hidden = v !== name; });
    currentView = name;
    document.querySelectorAll('#nav-links a').forEach(a => {
      a.classList.toggle('active', a.dataset.route === name || (name === 'detail' && a.dataset.route === 'home'));
    });
    updateChrome();
  }

  function route() {
    navDepth++;
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    const head = parts[0] || '';

    if (head === 'pokemon' && parts[1]) {
      const uid = parseInt(parts[1], 10);
      showView('detail');
      PKX.detail.show(uid);
      const p = PKX.BY_UID[uid];
      document.title = p ? `${p.name} ${pad(p.id)} | Pokédex Nacional` : 'Pokédex Nacional';
      window.scrollTo(0, 0);
    } else if (head === 'compare') {
      const ids = parts[1] ? parts[1].split(',').map(Number) : null;
      showView('compare');
      PKX.tools.compare(ids);
      updateChrome();
      document.title = 'Comparador | Pokédex Nacional';
      window.scrollTo(0, 0);
    } else if (head === 'types') {
      showView('types');
      PKX.tools.types();
      document.title = 'Tabla de tipos | Pokédex Nacional';
      window.scrollTo(0, 0);
    } else if (head === 'team') {
      showView('team');
      PKX.tools.team();
      document.title = 'Mi equipo | Pokédex Nacional';
      window.scrollTo(0, 0);
    } else {
      showView('home');
      document.title = 'Pokédex Nacional | Generaciones I-IX y Megaevoluciones';
      requestAnimationFrame(() => window.scrollTo(0, homeScroll.y));
    }
  }

  // ---------- Barra de navegación y bandeja ----------
  function updateChrome() {
    $('nav-team-count').textContent = S.team.length;
    $('nav-compare-count').textContent = S.compare.length;
    $('shiny-global-btn').classList.toggle('active', S.shiny);
    $('shiny-global-btn').setAttribute('aria-pressed', String(S.shiny));

    const tray = $('compare-tray');
    const show = S.compare.length > 0 && currentView !== 'compare';
    tray.hidden = !show;
    if (show) {
      $('tray-items').innerHTML = S.compare.map(u => {
        const p = PKX.BY_UID[u];
        return `<span class="tray-item"><img src="${p.sprite}" alt="${p.name}" onerror="this.style.visibility='hidden'"><span>${p.name}</span><button data-rm="${u}" aria-label="Quitar ${p.name}">✕</button></span>`;
      }).join('');
      $('tray-go').textContent = S.compare.length > 1 ? `Comparar (${S.compare.length})` : 'Elegí otro para comparar';
      $('tray-go').classList.toggle('disabled', S.compare.length < 2);
    }
  }

  function initChrome() {
    $('tray-items').addEventListener('click', e => {
      const b = e.target.closest('[data-rm]');
      if (!b) return;
      PKX.toggleCompare(+b.dataset.rm);
    });
    $('tray-clear').addEventListener('click', () => PKX.setCompare([]));
    $('tray-go').addEventListener('click', e => {
      if (S.compare.length < 2) { e.preventDefault(); PKX.toast('Elegí al menos 2 Pokémon'); }
    });

    $('theme-toggle-btn').addEventListener('click', e => PKX.setTheme(S.theme === 'light' ? 'dark' : 'light', e));
    $('shiny-global-btn').addEventListener('click', () => {
      PKX.setShiny(!S.shiny);
      PKX.toast(S.shiny ? '✨ Mostrando versiones Shiny' : 'Mostrando versiones normales');
    });

    window.addEventListener('scroll', () => {
      $('scroll-top-btn').classList.toggle('visible', window.scrollY > 350);
    }, { passive: true });
    $('scroll-top-btn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Re-render de vistas que dependen del estado global
    let t;
    PKX.onChange(() => {
      updateChrome();
      clearTimeout(t);
      t = setTimeout(() => {
        if (currentView === 'compare') PKX.tools.compare();
        else if (currentView === 'team') PKX.tools.team();
      }, 0);
    });
  }

  // ---------- PWA ----------
  function initPWA() {
    let deferred = null;
    const btn = $('install-btn');
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
    });
    btn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      btn.hidden = true;
    });
    window.addEventListener('appinstalled', () => { btn.hidden = true; PKX.toast('¡Pokédex instalada!'); });

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker no registrado', err));
      });
    }
  }

  // ---------- Inicio ----------
  PKX.home.init();
  initChrome();
  initPWA();
  window.addEventListener('hashchange', route);
  route();
})();

/* Growth.Etc — comportamento do site (sem dependências) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- rastreamento (KPIs: cliques no CTA, envios do formulário, cliques no WhatsApp) ----------
     Envia eventos para window.dataLayer (GTM) e gtag (GA4), se existirem. A medição só é carregada se houver um ID em assets/config.js
     e a pessoa aceitar (veja "medição com consentimento" abaixo). */
  function track(name, params) {
    try {
      var p = params || {};
      var payload = {}; for (var k in p) payload[k] = p[k]; payload.event = name;
      (window.dataLayer = window.dataLayer || []).push(payload);
      if (typeof window.gtag === 'function') window.gtag('event', name, p);
    } catch (e) { /* silencioso */ }
  }
  window.geTrack = track;
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!a) return;
    var pm = d.querySelector('[data-page]');
    track(a.getAttribute('data-track'), { label: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: a.getAttribute('href') || '', page: (pm && pm.getAttribute('data-page')) || (location.pathname.split('/').pop() || 'index') });
  });

  /* ---------- medição com consentimento (GTM ou GA4) ----------
     Sem ID em assets/config.js: nada é carregado, não há cookies e o aviso não aparece.
     Com ID: o Google Consent Mode começa em "negado"; o GTM/GA4 só é carregado depois do "Aceitar" (a escolha fica salva neste navegador). */
  (function () {
    var cfg = window.GE_CONFIG || {};
    var GTM = String(cfg.gtmId || '').trim(), GA4 = String(cfg.ga4Id || '').trim();
    if (!GTM && !GA4) return;
    var KEY = 'ge_consent', bar = null, loaded = false, saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
    window.dataLayer = window.dataLayer || [];
    function gtagCmd() { window.dataLayer.push(arguments); }
    if (!GTM) window.gtag = gtagCmd;                 // com GTM, os eventos seguem só pelo dataLayer (evita contar duas vezes)
    gtagCmd('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
    function load() {
      if (loaded) return; loaded = true;
      var s = d.createElement('script'); s.async = true;
      if (GTM) {
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM);
      } else {
        gtagCmd('js', new Date()); gtagCmd('config', GA4);
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4);
      }
      d.head.appendChild(s);
    }
    function choose(v) {
      try { localStorage.setItem(KEY, v); } catch (e) { /* segue sem salvar */ }
      if (v === 'granted') { gtagCmd('consent', 'update', { analytics_storage: 'granted' }); load(); }
      else gtagCmd('consent', 'update', { analytics_storage: 'denied' });
      if (bar) bar.hidden = true;
    }
    function show() {
      if (!bar) {
        bar = d.createElement('div'); bar.className = 'consent-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookies e medição');
        var pl = d.querySelector('a[data-track="link_privacidade"]'), ph = pl ? pl.getAttribute('href') : 'politica-de-privacidade.html';   // mesmo endereço do rodapé (na 404 é absoluto)
        bar.innerHTML = '<p>Usamos cookies de medição do Google para entender como o site é usado e melhorá-lo. Eles só entram se você aceitar. Veja a <a href="' + ph + '">Política de Privacidade</a>.</p>' +
          '<div class="btns"><button type="button" class="btn btn--primary" data-c="granted">Aceitar</button><button type="button" class="btn btn--ghost" data-c="denied">Recusar</button></div>';
        bar.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('[data-c]') : null; if (b) choose(b.getAttribute('data-c')); });
        d.body.appendChild(bar);
      }
      bar.hidden = false;
    }
    [].slice.call(d.querySelectorAll('[data-consent-open]')).forEach(function (b) { b.hidden = false; b.addEventListener('click', show); });
    if (saved === 'granted') choose('granted'); else if (saved !== 'denied') show();
  })();

  /* ---------- menu mobile (foco e teclado) ----------
     Aberto: o resto da página fica inerte (o Tab não chega no conteúdo de trás), o foco vai para o primeiro link e fica preso no cabeçalho.
     Fechado (Esc ou botão): o foco volta para o botão do menu. */
  var burger = d.querySelector('.burger'), nav = d.getElementById('menu'), hdr = d.querySelector('.site-header');
  var behind = [].slice.call(d.querySelectorAll('main, .site-footer, .dock, .fab-wrap, .skip'));
  function menuOpen() { return !!(burger && burger.getAttribute('aria-expanded') === 'true'); }
  function setMenu(open, giveBack) {
    if (!burger || !nav) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    root.style.overflow = open ? 'hidden' : '';
    behind.forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    else if (giveBack) burger.focus();
  }
  if (burger && nav) {
    burger.addEventListener('click', function () { setMenu(!menuOpen(), true); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false, false); });
    d.addEventListener('keydown', function (e) {
      if (!menuOpen()) return;
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key !== 'Tab' || !hdr) return;
      var items = [].slice.call(hdr.querySelectorAll('a[href], button')).filter(function (el) { return el.getClientRects().length > 0; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1240 && menuOpen()) setMenu(false, false); });   // 1240 px = menu horizontal (CSS)
    window.addEventListener('pageshow', function () { if (menuOpen()) setMenu(false, false); });
  }

  /* ---------- entrada sutil (só transform; o conteúdo já está visível em repouso) ---------- */
  var rv = [].slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- barra fixa mobile: aparece quando o CTA do topo sai da tela; some enquanto o briefing está visível ---------- */
  var dock = d.querySelector('.dock'), anchor = d.querySelector('[data-dock-anchor]');
  var fab = d.querySelector('.wa-fab');
  var anchorOut = false, inForm = false, inSkip = false, typing = false;
  function paintFloat() {
    if (dock) { var on = anchorOut && !inForm && !inSkip; dock.classList.toggle('is-on', on); d.body.classList.toggle('dock-on', on); }
    if (fab) fab.classList.toggle('is-away', typing || inForm);
  }
  if (dock) {
    if (anchor && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var en = es[0]; anchorOut = !en.isIntersecting && en.boundingClientRect.top < 0; paintFloat();
      }, { threshold: 0 }).observe(anchor);
    } else { anchorOut = true; paintFloat(); }
  }
  var offEls = [].slice.call(d.querySelectorAll('[data-dock-off]'));
  if (offEls.length && 'IntersectionObserver' in window) {
    var offLive = {};
    var offIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { offLive[en.target.id || 'x'] = en.isIntersecting; });
      inForm = Object.keys(offLive).some(function (k) { return offLive[k]; });
      paintFloat();
    }, { threshold: 0.12 });
    offEls.forEach(function (el) { offIO.observe(el); });
  }
  /* cartão de preço e chamada final do curso já têm o próprio botão: a barra fixa sai de cena enquanto eles aparecem na tela (o botão de WhatsApp continua) */
  var skipEls = [].slice.call(d.querySelectorAll('[data-dock-skip]'));
  if (skipEls.length && 'IntersectionObserver' in window) {
    var skipLive = [];
    var skipIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { skipLive[skipEls.indexOf(en.target)] = en.isIntersecting; });
      inSkip = skipLive.some(Boolean);
      paintFloat();
    }, { threshold: 0.12 });
    skipEls.forEach(function (el) { skipIO.observe(el); });
  }

  /* ---------- pills de navegação (O que fazemos): destaca a frente visível ---------- */
  var pills = [].slice.call(d.querySelectorAll('.pills a[href^="#"]'));
  if (pills.length && 'IntersectionObserver' in window) {
    var map = {}, live = {}; pills.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var ids = Object.keys(map);
    var paint = function () {
      var cur = null;
      for (var i = 0; i < ids.length; i++) { if (live[ids[i]]) { cur = ids[i]; break; } }
      pills.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (!cur) return;
      var a = map[cur]; a.setAttribute('aria-current', 'true');
      var ul = a.closest('ul');
      if (ul && ul.scrollWidth > ul.clientWidth) { ul.scrollTo({ left: Math.max(0, a.offsetLeft - 24), behavior: reduce ? 'auto' : 'smooth' }); }
    };
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) { live[en.target.id] = en.isIntersecting; });
      paint();
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    ids.forEach(function (id) { var sct = d.getElementById(id); if (sct) spy.observe(sct); });
  }

  /* ---------- botão de WhatsApp sai da frente enquanto a pessoa digita ---------- */
  if (fab) {
    d.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input,select,textarea')) { typing = true; paintFloat(); } });
    d.addEventListener('focusout', function () { typing = false; paintFloat(); });
  }

  /* ---------- carrossel de cases: setas, contador e teclado ---------- */
  var snap = d.querySelector('.snap'), sctrl = d.querySelector('[data-snap-ctrl]');
  if (snap && sctrl) {
    var cards = [].slice.call(snap.children), sbtns = [].slice.call(sctrl.querySelectorAll('[data-snap]')), scount = sctrl.querySelector('.snap-count');
    var raf = 0;
    var current = function () {
      var base = snap.getBoundingClientRect().left + (parseFloat(getComputedStyle(snap).scrollPaddingInlineStart) || 0), best = 0, bd = Infinity;
      cards.forEach(function (c, i) { var dd = Math.abs(c.getBoundingClientRect().left - base); if (dd < bd) { bd = dd; best = i; } });
      if (snap.scrollLeft + snap.clientWidth >= snap.scrollWidth - 2) best = cards.length - 1;
      return best;
    };
    var paintSnap = function () {
      raf = 0; var i = current();
      // só vira parada do Tab quando há o que rolar (a partir de 960 px os cases ficam em grade)
      if (snap.scrollWidth > snap.clientWidth + 1) snap.setAttribute('tabindex', '0'); else snap.removeAttribute('tabindex');
      if (scount) scount.textContent = 'Case ' + (i + 1) + ' de ' + cards.length;
      sbtns.forEach(function (b) { var dir = +b.getAttribute('data-snap'); b.setAttribute('aria-disabled', (dir < 0 && i === 0) || (dir > 0 && i === cards.length - 1) ? 'true' : 'false'); });
    };
    snap.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(paintSnap); }, { passive: true });
    window.addEventListener('resize', paintSnap);
    sbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-disabled') === 'true') return;
        var dir = +b.getAttribute('data-snap'), i = Math.max(0, Math.min(cards.length - 1, current() + dir)), c = cards[i];
        var base = snap.getBoundingClientRect().left + (parseFloat(getComputedStyle(snap).scrollPaddingInlineStart) || 0);
        snap.scrollBy({ left: c.getBoundingClientRect().left - base, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    paintSnap();
  }

  /* ---------- faixa de credenciais: botão para pausar a animação ---------- */
  [].slice.call(d.querySelectorAll('.proof-pause')).forEach(function (b) {
    var lab = b.querySelector('span');
    b.addEventListener('click', function () {
      var tr = b.closest('.proof') && b.closest('.proof').querySelector('.proof-track'), on = !b.classList.contains('is-on');
      b.classList.toggle('is-on', on);
      if (lab) lab.textContent = on ? 'Retomar animação' : 'Pausar animação';
      if (tr) tr.classList.toggle('is-paused', on);
    });
  });

  /* ---------- formulário rápido do Contato → WhatsApp (e cópia por e-mail para a Growth.Etc) ---------- */
  var form = d.getElementById('form-pre');
  if (form) {
    var WA = form.getAttribute('data-wa') || '5511999022351';
    var EP = form.getAttribute('data-endpoint') || '';
    var sel = d.getElementById('f-desafio');
    var byHash = { 'frente-inovacao': 'Estratégia que nunca sai do papel', 'frente-branding': 'Marca que não atrai o cliente certo', 'frente-social': 'Anúncios sem retorno', 'frente-seo': 'Invisível no Google e nas IAs', 'frente-vendas': 'Time comercial sem processo' };
    var h = (location.hash || '').replace('#', '');
    if (sel && byHash[h]) sel.value = byHash[h];

    function fieldOf(el) { return el.closest('.field'); }
    function setErr(el, bad) {
      var f = fieldOf(el); if (!f) return;
      if (bad) { f.setAttribute('data-invalid', ''); el.setAttribute('aria-invalid', 'true'); } else { f.removeAttribute('data-invalid'); el.removeAttribute('aria-invalid'); }
    }
    function valid(el) {
      var v = (el.value || '').trim();
      if (el.id === 'f-email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (el.id === 'f-fone') return v.replace(/\D/g, '').length >= 10;
      return v.length > 0;
    }
    function phoneMask(v) {
      var s = (v || '').replace(/\D/g, '').slice(0, 11);
      if (!s.length) return '';
      if (s.length <= 2) return '(' + s;
      var cut = s.length > 10 ? 7 : 6, b = s.slice(cut);
      return '(' + s.slice(0, 2) + ') ' + s.slice(2, cut) + (b ? '-' + b : '');
    }
    [].slice.call(form.querySelectorAll('input,select')).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value) setErr(el, !valid(el)); });
      el.addEventListener('input', function () {
        if (el.id === 'f-fone' && !/^\s*\+/.test(el.value) && (el.selectionStart === null || el.selectionStart >= el.value.length)) el.value = phoneMask(el.value);
        if (fieldOf(el) && fieldOf(el).hasAttribute('data-invalid') && valid(el)) setErr(el, false);
      });
    });

    function origin() {
      try {
        var p = new URLSearchParams(location.search), out = [];
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { var v = p.get(k); if (v) out.push(k.replace('utm_', '') + ': ' + v); });
        return out.join(' · ');
      } catch (e) { return ''; }
    }
    // cópia por e-mail (FormSubmit): em segundo plano; o WhatsApp continua sendo o canal principal
    function sendCopy(data) {
      if (!EP || !window.fetch) return Promise.resolve(false);
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
      return fetch(EP, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true, signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
        clearTimeout(timer);
        return r.json().then(function (j) { return r.ok && j && (j.success === true || j.success === 'true'); }, function () { return false; });
      }, function () { clearTimeout(timer); return false; });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.elements.namedItem('_honey');
      var bad = null;
      [].slice.call(form.querySelectorAll('[required]')).forEach(function (el) {
        var ok = valid(el); setErr(el, !ok); if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      var g = function (id) { return (d.getElementById(id).value || '').trim(); };
      var text = 'Olá! Quero solicitar uma conversa de 20 minutos com a Growth.Etc (pré-diagnóstico gratuito).\n\n' +
        'Nome: ' + g('f-nome') + '\nEmpresa: ' + g('f-empresa') + '\nE-mail: ' + g('f-email') + '\nWhatsApp: ' + g('f-fone') +
        '\nMaior desafio hoje: ' + g('f-desafio');
      var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
      track('form_submit', { form: 'contato_rapido', desafio: g('f-desafio') });
      var ok = d.getElementById('form-ok'), link = d.getElementById('form-ok-link'), mailSt = d.getElementById('form-mail');
      if (link) link.setAttribute('href', url);
      form.hidden = true;
      if (ok) { ok.classList.add('is-on'); ok.setAttribute('tabindex', '-1'); ok.focus({ preventScroll: false }); }
      try { var w = window.open(url, '_blank', 'noopener'); if (w) w.opener = null; } catch (err) { /* o link do painel cobre este caso */ }
      if (hp && hp.value) return;                       // robô: não envia a cópia
      if (mailSt) mailSt.textContent = 'Enviando uma cópia por e-mail para a Growth.Etc…';
      var data = { _subject: 'Novo contato rápido do site: ' + g('f-empresa'), _template: 'table', _captcha: 'false',
        'Nome': g('f-nome'), 'Empresa': g('f-empresa'), 'email': g('f-email'), 'WhatsApp': g('f-fone'), 'Maior desafio hoje': g('f-desafio') };
      if (/^https?:/.test(location.protocol)) data['Página'] = location.origin + location.pathname;
      var og = origin(); if (og) data['Origem da visita'] = og;
      sendCopy(data).then(function (okMail) {
        if (mailSt) mailSt.textContent = okMail ? 'Também enviamos uma cópia por e-mail para a Growth.Etc.' : 'A cópia por e-mail não seguiu agora. O WhatsApp é o canal principal: envie a mensagem por lá.';
        track(okMail ? 'email_copy' : 'form_submit_fail', { form: 'contato_rapido', state: okMail ? 'ok' : 'fail' });
      });
    });
  }
})();

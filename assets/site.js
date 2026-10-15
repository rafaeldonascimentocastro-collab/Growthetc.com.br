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

  /* ---------- origem da visita: UTM do primeiro acesso da sessão ----------
     Guarda os parâmetros utm_* da página de entrada para que o lead (e a mensagem do WhatsApp) leve a origem
     mesmo quando a pessoa navega por outras páginas antes de converter. */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  function store(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } return v; }
  (function () {
    try {
      var p = new URLSearchParams(location.search), got = {}, any = false;
      UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) { got[k] = v.slice(0, 80); any = true; } });
      if (any && !store('ge_utm')) store('ge_utm', got);
      if (!store('ge_landing')) store('ge_landing', { page: location.pathname.split('/').pop() || 'index.html', ref: (d.referrer || '').slice(0, 120) });
    } catch (e) { /* segue */ }
  })();
  function originText(sep) {
    var u = store('ge_utm') || {}, out = [];
    UTM_KEYS.forEach(function (k) { if (u[k]) out.push(k.replace('utm_', '') + ': ' + u[k]); });
    return out.join(sep || ' · ');
  }
  function pageName() { var pm = d.querySelector('[data-page]'); return (pm && pm.getAttribute('data-page')) || (location.pathname.split('/').pop() || 'index'); }
  window.geOrigin = originText;

  /* ---------- WhatsApp: a mensagem leva a origem da visita (campanha), se houver ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="https://wa.me/"]') : null;
    if (!a || a.hasAttribute('data-wa-done')) return;
    var og = originText(' · ');
    if (!og) return;
    try {
      var href = a.getAttribute('href'), m = /[?&]text=([^&]*)/.exec(href), t = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
      a.setAttribute('href', href.split('?')[0] + '?text=' + encodeURIComponent(t + '\n\n(Origem: ' + og + ')'));
      a.setAttribute('data-wa-done', '');
    } catch (err) { /* segue com o link original */ }
  }, true);

  /* ---------- formulários de lead (Contato, Pré-diagnóstico e Portfólio) ----------
     Envio para o endpoint configurado em assets/config.js → página obrigado.html (onde o evento generate_lead é disparado).
     Se o envio falhar, o painel de reserva oferece o WhatsApp e o e-mail já preenchidos, para o lead não se perder. */
  var CFG = window.GE_CONFIG || {};
  var WA_NUM = String(CFG.whatsapp || '5511992253454');
  var LEAD_MAIL = String(CFG.leadEmail || 'growthetc@gmail.com');
  function phoneMask(v) {
    var s = (v || '').replace(/\D/g, '').slice(0, 11);
    if (!s.length) return '';
    if (s.length <= 2) return '(' + s;
    var cut = s.length > 10 ? 7 : 6, b = s.slice(cut);
    return '(' + s.slice(0, 2) + ') ' + s.slice(2, cut) + (b ? '-' + b : '');
  }
  function postLead(ep, data) {
    if (!ep || !window.fetch) return Promise.resolve(false);
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    return fetch(ep, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true, signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      clearTimeout(timer);
      return r.json().then(function (j) { return r.ok && j && (j.success === true || j.success === 'true'); }, function () { return false; });
    }, function () { clearTimeout(timer); return false; });
  }
  var FRENTE_DESAFIO = { 'frente-inovacao': 'Estratégia que nunca sai do papel', 'frente-branding': 'Marca que não atrai o cliente certo', 'frente-social': 'Anúncios sem retorno', 'frente-seo': 'Invisível no Google e nas IAs', 'frente-vendas': 'Time comercial sem processo' };
  [].slice.call(d.querySelectorAll('form[data-lead]')).forEach(function (form) {
    var tipo = form.getAttribute('data-lead');
    var EP = form.getAttribute('data-endpoint') || CFG.leadEndpoint || '';
    var btn = form.querySelector('button[type=submit]');
    var fb = d.getElementById(form.getAttribute('data-fallback') || 'form-ok');
    var f = function (n) { return form.elements.namedItem(n); };
    var val = function (n) { var el = f(n); return el ? (el.value || '').trim() : ''; };
    var h = (location.hash || '').replace('#', ''), sel = f('desafio');
    if (sel && FRENTE_DESAFIO[h]) {
      sel.value = FRENTE_DESAFIO[h];
      requestAnimationFrame(function () { var box = form.closest('[id]') || form; box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    }
    function boxOf(el) { return el.closest('.field'); }
    function setErr(el, bad) {
      var b = boxOf(el); if (!b) return;
      if (bad) { b.setAttribute('data-invalid', ''); el.setAttribute('aria-invalid', 'true'); } else { b.removeAttribute('data-invalid'); el.removeAttribute('aria-invalid'); }
    }
    function valid(el) {
      var v = (el.value || '').trim();
      if (!v) return !el.required;
      if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (el.type === 'tel') return v.replace(/\D/g, '').length >= 10;
      return true;
    }
    [].slice.call(form.querySelectorAll('input:not([type=hidden]),select,textarea')).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value) setErr(el, !valid(el)); });
      el.addEventListener('input', function () {
        if (el.type === 'tel' && !/^\s*\+/.test(el.value) && (el.selectionStart === null || el.selectionStart >= el.value.length)) el.value = phoneMask(el.value);
        if (boxOf(el) && boxOf(el).hasAttribute('data-invalid') && valid(el)) setErr(el, false);
      });
    });
    var started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start', { form: tipo }); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      [].slice.call(form.querySelectorAll('input:not([type=hidden]):not(.hp),select,textarea')).forEach(function (el) {
        var ok = valid(el); setErr(el, !ok); if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); track('form_error', { form: tipo }); return; }
      var lead = { tipo: tipo, nome: val('nome'), email: val('email'), fone: val('telefone'), desafio: val('desafio'), empresa: val('empresa'), t: Date.now() };
      var hp = f('_honey');
      if (hp && hp.value) { location.href = 'obrigado.html?tipo=' + encodeURIComponent(tipo); return; }   // robô: não envia
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Enviando…'; }
      var titles = { contato: 'Pedido de conversa', pre_diagnostico: 'Pedido de pré-diagnóstico', portfolio: 'Pedido do Portfólio', newsletter: 'Inscrição no blog' };
      var data = { _subject: (titles[tipo] || 'Novo lead') + ' (site): ' + (lead.empresa || lead.nome), _template: 'table', _captcha: 'false',
        'Tipo de lead': titles[tipo] || tipo, 'Nome': lead.nome, 'email': lead.email };
      if (lead.fone) data['WhatsApp'] = lead.fone;
      if (lead.empresa) data['Empresa'] = lead.empresa;
      if (lead.desafio) data['Maior desafio hoje'] = lead.desafio;
      if (/^https?:/.test(location.protocol)) data['Página'] = location.origin + location.pathname;
      var og = originText(' · '); if (og) data['Origem da visita'] = og;
      var land = store('ge_landing'); if (land && land.page) data['Página de entrada'] = land.page + (land.ref ? ' (vindo de ' + land.ref + ')' : '');
      postLead(EP, data).then(function (ok) {
        if (ok) {
          store('ge_lead', lead);
          track('form_submit', { form: tipo, desafio: lead.desafio || '' });
          location.href = 'obrigado.html?tipo=' + encodeURIComponent(tipo);
          return;
        }
        track('form_submit_fail', { form: tipo });
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = label; }
        var text = 'Olá! Tentei enviar o formulário do site da Growth.Etc, mas não foi. Seguem os meus dados:\n\n' +
          'Nome: ' + lead.nome + (lead.empresa ? '\nEmpresa: ' + lead.empresa : '') + '\nE-mail: ' + lead.email +
          (lead.fone ? '\nWhatsApp: ' + lead.fone : '') + (lead.desafio ? '\nMaior desafio hoje: ' + lead.desafio : '') + '\nPedido: ' + (titles[tipo] || tipo);
        var wa = d.getElementById('form-ok-link'), ml = d.getElementById('form-ok-mail');
        if (wa) wa.setAttribute('href', 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text));
        if (ml) ml.setAttribute('href', 'mailto:' + LEAD_MAIL + '?subject=' + encodeURIComponent(titles[tipo] || 'Contato pelo site') + '&body=' + encodeURIComponent(text));
        if (fb) { fb.classList.add('is-on'); fb.setAttribute('tabindex', '-1'); try { fb.focus({ preventScroll: false }); } catch (err) { fb.focus(); } }
      });
    });
  });

  /* ---------- blog: filtro de artigos por tema ---------- */
  var fbtns = [].slice.call(d.querySelectorAll('.blog-filter [data-filter]'));
  if (fbtns.length) {
    var list = d.getElementById('lista-artigos'), feat = d.querySelector('.post-feature');
    var applyFilter = function (cat) {
      fbtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === cat ? 'true' : 'false'); });
      var all = cat === '*';
      if (list) list.classList.toggle('is-filtered', !all);
      if (feat) feat.hidden = !all;
      [].slice.call(list ? list.querySelectorAll('.post-card') : []).forEach(function (c) { c.hidden = !all && c.getAttribute('data-cat') !== cat; });
      track('blog_filter', { tema: all ? 'todos' : cat });
    };
    fbtns.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); }); });
  }

  /* ---------- página de obrigado: personaliza e dispara a conversão (uma vez por lead) ---------- */
  if (pageName() === 'obrigado') {
    var q = new URLSearchParams(location.search), tp = q.get('tipo') || 'contato', lead = store('ge_lead') || {};
    [].slice.call(d.querySelectorAll('[data-tipo]')).forEach(function (el) { el.hidden = (' ' + el.getAttribute('data-tipo') + ' ').indexOf(' ' + tp + ' ') < 0; });
    var first = (lead.nome || '').split(' ')[0];
    [].slice.call(d.querySelectorAll('[data-fill="nome"]')).forEach(function (n) { n.textContent = first ? ', ' + first : ''; });
    var msg = 'Olá! Acabei de enviar ' + ({ contato: 'o pedido de conversa', pre_diagnostico: 'o pedido de pré-diagnóstico', briefing: 'o briefing do pré-diagnóstico', portfolio: 'o pedido do Portfólio', newsletter: 'a inscrição no blog' }[tp] || 'o formulário') +
      ' pelo site da Growth.Etc.' + (lead.nome ? '\n\nNome: ' + lead.nome : '') + (lead.empresa ? '\nEmpresa: ' + lead.empresa : '') + (lead.desafio ? '\nMaior desafio hoje: ' + lead.desafio : '');
    [].slice.call(d.querySelectorAll('[data-wa-thanks]')).forEach(function (a) { a.setAttribute('href', 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(msg)); });
    if (lead.t && store('ge_lead_sent') !== lead.t) {
      store('ge_lead_sent', lead.t);
      if (tp === 'newsletter') track('sign_up', { method: 'newsletter_blog', origem: originText(' · ') || 'direto' });
      else track('generate_lead', { form: lead.tipo || tp, lead_type: tp, desafio: lead.desafio || '', origem: originText(' · ') || 'direto' });
    }
  }
})();

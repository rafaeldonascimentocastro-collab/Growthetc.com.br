/* Growth.Etc — briefing do pré-diagnóstico: formulário em 5 etapas, validação e envio
   (WhatsApp com todas as respostas + PDF para anexar/baixar + cópia por e-mail com o PDF) */
(function () {
  'use strict';
  var d = document;
  var form = d.getElementById('form-brief');
  if (!form) return;
  form.noValidate = true; // sem JS, a validação nativa do navegador continua valendo

  var track = typeof window.geTrack === 'function' ? window.geTrack : function () {};
  var ENDPOINT = form.getAttribute('data-endpoint');
  var MAIL = form.getAttribute('data-mail');
  var WA = form.getAttribute('data-wa');
  var PHONE = form.getAttribute('data-phone') || '';
  var SITE = form.getAttribute('data-site') || '';
  var ATTACH = form.getAttribute('data-attach') !== '0'; // "0" desliga o anexo do PDF no e-mail (as respostas seguem em tabela)
  var WA_MAX = 5000; // tamanho máximo do link do WhatsApp (já codificado); acima disso a mensagem é resumida e o PDF leva tudo
  var WA_MAX_NOPDF = 8000; // sem PDF (não deveria acontecer), a mensagem pode ser mais longa antes de ser resumida
  var wiz = d.getElementById('wiz');
  var steps = [].slice.call(form.querySelectorAll('.wiz-step'));
  var total = steps.length;
  var cur = 0, started = false, sending = false, last = null, result = null;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var elCount = d.getElementById('wiz-count');
  var elTitle = d.getElementById('wiz-title');
  var stairs = [].slice.call(d.querySelectorAll('#wiz-stairs li'));
  var side = [].slice.call(d.querySelectorAll('#brief-steps li'));
  var btnBack = form.querySelector('[data-back]');
  var btnNext = form.querySelector('[data-next]');
  var btnSend = form.querySelector('[data-send]');
  var elStatus = d.getElementById('wiz-status');
  var head = d.getElementById('wiz-head');
  var done = d.getElementById('wiz-done');

  /* ---------- máscaras e validações ---------- */
  // CNPJ numérico ou alfanumérico: 12 primeiras posições aceitam 0-9 e A-Z; as 2 últimas (dígitos verificadores) são sempre números.
  function cnpjClean(v) {
    var s = (v || '').toUpperCase().replace(/[^0-9A-Z]/g, ''), o = '', i, c;
    for (i = 0; i < s.length && o.length < 14; i++) {
      c = s.charAt(i);
      if (o.length >= 12 && !/[0-9]/.test(c)) continue;
      o += c;
    }
    return o;
  }
  function cnpjMask(v) {
    var s = cnpjClean(v), o = '';
    for (var i = 0; i < s.length; i++) {
      if (i === 2 || i === 5) o += '.';
      if (i === 8) o += '/';
      if (i === 12) o += '-';
      o += s.charAt(i);
    }
    return o;
  }
  // Valor de cada caractere = código ASCII − 48 (0-9 → 0-9; A-Z → 17-42); mesmo módulo 11 do CNPJ numérico.
  function cnpjOk(v) {
    var s = cnpjClean(v);
    if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(s) || /^(.)\1{13}$/.test(s)) return false;
    var vals = s.split('').map(function (c) { return c.charCodeAt(0) - 48; });
    function dv(n) {
      var w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      var sum = 0; for (var i = 0; i < n; i++) sum += vals[i] * w[i];
      var r = sum % 11; return r < 2 ? 0 : 11 - r;
    }
    return dv(12) === vals[12] && dv(13) === vals[13];
  }
  function phoneMask(v) {
    var s = (v || '').replace(/\D/g, '').slice(0, 11);
    if (!s.length) return '';
    if (s.length <= 2) return '(' + s;
    var cut = s.length > 10 ? 7 : 6, b = s.slice(cut);
    return '(' + s.slice(0, 2) + ') ' + s.slice(2, cut) + (b ? '-' + b : '');
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener('input', function (e) {
    var el = e.target, m = el.getAttribute && el.getAttribute('data-mask');
    if (m && (el.selectionStart === null || el.selectionStart >= el.value.length)) {
      el.value = m === 'cnpj' ? cnpjMask(el.value) : phoneMask(el.value);
    }
    var box = el.closest ? el.closest('.field, .grp, .yn') : null;
    if (box && box.hasAttribute('data-invalid') && !validateBox(box)) {
      clearInvalid(box);
      if (!steps[cur].querySelector('[data-invalid]')) elStatus.textContent = ''; // todos os destaques foram resolvidos
    }
  });

  /* ---------- erros por campo ---------- */
  function setInvalid(box, msg) {
    box.setAttribute('data-invalid', '');
    var err = box.querySelector('.err'); if (err && msg) err.textContent = msg;
    [].slice.call(box.querySelectorAll('input:not([type=radio]):not([type=checkbox]), textarea, select')).forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
  }
  function clearInvalid(box) {
    box.removeAttribute('data-invalid');
    [].slice.call(box.querySelectorAll('[aria-invalid]')).forEach(function (c) { c.removeAttribute('aria-invalid'); });
  }
  // devolve a mensagem de erro (ou '' se estiver certo)
  function validateBox(box) {
    if (box.closest('.cond[hidden]')) return ''; // campo condicional escondido não conta
    var required = box.hasAttribute('data-req');
    if (box.classList.contains('grp') || box.classList.contains('yn')) {
      if (required && !box.querySelector('input:checked')) return box.getAttribute('data-err') || 'Escolha uma opção.';
      return '';
    }
    var ctl = box.querySelector('input, textarea, select'); if (!ctl) return '';
    if (ctl.type === 'checkbox') return required && !ctl.checked ? (box.getAttribute('data-err') || 'Marque esta opção para continuar.') : '';
    var v = (ctl.value || '').trim(), kind = box.getAttribute('data-v');
    if (!v) return required ? (box.getAttribute('data-err') || 'Preencha este campo.') : '';
    if (kind === 'email' && !EMAIL_RE.test(v)) return 'Informe um e-mail válido, como nome@empresa.com.br.';
    if (kind === 'cnpj' && !cnpjOk(v)) return 'Confira o CNPJ. Ele tem 14 caracteres (numérico ou alfanumérico), como 00.000.000/0001-00.';
    if (kind === 'tel' && v.replace(/\D/g, '').length < 10) return 'Informe um telefone com DDD, por exemplo (11) 99999-9999.';
    return '';
  }
  form.addEventListener('focusout', function (e) {
    var el = e.target; if (!el.matches || !el.matches('input[type=text],input[type=email],input[type=tel],textarea')) return;
    if (!el.value.trim()) return;
    var box = el.closest('.field'); if (!box) return;
    var m = validateBox(box); if (m) setInvalid(box, m); else clearInvalid(box);
  });

  function focusTarget(box) {
    return box.querySelector('input:checked') || box.querySelector('input, textarea, select');
  }
  // valida uma etapa; devolve o primeiro controle com erro
  function checkStep(i) {
    var first = null;
    [].slice.call(steps[i].querySelectorAll('.field, .grp, .yn')).forEach(function (box) {
      var m = validateBox(box);
      if (m) { setInvalid(box, m); if (!first) first = focusTarget(box); } else { clearInvalid(box); }
    });
    return first;
  }

  /* ---------- campos condicionais (ex.: “Outro” em como vende) ---------- */
  function syncCond() {
    [].slice.call(form.querySelectorAll('.cond')).forEach(function (c) {
      var n = c.getAttribute('data-if-name'), v = c.getAttribute('data-if-value');
      var chk = null;
      [].slice.call(form.querySelectorAll('input[type=radio]')).forEach(function (r) { if (r.name === n && r.checked) chk = r; });
      c.hidden = !(chk && chk.value === v);
    });
  }
  form.addEventListener('change', syncCond);

  /* ---------- navegação entre etapas ---------- */
  function show(n, focus) {
    cur = n;
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    elCount.textContent = 'Etapa ' + (n + 1) + ' de ' + total;
    elTitle.textContent = steps[n].getAttribute('data-title');
    stairs.forEach(function (li, i) { li.classList.toggle('is-done', i < n); li.classList.toggle('is-current', i === n); });
    side.forEach(function (li, i) {
      li.classList.toggle('is-done', i < n); li.classList.toggle('is-current', i === n);
      if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    btnBack.hidden = n === 0;
    btnNext.hidden = n === total - 1;
    btnSend.hidden = n !== total - 1;
    elStatus.textContent = '';
    if (focus) {
      elTitle.setAttribute('tabindex', '-1');
      try { elTitle.focus({ preventScroll: true }); } catch (e) { elTitle.focus(); }
      var r = wiz.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.45) wiz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }
  function next() {
    var bad = checkStep(cur);
    if (bad) {
      elStatus.textContent = 'Revise os campos destacados para continuar.';
      track('form_error', { step: cur + 1 });
      bad.focus();
      return;
    }
    track('form_step', { step: cur + 2, title: steps[Math.min(cur + 1, total - 1)].getAttribute('data-title') });
    show(cur + 1, true);
  }
  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', function () { if (cur > 0) show(cur - 1, true); });
  side.forEach(function (li, i) { // etapas já concluídas voltam ao clicar na lista lateral
    li.addEventListener('click', function () { if (i < cur) show(i, true); });
  });

  form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start', { form: 'pre_diagnostico' }); loadPdf(); } });

  /* ---------- coleta das respostas (nome do campo = rótulo no e-mail; [nome, resposta, pergunta, opcional]) ---------- */
  function questionOf(el, fallback) {
    var box = el.closest ? el.closest('.field, .grp, .yn') : null, node, c;
    if (!box) return fallback;
    node = box.querySelector('label[for]') || box.querySelector('.q');
    if (!node) return fallback;
    c = node.cloneNode(true);
    [].slice.call(c.querySelectorAll('.opt-tag')).forEach(function (x) { x.parentNode.removeChild(x); });
    return (c.textContent || '').replace(/\s+/g, ' ').trim() || fallback;
  }
  function collect() {
    var groups = [];
    steps.forEach(function (s) {
      var order = [], map = {}, ask = {}, opt = {};
      [].slice.call(s.elements ? s.elements : s.querySelectorAll('input, textarea, select')).forEach(function (el) {
        var n = el.name;
        if (!n || n.charAt(0) === '_' || el.closest('.cond[hidden]')) return;
        if (!(n in map)) {
          var box = el.closest('.field, .grp, .yn');
          map[n] = []; order.push(n); ask[n] = questionOf(el, n); opt[n] = !(box && box.hasAttribute('data-req'));
        }
        if (el.type === 'radio' || el.type === 'checkbox') { if (el.checked) map[n].push(el.value); } else { map[n].push((el.value || '').trim()); }
      });
      groups.push({ title: s.getAttribute('data-title'), rows: order.map(function (n) { return [n, map[n].join(', ') || '—', ask[n], opt[n]]; }) });
    });
    return groups;
  }
  function flat(groups) { var o = {}; groups.forEach(function (g) { g.rows.forEach(function (r) { o[r[0]] = r[1]; }); }); return o; }
  function dispName(n) { return n === 'email' ? 'E-mail' : n; }
  // lim: corta cada resposta nesse tamanho (0 = inteira) · skip: não lista os campos opcionais sem resposta
  function summaryText(groups, lim, skip) {
    var t = 'BRIEFING DE PRÉ-DIAGNÓSTICO · GROWTH.ETC\n';
    groups.forEach(function (g, i) {
      var ls = [];
      g.rows.forEach(function (r) {
        var v = String(r[1]);
        if (v === '—' && (skip || r[0] === 'Frente de interesse')) return;
        if (lim) v = cut(v.replace(/\s*\n+\s*/g, ' / '), lim);
        ls.push(dispName(r[0]) + ': ' + v);
      });
      if (ls.length) t += '\n== ' + (i + 1) + '. ' + g.title + ' ==\n' + ls.join('\n') + '\n';
    });
    var o = origin(); if (o) t += '\nOrigem da visita: ' + o + '\n';
    return t;
  }
  function origin() {
    try {
      var p = new URLSearchParams(location.search), out = [];
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { var v = p.get(k); if (v) out.push(k.replace('utm_', '') + ': ' + v); });
      return out.join(' | ');
    } catch (e) { return ''; }
  }
  function pageUrl() { return /^https?:/.test(location.protocol) ? location.origin + location.pathname : ''; }
  function two(v) { return ('0' + v).slice(-2); }

  /* ---------- interesse vindo do botão clicado em outra página (#frente-…) ---------- */
  var FRENTES = { inovacao: 'Inovação e Estratégia', branding: 'Marca (Branding)', social: 'Redes sociais e anúncios', seo: 'Google e IA (SEO)', vendas: 'Vendas e CRM' };
  (function () {
    var m = /^#frente-([a-z]+)/.exec(location.hash || ''), f = m && FRENTES[m[1]];
    var inp = form.elements.namedItem('Frente de interesse'), chip = d.getElementById('wiz-chip');
    if (f && inp) {
      inp.value = f; if (chip) { chip.textContent = 'Interesse: ' + f; chip.hidden = false; }
      // a pessoa chegou por um botão "Quero esta frente…": leva direto ao briefing (o hash #frente-… não é um id da página, então o navegador não rola sozinho)
      var touched = false, mark = function () { touched = true; };
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, mark, { once: true, passive: true }); });
      var land = function (smooth) { if (wiz) wiz.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' }); };
      requestAnimationFrame(function () { land(true); });
      // depois que imagens e fontes terminam de carregar, realinha uma vez (se a pessoa ainda não mexeu na página)
      window.addEventListener('load', function () { if (touched || !wiz) return; var t = wiz.getBoundingClientRect().top; if (t < 0 || t > 160) land(false); });
    }
  })();

  /* ---------- WhatsApp: mensagem com todas as respostas ---------- */
  var ESSENCIAL = ['Nome', 'email', 'WhatsApp', 'Razão social', 'CNPJ', 'Nome fantasia', 'Segmento de mercado', 'Atuação', 'Principal dor'];
  function cut(v, lim) {
    if (v.length <= lim) return v;
    var c = v.slice(0, lim - 1), sp = c.lastIndexOf(' ');
    return (sp > lim * 0.6 ? c.slice(0, sp) : c) + '…';
  }
  // nível 0: tudo · 1: respostas longas resumidas · 2: só o essencial (o PDF leva o resto)
  function waBody(g, level, hasPdf) {
    var lim = level === 1 ? 220 : 160, fi = flat(g)['Frente de interesse'];
    var t = 'Olá! Preenchi o pré-diagnóstico no site da Growth.Etc. Seguem as minhas respostas:\n';
    if (fi && fi !== '—') t += '\n*Frente de interesse:* ' + fi + '\n'; // vem do botão clicado no site; fica no topo, como contexto
    g.forEach(function (gr, i) {
      var ls = [];
      gr.rows.forEach(function (r) {
        var v = String(r[1]).replace(/\s*\n+\s*/g, ' / ').trim();
        if (!v || v === '—' || r[0] === 'Frente de interesse') return; // campo opcional sem resposta
        if (level === 2 && ESSENCIAL.indexOf(r[0]) < 0) return;
        if (level > 0) v = cut(v, lim);
        ls.push('*' + dispName(r[0]) + ':* ' + v);
      });
      if (ls.length) t += '\n*' + (i + 1) + '. ' + gr.title + '*\n' + ls.join('\n') + '\n';
    });
    if (level > 0) t += hasPdf ? '\n_Resumo. As respostas completas estão no PDF que envio a seguir._\n' : '\n_Resumo._\n';
    return t.replace(/\s+$/, '');
  }
  function waLink(g, hasPdf) {
    var base = 'https://wa.me/' + WA + '?text=', max = hasPdf ? WA_MAX : WA_MAX_NOPDF, lv, t, u;
    for (lv = 0; lv < 3; lv++) {
      t = waBody(g, lv, hasPdf); u = base + encodeURIComponent(t);
      if (u.length <= max) break;
    }
    return { href: u, text: t, level: Math.min(lv, 2) };
  }
  function openWhatsApp(href) { // chamado dentro do clique; o painel tem o botão para o caso de o navegador bloquear
    try { var w = window.open(href, '_blank'); if (w) { try { w.opener = null; } catch (e) { /* segue */ } return true; } } catch (e) { /* segue */ }
    return false;
  }

  /* ---------- PDF com todas as respostas ---------- */
  // O gerador de PDF (prediag-pdf.js) não faz parte do carregamento inicial: entra quando a pessoa começa o briefing.
  // No arquivo único (e-mail), ele já vai embutido (window.GEPDF existe) e nada é baixado.
  var PDF_SRC = form.getAttribute('data-pdf-src') || '';
  var pdfLoad = null;
  function loadPdf() {
    if (window.GEPDF) return Promise.resolve(true);
    if (!PDF_SRC) return Promise.resolve(false);
    if (!pdfLoad) {
      pdfLoad = new Promise(function (resolve) {
        var sc = d.createElement('script');
        sc.src = PDF_SRC; sc.async = true;
        sc.onload = function () { resolve(!!window.GEPDF); };
        sc.onerror = function () { pdfLoad = null; resolve(false); }; // permite tentar de novo no envio
        d.head.appendChild(sc);
      });
    }
    return pdfLoad;
  }
  function fmtDate(t) { return two(t.getDate()) + '/' + two(t.getMonth() + 1) + '/' + t.getFullYear() + ', ' + two(t.getHours()) + ':' + two(t.getMinutes()); }
  function companyOf(o) { return [o['Nome fantasia'], o['Razão social']].filter(function (x) { return x && x !== '—'; })[0] || ''; }
  function pdfName(g) {
    var o = flat(g), base = companyOf(o) || o['Nome'] || 'briefing', t = new Date();
    if (base.normalize) base = base.normalize('NFD').replace(/[̀-ͯ]/g, '');
    base = base.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'briefing';
    return 'Pre-diagnostico-Growth.Etc-' + base + '-' + t.getFullYear() + two(t.getMonth() + 1) + two(t.getDate()) + '.pdf';
  }
  function makePdf(g) {
    if (!window.GEPDF) return null;
    var o = flat(g), now = new Date(), facts = [], notes = [], og = origin(), u = pageUrl();
    [['Responsável', 'Nome'], ['E-mail', 'email'], ['WhatsApp', 'WhatsApp'], ['CNPJ', 'CNPJ'], ['Empresa', 'Nome fantasia'], ['Segmento', 'Segmento de mercado'],
      ['Atuação', 'Atuação'], ['Frente de interesse', 'Frente de interesse']].forEach(function (p) {
      if (o[p[1]] && o[p[1]] !== '—') facts.push([p[0], cut(o[p[1]].replace(/\s*\n+\s*/g, ' / '), 90)]);
    });
    var groups = g.map(function (gr) {
      return {
        title: gr.title,
        rows: gr.rows.filter(function (r) { return !(r[0] === 'Frente de interesse' && r[1] === '—'); }).map(function (r) {
          var v = r[1];
          if (r[0] === 'Concordância com o uso das informações' && v !== '—') v = 'Sim. Concordo em compartilhar estas informações com a Growth.Etc para a elaboração do pré-diagnóstico e para contato sobre ele.';
          return { q: r[2] || dispName(r[0]), v: v };
        })
      };
    });
    if (og) notes.push('Origem da visita: ' + og);
    if (u) notes.push('Página: ' + u);
    var res = window.GEPDF.build({
      company: companyOf(o), person: o['Nome'] || '', when: fmtDate(now), date: now,
      contact: { mail: MAIL, phone: PHONE, wa: WA, site: SITE }, summary: facts, groups: groups, note: notes.join('   ·   ')
    });
    res.name = pdfName(g);
    try { res.file = new File([res.blob], res.name, { type: 'application/pdf' }); } catch (e) { res.file = null; }
    return res;
  }
  function kb(n) { return n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
  // Na pré-visualização do Claude o navegador bloqueia downloads feitos pela página; ali o arquivo sai pelo recurso do visualizador
  // (pede uma confirmação). Em qualquer outro lugar (site publicado, arquivo local) window.claude não existe e vale o download comum.
  var dn = null;
  var inPreview = !!(window.claude && typeof window.claude.use === 'function');
  if (inPreview) {
    try { window.claude.use('downloads').then(function (x) { dn = x || null; }, function () { dn = null; }); } catch (e) { dn = null; }
  }
  function plainDownload(pdf) {
    var url = URL.createObjectURL(pdf.blob), a = d.createElement('a');
    a.href = url; a.download = pdf.name; a.target = '_blank'; a.rel = 'noopener'; a.style.display = 'none'; // _blank: em navegador sem suporte a download, o PDF abre em outra aba e a página continua aqui
    d.body.appendChild(a); a.click();
    setTimeout(function () { try { d.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { /* segue */ } }, 5000);
  }
  function download(pdf) {
    if (!pdf || !pdf.blob || !window.URL || !URL.createObjectURL) return;
    if (dn && typeof dn.save === 'function') {
      var p; try { p = dn.save({ filename: pdf.name, data: pdf.blob }); } catch (e) { p = null; }
      if (p && p.then) {
        p.then(function () { /* salvo */ }, function (err) { if (!err || err.code !== 'declined') plainDownload(pdf); }); // recusou: respeita; falhou: tenta o jeito comum
        return;
      }
    }
    plainDownload(pdf);
  }
  function canShareFile(pdf) {
    try { return !!(pdf && pdf.file && navigator.share && navigator.canShare && navigator.canShare({ files: [pdf.file] })); } catch (e) { return false; }
  }

  /* ---------- e-mail: cópia para a Growth.Etc, com o PDF anexado ---------- */
  function payload(g) {
    var o = flat(g);
    var p = {
      _subject: 'Novo briefing de pré-diagnóstico: ' + (companyOf(o) || o['Nome'] || ''),
      _template: 'table',
      _captcha: 'false'
    };
    g.forEach(function (gr) { gr.rows.forEach(function (r) { if (r[0] === 'Frente de interesse' && r[1] === '—') return; p[r[0]] = r[1]; }); });
    var u = pageUrl(); if (u) p['Página'] = u;
    var og = origin(); if (og) p['Origem da visita'] = og;
    return p;
  }
  // com PDF: multipart (campo "attachment"); sem PDF: JSON
  function post(g, pdf, withPdf) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    var p = payload(g), body, headers = { 'Accept': 'application/json' }, keep = false;
    if (withPdf && pdf && pdf.blob && typeof FormData === 'function') {
      body = new FormData();
      var est = pdf.size;
      Object.keys(p).forEach(function (k) { body.append(k, p[k]); est += k.length + String(p[k]).length * 3 + 120; });
      body.append('attachment', pdf.blob, pdf.name);
      keep = est < 60000; // keepalive (o envio termina mesmo se o WhatsApp tomar a tela) só aceita corpos de até 64 KB
    } else {
      body = JSON.stringify(p); headers['Content-Type'] = 'application/json';
    }
    return fetch(ENDPOINT, { method: 'POST', headers: headers, body: body, keepalive: keep, signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      clearTimeout(timer);
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j || {} }; }, function () { return { ok: r.ok, status: r.status, j: {} }; });
    }, function (err) { clearTimeout(timer); throw err; });
  }
  function accepted(res) { var s = res.j && res.j.success; return res.ok && (s === true || s === 'true'); }
  // devolve { state: 'ok' | 'ok-nopdf' | 'fail' }
  function sendMail(g, pdf) {
    var hasPdf = ATTACH && !!(pdf && pdf.blob);
    return post(g, pdf, hasPdf).then(function (res) {
      if (accepted(res)) return { state: hasPdf ? 'ok' : 'ok-nopdf' };
      if (hasPdf) { // o servidor recusou o envio com anexo (o endpoint AJAX só documenta JSON): ao menos as respostas seguem por e-mail
        return post(g, pdf, false).then(function (r2) { return { state: accepted(r2) ? 'ok-nopdf' : 'fail' }; }, function () { return { state: 'fail' }; });
      }
      return { state: 'fail' };
    }, function () { return { state: 'fail' }; });
  }
  // plano B quando o e-mail automático falha: o corpo cabe no link (cerca de 1.900 caracteres); respostas longas são resumidas, nunca o fim cortado
  function mailtoHref(g) {
    var o = flat(g), subject = 'Briefing de pré-diagnóstico: ' + (companyOf(o) || o['Nome'] || '');
    var lims = [0, 240, 140, 90, 60], MAXB = 1890, body = '', note = '', i;
    for (i = 0; i < lims.length; i++) {
      body = summaryText(g, lims[i], true).replace(/\s+$/, '');
      note = i === 0 ? '\n\n[Se puder, anexe a este e-mail o PDF com as respostas.]' : '\n\n[Resumo. As respostas completas estão no PDF: anexe o arquivo baixado a este e-mail.]';
      if (encodeURIComponent(body + note).length <= MAXB) break;
    }
    while (encodeURIComponent(body + note).length > MAXB && body.length > 200) body = body.slice(0, body.length - 100); // último recurso
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body + note);
  }

  /* ---------- painel de retorno ---------- */
  function fill(root, key, val) { [].slice.call(root.querySelectorAll('[data-fill="' + key + '"]')).forEach(function (n) { n.textContent = val; }); }
  function setBusy(on) {
    sending = on; btnSend.disabled = on; btnSend.setAttribute('aria-busy', on ? 'true' : 'false');
    btnSend.textContent = on ? 'Preparando o envio…' : btnSend.getAttribute('data-label');
  }
  function swapTo(panel) {
    head.hidden = true; form.hidden = true; done.hidden = true;
    panel.hidden = false;
    var h = panel.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    wiz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  var MAIL_TXT = {
    wait: 'Enviando uma cópia com o PDF para ' + MAIL + '…',
    ok: 'Cópia enviada por e-mail para ' + MAIL + ', com o PDF em anexo.',
    'ok-nopdf': 'Cópia das respostas enviada por e-mail para ' + MAIL + '. O PDF não seguiu junto: use o WhatsApp.',
    fail: 'Não foi possível enviar o e-mail automaticamente. O WhatsApp continua valendo; se quiser, envie também por e-mail.'
  };
  function setMail(state) {
    var dot = d.getElementById('wiz-mail-dot'), st = d.getElementById('wiz-mail-status'), acts = d.getElementById('wiz-mail-actions');
    if (dot) dot.className = 'wiz-dot ' + (state === 'wait' ? 'is-wait' : state === 'fail' ? 'is-fail' : 'is-ok');
    if (st) st.textContent = MAIL_TXT[state] || '';
    if (acts) acts.hidden = state !== 'fail';
  }
  function runMail() {
    if (!result) return;
    setMail('wait');
    var g = result.g, pdf = result.pdf;
    sendMail(g, pdf).then(function (r) {
      setMail(r.state);
      track(r.state === 'fail' ? 'form_submit_fail' : 'email_copy', { form: 'pre_diagnostico', state: r.state });
    });
  }
  function renderDone(g, pdf, wa, opened) {
    var o = flat(g), text = summaryText(g);
    fill(done, 'nome', (o['Nome'] || '').split(' ')[0]);
    fill(done, 'empresa', companyOf(o));
    var a = d.getElementById('wiz-wa'); if (a) a.setAttribute('href', wa.href);
    var lng = d.getElementById('wiz-wa-long'); if (lng) lng.hidden = wa.level === 0;
    var card = d.getElementById('wiz-pdf-card'), info = d.getElementById('wiz-pdf-info'), sh = d.getElementById('wiz-pdf-share'), dl = d.getElementById('wiz-pdf-dl');
    if (card) card.hidden = !pdf;
    if (pdf) {
      if (info) info.textContent = pdf.name + ' · ' + pdf.pages + (pdf.pages === 1 ? ' página' : ' páginas') + ' · ' + kb(pdf.size);
      var can = canShareFile(pdf), how = d.getElementById('wiz-pdf-how');
      if (sh) sh.hidden = !can;
      if (how) how.textContent = can
        ? 'Toque em “Compartilhar o PDF”, escolha o WhatsApp e depois a conversa com a Growth.Etc (' + PHONE + '). Se preferir, baixe o arquivo e anexe pelo clipe, em Documento.'
        : 'Baixe o arquivo. Na conversa do WhatsApp, toque no clipe (ou no +) e escolha Documento. No computador, é só arrastar o PDF para a conversa.';
    }
    var sum = d.getElementById('wiz-sum'); if (sum) sum.value = text;
    var ml = d.getElementById('wiz-mail-link'); if (ml) ml.setAttribute('href', mailtoHref(g));
    var pv = d.getElementById('wiz-preview');
    if (pv) {
      pv.hidden = !inPreview;
      pv.textContent = dn
        ? 'Você está vendo a pré-visualização da página. Aqui a cópia por e-mail não é enviada, porque a pré-visualização bloqueia conexões externas. O botão “Baixar o PDF” funciona com uma confirmação do visualizador.'
        : 'Você está vendo a pré-visualização da página. Aqui a cópia por e-mail e o download do PDF ficam bloqueados pela própria pré-visualização.';
    }
    var nt = d.getElementById('wiz-wa-hint'); if (nt) nt.textContent = opened ? 'Abrimos o WhatsApp para você. Se ele não apareceu, toque no botão.' : 'Toque no botão para abrir o WhatsApp.';
    if (opened) track('whatsapp_open', { form: 'pre_diagnostico', texto: wa.level });
    track('form_submit', { form: 'pre_diagnostico', atuacao: o['Atuação'] || '', frente: o['Frente de interesse'] || '', pdf: pdf ? pdf.pages : 0, texto: wa.level });
    side.forEach(function (li) { li.classList.add('is-done'); li.classList.remove('is-current'); li.removeAttribute('aria-current'); });
    swapTo(done);
  }

  function submitAll() {
    if (sending) return;
    for (var i = 0; i < total; i++) {
      var bad = checkStep(i);
      if (bad) { show(i, true); elStatus.textContent = 'Revise os campos destacados para enviar.'; track('form_error', { step: i + 1 }); bad.focus(); return; }
    }
    var hp = form.elements.namedItem('_honey');
    var g = collect(); last = g;
    if (hp && hp.value) { swapTo(done); return; } // robô: não envia, não avisa
    setBusy(true);
    if (window.GEPDF || !PDF_SRC) { finishSend(g); return; } // caminho normal: tudo dentro do mesmo toque
    // o gerador de PDF ainda não chegou (rede lenta): espera até 6 s e segue (sem PDF, se ele não vier; o painel traz o botão do WhatsApp)
    var gone = false, go = function () { if (!gone) { gone = true; finishSend(g); } };
    loadPdf().then(go, go);
    setTimeout(go, 6000);
  }
  function finishSend(g) {
    var pdf = null;
    try { pdf = makePdf(g); } catch (e) { pdf = null; }
    var wa = waLink(g, !!pdf);
    result = { g: g, pdf: pdf, wa: wa };
    // tudo acontece dentro do mesmo toque (senão o navegador bloqueia a janela do WhatsApp):
    // 1) a cópia por e-mail sai em segundo plano, 2) o WhatsApp abre com as respostas, 3) o painel mostra o PDF e o estado de cada envio
    runMail();
    var opened = openWhatsApp(wa.href);
    renderDone(g, pdf, wa, opened);
    setBusy(false);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (cur < total - 1) next(); else submitAll();
  });

  /* ---------- ações do painel ---------- */
  function flash(btn, msg) {
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old); btn.textContent = msg;
    setTimeout(function () { btn.textContent = old; }, 2200);
  }
  var dlBtn = d.getElementById('wiz-pdf-dl');
  if (dlBtn) dlBtn.addEventListener('click', function () { if (result && result.pdf) download(result.pdf); });
  var shBtn = d.getElementById('wiz-pdf-share');
  if (shBtn) shBtn.addEventListener('click', function () {
    if (!result || !result.pdf) return;
    var o = flat(result.g), data = { files: [result.pdf.file], title: 'Pré-diagnóstico Growth.Etc', text: 'Respostas do pré-diagnóstico' + (companyOf(o) ? ' · ' + companyOf(o) : '') };
    var p; try { p = navigator.share(data); } catch (e) { download(result.pdf); return; }
    if (p && p.catch) p.catch(function (err) { if (err && err.name === 'AbortError') return; download(result.pdf); }); // se o compartilhamento falhar, baixa o arquivo
  });
  var retry = d.getElementById('wiz-mail-retry');
  if (retry) retry.addEventListener('click', runMail);
  var copyBtn = d.getElementById('wiz-copy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var sum = d.getElementById('wiz-sum'), text = sum ? sum.value : '';
    function manual() {
      var det = d.getElementById('wiz-sum-wrap'); if (det) det.open = true;
      if (sum) { sum.focus(); sum.select(); }
      try { if (d.execCommand && d.execCommand('copy')) { flash(copyBtn, 'Copiado!'); return; } } catch (e) { /* segue */ }
      flash(copyBtn, 'Selecione e copie');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { flash(copyBtn, 'Copiado!'); }, manual); else manual();
  });
  var review = d.getElementById('wiz-review');
  if (review) review.addEventListener('click', function () {
    done.hidden = true; head.hidden = false; form.hidden = false; show(total - 1, true);
  });

  /* ---------- início ---------- */
  btnSend.setAttribute('data-label', btnSend.textContent);
  syncCond();
  show(0, false);
})();

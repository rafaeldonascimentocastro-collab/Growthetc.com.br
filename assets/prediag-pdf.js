/* Growth.Etc — PDF das respostas do pré-diagnóstico
   JavaScript puro, sem bibliotecas: fontes padrão do PDF (Helvetica, codificação WinAnsi), A4, várias páginas.
   Uso: GEPDF.build(dados) -> { bytes, blob, pages, size }
   Arquivo gerado por make_pdf_js.py (a faixa do topo e as larguras das fontes entram no build). */
(function (root) {
  'use strict';

  /* ---------- faixa do topo (logo branco sobre navy), embutida no build ---------- */
  var HEAD = { w: 1191, h: 168, b64: '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' };

  /* larguras dos códigos 32..255 (WinAnsi), em milésimos de em */
  var W_REG = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761, 556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500];
  var W_BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761, 556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556];

  /* ---------- medidas (pontos) e cores ---------- */
  var PW = 595.28, PH = 841.89;     // A4
  var MX = 44, CW = PW - MX * 2;    // margem lateral e largura útil
  var HEAD_H = 84, BAND2 = 26;      // faixa do topo (1ª página) e faixa fina (demais)
  var FOOT_H = 54;                  // reserva do rodapé
  var C = {
    navy: [0.094, 0.161, 0.200], mute: [0.337, 0.396, 0.439], faint: [0.541, 0.592, 0.627],
    orange: [0.875, 0.365, 0.169], orangeInk: [0.737, 0.286, 0.110], orangeLit: [0.945, 0.498, 0.325],
    paper: [0.965, 0.953, 0.925], line: [0.882, 0.867, 0.835], white: [1, 1, 1], silver: [0.78, 0.83, 0.86]
  };

  /* ---------- texto: Unicode -> WinAnsi (1 byte por caractere) ---------- */
  var CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89,
    0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95,
    0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
  function enc(s) {
    s = String(s == null ? '' : s);
    try { if (s.normalize) s = s.normalize('NFC'); } catch (e) { /* segue */ }
    var out = '', i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c === 10) { out += '\n'; continue; }
      if (c === 13 || c === 0xAD) continue;
      if (c === 9) { out += ' '; continue; }
      if (c >= 0xD800 && c <= 0xDFFF) { if (c <= 0xDBFF) i++; continue; }          // emoji e outros fora do plano básico: descarta
      if (c === 0x200B || c === 0x200C || c === 0x200D || c === 0xFE0F || c === 0x2060 || c === 0xFEFF) continue;
      if (c === 0x2010 || c === 0x2011 || c === 0x2212) { out += '-'; continue; }
      if (c === 0x2009 || c === 0x2002 || c === 0x2003 || c === 0x202F) { out += ' '; continue; }
      if (c === 0x2192) { out += '->'; continue; }
      if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255)) { out += String.fromCharCode(c); continue; }
      if (CP1252[c]) { out += String.fromCharCode(CP1252[c]); continue; }
      out += '?';
    }
    return out;
  }
  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function n(x) { return String(Math.round(x * 100) / 100); }
  function clr(c) { return n(c[0]) + ' ' + n(c[1]) + ' ' + n(c[2]); }
  function hex16(s) { var h = 'FEFF', i, c; for (i = 0; i < s.length; i++) { c = s.charCodeAt(i).toString(16).toUpperCase(); h += ('0000' + c).slice(-4); } return '<' + h + '>'; }
  function two(v) { return ('0' + v).slice(-2); }

  /* ---------- medição e quebra de linha ---------- */
  function wchar(code, bold) { var a = bold ? W_BOLD : W_REG; return a[code - 32] || 556; }
  function width(s, bold, size, tc) {
    var w = 0, i;
    for (i = 0; i < s.length; i++) w += wchar(s.charCodeAt(i), bold);
    return w * size / 1000 + (tc || 0) * s.length;
  }
  function fit(word, bold, size, maxW) { // quantos caracteres cabem
    var w = 0, i;
    for (i = 0; i < word.length; i++) {
      w += wchar(word.charCodeAt(i), bold) * size / 1000;
      if (w > maxW) return Math.max(1, i);
    }
    return word.length;
  }
  function wrap(s, bold, size, maxW) {
    var lines = [], paras = s.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '').split('\n'), p, words, cur, i, w, test, k;
    for (p = 0; p < paras.length; p++) {
      if (!paras[p].replace(/ /g, '')) { lines.push(''); continue; }
      words = paras[p].split(/ +/); cur = '';
      for (i = 0; i < words.length; i++) {
        w = words[i]; if (!w) continue;
        test = cur ? cur + ' ' + w : w;
        if (width(test, bold, size) <= maxW) { cur = test; continue; }
        if (cur) { lines.push(cur); cur = ''; }
        while (width(w, bold, size) > maxW) {
          k = fit(w, bold, size, maxW);
          for (var j = k; j > Math.max(2, Math.floor(k * 0.55)); j--) { if (/[\/\-._?&=,;:@]/.test(w.charAt(j - 1))) { k = j; break; } }  // prefere quebrar depois de pontuação
          lines.push(w.slice(0, k)); w = w.slice(k);
        }
        cur = w;
      }
      lines.push(cur);
    }
    return lines.length ? lines : [''];
  }

  /* ---------- documento ---------- */
  function Doc(meta) { this.meta = meta; this.pages = []; this.y = 0; this.cur = null; this.newPage(); }
  Doc.prototype.op = function (s) { this.cur.ops.push(s); };
  Doc.prototype.rect = function (x, yTop, w, h, c) { this.op(clr(c) + ' rg ' + n(x) + ' ' + n(PH - yTop - h) + ' ' + n(w) + ' ' + n(h) + ' re f'); };
  Doc.prototype.rrect = function (x, yTop, w, h, r, c) {
    var X = x, Y = PH - yTop - h, k = 0.5523 * r;
    this.op(clr(c) + ' rg ' + n(X + r) + ' ' + n(Y) + ' m ' + n(X + w - r) + ' ' + n(Y) + ' l ' +
      n(X + w - r + k) + ' ' + n(Y) + ' ' + n(X + w) + ' ' + n(Y + r - k) + ' ' + n(X + w) + ' ' + n(Y + r) + ' c ' +
      n(X + w) + ' ' + n(Y + h - r) + ' l ' +
      n(X + w) + ' ' + n(Y + h - r + k) + ' ' + n(X + w - r + k) + ' ' + n(Y + h) + ' ' + n(X + w - r) + ' ' + n(Y + h) + ' c ' +
      n(X + r) + ' ' + n(Y + h) + ' l ' +
      n(X + r - k) + ' ' + n(Y + h) + ' ' + n(X) + ' ' + n(Y + h - r + k) + ' ' + n(X) + ' ' + n(Y + h - r) + ' c ' +
      n(X) + ' ' + n(Y + r) + ' l ' +
      n(X) + ' ' + n(Y + r - k) + ' ' + n(X + r - k) + ' ' + n(Y) + ' ' + n(X + r) + ' ' + n(Y) + ' c f');
  };
  Doc.prototype.hline = function (x1, x2, yTop, c, lw) { this.op(clr(c) + ' RG ' + n(lw || 0.5) + ' w ' + n(x1) + ' ' + n(PH - yTop) + ' m ' + n(x2) + ' ' + n(PH - yTop) + ' l S'); };
  // texto já em WinAnsi; yTop = topo da linha, baseline = yTop + 0.82 * tamanho
  Doc.prototype.text = function (x, yTop, s, o) {
    o = o || {};
    var size = o.size || 10, font = o.bold ? 'F2' : (o.italic ? 'F3' : 'F1'), base = PH - (yTop + size * 0.82);
    this.op('BT /' + font + ' ' + n(size) + ' Tf ' + clr(o.color || C.navy) + ' rg ' + n(o.tc || 0) + ' Tc ' + n(x) + ' ' + n(base) + ' Td (' + esc(s) + ') Tj ET');
  };
  Doc.prototype.image = function (x, yTop, w, h) { this.op('q ' + n(w) + ' 0 0 ' + n(h) + ' ' + n(x) + ' ' + n(PH - yTop - h) + ' cm /Im1 Do Q'); };
  Doc.prototype.link = function (x, yTop, w, h, uri) { this.cur.links.push({ r: [x, PH - yTop - h, x + w, PH - yTop], uri: uri }); };
  Doc.prototype.limit = function () { return PH - FOOT_H; };
  Doc.prototype.ensure = function (h) { if (this.y + h > this.limit()) this.newPage(); };

  Doc.prototype.newPage = function () {
    this.cur = { ops: [], links: [] };
    this.pages.push(this.cur);
    if (this.pages.length === 1) {
      if (HEAD.b64) this.image(0, 0, PW, HEAD_H);
      else {
        this.rect(0, 0, PW, HEAD_H, C.navy);
        this.text(MX, 22, enc('growth.etc'), { bold: true, size: 26, color: C.white });
        this.text(MX, 52, enc('SALES INNOVATION'), { bold: true, size: 8, color: C.orangeLit, tc: 2.2 });
      }
      this.rect(0, HEAD_H, PW, 3, C.orange);
      var a = enc('PRÉ-DIAGNÓSTICO'), b = enc('Respostas do briefing');
      this.text(PW - MX - width(a, true, 9.5, 1.2), 30, a, { bold: true, size: 9.5, color: C.orangeLit, tc: 1.2 });
      this.text(PW - MX - width(b, false, 9.5), 45, b, { size: 9.5, color: C.silver });
      this.y = HEAD_H + 3 + 28;
    } else {
      this.rect(0, 0, PW, BAND2, C.navy);
      this.rect(0, BAND2, PW, 2, C.orange);
      var l = enc('Growth.Etc  ·  Pré-diagnóstico'), r = enc(this.meta.company ? 'Respostas de ' + this.meta.company : 'Respostas do briefing');
      this.text(MX, 8, l, { bold: true, size: 8.5, color: C.white });
      this.text(PW - MX - width(r, false, 8.5), 8, r, { size: 8.5, color: C.silver });
      this.y = BAND2 + 2 + 24;
    }
  };

  /* título e identificação */
  Doc.prototype.title = function () {
    var m = this.meta, eyebrow = enc('BRIEFING DE PRÉ-DIAGNÓSTICO');
    this.text(MX, this.y, eyebrow, { bold: true, size: 8.5, color: C.orangeInk, tc: 1.3 });
    this.y += 16;
    var lines = wrap(enc(m.company || m.person || 'Respostas do briefing'), true, 22, CW), i;
    for (i = 0; i < Math.min(lines.length, 2); i++) { this.text(MX, this.y, lines[i], { bold: true, size: 22, color: C.navy }); this.y += 27; }
    var sub = [];
    if (m.person && m.company) sub.push('Respostas de ' + m.person);
    if (m.when) sub.push(m.when);
    if (sub.length) { this.text(MX, this.y + 1, enc(sub.join('  ·  ')), { size: 10, color: C.mute }); this.y += 18; }
    this.y += 8;
  };

  /* resumo em duas colunas, em cartão */
  Doc.prototype.summary = function (facts) {
    if (!facts.length) return;
    var pad = 16, gap = 22, colW = (CW - pad * 2 - gap) / 2, rows = [], i, h = 0, j;
    for (i = 0; i < facts.length; i += 2) {
      var pair = [facts[i], facts[i + 1]].filter(Boolean).map(function (f) {
        return { l: enc(f[0]).toUpperCase(), v: wrap(enc(f[1] || '—'), true, 10.5, colW) };
      });
      var rh = 0; for (j = 0; j < pair.length; j++) rh = Math.max(rh, 11 + pair[j].v.length * 14);
      rows.push({ cells: pair, h: rh }); h += rh + (i + 2 < facts.length ? 10 : 0);
    }
    var boxH = pad * 2 + h;
    this.ensure(boxH + 10);
    this.rrect(MX, this.y, CW, boxH, 9, C.paper);
    var y = this.y + pad;
    for (i = 0; i < rows.length; i++) {
      for (j = 0; j < rows[i].cells.length; j++) {
        var x = MX + pad + j * (colW + gap), cell = rows[i].cells[j], k;
        this.text(x, y, cell.l, { bold: true, size: 6.8, color: C.mute, tc: 0.7 });
        for (k = 0; k < cell.v.length; k++) this.text(x, y + 11 + k * 14, cell.v[k], { bold: true, size: 10.5, color: C.navy });
      }
      y += rows[i].h + 10;
    }
    this.y += boxH + 22;
  };

  /* título de seção (número + nome) */
  Doc.prototype.section = function (num, name, firstNeed) {
    this.ensure(46 + (firstNeed || 40));
    this.rect(MX, this.y + 1, 3, 14, C.orange);
    this.text(MX + 11, this.y, enc(num + '.  ' + name), { bold: true, size: 12.5, color: C.navy });
    this.y += 22;
    this.hline(MX, MX + CW, this.y - 4, C.navy, 0.9);
    this.y += 8;
  };

  /* pergunta + resposta */
  Doc.prototype.rowHeight = function (q, v) {
    var qs = wrap(enc(q), true, 8.6, CW), vs = (!v || v === '—') ? [''] : wrap(enc(v), false, 10, CW);
    return qs.length * 11.4 + 3 + Math.min(vs.length, 2) * 13.4 + 6;
  };
  Doc.prototype.row = function (q, v, last) {
    var empty = !v || v === '—';
    var qs = wrap(enc(q), true, 8.6, CW), vs = empty ? [enc('Não informado')] : wrap(enc(v), false, 10, CW), i;
    this.ensure(qs.length * 11.4 + 3 + Math.min(vs.length, 2) * 13.4 + 6);
    for (i = 0; i < qs.length; i++) { this.text(MX, this.y, qs[i], { bold: true, size: 8.6, color: C.mute }); this.y += 11.4; }
    this.y += 3;
    for (i = 0; i < vs.length; i++) {
      if (this.y + 13.4 > this.limit()) this.newPage();
      if (empty) this.text(MX, this.y, vs[i], { italic: true, size: 10, color: C.faint });
      else if (vs[i]) this.text(MX, this.y, vs[i], { size: 10, color: C.navy });
      this.y += 13.4;
    }
    this.y += 5;
    if (!last) { this.hline(MX, MX + CW, this.y, C.line, 0.5); }
    this.y += 9;
  };
  Doc.prototype.gap = function (h) { this.y += h; };
  Doc.prototype.note = function (s) {
    var ls = wrap(enc(s), false, 8, CW), i;
    this.ensure(ls.length * 11 + 8);
    for (i = 0; i < ls.length; i++) { this.text(MX, this.y, ls[i], { size: 8, color: C.faint }); this.y += 11; }
  };

  /* rodapé de todas as páginas (precisa do total) + links */
  Doc.prototype.footers = function () {
    var N = this.pages.length, c = this.meta.contact || {}, p, saved = this.cur;
    for (p = 0; p < N; p++) {
      this.cur = this.pages[p];
      var yL = PH - 40, y = PH - 34;
      this.hline(MX, MX + CW, yL, C.line, 0.6);
      var x = MX, a = enc('Growth.Etc · Sales Innovation'), sep = enc('   ·   ');
      this.text(x, y, a, { bold: true, size: 8, color: C.navy }); x += width(a, true, 8);
      var parts = [];
      if (c.mail) parts.push([enc(c.mail), 'mailto:' + c.mail]);
      if (c.phone) parts.push([enc(c.phone), c.wa ? 'https://wa.me/' + c.wa : '']);
      if (c.site) parts.push([enc(String(c.site).replace(/^https?:\/\//, '')), c.site]);
      for (var i = 0; i < parts.length; i++) {
        this.text(x, y, sep, { size: 8, color: C.faint }); x += width(sep, false, 8);
        this.text(x, y, parts[i][0], { size: 8, color: C.mute });
        var w = width(parts[i][0], false, 8);
        if (parts[i][1]) this.link(x, y, w, 10, parts[i][1]);
        x += w;
      }
      var pg = enc('Página ' + (p + 1) + ' de ' + N);
      this.text(PW - MX - width(pg, false, 8), y, pg, { size: 8, color: C.mute });
    }
    this.cur = saved;
  };

  /* ---------- gravação do arquivo ---------- */
  Doc.prototype.finish = function () {
    this.footers();
    var N = this.pages.length, out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', offs = [0], i, j;
    function put(num, body) { offs[num] = out.length; out += num + ' 0 obj\n' + body + '\nendobj\n'; }
    function stream(dict, data) { return '<< ' + dict + ' /Length ' + data.length + ' >>\nstream\n' + data + '\nendstream'; }
    var plan = [], next = 8;
    for (i = 0; i < N; i++) {
      var o = { content: next++, annots: [], page: 0 };
      for (j = 0; j < this.pages[i].links.length; j++) o.annots.push(next++);
      o.page = next++; plan.push(o);
    }
    var kids = plan.map(function (o) { return o.page + ' 0 R'; }).join(' ');
    var m = this.meta, now = m.date || new Date(), tz = -now.getTimezoneOffset(), sgn = tz < 0 ? '-' : '+', tzs = two(Math.floor(Math.abs(tz) / 60)) + "'" + two(Math.abs(tz) % 60) + "'";
    var date = 'D:' + now.getFullYear() + two(now.getMonth() + 1) + two(now.getDate()) + two(now.getHours()) + two(now.getMinutes()) + two(now.getSeconds()) + sgn + tzs;
    var title = 'Pré-diagnóstico' + (m.company ? ' · ' + m.company : '');
    put(1, '<< /Type /Catalog /Pages 2 0 R /Lang (pt-BR) /ViewerPreferences << /DisplayDocTitle true >> >>');
    put(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + N + ' >>');
    put(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    put(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    put(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');
    var jpg = HEAD.b64 ? atob(HEAD.b64) : '';
    put(6, jpg ? stream('/Type /XObject /Subtype /Image /Width ' + HEAD.w + ' /Height ' + HEAD.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode', jpg) : '<< /Type /XObject /Subtype /Form /BBox [0 0 1 1] /Length 0 >>\nstream\n\nendstream');
    put(7, '<< /Title ' + hex16(title) + ' /Author ' + hex16('Growth.Etc') + ' /Subject ' + hex16('Respostas do briefing de pré-diagnóstico') +
      ' /Creator ' + hex16('Growth.Etc · site') + ' /Producer ' + hex16('Growth.Etc') + ' /CreationDate (' + date + ') >>');
    for (i = 0; i < N; i++) {
      var pl = plan[i], pg = this.pages[i], body = pg.ops.join('\n');
      put(pl.content, stream('', body));
      for (j = 0; j < pg.links.length; j++) {
        var L = pg.links[j];
        put(pl.annots[j], '<< /Type /Annot /Subtype /Link /Rect [' + L.r.map(n).join(' ') + '] /Border [0 0 0] /A << /S /URI /URI (' + esc(L.uri) + ') >> >>');
      }
      put(pl.page, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + n(PW) + ' ' + n(PH) + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> /XObject << /Im1 6 0 R >> >> /Contents ' + pl.content + ' 0 R' +
        (pl.annots.length ? ' /Annots [' + pl.annots.map(function (a) { return a + ' 0 R'; }).join(' ') + ']' : '') + ' >>');
    }
    var xref = out.length, total = next;
    out += 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (i = 1; i < total; i++) out += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    var id = ''; for (i = 0; i < 16; i++) id += ('0' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
    out += 'trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 7 0 R /ID [<' + id + '><' + id + '>] >>\nstartxref\n' + xref + '\n%%EOF\n';
    var bytes = new Uint8Array(out.length);
    for (i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    var blob = null; try { blob = new Blob([bytes], { type: 'application/pdf' }); } catch (e) { blob = null; }
    return { bytes: bytes, blob: blob, pages: N, size: bytes.length };
  };

  /* dados: { company, person, when, date, contact:{mail,phone,wa,site}, summary:[[rótulo,valor]], groups:[{title, rows:[{q,v}]}], note } */
  function build(data) {
    var doc = new Doc(data), gi, ri, rows;
    doc.title();
    doc.summary(data.summary || []);
    for (gi = 0; gi < data.groups.length; gi++) {
      rows = data.groups[gi].rows;
      if (!rows.length) continue;
      doc.section(gi + 1, data.groups[gi].title, doc.rowHeight(rows[0].q, rows[0].v));
      for (ri = 0; ri < rows.length; ri++) doc.row(rows[ri].q, rows[ri].v, ri === rows.length - 1);
      doc.gap(10);
    }
    if (data.note) doc.note(data.note);
    return doc.finish();
  }

  root.GEPDF = { build: build, enc: enc, width: width };
})(typeof window !== 'undefined' ? window : globalThis);

/* JFRESH OS — Phase 12 NP-09 Smart Help & Guided Learning screens (HELP-001..007) and the global
   "? Bantuan" contextual help panel (§51–§59) available on every screen for every role, incl. clients.
   Every answer, article, tour, walkthrough, training row and analytics number comes from the help engine
   (assets/js/jfos-help.js · window.JFHELP). Incident reports from the panel go to JFGO.reportIncident.
   The panel hooks into the shell without app.js changes: a MutationObserver re-inserts the help button
   into the header after every render; the panel, spotlight and bubbles live outside #app. */
(function () {
  var A = window.JFAPP, HL = window.JFHELP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8;
  if (!A || !HL || !P || !H) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href;
  var C = window.JFOS, X = window.JFACCESS;
  A.addParents(HL.PARENTS || {});

  function cx() { return A.ctx(); }
  function phone() { return A.mode() === 'm'; }
  function dctx() { var c = cx(); return c ? Object.assign({}, c, { device: phone() ? 'mobile' : A.mode() === 't' ? 'ipad' : 'desktop' }) : c; }
  function tt(x) { return x == null ? '' : t(x); }
  function open(id) { return H.open(id); }
  function scrN(id) { var s = C.screen(id); return s ? s.n : L(id, id); }
  function GO() { return window.JFGO || null; }
  function chipSt(map, k) { var x = map && map[k]; return x ? A.chip(x[1], x[0]) : A.chip('info', L(String(k), String(k))); }
  var PROG_T = { assigned: 'info', started: 'info', completed: 'warn', practiced: 'appr', passed: 'ok' };
  function progChip(st, n) { return A.chip(PROG_T[st] || 'info', n || HL.PROGRESS_N[st] || L(st, st)); }
  function needNote(need) { return need ? '<p class="hp12-need">' + ic('lock') + '<span>' + tt(need.msg) + '</span></p>' : ''; }
  function videoBox(v) {
    if (!v) return '';
    return '<div class="hp12-vid" role="img" aria-label="' + esc(T(L('Video tutorial', 'Video tutorial'))) + '">' + '<span class="hp12-vid-p">' + ic('play') + '</span><span><b>' + tt(v.title || L('Video tutorial', 'Video tutorial')) + '</b><small>' +
      esc(v.len) + ' ' + t(L('detik', 'seconds')) + ' · ' + t(v.src ? L('Putar', 'Play') : L('Video segera tersedia', 'Video coming soon')) + '</small></span></div>';
  }
  function stepsList(steps) { return steps && steps.length ? '<ol class="hp12-steps">' + steps.map(function (s) { return '<li>' + tt(s) + '</li>'; }).join('') + '</ol>' : ''; }
  function kindChip(a) { var tn = { howto: 'info', why: 'warn', whatif: 'appr', whatis: 'ok' }[a.kind] || 'info'; return a.kindN ? A.chip(tn, a.kindN) : ''; }

  /* ---------- Article (HELP-004/<HLP-id> and inside the panel) ---------- */
  var opened = {};
  function getArticle(id, src) {
    var c = cx(), log = !opened[id + (src || '')];
    opened[id + (src || '')] = 1;
    return HL.article(c, id, { src: src || 'help', log: log });
  }
  function articleBody(a, o) {
    o = o || {};
    var fb = a.feedback || { yes: 0, no: 0, pct: null };
    return '<div class="hp12-art">' +
      '<div class="hp12-art-h">' + kindChip(a) + (a.moduleN ? A.chip('info', a.moduleN) : '') + (a.screen ? '<span class="hp12-src">' + ic('monitor') + (open(a.screen) ? '<a href="' + href(a.screen) + '">' + tt(a.screenN) + '</a>' : '<span>' + tt(a.screenN) + '</span>') + '</span>' : '') + '</div>' +
      '<p class="hp12-lead">' + tt(a.description) + '</p>' +
      (a.canDo ? stepsList(a.steps) + videoBox(a.video) : needNote(a.need)) +
      (a.faq && a.faq.length ? '<div class="hp12-faq">' + a.faq.map(function (f) { return '<details><summary>' + tt(f.q) + '</summary><p>' + tt(f.a) + '</p></details>'; }).join('') + '</div>' : '') +
      '<div class="hp12-art-a">' + (a.walk ? '<button type="button" class="btn btn-primary btn-sm" data-hp="walk" data-val="' + esc(a.walk) + '">' + ic('pointer') + '<span>' + t(L('PANDU SAYA', 'GUIDE ME')) + '</span></button>' : '') +
      (o.page ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-go="HELP-004" data-rec="' + esc(a.id) + '">' + ic('file') + '<span>' + t(L('Buka halaman', 'Open page')) + '</span></button>') + '</div>' +
      (a.status === 'published' ? '<div class="hp12-fb"><span>' + t(L('Apakah ini membantu?', 'Was this helpful?')) + '</span>' +
        '<button type="button" class="hp12-fbb' + (a.myFeedback && a.myFeedback.helpful === true ? ' on' : '') + '" data-hp="fb" data-val="' + esc(a.id) + '|1">' + ic('check') + '<span>' + t(L('Ya', 'Yes')) + '</span></button>' +
        '<button type="button" class="hp12-fbb' + (a.myFeedback && a.myFeedback.helpful === false ? ' on' : '') + '" data-hp="fb" data-val="' + esc(a.id) + '|0">' + ic('x') + '<span>' + t(L('Tidak', 'No')) + '</span></button>' +
        (fb.pct != null ? '<small>' + esc(fb.pct) + '% ' + t(L('merasa terbantu', 'found it helpful')) + ' (' + (fb.yes + fb.no) + ')</small>' : '') + '</div>' : '') +
      (a.related && a.related.length ? '<div class="hp12-rel"><b>' + t(L('Terkait', 'Related')) + '</b>' + a.related.map(function (r) { return '<a href="' + href('HELP-004', r.id) + '" data-hp-art="' + esc(r.id) + '">' + ic(r.canDo ? 'file' : 'lock') + '<span>' + tt(r.title) + '</span></a>'; }).join('') + '</div>' : '') +
      '</div>';
  }

  /* ---------- Contextual help block (panel + HELP-002) ---------- */
  function ctxHelp(h, o) {
    o = o || {};
    if (!h) return A.empty(L('Belum ada bantuan untuk layar ini.', 'No help for this screen yet.'));
    function artRow(a) {
      return '<details class="hp12-ar"' + (o.openFirst ? ' open' : '') + '><summary>' + ic(a.canDo ? (a.kind === 'why' ? 'help' : a.kind === 'whatif' ? 'alert' : 'file') : 'lock') + '<span>' + tt(a.title) + '</span></summary>' +
        '<div class="hp12-ar-b"><p>' + tt(a.description) + '</p>' + (a.canDo ? stepsList(a.steps) : needNote(a.need)) +
        '<div class="hp12-art-a">' + (a.walk ? '<button type="button" class="btn btn-primary btn-sm" data-hp="walk" data-val="' + esc(a.walk) + '">' + ic('pointer') + '<span>' + t(L('PANDU SAYA', 'GUIDE ME')) + '</span></button>' : '') +
        (a.id ? '<a class="btn btn-ghost btn-sm" href="' + href('HELP-004', a.id) + '">' + ic('file') + '<span>' + t(L('Selengkapnya', 'More')) + '</span></a>' : '') + '</div></div></details>';
    }
    var wi = h.whatIs || {};
    var sec = function (title, icon, body) { return body ? '<section class="hp12-sec"><h3>' + ic(icon) + '<span>' + t(title) + '</span></h3>' + body + '</section>' : ''; };
    return '<div class="hp12-ctx">' +
      '<div class="hp12-ctx-h"><span class="hp12-ctx-ic">' + ic((h.screen && h.screen.icon) || 'help') + '</span><div><b>' + tt(h.screen && h.screen.n) + '</b><small>' + (h.screen && h.screen.moduleN ? tt(h.screen.moduleN) + ' · ' : '') + tt(h.role && h.role.n) + '</small></div>' +
        (h.statusN ? A.chip('info', h.statusN, 'status') : '') + '</div>' +
      (h.rec && h.rec.id ? '<p class="hp12-recl">' + ic('tag') + '<span>' + esc(h.rec.id) + (h.rec.label ? ' · ' + tt(h.rec.label) : '') + '</span></p>' : '') +
      sec(L('Apa ini?', 'What is this?'), 'help', '<p class="hp12-lead">' + tt(wi.title) + (wi.title ? ' — ' : '') + tt(wi.description) + '</p>' + (h.fallback ? '<p class="hp12-mute">' + t(L('Belum ada artikel khusus; ini tujuan layar dari registry.', 'No dedicated article yet; this is the screen purpose from the registry.')) + '</p>' : '')) +
      sec(L('Kenapa tombol belum aktif?', 'Why is a button not active?'), 'alert', (h.blocked || []).filter(function (b) { return b.ok === false; }).map(function (b) {
        return '<div class="hp12-blk"><b>' + esc(b.label) + '</b><ul>' + (b.reasons || []).map(function (r) { return '<li>' + tt(r) + '</li>'; }).join('') + '</ul>' + (b.next && open(b.next.s) ? '<a class="lnk5" href="' + href(b.next.s, b.next.rec, b.next.q) + '">' + tt(b.next.l) + '</a>' : '') + '</div>';
      }).join('')) +
      sec(L('Cara melakukan', 'How to'), 'list', (h.howTo || []).map(artRow).join('')) +
      sec(L('Bagaimana jika…', 'What if…'), 'alert', (h.whatIf || []).map(artRow).join('')) +
      sec(L('Video tutorial', 'Video tutorial'), 'play', videoBox(h.video)) +
      sec(L('Masalah umum', 'Common issues'), 'message', (h.issues || []).map(function (i) { return '<details class="hp12-ar"><summary>' + ic('help') + '<span>' + tt(i.q) + '</span></summary><div class="hp12-ar-b"><p>' + tt(i.a) + '</p></div></details>'; }).join('')) +
      sec(L('Bantuan tombol', 'Button help'), 'pointer', (h.buttons || []).map(function (b) {
        return '<div class="hp12-btnh"><div class="hp12-btnh-h"><b class="hp12-btnl">' + esc(b.label) + '</b>' + (b.allowed === false ? A.chip('warn', L('Bukan izin Anda', 'Not your permission'), 'lock') : '') + '</div><p>' + tt(b.purpose) + '</p>' +
          (b.conditions && b.conditions.length ? '<small>' + t(L('Syarat', 'Conditions')) + '</small><ul>' + b.conditions.map(function (x) { return '<li>' + tt(x) + '</li>'; }).join('') + '</ul>' : '') +
          (b.after ? '<small>' + t(L('Setelah ditekan', 'After you press it')) + '</small><p>' + tt(b.after) + '</p>' : '') + (b.need ? needNote(b.need) : '') + '</div>';
      }).join('')) +
      sec(L('PANDU SAYA', 'GUIDE ME'), 'pointer', (h.walkthroughs || []).map(function (w) {
        return '<div class="hp12-wk"><span>' + ic('pointer') + '<b>' + tt(w.title) + '</b></span>' + (w.canDo ? '<button type="button" class="btn btn-primary btn-sm" data-hp="walk" data-val="' + esc(w.id) + '">' + ic('play') + '<span>' + t(L('PANDU SAYA', 'GUIDE ME')) + '</span></button>' : needNote(w.need)) + '</div>';
      }).join('')) +
      sec(L('Bantuan terkait', 'Related help'), 'link', (h.related || []).length ? '<div class="hp12-rel">' + h.related.map(function (r) { return '<a href="' + href('HELP-004', r.id) + '">' + ic(r.canDo ? 'file' : 'lock') + '<span>' + tt(r.title) + '</span></a>'; }).join('') + '</div>' : '') +
      (h.contact ? '<p class="hp12-contact">' + ic('headset') + '<span>' + tt(h.contact.msg) + '</span>' + (h.contact.s && open(h.contact.s) ? ' <a class="lnk5" href="' + href(h.contact.s) + '">' + t(L('Buka', 'Open')) + '</a>' : '') + '</p>' : '') +
      '</div>';
  }

  /* ---------- Search results (panel + HELP-004) ---------- */
  var lastQ = {};
  function doSearch(q, where) {
    var c = cx(), key = where + '|' + q, log = !lastQ[key];
    lastQ[key] = 1;
    return HL.search(c, q, { limit: 12, log: log });
  }
  function results(r, o) {
    o = o || {};
    if (!r) return '';
    var rows = (r.results || []).map(function (x) {
      return '<a class="hp12-res" href="' + href('HELP-004', x.id) + '"' + (o.panel ? ' data-hp-art="' + esc(x.id) + '"' : '') + '><span class="hp12-res-ic">' + ic(x.canDo ? (x.kind === 'why' ? 'help' : 'file') : 'lock') + '</span><span class="hp12-res-b"><b>' + tt(x.title) + '</b><small>' + tt(x.kindN) + ' · ' + tt(x.screenN) + (x.video ? ' · ' + t(L('video', 'video')) : '') + (x.walk ? ' · ' + t(L('PANDU SAYA', 'GUIDE ME')) : '') + '</small>' +
        (o.panel ? '' : '<span class="hp12-res-d">' + tt(x.description) + '</span>') + (x.need ? '<span class="hp12-res-n">' + ic('lock') + t(L('Butuh izin: ', 'Needs permission: ')) + tt(x.need.permN) + '</span>' : '') + '</span>' + ic('chevr', 'hp12-res-go') + '</a>';
    }).join('');
    var gl = (r.glossary || []).map(function (g) { return '<div class="hp12-gl"><b>' + tt(g.term) + '</b><span>' + tt(g.def) + '</span></div>'; }).join('');
    if (!rows && !gl) {
      return '<div class="hp12-none">' + ic('search') + '<p><b>' + t(L('Belum ada jawaban untuk "' + r.q + '".', 'No answer yet for "' + r.q + '".')) + '</b> ' + t(L('Pencarian ini dicatat agar tim training menambah konten.', 'This search is logged so the training team can add content.')) + '</p>' +
        ((r.suggest || []).length ? '<div class="hp12-rel"><b>' + t(L('Mungkin maksud Anda', 'Maybe you meant')) + '</b>' + r.suggest.map(function (s) { return '<a href="' + href('HELP-004', s.id) + '">' + ic('file') + '<span>' + tt(s.title) + '</span></a>'; }).join('') + '</div>' : '') +
        (r.contact ? '<p class="hp12-contact">' + ic('headset') + '<span>' + tt(r.contact.msg) + '</span></p>' : '') + '</div>';
    }
    return (gl ? '<div class="hp12-gls">' + gl + '</div>' : '') + '<div class="hp12-rs">' + rows + '</div>';
  }

  /* ---------- Tanya JFRESH answer ---------- */
  function answerHtml(r) {
    if (!r) return '';
    var links = (r.links || []).filter(function (l) { return l.s && open(l.s); });
    return '<div class="hp12-ans' + (r.fallback ? ' hp12-ans-fb' : '') + '">' + '<p>' + tt(r.answer) + '</p>' +
      (r.steps && r.steps.length ? stepsList(r.steps) : '') + (r.need ? needNote(r.need) : '') +
      (r.who && r.who.length && !r.need ? '<small class="hp12-who">' + ic('users') + t(L('Yang bisa: ', 'Who can: ')) + r.who.map(function (w) { return tt(w.n); }).join(', ') + '</small>' : '') +
      ((r.article && r.article.id) || links.length ? '<div class="hp12-rel">' + (r.article && r.article.id ? '<a href="' + href('HELP-004', r.article.id) + '">' + ic('file') + '<span>' + tt(r.article.title) + '</span></a>' : '') +
        links.map(function (l) { return '<a href="' + href(l.s, l.rec, l.q) + '">' + ic('arrow') + '<span>' + tt(l.l || scrN(l.s)) + '</span></a>'; }).join('') + '</div>' : '') +
      (r.context && r.context.screenN ? '<small class="hp12-mute">' + t(L('Konteks: ', 'Context: ')) + tt(r.context.screenN) + (r.context.rec ? ' · ' + esc(r.context.rec) : '') + (r.context.statusN ? ' · ' + tt(r.context.statusN) : '') + ' · ' + tt(r.context.roleN) + '</small>' : '') + '</div>';
  }

  /* ---------- Incident report form (shared with LIVE-003/new) ---------- */
  var INC_MOD = { auth: L('Login / akun', 'Login / account'), order: L('Order', 'Order'), logistics: L('Logistik / driver', 'Logistics / driver'), production: L('Produksi', 'Production'), delivery: L('Delivery', 'Delivery'), finance: L('Finance', 'Finance'), client: L('Portal klien', 'Client portal'), integration: L('Integrasi', 'Integration'), other: L('Lainnya', 'Other') };
  var HELP2INC = { production: 'production', logistics: 'logistics', delivery: 'delivery', finance: 'finance', purchasing: 'finance', commercial: 'order', client: 'client', system: 'auth' };
  var SEV_O = [['low', L('Low — kecil, ada cara lain', 'Low — minor, a workaround exists')], ['medium', L('Medium — mengganggu sebagian', 'Medium — partly blocking')], ['high', L('High — fungsi utama gagal', 'High — a major function fails')], ['critical', L('Critical — operasi atau keamanan gagal', 'Critical — operations or security fail')]];
  function incForm(o) {
    o = o || {};
    var G = GO(), kinds = [['other', L('Masalah lain', 'Other problem')]].concat(G ? Object.keys(G.CRITICAL_KINDS).map(function (k) { return [k, G.CRITICAL_KINDS[k]]; }) : []);
    var mod = o.module || 'other';
    return '<form class="hp12-inc" data-hp-inc="1" onsubmit="return false">' +
      H.fld(L('Apa masalahnya?', 'What is the problem?'), H.area('problem', '', L('Contoh: Tombol simpan tidak merespons di layar timbang', 'E.g. The save button does not respond on the weighing screen')), { req: true, wide: true }) +
      H.fld(L('Jenis', 'Type'), H.sel('kind', kinds, 'other'), { hint: t(L('Jenis kritis (login, order hilang, produksi terhenti, selisih keuangan, pembayaran ganda, data klien bocor, database) langsung dieskalasi.', 'Critical types (login, missing order, production blocked, financial mismatch, duplicate payment, client data exposure, database) escalate immediately.')) }) +
      '<div class="hp12-inc-2">' + H.fld(L('Tingkat', 'Severity'), H.sel('sev', SEV_O, 'medium')) + H.fld(L('Modul', 'Module'), H.sel('module', Object.keys(INC_MOD).map(function (k) { return [k, INC_MOD[k]]; }), mod)) + '</div>' +
      '<label class="f5 f5-w"><span>' + t(L('Bukti (foto / screenshot, opsional)', 'Evidence (photo / screenshot, optional)')) + '</span><input type="file" name="evf" multiple accept="image/*,.pdf"></label>' +
      '<input type="hidden" name="screen" value="' + esc(o.screen || '') + '">' +
      '<p class="hp12-err" role="alert"></p>' +
      '<button type="button" class="btn btn-primary' + (o.big ? ' btn-xl' : '') + ' hp12-inc-go" data-hp="incSend">' + ic('alert') + '<span>' + t(L('KIRIM LAPORAN', 'SEND REPORT')) + '</span></button></form>';
  }
  function incSubmit(form) {
    var G = GO(), c = dctx();
    var err = form.querySelector('.hp12-err');
    if (!G) { err.textContent = T(L('Layanan laporan belum tersedia. Coba Lagi.', 'Reporting is not available. Try again.')); return null; }
    var v = {}; form.querySelectorAll('[name]').forEach(function (f) { if (f.type !== 'file') v[f.name] = String(f.value).trim(); });
    var fi = form.querySelector('[name=evf]'), ev = fi && fi.files ? Array.prototype.map.call(fi.files, function (f) { return f.name; }) : [];
    var r = G.reportIncident(c, { problem: v.problem, kind: v.kind, sev: v.sev, module: v.module, screen: v.screen || A.S.screen, evidence: ev });
    if (!r || !r.ok) { err.textContent = r && r.errors ? Object.keys(r.errors).map(function (k) { return T(r.errors[k]); }).join(' ') : T(r && r.msg || L('Laporan belum terkirim. Coba Lagi.', 'The report was not sent. Try again.')); return null; }
    return r;
  }
  function incDone(r) {
    var i = r.incident, can3 = open('LIVE-003');
    return '<div class="hp12-ok">' + ic('checkc') + '<div><b>' + t(L('Laporan terkirim', 'Report sent')) + ' · <span class="mono6">' + esc(i.id) + '</span></b><p>' +
      t(L('Status: ', 'Status: ')) + tt(i.stN) + ' · ' + t(L('Tingkat ', 'Severity ')) + tt(i.sevN) + ' · SLA ' + esc(i.sla) + '</p>' +
      (r.escalated ? '<p class="hp12-esc">' + ic('alert') + t(L('Kritis: langsung dieskalasi ke Implementation Lead dan Owner.', 'Critical: escalated immediately to the Implementation Lead and Owner.')) + '</p>' : '') +
      (can3 ? '<a class="btn btn-ghost btn-sm" href="' + href('LIVE-003', i.id) + '">' + ic('arrow') + '<span>' + t(L('Lihat tiket', 'View ticket')) + '</span></a>' : '<p class="hp12-mute">' + t(L('Tim go-live akan menindaklanjuti. Simpan nomor tiket ini.', 'The go-live team will follow up. Keep this ticket number.')) + '</p>') + '</div></div>';
  }

  /* =====================================================================
     GLOBAL "? BANTUAN" PANEL (§51–§58)
     ===================================================================== */
  var PN = { open: false, tab: 'here', q: '', art: null, chat: [], inc: null, uid: null, lastScreen: null };
  function ensureUser() { var c = cx(), u = c ? c.uid : null; if (u !== PN.uid) { PN.uid = u; PN.chat = []; PN.inc = null; PN.art = null; PN.q = ''; chat5 = []; } }
  function curScreen() { var s = A.S.screen; if (s === 'HELP-002' && A.S.q && A.S.q['for']) return A.S.q['for']; return s; }
  function curRec() { if (A.S.screen === 'HELP-002') return A.S.q && A.S.q.rec || null; return A.S.rec && A.S.rec !== 'new' ? A.S.rec : null; }
  function panelEl() {
    var el = document.getElementById('hp12-p');
    if (!el) {
      el = document.createElement('div'); el.id = 'hp12-p'; el.className = 'hp12-pw'; el.hidden = true;
      document.body.appendChild(el);
      el.addEventListener('click', panelClick);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closePanel(); return; }
        if (e.key === 'Enter' && e.target.matches('.hp12-pq')) { e.preventDefault(); runPanelInput(e.target); }
      });
    }
    return el;
  }
  function openPanel(tab) {
    ensureUser(); if (!cx()) return;
    PN.open = true; if (tab) PN.tab = tab; PN.art = tab === 'here' ? null : PN.art;
    renderPanel();
    var el = panelEl(); el.hidden = false; document.body.classList.add('hp12-on');
    var f = el.querySelector('.hp12-pq') || el.querySelector('.hp12-p-x'); if (f) f.focus({ preventScroll: true });
    var b = document.querySelector('.hp12-hb'); if (b) b.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    PN.open = false; var el = document.getElementById('hp12-p'); if (el) el.hidden = true; document.body.classList.remove('hp12-on');
    var b = document.querySelector('.hp12-hb'); if (b) { b.setAttribute('aria-expanded', 'false'); }
  }
  function tabBtn(k, label, icon) { return '<button type="button" role="tab" class="hp12-tab" aria-selected="' + (PN.tab === k) + '" data-hp="tab" data-val="' + k + '">' + ic(icon) + '<span>' + t(label) + '</span></button>'; }
  function renderPanel() {
    var el = panelEl(), c = cx(); if (!c) return;
    var sid = curScreen(), body = '';
    if (PN.art) {
      var a = getArticle(PN.art, 'panel');
      body = a ? '<button type="button" class="hp12-back" data-hp="back">' + ic('arrowl') + '<span>' + t(L('Kembali', 'Back')) + '</span></button><h3 class="hp12-art-t">' + tt(a.title) + '</h3>' + articleBody(a) : A.empty(L('Artikel tidak ditemukan.', 'Article not found.'));
    } else if (PN.tab === 'here') {
      var h = null; try { h = HL.helpFor(c, sid, { rec: curRec() }); } catch (e) { h = null; }
      body = h ? ctxHelp(h) : A.stateCard('error', L('Data belum berhasil dimuat.', 'The data could not be loaded.'), '<button type="button" class="btn btn-blue btn-sm" data-hp="tab" data-val="here">' + ic('refresh') + '<span>' + t(L('Coba Lagi', 'Try Again')) + '</span></button>');
    } else if (PN.tab === 'search') {
      body = '<div class="hp12-qbox">' + ic('search') + '<input class="hp12-pq" type="search" data-k="search" value="' + esc(PN.q) + '" placeholder="' + t(L('Cari bantuan…', 'Search help…')) + '" aria-label="' + t(L('Cari bantuan', 'Search help')) + '"><button type="button" class="btn btn-blue btn-sm" data-hp="search">' + t(L('Cari', 'Search')) + '</button></div>' +
        (PN.q ? results(doSearch(PN.q, 'panel'), { panel: true }) : popularBlock());
    } else if (PN.tab === 'ask') {
      body = '<p class="hp12-mute">' + t(L('Tanya apa saja tentang layar ini. Jawaban memakai layar, status data, peran dan izin Anda.', 'Ask anything about this screen. Answers use the screen, record status, your role and permissions.')) + '</p>' +
        '<div class="hp12-chat">' + (PN.chat.length ? PN.chat.map(function (m) { return '<div class="hp12-q">' + esc(m.q) + '</div>' + answerHtml(m.r); }).join('') : suggestBlock(sid)) + '</div>' +
        '<div class="hp12-qbox">' + ic('message') + '<input class="hp12-pq" type="text" data-k="ask" placeholder="' + t(L('Contoh: Kenapa tombol ini belum aktif?', 'E.g. Why is this button not active?')) + '" aria-label="' + t(L('Pertanyaan', 'Question')) + '"><button type="button" class="btn btn-primary btn-sm" data-hp="ask">' + t(L('Tanya', 'Ask')) + '</button></div>';
    } else if (PN.tab === 'report') {
      var hm = null; try { var hh = HL.helpFor(c, sid); hm = hh && hh.screen && HELP2INC[hh.screen.module]; } catch (e) {}
      body = PN.inc ? incDone(PN.inc) + '<button type="button" class="btn btn-ghost btn-sm" data-hp="incNew">' + ic('plus') + '<span>' + t(L('Laporkan masalah lain', 'Report another problem')) + '</span></button>' :
        '<p class="hp12-mute">' + t(L('Ada yang tidak berjalan? Laporkan di sini — layar saat ini ikut terkirim.', 'Something not working? Report it here — the current screen is sent along.')) + ' <b>' + tt(scrN(sid)) + '</b></p>' + incForm({ screen: sid, module: hm || 'other' });
    }
    var walks = []; try { walks = HL.walkthroughs(c, sid).filter(function (w) { return w.canDo; }); } catch (e) {}
    el.innerHTML = '<div class="hp12-scrim" data-hp="close"></div><aside class="hp12-p" role="dialog" aria-modal="false" aria-labelledby="hp12-pt">' +
      '<div class="hp12-p-h"><span class="hp12-p-ic">' + ic('help') + '</span><div class="hp12-p-tt"><b id="hp12-pt">' + t(L('Bantuan', 'Help')) + '</b><small>' + tt(scrN(sid)) + '</small></div>' +
      '<button type="button" class="ib hp12-p-x" data-hp="close" aria-label="' + t(L('Tutup bantuan', 'Close help')) + '">' + ic('x') + '</button></div>' +
      '<div class="hp12-acts">' +
        (walks.length ? '<button type="button" class="hp12-act hp12-act-p" data-hp="walk" data-val="' + esc(walks[0].id) + '">' + ic('pointer') + '<span>' + t(L('PANDU SAYA', 'GUIDE ME')) + '</span></button>' : '<a class="hp12-act" href="' + href('HELP-003') + '" data-hp="close-nav">' + ic('pointer') + '<span>' + t(L('PANDU SAYA', 'GUIDE ME')) + '</span></a>') +
        '<button type="button" class="hp12-act" data-hp="whatis">' + ic('eye') + '<span>' + t(L('APA INI?', 'WHAT IS THIS?')) + '</span></button>' +
        '<button type="button" class="hp12-act" data-hp="tour">' + ic('sparkles') + '<span>' + t(L('Tur produk', 'Product tour')) + '</span></button>' +
      '</div>' +
      '<div class="hp12-tabs" role="tablist">' + tabBtn('here', L('Layar ini', 'This screen'), 'monitor') + tabBtn('search', L('Cari', 'Search'), 'search') + tabBtn('ask', L('Tanya JFRESH', 'Ask JFRESH'), 'message') + tabBtn('report', L('Lapor', 'Report'), 'alert') + '</div>' +
      '<div class="hp12-p-b">' + body + '</div>' +
      '<div class="hp12-p-f"><a href="' + href('HELP-001') + '" data-hp="close-nav">' + ic('help') + '<span>' + t(L('Buka Smart Help', 'Open Smart Help')) + '</span></a>' + (open('HELP-007') ? '<a href="' + href('HELP-007') + '" data-hp="close-nav">' + ic('target') + '<span>' + t(L('Progres belajar', 'Learning progress')) + '</span></a>' : '') + '</div>' +
      '</aside>';
  }
  function popularBlock() {
    var c = cx(), hm = null; try { hm = HL.home(c); } catch (e) {}
    var pop = hm && hm.popular || [];
    return pop.length ? '<div class="hp12-pop"><b>' + t(L('Sering dicari', 'Popular searches')) + '</b><div>' + pop.slice(0, 6).map(function (p) { return '<button type="button" class="hp12-chipb" data-hp="q" data-val="' + esc(p.term) + '">' + esc(p.term) + '</button>'; }).join('') + '</div></div>' : '';
  }
  function suggestBlock(sid) {
    var qs = [L('Apa fungsi layar ini?', 'What is this screen for?'), L('Kenapa tombol ini belum aktif?', 'Why is this button not active?'), L('Siapa yang bisa menyetujui?', 'Who can approve?'), L('Apa itu POD?', 'What is POD?')];
    if (sid === 'PROD-PACK-002') qs.unshift(L('Kenapa tombol Packing belum aktif?', 'Why is the Packing button not active?'));
    return '<div class="hp12-pop"><b>' + t(L('Coba tanya', 'Try asking')) + '</b><div>' + qs.map(function (q) { return '<button type="button" class="hp12-chipb" data-hp="askq" data-val="' + esc(T(q)) + '">' + t(q) + '</button>'; }).join('') + '</div></div>';
  }
  function runAsk(q) {
    q = String(q || '').trim(); if (!q) return;
    var r = null; try { r = HL.ask(cx(), q, { screen: curScreen(), rec: curRec() }); } catch (e) { r = null; }
    PN.chat.push({ q: q, r: r || { answer: L('Data belum berhasil dimuat. Coba Lagi.', 'The data could not be loaded. Try again.'), fallback: true } });
    renderPanel();
    var b = document.querySelector('.hp12-p-b'); if (b) b.scrollTop = b.scrollHeight;
    var inp = document.querySelector('#hp12-p .hp12-pq'); if (inp) inp.focus({ preventScroll: true });
  }
  function runPanelInput(inp) {
    if (inp.getAttribute('data-k') === 'ask') runAsk(inp.value);
    else { PN.q = inp.value.trim(); renderPanel(); var i2 = document.querySelector('#hp12-p .hp12-pq'); if (i2) { i2.focus({ preventScroll: true }); } }
  }
  function feedback(val) {
    var p = String(val).split('|'), r = HL.feedback(cx(), p[0], p[1] === '1');
    if (!r || !r.ok) { P.fail(r); return false; }
    A.toast(L('Terima kasih atas masukan Anda.', 'Thanks for your feedback.'));
    return true;
  }
  function panelClick(e) {
    var art = e.target.closest('[data-hp-art]');
    if (art) { e.preventDefault(); PN.art = art.getAttribute('data-hp-art'); renderPanel(); return; }
    var el = e.target.closest('[data-hp]'); if (!el) { if (e.target.closest('a[href^="#"]')) closePanelIfPhone(); return; }
    var a = el.getAttribute('data-hp'), v = el.getAttribute('data-val');
    if (a === 'close') { closePanel(); return; }
    if (a === 'close-nav') { closePanel(); return; }
    if (a === 'tab') { PN.tab = v; PN.art = null; renderPanel(); return; }
    if (a === 'back') { PN.art = null; renderPanel(); return; }
    if (a === 'search') { runPanelInput(el.parentNode.querySelector('.hp12-pq')); return; }
    if (a === 'q') { PN.q = v; renderPanel(); return; }
    if (a === 'ask') { runAsk(el.parentNode.querySelector('.hp12-pq').value); return; }
    if (a === 'askq') { runAsk(v); return; }
    if (a === 'fb') { if (feedback(v)) renderPanel(); return; }
    if (a === 'walk') { closePanel(); WK.start(v); return; }
    if (a === 'whatis') { closePanel(); WI.on(); return; }
    if (a === 'tour') { closePanel(); TOUR.start(true); return; }
    if (a === 'incSend') { var r = incSubmit(el.closest('form')); if (r) { PN.inc = r; renderPanel(); A.toast(L('Laporan ' + r.incident.id + ' terkirim.', 'Report ' + r.incident.id + ' sent.')); } return; }
    if (a === 'incNew') { PN.inc = null; renderPanel(); return; }
  }
  function closePanelIfPhone() { if (phone()) closePanel(); }

  /* ---------- Help button in the header (next to the bell) ---------- */
  function ensureButton() {
    var hd = document.getElementById('hd'); if (!hd || !cx()) return;
    if (hd.querySelector('.hp12-hb')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hp12-hb'; b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', String(PN.open));
    b.setAttribute('aria-label', T(L('Bantuan untuk layar ini', 'Help for this screen')));
    b.innerHTML = ic('help') + '<span class="hp12-hb-t">' + t(L('Bantuan', 'Help')) + '</span>';
    b.addEventListener('click', function (e) { e.stopPropagation(); if (PN.open) closePanel(); else openPanel('here'); });
    var bell = hd.querySelector('.hd-bell');
    if (bell) hd.insertBefore(b, bell); else hd.appendChild(b);
  }
  /* §53 button help: a tooltip (title) on screen buttons the help engine knows. */
  var BH = {};
  function decorate() {
    var view = document.getElementById('view'); if (!view) return;
    view.querySelectorAll('.btn:not([data-hp12t])').forEach(function (b) {
      b.setAttribute('data-hp12t', '1');
      if (b.title) return;
      var lab = (b.textContent || '').trim(); if (!lab || lab.length > 40) return;
      if (!(lab in BH)) { var x = null; try { x = HL.buttonHelp(lab); } catch (e) {} BH[lab] = x ? T(x.purpose) + (x.after ? ' → ' + T(x.after) : '') : null; }
      if (BH[lab]) b.title = BH[lab];
    });
  }

  /* =====================================================================
     SPOTLIGHT (shared by the product tour and PANDU SAYA)
     ===================================================================== */
  var SP = { el: null, raf: 0, sel: null, card: null };
  function spotEls() {
    var s = document.getElementById('hp12-spot'), c = document.getElementById('hp12-card');
    if (!s) { s = document.createElement('div'); s.id = 'hp12-spot'; s.className = 'hp12-spot'; s.hidden = true; document.body.appendChild(s); }
    if (!c) { c = document.createElement('div'); c.id = 'hp12-card'; c.className = 'hp12-card'; c.hidden = true; c.setAttribute('role', 'dialog'); c.setAttribute('aria-live', 'polite'); document.body.appendChild(c); c.addEventListener('click', cardClick); }
    return { s: s, c: c };
  }
  function visibleEl(sel) {
    if (!sel) return null;
    var list; try { list = document.querySelectorAll(sel); } catch (e) { return null; }
    for (var i = 0; i < list.length; i++) { var r = list[i].getBoundingClientRect(); if (r.width > 0 && r.height > 0) return list[i]; }
    return null;
  }
  function place() {
    var e = spotEls(), el = SP.el;
    if (el && !el.isConnected) el = SP.el = visibleEl(SP.sel);
    if (!el && SP.sel && SP.card === 'walk') { el = SP.el = visibleEl(SP.sel); if (el && !SP.rp) { SP.rp = 1; setTimeout(function () { SP.rp = 0; if (WK.on && SP.card === 'walk') WK.paint(); }, 0); } }
    if (el) {
      var r = el.getBoundingClientRect(), pad = 6;
      e.s.hidden = false;
      e.s.style.left = (r.left - pad) + 'px'; e.s.style.top = (r.top - pad) + 'px'; e.s.style.width = (r.width + pad * 2) + 'px'; e.s.style.height = (r.height + pad * 2) + 'px';
    } else e.s.hidden = true;
    var c = e.c; if (c.hidden) return;
    if (phone() || !el) { c.classList.add('hp12-card-dock'); c.style.left = ''; c.style.top = ''; return; }
    c.classList.remove('hp12-card-dock');
    var rr = el.getBoundingClientRect(), cw = c.offsetWidth, ch = c.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var top = rr.bottom + 14; if (top + ch > vh - 12) top = rr.top - ch - 14; if (top < 12) top = Math.max(12, Math.min(vh - ch - 12, rr.top));
    var left = Math.max(12, Math.min(rr.left, vw - cw - 12));
    if (top < rr.bottom && top + ch > rr.top && rr.right + cw + 24 < vw) { left = rr.right + 14; top = Math.max(12, Math.min(vh - ch - 12, rr.top)); }
    c.style.left = Math.round(left) + 'px'; c.style.top = Math.round(top) + 'px';
  }
  function loop() { cancelAnimationFrame(SP.raf); if (!SP.card) return; place(); SP.raf = requestAnimationFrame(loop); }
  function spot(sel, cardHtml, who) {
    var e = spotEls();
    SP.sel = sel; SP.el = visibleEl(sel); SP.card = who;
    if (SP.el) { var r = SP.el.getBoundingClientRect(); if (r.top < 70 || r.bottom > window.innerHeight - 90) SP.el.scrollIntoView({ block: 'center', behavior: 'auto' }); }
    e.c.innerHTML = cardHtml; e.c.hidden = false;
    loop();
    var f = e.c.querySelector('[data-sp="next"]'); if (f) f.focus({ preventScroll: true });
  }
  function unspot() { var e = spotEls(); e.s.hidden = true; e.c.hidden = true; e.c.innerHTML = ''; SP.card = null; SP.el = null; SP.sel = null; cancelAnimationFrame(SP.raf); }
  function cardClick(e) {
    var el = e.target.closest('[data-sp]'); if (!el) return;
    var a = el.getAttribute('data-sp');
    if (SP.card === 'tour') TOUR.act(a); else if (SP.card === 'walk') WK.act(a);
  }
  function cardHtml(o) {
    return '<div class="hp12-card-h"><span class="hp12-card-n">' + esc(o.n) + '/' + esc(o.total) + '</span><b>' + tt(o.title) + '</b></div><p>' + tt(o.body) + '</p>' +
      (o.missing ? '<p class="hp12-card-m">' + ic('info') + t(o.missing) + '</p>' : '') +
      '<div class="hp12-dots" aria-hidden="true">' + Array.apply(null, { length: o.total }).map(function (_, i) { return '<i' + (i < o.n ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
      '<div class="hp12-card-a">' + (o.extra || '') + '<span class="hp12-sp"></span>' + (o.n > 1 ? '<button type="button" class="btn btn-ghost btn-sm" data-sp="back">' + t(L('Kembali', 'Back')) + '</button>' : '') +
      '<button type="button" class="btn btn-primary btn-sm" data-sp="next">' + t(o.n === o.total ? L('Selesai', 'Done') : L('Lanjut', 'Next')) + '</button></div>' +
      '<button type="button" class="hp12-card-x" data-sp="skip" aria-label="' + t(L('Lewati', 'Skip')) + '">' + t(L('Lewati', 'Skip')) + '</button>';
  }

  /* ---------- Product tour (§54) ---------- */
  var TOUR = {
    on: false, steps: [], i: 0, tried: {},
    start: function (manual) {
      var c = cx(); if (!c) return;
      var tr = HL.tour(c); if (!tr) return;
      if (manual) { var r0 = HL.tourAction(c, 'restart'); if (r0 && r0.tour) tr = r0.tour; }
      TOUR.steps = tr.steps.filter(function (s) { return !!visibleEl(TOUR.sel(s)) || !s.opt; });
      TOUR.i = manual ? 0 : Math.min(tr.step || 0, TOUR.steps.length - 1); TOUR.on = true; TOUR.screen = A.S.screen;
      TOUR.show();
    },
    sel: function (s) { if (s.k === 'help' && document.querySelector('.hp12-hb')) return '.hp12-hb'; return phone() ? s.mSel : s.sel; },
    show: function () {
      var s = TOUR.steps[TOUR.i]; if (!s) { TOUR.end(); return; }
      var sel = TOUR.sel(s);
      spot(sel, cardHtml({ n: TOUR.i + 1, total: TOUR.steps.length, title: s.t, body: s.b, missing: visibleEl(sel) ? null : L('Bagian ini tidak terlihat di ukuran layar ini.', 'This part is not visible at this screen size.'),
        extra: '<button type="button" class="hp12-lnkb" data-sp="dontShow">' + t(L('Jangan tampilkan lagi', "Don't show again")) + '</button>' }), 'tour');
    },
    act: function (a) {
      var c = cx();
      if (a === 'next') { if (TOUR.i >= TOUR.steps.length - 1) { HL.tourAction(c, 'done'); TOUR.end(); A.toast(L('Tur selesai. Buka ? Bantuan kapan saja.', 'Tour finished. Open ? Help any time.')); return; } HL.tourAction(c, 'next', TOUR.i); TOUR.i++; TOUR.show(); return; }
      if (a === 'back') { HL.tourAction(c, 'back', TOUR.i); TOUR.i = Math.max(0, TOUR.i - 1); TOUR.show(); return; }
      if (a === 'skip') { HL.tourAction(c, 'skip'); TOUR.end(); return; }
      if (a === 'dontShow') { HL.tourAction(c, 'dontShow'); TOUR.end(); A.toast(L('Tur tidak akan ditampilkan lagi. Mulai ulang dari ? Bantuan.', 'The tour will not show again. Restart it from ? Help.')); return; }
    },
    end: function () { TOUR.on = false; unspot(); },
    auto: function () {
      var c = cx(); if (!c || TOUR.on || WK.on || TOUR.tried[c.uid]) return;
      if (A.S.screen !== c.landing || !document.querySelector('#view .ph, #view .card, #view section')) return;
      TOUR.tried[c.uid] = 1;
      var tr = null; try { tr = HL.tour(c); } catch (e) {}
      if (tr && tr.show) TOUR.start(false);
    }
  };

  /* ---------- PANDU SAYA walkthrough (§55) ---------- */
  var WK = {
    on: false, w: null, i: 0, wait: 0,
    start: function (id) {
      var c = cx(), r = HL.walkStart(c, id);
      if (!r || !r.ok) { A.toast(r && r.need ? r.need.msg : (r && r.msg) || L('Panduan belum bisa dimulai.', 'The guide cannot start.'), 'warn'); return; }
      if (TOUR.on) TOUR.end();
      WK.w = r.walk; WK.i = 0; WK.on = true; WK.show();
    },
    show: function () {
      var s = WK.w.steps[WK.i]; if (!s) return;
      if (s.screen && A.S.screen !== s.screen && C.screen(s.screen)) {
        if (!open(s.screen)) { A.toast(L('Layar panduan ini tidak tersedia untuk peran Anda.', 'This guide screen is not available for your role.'), 'warn'); WK.act('skip'); return; }
        WK.nav = true; A.go(s.screen); return;   // re-shown by the observer once the screen has rendered
      }
      WK.paint();
    },
    paint: function () {
      var s = WK.w.steps[WK.i], el = visibleEl(s.sel);
      spot(s.sel, cardHtml({ n: s.n, total: WK.w.steps.length, title: s.t, body: s.hint, missing: el ? null : L('Elemen ini belum terlihat. Buka data yang ingin dikerjakan, lalu tekan Lanjut.', 'This element is not visible yet. Open the record you want to work on, then press Next.'),
        extra: '<span class="hp12-card-w">' + ic('pointer') + tt(WK.w.title) + '</span>' }), 'walk');
      if (el) { el.classList.add('hp12-target'); var all = []; try { all = document.querySelectorAll(s.sel); } catch (e) {} Array.prototype.forEach.call(all.length ? all : [el], WK.bind); }
    },
    bind: function (el) {
      if (el.__hp12 === WK.w.id + ':' + WK.i) return; el.__hp12 = WK.w.id + ':' + WK.i;
      var tag = el.tagName, ev = tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' ? 'change' : 'click';
      var n = WK.i, w = WK.w && WK.w.id;
      el.addEventListener(ev, function () { if (!WK.on || WK.i !== n || !WK.w || WK.w.id !== w) return; setTimeout(function () { if (WK.on && WK.i === n && WK.w && WK.w.id === w) WK.act('next'); }, ev === 'click' ? 450 : 200); });
    },
    act: function (a) {
      var c = cx(), id = WK.w && WK.w.id; if (!id) return;
      document.querySelectorAll('.hp12-target').forEach(function (x) { x.classList.remove('hp12-target'); });
      if (a === 'next') {
        if (WK.i >= WK.w.steps.length - 1) { var d = HL.walkDone(c, id); WK.end(); A.toast(d && d.ok ? L('Panduan selesai — tercatat di progres belajar Anda.', 'Guide finished — recorded in your learning progress.') : (d && d.msg) || L('Panduan selesai.', 'Guide finished.')); return; }
        WK.i++; HL.walkStep(c, id, WK.i + 1); WK.show(); return;
      }
      if (a === 'back') { WK.i = Math.max(0, WK.i - 1); HL.walkStep(c, id, WK.i + 1); WK.show(); return; }
      if (a === 'skip') { HL.walkAbandon(c, id); WK.end(); A.toast(L('Panduan dihentikan.', 'Guide stopped.'), 'warn'); return; }
    },
    end: function () { WK.on = false; WK.w = null; unspot(); },
    afterRender: function () {
      if (!WK.on) return;
      var s = WK.w.steps[WK.i];
      if (s.screen && A.S.screen !== s.screen) { if (!WK.nav) { /* user left the guided screen */ WK.paint(); } return; }
      WK.nav = false;
      clearTimeout(WK.wait);
      var tries = 0;
      (function poll() { if (!WK.on) return; if (visibleEl(s.sel) || tries++ > 14) { WK.paint(); return; } WK.wait = setTimeout(poll, 150); })();
    }
  };

  /* ---------- APA INI? mode (§57) ---------- */
  var WI = {
    on: function () {
      if (TOUR.on) TOUR.end();
      document.body.classList.add('hp12-wi');
      var b = document.getElementById('hp12-wib');
      if (!b) { b = document.createElement('div'); b.id = 'hp12-wib'; b.className = 'hp12-wib'; document.body.appendChild(b); }
      b.innerHTML = ic('eye') + '<span>' + t(L('Mode APA INI? aktif — ketuk bagian mana saja di layar.', 'WHAT IS THIS? mode is on — tap anything on the screen.')) + '</span><button type="button" class="btn btn-sm btn-blue" data-wi="off">' + t(L('Selesai', 'Done')) + '</button>';
      b.hidden = false; WI.active = true;
    },
    off: function () { WI.active = false; document.body.classList.remove('hp12-wi'); var b = document.getElementById('hp12-wib'); if (b) b.hidden = true; WI.close(); },
    close: function () { var x = document.getElementById('hp12-wbub'); if (x) x.remove(); document.querySelectorAll('.hp12-wi-on').forEach(function (e) { e.classList.remove('hp12-wi-on'); }); },
    lookup: function (target) {
      var c = cx(), el = target.closest('[data-help], .chip, .btn, button, a, th, h1, h2, h3, dt, label, .kp10-k, .kp10-i, .tl5, .at, .rl, .mc, .q8, td') || target;
      var keys = [];
      var dh = el.getAttribute && el.getAttribute('data-help'); if (dh) keys.push(dh);
      var hr = el.getAttribute && el.getAttribute('href'); var m = hr && hr.match(/#\/[^/]+\/([A-Z0-9-]+)/);
      var lab = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      if (lab) keys.push(lab);
      if (m) keys.push(m[1]);
      lab.split(/[\s·:/()\-,.]+/).filter(function (w) { return w.length >= 2; }).forEach(function (w) { keys.push(w); });
      var hit = null, btn = null;
      if (el.matches && el.matches('.btn, button') && lab) { try { btn = HL.buttonHelp(lab, c); } catch (e) {} }
      for (var i = 0; i < keys.length && !hit; i++) { try { hit = HL.whatIs(keys[i], c); } catch (e) {} }
      if (!hit && !btn) { try { hit = HL.whatIs(A.S.screen, c); } catch (e) {} if (hit) hit = Object.assign({}, hit, { part: true }); }
      return { el: el, hit: hit, btn: btn, lab: lab };
    },
    show: function (target) {
      WI.close();
      var r = WI.lookup(target), el = r.el;
      el.classList.add('hp12-wi-on');
      var body;
      if (r.btn) {
        body = '<b>' + esc(r.btn.label) + '</b><p>' + tt(r.btn.purpose) + '</p>' + (r.btn.conditions && r.btn.conditions.length ? '<small>' + t(L('Syarat', 'Conditions')) + '</small><ul>' + r.btn.conditions.map(function (x) { return '<li>' + tt(x) + '</li>'; }).join('') + '</ul>' : '') +
          (r.btn.after ? '<small>' + t(L('Setelah ditekan', 'After you press it')) + '</small><p>' + tt(r.btn.after) + '</p>' : '') + (r.btn.need ? needNote(r.btn.need) : '');
      } else if (r.hit) {
        body = (r.hit.part ? '<small>' + t(L('Bagian dari layar', 'Part of the screen')) + '</small>' : '') + '<b>' + tt(r.hit.term) + '</b><p>' + tt(r.hit.def) + '</p>' +
          (r.hit.screen && r.hit.screen !== A.S.screen && open(r.hit.screen) ? '<a class="lnk5" href="' + href(r.hit.screen) + '">' + t(L('Buka ', 'Open ')) + tt(r.hit.screenN) + '</a>' : '');
      } else body = '<b>' + esc(r.lab || T(L('Bagian ini', 'This part'))) + '</b><p>' + t(L('Belum ada penjelasan untuk bagian ini. Coba Tanya JFRESH.', 'No explanation for this part yet. Try Ask JFRESH.')) + '</p>';
      var b = document.createElement('div'); b.id = 'hp12-wbub'; b.className = 'hp12-wbub'; b.setAttribute('role', 'status');
      b.innerHTML = body + '<button type="button" class="hp12-card-x" data-wi="close" aria-label="' + t(L('Tutup', 'Close')) + '">' + ic('x') + '</button>';
      document.body.appendChild(b);
      var rr = el.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
      if (phone()) { b.classList.add('hp12-wbub-dock'); return; }
      var top = rr.bottom + 10; if (top + b.offsetHeight > vh - 10) top = Math.max(10, rr.top - b.offsetHeight - 10);
      b.style.top = Math.round(top) + 'px'; b.style.left = Math.round(Math.max(10, Math.min(rr.left, vw - b.offsetWidth - 10))) + 'px';
    }
  };
  // Capture phase: in APA INI? mode a tap explains instead of acting.
  window.addEventListener('click', function (e) {
    var w = e.target.closest && e.target.closest('[data-wi]');
    if (w) { e.preventDefault(); e.stopPropagation(); if (w.getAttribute('data-wi') === 'off') WI.off(); else WI.close(); return; }
    if (!WI.active) return;
    if (e.target.closest('#hp12-wib, #hp12-wbub, #hp12-p, .dlg5')) return;
    e.preventDefault(); e.stopPropagation();
    WI.show(e.target);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (WI.active) { WI.off(); return; }
    if (PN.open && !document.querySelector('.dlg5')) closePanel();
  });

  /* ---------- Hook: after every shell render ---------- */
  var pend = 0, lastView = null;
  function tick() {
    pend = 0;
    if (!cx()) return;
    ensureUser();
    ensureButton();
    decorate();
    var v = document.getElementById('view'), ready = v && !v.querySelector('.skel') && v.firstElementChild;
    if (ready && v.firstElementChild !== lastView) {
      lastView = v.firstElementChild;
      if (WK.on) WK.afterRender();
      else if (TOUR.on && A.S.screen !== TOUR.screen) TOUR.end();
      else TOUR.auto();
      if (PN.open && !PN.art && PN.tab === 'here' && PN.lastScreen !== A.S.screen + '|' + A.S.rec) renderPanel();
      PN.lastScreen = A.S.screen + '|' + A.S.rec;
      if (A.S.screen.indexOf('HELP-') !== 0) PN.ctxScreen = A.S.screen;
    }
  }
  function schedule() { if (!pend) pend = requestAnimationFrame(tick); }
  var app = document.getElementById('app');
  if (app && window.MutationObserver) new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
  window.addEventListener('hashchange', function () { if (WI.active) WI.close(); if (PN.open && phone()) closePanel(); setTimeout(schedule, 0); });
  window.addEventListener('resize', function () { if (SP.card) place(); });

  /* =====================================================================
     SCREENS
     ===================================================================== */
  function tile(o) {
    var tag = o.go ? 'a' : 'button';
    return '<' + tag + ' class="hp12-tile"' + (o.go ? ' href="' + href(o.go, o.rec, o.q) + '"' : ' type="button" data-act="' + o.act + '"') + '><span class="hp12-tile-ic">' + ic(o.icon) + '</span><span><b>' + t(o.t) + '</b><small>' + t(o.s) + '</small></span></' + tag + '>';
  }
  function searchBar(q, big) {
    return '<div class="hp12-sbar' + (big ? ' hp12-sbar-l' : '') + '">' + ic('search') + '<input type="search" id="hp12-q" value="' + esc(q || '') + '" placeholder="' + t(L('Cari bantuan…', 'Search help…')) + '" aria-label="' + t(L('Cari bantuan', 'Search help')) + '">' +
      A.btn('blue', L('Cari', 'Search'), null, { act: 'hpSearch', cls: 'btn-sm' }) + '</div>';
  }
  function bindSearch() { var i = document.getElementById('hp12-q'); if (i) i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); A.go('HELP-004', null, { q: i.value.trim() }); } }); }
  var commonAct = {
    hpSearch: function () { var i = document.getElementById('hp12-q'); A.go('HELP-004', null, i && i.value.trim() ? { q: i.value.trim() } : {}); },
    hpWhat: function () { WI.on(); },
    hpTour: function () { TOUR.start(true); },
    hpPanel: function (el) { openPanel(el.getAttribute('data-val') || 'here'); },
    hpWalk: function (el) { WK.start(el.getAttribute('data-val')); },
    hpFb: function (el) { if (feedback(el.getAttribute('data-val'))) A.rerender(); }
  };
  function acts(o) { return Object.assign({}, commonAct, o || {}); }
  // In-page article buttons use data-hp (panel attribute) → route them to the screen handlers too.
  document.addEventListener('click', function (e) {
    if (e.target.closest('#hp12-p, #hp12-card')) return;
    var el = e.target.closest('#view [data-hp]'); if (!el) return;
    var a = el.getAttribute('data-hp');
    if (a === 'walk') WK.start(el.getAttribute('data-val'));
    else if (a === 'fb') { if (feedback(el.getAttribute('data-val'))) A.rerender(); }
    else if (a === 'incSend') { var r = incSubmit(el.closest('form')); if (r && A.HP12.onInc) A.HP12.onInc(r); }
  });

  /* ================= HELP-001 Smart Help Home (every role, incl. clients) ================= */
  V['HELP-001'] = {
    title: function () { return L('JFRESH Smart Help', 'JFRESH Smart Help'); },
    render: function () {
      var c = cx(), hm = HL.home(c);
      if (!hm) return A.stateCard('error', L('Data belum berhasil dimuat.', 'The data could not be loaded.'), A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' }));
      var tr = HL.training(c) || hm.training || {}, paths = Array.isArray(tr.paths) ? tr.paths : [];
      var tiles = '<div class="hp12-tiles">' + [
        tile({ icon: 'monitor', t: L('Pelajari Halaman Ini', 'Learn This Screen'), s: L('Bantuan untuk layar yang terakhir dibuka', 'Help for the screen you last opened'), go: 'HELP-002', q: PN.ctxScreen ? { 'for': PN.ctxScreen } : null }),
        tile({ icon: 'pointer', t: L('PANDU SAYA', 'GUIDE ME'), s: L('Langkah demi langkah di layar asli', 'Step by step on the real screen'), go: 'HELP-003' }),
        tile({ icon: 'play', t: L('Video Singkat', 'Short Videos'), s: L('Tutorial 30–90 detik', '30–90 second tutorials'), go: 'HELP-004', q: { k: 'video' } }),
        tile({ icon: 'search', t: L('Cari Tutorial', 'Find a Tutorial'), s: L('Artikel & FAQ', 'Articles & FAQ'), go: 'HELP-004' }),
        tile({ icon: 'eye', t: L('APA INI?', 'WHAT IS THIS?'), s: L('Ketuk bagian layar untuk penjelasan', 'Tap any part of the screen to learn'), act: 'hpWhat' }),
        tile({ icon: 'message', t: L('Tanya JFRESH', 'Ask JFRESH'), s: L('Asisten AI kontekstual (berbasis aturan)', 'Context-aware assistant (rule based)'), go: 'HELP-005' })
      ].join('') + '</div>';
      var prog = H.card(L('Progres Training Saya', 'My Training Progress'), paths.length ? '<div class="hp12-prog"><div class="hp12-prog-h"><b class="num">' + esc(tr.pct) + '%</b>' + progChip(tr.st, tr.stN) + '</div>' + P.prog(tr.pct, 100, tr.pct >= 100 ? 'healthy' : 'watch') +
        '<ol class="hp12-path">' + paths.slice(0, 2).map(function (p) { return '<li><b>' + tt(p.n) + '</b><span>' + progChip(p.st, p.stN) + ' <span class="num">' + p.pct + '%</span></span></li>'; }).join('') + '</ol></div>' : A.empty(L('Belum ada jalur training untuk peran Anda.', 'No training path for your role yet.')), { icon: 'target', link: ['HELP-007', L('Lihat progres', 'View progress')] });
      var forMe = H.card(L('Bantuan untuk peran Anda', 'Help for your role'), (hm.forMe || []).length ? '<div class="hp12-rs">' + hm.forMe.map(function (a) {
        return '<a class="hp12-res" href="' + href('HELP-004', a.id) + '"><span class="hp12-res-ic">' + ic(a.image || 'file') + '</span><span class="hp12-res-b"><b>' + tt(a.title) + '</b><small>' + tt(a.kindN) + ' · ' + tt(a.screenN) + (a.video ? ' · ' + esc(a.video.len) + ' ' + t(L('dtk', 's')) : '') + '</small></span>' + ic('chevr', 'hp12-res-go') + '</a>';
      }).join('') + '</div>' : A.empty(L('Belum ada bantuan khusus untuk peran Anda.', 'No help specific to your role yet.')), { icon: 'user' });
      var pop = H.card(L('Tutorial Populer', 'Popular Tutorials'), (hm.popular || []).length ? '<ul class="hp12-popl">' + hm.popular.slice(0, 6).map(function (p) { return '<li><a href="' + href('HELP-004', null, { q: p.term }) + '">' + ic('search') + '<span>' + esc(p.term) + '</span></a><b class="num">' + esc(p.count) + '</b></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada data.', 'No data yet.')), { icon: 'trend' });
      var vids = H.card(L('Video singkat', 'Short videos'), (hm.videos || []).length ? '<div class="hp12-vids">' + hm.videos.slice(0, 4).map(function (v) { return '<a class="hp12-vid" href="' + href('HELP-004', v.id) + '"><span class="hp12-vid-p">' + ic('play') + '</span><span><b>' + tt(v.title) + '</b><small>' + esc(v.len) + ' ' + t(L('detik', 'seconds')) + '</small></span></a>'; }).join('') + '</div>' : A.empty(L('Belum ada video untuk peran Anda.', 'No videos for your role yet.')), { icon: 'play' });
      var walks = H.card(L('PANDU SAYA', 'GUIDE ME'), (hm.walkthroughs || []).length ? hm.walkthroughs.slice(0, 4).map(function (w) { return '<div class="hp12-wk"><span>' + ic('pointer') + '<b>' + tt(w.title) + '</b><small>' + tt(w.screenN) + '</small></span>' + A.btn('primary', L('PANDU SAYA', 'GUIDE ME'), 'play', { act: 'hpWalk', val: w.id, cls: 'btn-sm' }) + '</div>'; }).join('') : A.empty(L('Belum ada panduan interaktif untuk peran Anda.', 'No interactive guides for your role yet.')), { icon: 'pointer', link: ['HELP-003', L('Semua', 'All')] });
      var gl = H.card(L('Istilah penting', 'Key terms'), '<dl class="hp12-gll">' + (hm.glossary || []).map(function (g) { return '<div><dt>' + tt(g.term) + '</dt><dd>' + tt(g.def) + '</dd></div>'; }).join('') + '</dl>', { icon: 'list' });
      var tourC = hm.tour ? '<div class="hp12-tourc">' + ic('sparkles') + '<span><b>' + t(L('Tur produk', 'Product tour')) + '</b><small>' + t(hm.tour.state === 'seen' ? L('Sudah dilihat', 'Seen') : hm.tour.state === 'dontShow' ? L('Disembunyikan', 'Hidden') : hm.tour.state === 'skipped' ? L('Dilewati', 'Skipped') : L('Belum dilihat', 'Not seen yet')) + '</small></span>' + A.btn('ghost', L('Mulai tur', 'Start tour'), 'play', { act: 'hpTour', cls: 'btn-sm' }) + '</div>' : '';
      var mgr = (hm.canManage && open('HELP-006') ? A.btn('ghost', L('Tutorial Manager', 'Tutorial Manager'), 'edit', { go: 'HELP-006', cls: 'btn-sm' }) : '') + (hm.canTeam && open('HELP-007') ? A.btn('ghost', L('Progres tim', 'Team progress'), 'users', { go: 'HELP-007', cls: 'btn-sm' }) : '');
      return '<section class="hp12-hero"><div class="hp12-hero-t"><h1>' + t(L('JFRESH Smart Help', 'JFRESH Smart Help')) + '</h1><p>' + t(L('Belajar langsung di aplikasi, kapan pun dibutuhkan.', 'Learn right inside the app, whenever you need it.')) + ' · ' + tt(hm.role && hm.role.n) + '</p></div>' +
        searchBar('', true) + '<div class="hp12-hero-a">' + A.btn('primary', L('Tanya JFRESH', 'Ask JFRESH'), 'message', { go: 'HELP-005' }) + mgr + '</div></section>' +
        tiles + '<div class="hp12-g2">' + prog + pop + '</div>' + '<div class="hp12-g2">' + forMe + '<div class="hp12-col">' + walks + vids + '</div></div>' +
        '<div class="hp12-g2">' + gl + '<div class="hp12-col">' + tourC + (hm.contact ? H.card(L('Butuh bantuan lain?', 'Need more help?'), '<p class="hp12-contact">' + ic('headset') + '<span>' + tt(hm.contact.msg) + '</span></p>' + (hm.contact.s && open(hm.contact.s) ? A.btn('ghost', L('Buka', 'Open'), 'arrow', { go: hm.contact.s, cls: 'btn-sm' }) : '') + A.btn('ghost', L('Laporkan Masalah', 'Report a Problem'), 'alert', { act: 'hpPanel', val: 'report', cls: 'btn-sm' }), { icon: 'headset' }) : '') + '</div></div>';
    },
    after: bindSearch,
    act: acts()
  };

  /* ================= HELP-002 Contextual Help ================= */
  function screenOpts(c) {
    var seen = {}, out = [];
    function add(id) { if (!id || seen[id] || !C.screen(id) || !X.canScreen(c, id)) return; seen[id] = 1; out.push([id, [id + ' · ' + T(C.screen(id).n), id + ' · ' + (C.screen(id).n[1] || C.screen(id).n[0])]]); }
    add(PN.ctxScreen);
    (c.nav || []).forEach(function (n) { if (n.sub) n.sub.forEach(function (s) { add(s.s); (s.also || []).forEach(add); }); else { add(n.s); (n.also || []).forEach(add); } });
    (c.mnav || []).forEach(function (n) { add(n.s); });
    ['HELP-001', 'USER-001', 'NOTIF-001'].forEach(add);
    return out;
  }
  V['HELP-002'] = {
    render: function (cc) {
      var c = cx(), sid = cc.q['for'] || PN.ctxScreen || c.landing, rec = cc.q.rec || null, h = null;
      try { h = HL.helpFor(c, sid, { rec: rec }); } catch (e) { h = null; }
      var picker = '<div class="hp12-pick">' + H.fld(L('Bantuan untuk layar', 'Help for screen'), H.sel('for', screenOpts(c), sid)) + '</div>';
      return P.head(t(L('Bantuan sesuai layar, peran dan status data Anda.', 'Help for your screen, role and record status.')), A.btn('ghost', L('APA INI?', 'WHAT IS THIS?'), 'eye', { act: 'hpWhat', cls: 'btn-sm' }) + A.btn('primary', L('Tanya JFRESH', 'Ask JFRESH'), 'message', { go: 'HELP-005', qs: 'for=' + sid + (rec ? '&rec=' + rec : ''), cls: 'btn-sm' })) +
        picker + (h ? '<div class="card hp12-ctxc">' + ctxHelp(h, { openFirst: false }) + '</div>' : A.stateCard('empty', L('Layar ini belum dikenal oleh Smart Help.', 'Smart Help does not know this screen yet.'), A.btn('blue', L('Cari Bantuan', 'Search Help'), 'search', { go: 'HELP-004' })));
    },
    after: function () { var s = document.querySelector('#view .hp12-pick select'); if (s) s.addEventListener('change', function () { A.go('HELP-002', null, { 'for': s.value }); }); },
    act: acts()
  };

  /* ================= HELP-003 Guided Walkthrough ================= */
  var WK_ST = { 'new': ['info', L('Belum dicoba', 'Not tried')], started: ['warn', L('Sedang berjalan', 'In progress')], done: ['ok', L('Selesai', 'Done')], abandoned: ['appr', L('Dihentikan', 'Stopped')] };
  V['HELP-003'] = {
    render: function () {
      var c = cx(), ws = HL.walkthroughs(c);
      var mine = ws.filter(function (w) { return w.canDo; }), other = ws.filter(function (w) { return !w.canDo; });
      function card(w) {
        var pr = w.progress, st = pr ? WK_ST[pr.st] || WK_ST['new'] : WK_ST['new'];
        return '<section class="card hp12-wkc"><div class="hp12-wkc-h"><span class="hp12-tile-ic">' + ic(w.canDo ? 'pointer' : 'lock') + '</span><div><h3>' + tt(w.title) + '</h3><small>' + esc(w.screen) + ' · ' + tt(w.screenN) + '</small></div>' + A.chip(st[0], st[1]) + '</div>' +
          (w.canDo ? '<ol class="hp12-steps hp12-steps-c">' + w.steps.map(function (s) { return '<li><b>' + tt(s.t) + '</b><small>' + tt(s.hint) + '</small></li>'; }).join('') + '</ol>' +
            '<div class="hp12-art-a">' + A.btn('primary', L('PANDU SAYA', 'GUIDE ME'), 'play', { act: 'hpWalk', val: w.id }) + (pr && pr.done ? '<small class="hp12-mute">' + t(L('Selesai ', 'Completed ')) + pr.done + '× · ' + t(L('dimulai ', 'started ')) + pr.starts + '×</small>' : '') + '</div>' : needNote(w.need)) + '</section>';
      }
      return P.head(t(L('Sistem menyorot elemen asli berikutnya di layar. Tekan Lanjut atau kerjakan langkahnya.', 'The system highlights the actual next element on screen. Press Next or do the step.'))) +
        (mine.length ? '<div class="hp12-wkg">' + mine.map(card).join('') + '</div>' : A.stateCard('empty', L('Belum ada panduan interaktif untuk peran Anda.', 'No interactive guides for your role yet.'), A.btn('blue', L('Cari Bantuan', 'Search Help'), 'search', { go: 'HELP-004' }))) +
        (other.length ? '<details class="card hp12-oth"><summary>' + ic('lock') + t(L('Panduan untuk peran lain', 'Guides for other roles')) + ' <b class="num">' + other.length + '</b></summary><p class="hp12-mute">' + t(L('Langkahnya tidak ditampilkan karena Anda tidak memiliki izinnya (§59).', 'Steps are hidden because you do not have the permission (§59).')) + '</p><div class="hp12-wkg">' + other.map(card).join('') + '</div></details>' : '');
    },
    act: acts()
  };

  /* ================= HELP-004 Help Search (+ article detail) ================= */
  V['HELP-004'] = {
    title: function (rec) { if (rec) { var a = HL.article(cx(), rec, { log: false }); if (a) return a.title; } return L('Cari Bantuan', 'Help Search'); },
    render: function (cc) {
      var c = cx();
      if (cc.rec) {
        var a = getArticle(cc.rec, 'page');
        if (!a) return A.stateCard('empty', L('Artikel tidak ditemukan atau belum terbit.', 'Article not found or not published.'), A.btn('blue', L('Cari Bantuan', 'Search Help'), 'search', { go: 'HELP-004' }));
        return P.head(tt(a.kindN) + ' · v' + esc(a.v) + (a.status !== 'published' ? ' · ' + tt(a.statusN) : ''), A.btn('ghost', L('Tanya JFRESH', 'Ask JFRESH'), 'message', { go: 'HELP-005', cls: 'btn-sm' })) +
          '<div class="card hp12-artc">' + articleBody(a, { page: true }) + '</div>';
      }
      var q = cc.q.q || '', body;
      if (cc.q.k === 'video') {
        var vids = HL.articles(c, {}).filter(function (x) { return x.video; });
        body = H.card(L('Video tutorial', 'Video tutorials'), vids.length ? '<div class="hp12-vids">' + vids.map(function (v) { return '<a class="hp12-vid" href="' + href('HELP-004', v.id) + '"><span class="hp12-vid-p">' + ic('play') + '</span><span><b>' + tt(v.title) + '</b><small>' + esc(v.video.len) + ' ' + t(L('detik', 'seconds')) + ' · ' + tt(v.screenN) + '</small></span></a>'; }).join('') + '</div>' : A.empty(L('Belum ada video untuk peran Anda.', 'No videos for your role yet.')), { icon: 'play', count: vids.length });
      } else if (q) {
        var r = doSearch(q, 'page');
        body = r ? '<p class="hp12-mute">' + t(L(r.total + ' hasil untuk ', r.total + ' results for ')) + '<b>"' + esc(q) + '"</b></p>' + results(r) : A.stateCard('error', L('Data belum berhasil dimuat.', 'The data could not be loaded.'), A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' }));
      } else {
        var hm = HL.home(c) || {};
        body = '<div class="hp12-g2">' + H.card(L('Sering dicari', 'Popular searches'), '<ul class="hp12-popl">' + (hm.popular || []).map(function (p) { return '<li><a href="' + href('HELP-004', null, { q: p.term }) + '">' + ic('search') + '<span>' + esc(p.term) + '</span></a><b class="num">' + esc(p.count) + '</b></li>'; }).join('') + '</ul>', { icon: 'trend' }) +
          H.card(L('Bantuan untuk peran Anda', 'Help for your role'), '<div class="hp12-rs">' + (hm.forMe || []).map(function (a) { return '<a class="hp12-res" href="' + href('HELP-004', a.id) + '"><span class="hp12-res-ic">' + ic('file') + '</span><span class="hp12-res-b"><b>' + tt(a.title) + '</b><small>' + tt(a.screenN) + '</small></span>' + ic('chevr', 'hp12-res-go') + '</a>'; }).join('') + '</div>', { icon: 'user' }) + '</div>';
      }
      return P.head(t(L('Contoh: "cara buat invoice", "kenapa packing tidak bisa", "apa itu POD".', 'E.g. "cara buat invoice", "kenapa packing tidak bisa", "apa itu POD".'))) + searchBar(q, true) + body;
    },
    after: bindSearch,
    act: acts()
  };

  /* ================= HELP-005 Tanya JFRESH ================= */
  var chat5 = [];
  V['HELP-005'] = {
    render: function (cc) {
      ensureUser();
      var ctxS = cc.q['for'] || null, rec = cc.q.rec || null;
      var conv = chat5.length ? chat5.map(function (m) { return '<div class="hp12-q">' + esc(m.q) + '</div>' + answerHtml(m.r); }).join('') : suggestBlock(ctxS);
      return P.head(t(L('Asisten berbasis aturan: membaca layar, status data, peran, izin dan aturan bisnis. Tidak memakai AI eksternal.', 'Rule-based assistant: reads the screen, record status, role, permissions and business rules. No external AI.')),
        chat5.length ? A.btn('ghost', L('Mulai ulang', 'Start over'), 'refresh', { act: 'chatReset', cls: 'btn-sm' }) : '') +
        '<section class="card hp12-chat5">' + (ctxS ? '<p class="hp12-recl">' + ic('monitor') + '<span>' + t(L('Konteks: ', 'Context: ')) + esc(ctxS) + ' · ' + tt(scrN(ctxS)) + (rec ? ' · ' + esc(rec) : '') + '</span></p>' : '') +
        '<div class="hp12-chat">' + conv + '</div>' +
        '<div class="hp12-qbox hp12-qbox-l">' + ic('message') + '<input type="text" id="hp12-ask" placeholder="' + t(L('Tulis pertanyaan… contoh: Kenapa tombol Packing belum aktif?', 'Type a question… e.g. Why is the Packing button not active?')) + '" aria-label="' + t(L('Pertanyaan', 'Question')) + '">' +
        A.btn('primary', L('Tanya', 'Ask'), 'arrow', { act: 'ask5', cls: 'btn-sm' }) + '</div></section>' +
        '<p class="hp12-mute">' + t(L('Belum terjawab? Cari di Bantuan atau hubungi supervisor Anda.', 'Not answered? Search Help or contact your supervisor.')) + ' <a class="lnk5" href="' + href('HELP-004') + '">' + t(L('Cari Bantuan', 'Search Help')) + '</a></p>';
    },
    after: function (cc) {
      var i = document.getElementById('hp12-ask');
      if (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); V['HELP-005'].act.ask5(); } }); if (chat5.length) i.focus({ preventScroll: true }); }
      var ch = document.querySelector('#view .hp12-chat'); if (ch && chat5.length) { var last = ch.lastElementChild; if (last) last.scrollIntoView({ block: 'nearest' }); }
    },
    act: acts({
      ask5: function (el) { var i = document.getElementById('hp12-ask'), q = el && el.getAttribute && el.getAttribute('data-val') || (i && i.value.trim()); if (!q) return; var r = HL.ask(cx(), q, { screen: A.S.q['for'] || null, rec: A.S.q.rec || null }); chat5.push({ q: q, r: r }); A.rerender(); },
      chatReset: function () { chat5 = []; A.rerender(); }
    })
  };
  // Suggested questions on HELP-005 (buttons carry data-hp="askq").
  document.addEventListener('click', function (e) { var el = e.target.closest('#view [data-hp="askq"]'); if (el && A.S.screen === 'HELP-005') V['HELP-005'].act.ask5(el); });

  /* ================= HELP-006 Tutorial Manager (trainer edits; owner / superadmin view) ================= */
  function rawArt(id) { return (HL.state().content || []).filter(function (a) { return a.id === id; })[0] || null; }
  function lines(s) { return String(s || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function artForm(a) {
    a = a || {}; var d = a.vers && a.status === 'published' && a.vers[a.vers.length - 1].st === 'draft' ? a.vers[a.vers.length - 1].data : a;
    var mods = Object.keys(HL.MODULES).map(function (k) { return [k, HL.MODULES[k]]; }), kinds = Object.keys(HL.KINDS).map(function (k) { return [k, HL.KINDS[k]]; });
    var walks = [['', L('— tidak ada —', '— none —')]].concat(((HL.manager(cx()) || {}).walks || []).map(function (w) { return [w.id, [w.id + ' · ' + T(w.title), w.id + ' · ' + (w.title[1] || w.title[0])]]; }));
    var tl = d.title || ['', ''], ds = d.description || ['', ''];
    return '<div class="fgrid f2">' +
      H.fld(L('Judul (Indonesia)', 'Title (Indonesian)'), H.inp('title', tl[0]), { req: true }) + H.fld(L('Judul (English)', 'Title (English)'), H.inp('titleEn', tl[1])) +
      H.fld(L('Modul', 'Module'), H.sel('module', mods, d.module || 'general'), { req: true }) + H.fld(L('Layar (ID registry)', 'Screen (registry ID)'), H.inp('screen', d.screen || '', { ph: L('mis. PROD-RCV-002', 'e.g. PROD-RCV-002') }), { req: true }) +
      H.fld(L('Jenis', 'Kind'), H.sel('kind', kinds, d.kind || 'howto')) + H.fld(L('Izin (opsional)', 'Permission (optional)'), H.inp('perm', d.perm || '', { ph: L('mis. prod.t1', 'e.g. prod.t1') })) +
      H.fld(L('Fitur', 'Feature'), H.inp('feature', d.feature || '')) + H.fld(L('Tombol', 'Button'), H.inp('button', d.button || '')) +
      H.fld(L('Durasi video (30–90 dtk, opsional)', 'Video length (30–90 s, optional)'), H.inp('video', d.video ? d.video.len : '', { num: true })) + H.fld(L('Walkthrough', 'Walkthrough'), H.sel('walk', walks, d.walk || '')) +
      '</div>' + H.fld(L('Deskripsi', 'Description'), H.area('description', ds[0]), { wide: true }) +
      H.fld(L('Langkah (satu per baris)', 'Steps (one per line)'), H.area('steps', (d.steps || []).map(function (s) { return s[0]; }).join('\n')), { req: true, wide: true }) +
      H.fld(L('Kata kunci (pisahkan koma)', 'Keywords (comma separated)'), H.inp('keywords', (d.keywords || []).join(', ')), { wide: true });
  }
  function formToArt(v) {
    var f = { title: [v.title, v.titleEn || v.title], module: v.module, screen: v.screen, kind: v.kind, perm: v.perm || null, feature: v.feature || null, button: v.button || null, description: [v.description || '', v.description || ''],
      steps: lines(v.steps).map(function (s) { return [s, s]; }), keywords: v.keywords || '', walk: v.walk || null };
    if (v.video) f.video = { len: +v.video };
    return f;
  }
  function errMsg(r) { return r && r.errors ? Object.keys(r.errors).map(function (k) { return T(r.errors[k]); }).join(' ') : r && r.msg; }
  var ST_T = { draft: 'mute', published: 'ok', archived: 'warn' };
  V['HELP-006'] = {
    render: function (cc) {
      var c = cx(), tab = cc.q.tab || 'content';
      var tabs = H.tabs([['content', L('Konten', 'Content'), 'file'], ['analytics', L('Analytics', 'Analytics'), 'chart'], ['paths', L('Jalur & Walkthrough', 'Paths & Walkthroughs'), 'route']], tab, 'tab', { def: 'content' });
      var m = HL.manager(c, { status: cc.q.st || '', module: cc.q.mod || '', q: cc.q.q || '' });
      if (!m) return A.stateCard('noperm', L('Anda tidak memiliki akses ke Tutorial Manager.', 'You do not have access to the Tutorial Manager.'));
      var actions = m.canEdit ? A.btn('primary', L('Konten Baru', 'New Content'), 'plus', { act: 'artNew', cls: 'btn-sm' }) : '';
      var head = P.head(t(L('Konten bantuan berversi · terbit / arsip dengan alasan · hanya Training Lead yang mengedit.', 'Versioned help content · publish / archive with a reason · only the Training Lead edits.')) + (m.canEdit ? '' : ' · ' + t(L('Mode lihat', 'View only'))), actions, P.fresh({ kind: 'live', src: L('Sumber: Smart Help (JFHELP)', 'Source: Smart Help (JFHELP)') }));
      var k = P.kpis([{ k: L('Total konten', 'Total content'), v: m.counts.total, icon: 'file' }, { k: L('Terbit', 'Published'), v: m.counts.published, icon: 'checkc', tone: 'ok' }, { k: L('Draft', 'Draft'), v: m.counts.draft, icon: 'edit', tone: m.counts.draft ? 'appr' : null }, { k: L('Arsip', 'Archived'), v: m.counts.archived, icon: 'history' }, { k: L('Layar tercakup', 'Screens covered'), v: m.screensCovered, icon: 'monitor', tone: 'info' }]);
      var body = '';
      if (tab === 'content') {
        var fdefs = [{ k: 'st', l: L('Status', 'Status'), opts: Object.keys(HL.STATUS).map(function (s) { return [s, HL.STATUS[s][0]]; }) }, { k: 'mod', l: L('Modul', 'Module'), opts: Object.keys(HL.MODULES).map(function (s) { return [s, HL.MODULES[s]]; }) }];
        body = A.filters(fdefs, { search: L('Cari judul / kata kunci', 'Search title / keyword'), force: true }) + P.table(m.rows, [
          { h: L('ID', 'ID'), v: function (r) { return P.mono(r.id); } },
          { h: L('Judul', 'Title'), v: function (r) { return '<a class="lnk5" href="' + href('HELP-004', r.id) + '">' + tt(r.title) + '</a>' + (r.draft ? ' ' + A.chip('appr', L('Draft menunggu terbit', 'Draft pending'), 'edit') : ''); } },
          { h: L('Modul', 'Module'), v: function (r) { return tt(r.moduleN); } },
          { h: L('Layar', 'Screen'), v: function (r) { return esc(r.screen) + (r.screenOk ? '' : ' ' + A.chip('crit', L('Tidak ada', 'Missing'))); } },
          { h: L('Jenis', 'Kind'), v: function (r) { return tt(HL.KINDS[r.kind]); } },
          { h: L('Versi', 'Version'), cls: 'r num', v: function (r) { return 'v' + r.v; } },
          { h: L('Video', 'Video'), cls: 'r num', v: function (r) { return r.video ? r.video + ' s' : '—'; } },
          { h: L('Dibuka', 'Opened'), cls: 'r num', v: function (r) { return r.opens; } },
          { h: L('Membantu', 'Helpful'), cls: 'r num', v: function (r) { return r.feedback && r.feedback.pct != null ? r.feedback.pct + '%' : '—'; } },
          { h: L('Status', 'Status'), v: function (r) { return A.chip(ST_T[r.status] || 'info', r.statusN); } },
          { h: '', v: function (r) { return '<span class="hp12-ra">' + (m.canEdit && r.status !== 'archived' ? A.btn('ghost', L('Edit', 'Edit'), 'edit', { act: 'artEdit', val: r.id, cls: 'btn-sm' }) : '') + (m.canEdit && (r.status !== 'published' || r.draft) ? A.btn('blue', L('Terbitkan', 'Publish'), 'checkc', { act: 'artPub', val: r.id, cls: 'btn-sm' }) : '') + (m.canEdit && r.status !== 'archived' ? A.btn('danger', L('Arsip', 'Archive'), 'history', { act: 'artArc', val: r.id, cls: 'btn-sm' }) : '') + A.btn('ghost', L('Versi', 'Versions'), 'list', { act: 'artVer', val: r.id, cls: 'btn-sm' }) + '</span>'; } }
        ], function (r) { return { t: esc(r.id) + ' · ' + tt(r.title), r: 'v' + r.v, s: tt(r.moduleN) + ' · ' + esc(r.screen), chip: A.chip(ST_T[r.status] || 'info', r.statusN) }; }, null, { empty: L('Belum ada konten.', 'No content yet.') });
      } else if (tab === 'analytics') {
        var an = HL.analytics(c);
        if (!an) body = A.stateCard('noperm', L('Analytics butuh izin help.analytics.', 'Analytics needs the help.analytics permission.'));
        else body = P.kpis((HL.kpis(c) || []).map(function (x) { return { k: x.n, v: esc(x.v) + (x.u && !Array.isArray(x.u) ? x.u : ''), s: Array.isArray(x.u) ? t(x.u) : '' }; })) +
          (an.insights || []).slice(0, 3).map(function (i) { return P.rec({ title: L('Smart Help insight', 'Smart Help insight'), icon: 'bulb', sig: i.msg, why: i.term ? L('"' + i.term + '" dicari ' + i.count + '×', '"' + i.term + '" searched ' + i.count + '×') : null, rec: i.kind === 'ui' ? L('Sederhanakan UI atau tambah training untuk layar ini.', 'Simplify the UI or add training for this screen.') : i.kind === 'content' ? L('Tambah atau perbaiki konten bantuan.', 'Add or improve help content.') : L('Jadwalkan training ulang.', 'Schedule refresher training.'), act: i.screen && open(i.screen) ? { n: scrN(i.screen), s: i.screen } : null, tone: 'warn' }); }).join('') +
          '<div class="hp12-g2">' + H.card(L('Paling dicari', 'Most searched'), P.table(an.topSearches.slice(0, 10), [{ h: L('Pencarian', 'Search'), v: function (r) { return esc(r.term); } }, { h: L('Jumlah', 'Count'), cls: 'r num', v: function (r) { return r.count; } }, { h: L('User', 'Users'), cls: 'r num', v: function (r) { return r.users; } }, { h: L('Hasil', 'Results'), cls: 'r num', v: function (r) { return r.results ? r.results : A.chip('crit', L('0 — tanpa jawaban', '0 — unanswered')); } }, { h: L('Artikel teratas', 'Top article'), v: function (r) { return r.top ? '<a class="lnk5" href="' + href('HELP-004', r.top.id) + '">' + tt(r.top.title) + '</a>' : '—'; } }], function (r) { return { t: esc(r.term), r: r.count + '×', s: r.top ? tt(r.top.title) : '' }; }), { icon: 'search' }) +
          H.card(L('Paling sering dibuka', 'Most opened'), P.table(an.topOpened.slice(0, 10), [{ h: L('Artikel', 'Article'), v: function (r) { return '<a class="lnk5" href="' + href('HELP-004', r.id) + '">' + tt(r.title) + '</a>'; } }, { h: L('Layar', 'Screen'), v: function (r) { return esc(r.screen); } }, { h: L('Dibuka', 'Opened'), cls: 'r num', v: function (r) { return r.count; } }], function (r) { return { t: tt(r.title), r: r.count + '×' }; }), { icon: 'eye' }) + '</div>' +
          '<div class="hp12-g2">' + H.card(L('Walkthrough paling dipakai', 'Most used walkthroughs'), P.table(an.topWalkthroughs, [{ h: L('Panduan', 'Guide'), v: function (r) { return tt(r.title); } }, { h: L('Mulai', 'Started'), cls: 'r num', v: function (r) { return r.started; } }, { h: L('Selesai', 'Done'), cls: 'r num', v: function (r) { return r.completed; } }, { h: L('Rasio', 'Rate'), cls: 'r num', v: function (r) { return r.rate + '%'; } }], function (r) { return { t: tt(r.title), r: r.rate + '%' }; }), { icon: 'pointer' }) +
          H.card(L('Tugas yang sering gagal', 'Frequently failed tasks'), P.table(an.failedTasks, [{ h: L('Tugas', 'Task'), v: function (r) { return tt(r.task); } }, { h: L('Layar', 'Screen'), v: function (r) { return esc(r.screen || '—'); } }, { h: L('Gagal', 'Fails'), cls: 'r num', v: function (r) { return r.fails + '/' + r.attempts; } }, { h: L('Sumber', 'Source'), v: function (r) { return esc(r.src || ''); } }], function (r) { return { t: tt(r.task), r: r.fails + '/' + r.attempts }; }, null, { empty: L('Tidak ada tugas gagal.', 'No failed tasks.') }), { icon: 'alert' }) + '</div>' +
          '<div class="hp12-g2">' + H.card(L('Pencarian tanpa jawaban', 'Unanswered searches'), an.unanswered.length ? '<ul class="hp12-popl">' + an.unanswered.slice(0, 10).map(function (u) { return '<li><span>' + ic('search') + '<span>' + esc(u.term || u.q) + '</span></span><b class="num">' + esc(u.count || 1) + '</b></li>'; }).join('') + '</ul>' : A.empty(L('Semua pencarian terjawab.', 'Every search was answered.')), { icon: 'help' }) +
          H.card(L('Masukan user (terburuk dulu)', 'User feedback (worst first)'), P.table(an.feedback.slice(0, 8), [{ h: L('Artikel', 'Article'), v: function (r) { return tt(r.title); } }, { h: L('Ya', 'Yes'), cls: 'r num', v: function (r) { return r.yes; } }, { h: L('Tidak', 'No'), cls: 'r num', v: function (r) { return r.no; } }, { h: '%', cls: 'r num', v: function (r) { return r.pct != null ? r.pct + '%' : '—'; } }], function (r) { return { t: tt(r.title), r: r.pct != null ? r.pct + '%' : '—' }; }, null, { empty: L('Belum ada masukan.', 'No feedback yet.') }), { icon: 'message' }) + '</div>';
      } else {
        body = '<div class="hp12-g2">' + H.card(L('Jalur training per peran (§61)', 'Training paths by role (§61)'), m.paths.map(function (p) { return '<details class="hp12-ar"><summary>' + ic('route') + '<span>' + esc(p.id) + ' · ' + tt(p.n) + '</span><small>' + p.items.length + ' ' + t(L('materi', 'items')) + ' · ' + t(L('lulus ≥ ', 'pass ≥ ')) + p.pass + '</small></summary><div class="hp12-ar-b"><p class="hp12-mute">' + p.roles.map(function (r) { return esc(r === '*' ? T(L('semua staf', 'all staff')) : r); }).join(', ') + '</p><ol class="hp12-steps">' + p.items.map(function (i) { return '<li><a class="lnk5" href="' + href('HELP-004', i.hlp) + '">' + tt(i.title) + '</a></li>'; }).join('') + '</ol></div></details>'; }).join(''), { icon: 'route', count: m.paths.length }) +
          H.card(L('Walkthrough PANDU SAYA (§55)', 'GUIDE ME walkthroughs (§55)'), P.table(m.walks, [{ h: L('ID', 'ID'), v: function (r) { return P.mono(r.id); } }, { h: L('Judul', 'Title'), v: function (r) { return tt(r.title); } }, { h: L('Layar', 'Screen'), v: function (r) { return esc(r.screen); } }, { h: L('Langkah', 'Steps'), cls: 'r num', v: function (r) { return r.steps; } }], function (r) { return { t: tt(r.title), r: r.steps + ' ' + T(L('langkah', 'steps')), s: esc(r.screen) }; }), { icon: 'pointer' }) + '</div>';
      }
      return head + P.deskOnly(L('Tutorial Manager dirancang untuk PC / iPad. Di ponsel hanya ringkasan.', 'The Tutorial Manager is designed for PC / iPad. On a phone only the summary is shown.')) + k + tabs + '<div class="hide-m">' + body + '</div>';
    },
    act: acts({
      artNew: function () {
        H.dlg({ title: L('Konten bantuan baru', 'New help content'), icon: 'plus', ok: L('Simpan draft', 'Save draft'), body: artForm({}) + H.fld(L('Alasan', 'Reason'), H.area('reason', '', L('mis. Tugas baru Team 1', 'e.g. New Team 1 task')), { req: true, wide: true }),
          onOk: function (v, el) { v = P.vals(el); var r = HL.createArticle(cx(), formToArt(v), v.reason); if (!r || !r.ok) return errMsg(r); P.after(L('Draft ' + r.article.id + ' tersimpan. Terbitkan agar tampil untuk user.', 'Draft ' + r.article.id + ' saved. Publish it to show it to users.')); return true; } });
      },
      artEdit: function (el) {
        var id = el.getAttribute('data-val'), a = rawArt(id); if (!a) return;
        H.dlg({ title: L('Edit ' + id, 'Edit ' + id), icon: 'edit', ok: L('Simpan versi', 'Save version'), sub: a.status === 'published' ? t(L('Konten terbit tidak berubah sampai versi baru diterbitkan.', 'Published content does not change until the new version is published.')) : '',
          body: artForm(a) + H.fld(L('Alasan perubahan', 'Reason for the change'), H.area('reason', ''), { req: true, wide: true }),
          onOk: function (v, e2) { v = P.vals(e2); var r = HL.editArticle(cx(), id, formToArt(v), v.reason); if (!r || !r.ok) return errMsg(r); P.after(r.pending ? L('Versi draft tersimpan — menunggu terbit.', 'Draft version saved — waiting to publish.') : L('Draft diperbarui.', 'Draft updated.')); return true; } });
      },
      artPub: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Terbitkan ' + id, 'Publish ' + id), icon: 'checkc', ok: L('Terbitkan', 'Publish'), sub: t(L('Versi draft akan tampil untuk semua user yang berhak.', 'The draft version will show to every eligible user.')), fn: function (reason) { return HL.publish(cx(), id, reason); }, done: L(id + ' terbit.', id + ' published.') }); },
      artArc: function (el) { var id = el.getAttribute('data-val'); P.reasonDlg({ title: L('Arsipkan ' + id, 'Archive ' + id), icon: 'history', ok: L('Arsipkan', 'Archive'), sub: t(L('Konten tidak lagi tampil untuk user. Riwayat versi tetap tersimpan.', 'The content no longer shows to users. Version history is kept.')), fn: function (reason) { return HL.archive(cx(), id, reason); }, done: L(id + ' diarsipkan.', id + ' archived.') }); },
      artVer: function (el) {
        var id = el.getAttribute('data-val'), vs = HL.versions(cx(), id);
        H.dlg({ title: L('Riwayat versi ' + id, 'Version history ' + id), icon: 'list', body: '<ol class="hp12-vers">' + vs.slice().reverse().map(function (v) { return '<li><b>v' + v.v + '</b> ' + A.chip(v.st === 'published' ? 'ok' : v.st === 'draft' ? 'appr' : v.st === 'archived' ? 'warn' : 'info', L(v.st, v.st)) + '<span>' + tt(v.title) + '</span><small>' + esc(v.at) + ' · ' + esc(v.by) + (v.reason ? ' · ' + tt(v.reason) : '') + '</small></li>'; }).join('') + '</ol>' });
      }
    })
  };

  /* ================= HELP-007 Learning Progress ================= */
  V['HELP-007'] = {
    render: function (cc) {
      var c = cx(), who = cc.q.who || null, me = HL.training(c, who);
      if (!me) return A.stateCard(who ? 'noperm' : 'error', who ? L('Progres user ini di luar akses Anda.', 'This user\'s progress is outside your access.') : L('Data belum berhasil dimuat.', 'The data could not be loaded.'), A.btn('blue', L('Kembali', 'Back'), 'arrowl', { go: 'HELP-007' }));
      var mine = !who || who === c.uid || who === c.user.u;
      var stp = '<ol class="hp12-pst">' + HL.PROGRESS.map(function (s, i) { var cur = HL.PROGRESS.indexOf(me.st); return '<li class="' + (i < cur ? 'done' : i === cur ? 'now' : '') + '"><span>' + (i < cur ? ic('check') : i + 1) + '</span><b>' + tt(HL.PROGRESS_N[s]) + '</b></li>'; }).join('') + '</ol>';
      var paths = me.paths.map(function (p) {
        return '<section class="card hp12-pc"><div class="hp12-pc-h"><div><h3>' + tt(p.n) + (p.optional ? ' <small class="hp12-mute">' + t(L('opsional', 'optional')) + '</small>' : '') + '</h3><small>' + p.done + '/' + p.total + ' ' + t(L('materi', 'items')) + (p.score != null ? ' · ' + t(L('nilai ', 'score ')) + p.score + '/' + p.pass : ' · ' + t(L('lulus ≥ ', 'pass ≥ ')) + p.pass) + (p.by ? ' · ' + esc(p.by) : '') + '</small></div>' + progChip(p.st, p.stN) + '</div>' + P.prog(p.pct, 100, p.st === 'passed' ? 'healthy' : 'watch') +
          '<ul class="hp12-items">' + p.items.map(function (i) {
            return '<li class="' + (i.done ? 'done' : '') + '"><span class="hp12-ck">' + ic(i.done ? 'checkc' : 'clock') + '</span><a href="' + href('HELP-004', i.hlp) + '">' + tt(i.title) + '</a><span class="hp12-ra">' +
              (mine && i.walk && !i.done ? A.btn('ghost', L('PANDU SAYA', 'GUIDE ME'), 'pointer', { act: 'hpWalk', val: i.walk, cls: 'btn-sm' }) : '') + (mine && !i.done ? A.btn('blue', L('Tandai selesai', 'Mark done'), 'check', { act: 'mark', val: p.id + '|' + i.hlp, cls: 'btn-sm' }) : '') + '</span></li>';
          }).join('') + '</ul>' +
          (!mine && can('help.assess') && ['completed', 'practiced'].indexOf(p.st) >= 0 ? '<div class="hp12-art-a">' + A.btn('primary', L('Nilai', 'Assess'), 'checkc', { act: 'assess', val: me.uid + '|' + p.id, cls: 'btn-sm' }) + '</div>' : '') + '</section>';
      }).join('');
      var hero = '<section class="card hp12-me"><div class="hp12-me-r">' + H.ring(me.pct, { size: 96, band: { tone: me.pct >= 100 ? 'ok' : me.pct >= 70 ? 'warn' : 'crit', n: me.stN }, label: L('Progres', 'Progress') }) + '</div><div class="hp12-me-t"><h2>' + esc(me.name) + '</h2><p>' + tt(me.roleN) + (me.key ? ' ' + A.chip(me.trained ? 'ok' : 'crit', me.trained ? L('Key user terlatih', 'Key user trained') : L('Key user belum terlatih', 'Key user not trained'), 'star') : '') + '</p>' +
        '<p class="hp12-mute">' + me.passed + '/' + me.total + ' ' + t(L('jalur wajib lulus', 'required paths passed')) + '</p>' + stp + '</div></section>';
      var team = '';
      if (mine && can('help.team')) {
        var sum = HL.trainingSummary(c), rows = HL.trainingTeam(c, { role: cc.q.role || '' });
        if (sum) team = '<h2 class="hp12-h2">' + t(L('Progres tim', 'Team progress')) + '</h2>' + P.kpis([{ k: L('Penyelesaian rata-rata', 'Average completion'), v: sum.overall + '%', icon: 'target', tone: sum.overall >= 90 ? 'ok' : 'warn' }, { k: L('User lulus semua jalur', 'Users passed all paths'), v: (sum.trainedPct || 0) + '%', icon: 'usercheck' }, { k: L('Key user terlatih', 'Key users trained'), v: sum.keyUsers.trained + '/' + sum.keyUsers.total, icon: 'star', tone: sum.keyUsers.untrained.length ? 'crit' : 'ok', s: sum.keyUsers.untrained.length ? t(L('Gate go-live §95 gagal', 'Go-live gate §95 fails')) : '' }, { k: L('User', 'Users'), v: sum.users, icon: 'users' }]) +
          (sum.keyUsers.untrained.length ? '<div class="note5 n-crit hp12-ku">' + ic('alert') + '<span><b>' + t(L('Key user belum terlatih:', 'Key users not trained:')) + '</b> ' + sum.keyUsers.untrained.map(function (u) { return '<a class="lnk5" href="' + href('HELP-007', null, { who: u.uid }) + '">' + esc(u.name) + '</a> (' + tt(u.roleN) + ', ' + u.pct + '%)'; }).join(', ') + '</span></div>' : '') +
          '<div class="hp12-g2">' + H.card(L('Per peran', 'By role'), A.hbars(sum.byRole.map(function (r) { return { l: r.roleN, v: r.pct }; }), { fmt: function (v) { return v + '%'; } }), { icon: 'chart' }) +
          H.card(L('Anggota tim', 'Team members'), P.table(rows, [
            { h: L('Nama', 'Name'), v: function (r) { return '<a class="lnk5" href="' + href('HELP-007', null, { who: r.uid }) + '">' + esc(r.name) + '</a>' + (r.key ? ' ' + A.chip(r.trained ? 'ok' : 'crit', L('key', 'key'), 'star') : ''); } },
            { h: L('Peran', 'Role'), v: function (r) { return tt(r.roleN); } },
            { h: L('Progres', 'Progress'), cls: 'r num', v: function (r) { return r.pct + '%'; } },
            { h: L('Status', 'Status'), v: function (r) { return progChip(r.st, r.stN); } }
          ], function (r) { return { t: esc(r.name), r: r.pct + '%', s: tt(r.roleN), chip: progChip(r.st, r.stN) }; }, function (r) { return href('HELP-007', null, { who: r.uid }); }, { empty: L('Belum ada anggota tim.', 'No team members yet.') }), { icon: 'users', count: rows.length }) + '</div>';
      }
      return P.head(mine ? t(L('Ditugaskan → Mulai → Selesai → Sudah praktik → Lulus (§62).', 'Assigned → Started → Completed → Practiced → Passed (§62).')) : t(L('Progres anggota tim', 'Team member progress')), !mine ? (can('help.assign') ? A.btn('primary', L('Tugaskan jalur', 'Assign path'), 'plus', { act: 'assign', val: me.uid, cls: 'btn-sm' }) + ' ' : '') + A.btn('ghost', L('Progres saya', 'My progress'), 'user', { go: 'HELP-007', cls: 'btn-sm' }) : '') +
        hero + (paths || A.empty(L('Belum ada jalur training untuk peran Anda.', 'No training path for your role yet.'))) + team;
    },
    act: acts({
      mark: function (el) { var p = el.getAttribute('data-val').split('|'), r = HL.markItem(cx(), p[0], p[1]); if (!r || !r.ok) return P.fail(r); P.after(L('Materi ditandai selesai.', 'Item marked done.')); },
      assess: function (el) {
        var p = el.getAttribute('data-val').split('|');
        H.dlg({ title: L('Penilaian training', 'Training assessment'), icon: 'checkc', ok: L('Simpan penilaian', 'Save assessment'), sub: t(L('Penilai tidak boleh menilai dirinya sendiri (maker-checker).', 'Assessors cannot assess themselves (maker-checker).')),
          body: H.fld(L('Hasil', 'Result'), H.sel('st', [['passed', HL.PROGRESS_N.passed], ['practiced', HL.PROGRESS_N.practiced]], 'passed')) + H.fld(L('Nilai (0–100)', 'Score (0–100)'), H.inp('score', '', { num: true })) + H.fld(L('Catatan', 'Note'), H.area('note', ''), { wide: true }),
          onOk: function (v, e2) { v = P.vals(e2); var r = HL.assess(cx(), p[0], p[1], v.st, { score: v.score === '' ? null : +v.score, note: v.note }); if (!r || !r.ok) return r && r.msg; P.after(L('Penilaian tersimpan.', 'Assessment saved.')); return true; } });
      },
      assign: function (el) {
        var uid = el.getAttribute('data-val'), tr = HL.training(cx(), uid), has = {}; ((tr && tr.paths) || []).forEach(function (p) { has[p.id] = 1; });
        var paths = HL.paths().filter(function (p) { return !has[p.id]; }).map(function (p) { return [p.id, [p.id + ' · ' + T(p.n), p.id + ' · ' + (p.n[1] || p.n[0])]]; });
        if (!paths.length) { A.toast(L('Semua jalur training sudah ditugaskan ke user ini.', 'Every training path is already assigned to this user.'), 'warn'); return; }
        P.reasonDlg({ title: L('Tugaskan jalur training', 'Assign a training path'), icon: 'plus', ok: L('Tugaskan', 'Assign'), body: H.fld(L('Jalur', 'Path'), H.sel('path', paths, paths[0] && paths[0][0])), fn: function (reason, v) { return HL.assign(cx(), uid, v.path, reason); }, done: L('Jalur ditugaskan.', 'Path assigned.') });
      }
    })
  };

  /* Shared with screens-go2.js (LIVE-003 report form). */
  A.HP12 = { incForm: incForm, incSubmit: incSubmit, incDone: incDone, openPanel: openPanel, closePanel: closePanel, walk: function (id) { WK.start(id); }, whatIs: function () { WI.on(); }, tour: function () { TOUR.start(true); }, INC_MOD: INC_MOD, onInc: null };
})();

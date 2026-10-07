/* JFRESH OS — Phase 12 screens (writer W3): NP-06 Data Migration (MIG-001…004), NP-08 UAT & operational
   validation (UAT-001…004) and NP-10 pilot, reset, cut-off and production start (CUT-001…007).
   Desktop first for migration, reset and cutover; iPad strong for UAT, approvals and evidence; phone only for a
   tester's own UAT cases and status. Every number and every write goes through the JFGO engine
   (assets/js/jfos-go.js), which re-checks permission, maker-checker, gates, device and audit. Owner records
   (clients, invoices, payables, users …) are linked to their own screens, never copied here.
   Destructive or irreversible actions (reset, restore, rollback, START PRODUCTION) never render on a phone. */
(function () {
  var A = window.JFAPP, P = A && A.P10, H = A && A.P5, P8 = A && A.P8, G = window.JFGO, X = window.JFACCESS;
  if (!A || !P || !H || !P8 || !G) return;
  var V = A.V, T = A.T, L = A.L, t = A.t, esc = A.esc, ic = A.ic, can = A.can, href = A.href, fmt = A.fmt;
  var card = H.card, kv = H.kv, note = H.note, dlg = H.dlg, fld = H.fld, inp = H.inp, sel = H.sel, area = H.area, lnk = H.lnk;
  var rp = P.rp, rpj = P.rpj, n0 = P.n0, pct = P.pct, mono = P.mono;
  A.addParents(G.PARENTS);

  /* ================= Shared helpers ================= */
  function mob() { return A.mode() === 'm'; }
  function dev() { var m = A.mode(); return m === 'm' ? 'mobile' : m === 't' ? 'ipad' : 'desktop'; }
  // The access ctx plus the real device, so the engine refuses destructive actions on a phone (§113).
  function cx() { var c = A.ctx(); return c ? Object.assign({}, c, { device: dev() }) : c; }
  function me() { var c = A.ctx(); return c ? c.uid : null; }
  function user(uid) { return X && uid ? X.USERS.filter(function (u) { return u.id === uid || u.u === uid; })[0] : null; }
  function uname(uid) { if (!uid) return '—'; if (uid === 'system') return T(L('Sistem', 'System')); var u = user(uid); return u ? X.fullName(u) : uid; }
  function when(s) { return s ? esc(String(s).slice(0, 16)) : '—'; }
  function L2(p) { return Array.isArray(p) ? p : L(String(p == null ? '' : p)); }
  function cat(a, b) { a = L2(a); b = L2(b); return [a[0] + b[0], a[1] + b[1]]; }
  function kb(n) { return n == null ? '—' : fmt.num(Math.round(n / 1024), 0) + ' KB'; }
  function mono2(s) { return '<span class="mono6">' + esc(s) + '</span>'; }
  function chipOf(map, k, icon) { var x = map && map[k]; return x ? A.chip(x[1], x[0], icon) : A.chip('mute', L2(k || '—')); }
  var OWNER = { JFCOMM: L('Commercial (JFCOMM)', 'Commercial (JFCOMM)'), JFFIN: L('Finance (JFFIN)', 'Finance (JFFIN)'), JFACCESS: L('Akses (JFACCESS)', 'Access (JFACCESS)'), JFLOG: L('Logistik (JFLOG)', 'Logistics (JFLOG)'),
    JFPROD: L('Produksi (JFPROD)', 'Production (JFPROD)'), JFDLV: L('Delivery (JFDLV)', 'Delivery (JFDLV)'), JFGO: L('Go-Live (JFGO)', 'Go-Live (JFGO)'), JFIMP: L('Implementasi (JFIMP)', 'Implementation (JFIMP)'), JFHELP: L('Smart Help (JFHELP)', 'Smart Help (JFHELP)'), JFSYS: L('Sistem (JFSYS)', 'System (JFSYS)') };
  function srcC(label) { return '<span class="go12-src">' + ic('database') + '<span>' + t(L('Sumber: ', 'Source: ')) + (Array.isArray(label) ? t(label) : esc(label)) + '</span></span>'; }
  function ownerC(eng) { return srcC(OWNER[eng] || eng); }
  function head(sub, actions, src) { return P.head(sub, actions, src ? P.fresh({ kind: 'live', src: src, at: G.nowS() }) : ''); }
  function deskNote(msg) { return mob() ? note(t(msg || L('Tindakan di layar ini hanya bisa dilakukan di desktop atau iPad (§113). Di ponsel hanya status yang ditampilkan.', 'Actions on this screen are desktop / iPad only (§113). On a phone only the status is shown.')), 'monitor', 'info') : ''; }
  function noAccess() { return A.stateCard('noperm', L('Anda tidak memiliki akses ke data ini.', 'You do not have access to this data.'), A.backBtn(), L('Anda tidak memiliki akses.', 'You do not have access.')); }
  function loadErr() { return A.stateCard('error', L('Data belum berhasil dimuat. Coba Lagi.', 'The data could not be loaded. Try again.'), A.btn('blue', L('Coba Lagi', 'Try Again'), 'refresh', { act: 'retry' })); }

  // Engine refusal → one plain-language message; gate failures list each failed item by name.
  function msg(r, names) {
    var m = (r && r.msg) || (r && G.MSG[r.code]) || G.MSG.invalid, out = L2(m).slice(), extra = [];
    if (r && r.failed && r.failed.length) r.failed.forEach(function (k) { extra.push(names && names[k] ? L2(names[k]) : L2(k)); });
    if (r && r.errors && typeof r.errors === 'object') Object.keys(r.errors).forEach(function (k) { extra.push(L2(r.errors[k])); });
    if (r && r.code === 'invalid' && r.rows && r.rows.length) extra.push(L('Baris error: #' + r.rows.join(', #') + ' — tolak atau perbaiki dulu', 'Error rows: #' + r.rows.join(', #') + ' — reject or fix them first'));
    if (r && r.protected && r.protected.length) extra.push(L(r.protected.length + ' record terlindungi (contoh ' + r.protected.slice(0, 3).map(function (p) { return p.id; }).join(', ') + '). Alternatif: ' + (r.alt || []).map(function (a) { return a[0]; }).join(', '), r.protected.length + ' protected records (e.g. ' + r.protected.slice(0, 3).map(function (p) { return p.id; }).join(', ') + '). Alternatives: ' + (r.alt || []).map(function (a) { return a[1]; }).join(', ')));
    if (r && r.events && r.events.length) extra.push(L(r.events.length + ' kejadian nyata: ' + r.events.slice(0, 3).map(function (e) { return e.id; }).join(', '), r.events.length + ' real-world events: ' + r.events.slice(0, 3).map(function (e) { return e.id; }).join(', ')));
    if (r && r.code === 'gate' && r.recon) extra.push(L(r.recon + ' selisih ' + rp(r.diff), r.recon + ' difference ' + rp(r.diff)));
    if (extra.length) { out[0] += ' — ' + extra.map(function (e) { return e[0]; }).join('; '); out[1] += ' — ' + extra.map(function (e) { return e[1]; }).join('; '); }
    return out;
  }
  function fail(r, names) { A.toast(msg(r, names), 'crit'); return false; }
  // Action dialog: restates what will happen (sub), optional extra fields, a reason when the engine needs one.
  function act(o) {
    dlg({ title: o.title, icon: o.icon || 'check', ok: o.ok || L('Simpan', 'Save'),
      sub: o.sub ? '<span class="go12-cf">' + o.sub + '</span>' : '',
      body: (o.body || '') + (o.reason === false ? '' : fld(o.reasonLabel || L('Alasan', 'Reason'), area('reason', '', o.ph || L('Tulis alasan singkat (masuk audit trail)', 'Write a short reason (goes to the audit trail)')), { req: true, wide: true })) + (o.confirm ? fld(L('Ketik ' + o.confirm + ' untuk konfirmasi', 'Type ' + o.confirm + ' to confirm'), inp('confirm', '', { ph: L2(o.confirm) }), { req: true, wide: true }) : ''),
      after: o.after,
      onOk: function (v, el) {
        v = P.vals(el);
        if (o.confirm && v.confirm !== o.confirm) return L('Teks konfirmasi tidak cocok.', 'The confirmation text does not match.');
        if (o.check && !v[o.check]) return L('Centang konfirmasi dulu.', 'Tick the confirmation first.');
        var r = o.fn(v); if (!r || !r.ok) return msg(r, o.names);
        var done = typeof o.done === 'function' ? o.done(r) : (o.done || L('Tersimpan.', 'Saved.'));
        if (o.go) { var g = typeof o.go === 'function' ? o.go(r) : o.go; A.go(g[0], g[1], g[2]); setTimeout(function () { A.toast(done); }, 380); }
        else P.after(done);
        return true;
      } });
  }
  function radios(name, list, v) { return '<div class="go12-rad">' + list.map(function (x) { return '<label class="go12-ro' + (x[3] ? ' go12-ro-' + x[3] : '') + '"><input type="radio" name="' + name + '" value="' + esc(x[0]) + '"' + (x[0] === v ? ' checked' : '') + '><span><b>' + t(x[1]) + '</b>' + (x[2] ? '<small>' + t(x[2]) + '</small>' : '') + '</span></label>'; }).join('') + '</div>'; }
  function checks(name, list, vals) { return '<div class="go12-chk">' + list.map(function (x) { return '<label><input type="checkbox" data-multi="1" name="' + name + '" value="' + esc(x[0]) + '"' + ((vals || []).indexOf(x[0]) >= 0 ? ' checked' : '') + '><span>' + t(x[1]) + '</span></label>'; }).join('') + '</div>'; }
  function tick(ok, warn) { return '<span class="go12-tk go12-tk-' + (ok ? 'ok' : warn ? 'warn' : 'crit') + '">' + ic(ok ? 'checkc' : warn ? 'alert' : 'xc') + '</span>'; }

  // Horizontal pipeline stepper (NV-06 / NV-10). steps [[key,label]], done = count completed, sub(i) = small text.
  function pipe(steps, done, o) {
    o = o || {};
    return '<ol class="go12-pp' + (o.sm ? ' go12-pp-sm' : '') + '" aria-label="' + t(o.label || L('Tahapan', 'Steps')) + '">' + steps.map(function (s, i) {
      var c = i < done ? 'done' : i === done && !o.noNow ? 'now' : '';
      return '<li class="' + c + '"><span class="go12-pp-n">' + (i < done ? ic('check') : i + 1) + '</span><b>' + t(s[1]) + '</b>' + (o.sub ? '<small>' + o.sub(i, s) + '</small>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function dots(n, done) { var h = ''; for (var i = 0; i < n; i++) h += '<i class="' + (i < done ? 'on' : '') + '"></i>'; return '<span class="go12-dots" aria-hidden="true">' + h + '</span>'; }
  // Stacked bar (valid / warning / error / rejected).
  function stack(parts) {
    var tot = parts.reduce(function (s, p) { return s + (p.v || 0); }, 0) || 1;
    return '<div class="go12-stk" role="img" aria-label="' + esc(parts.map(function (p) { return T(p.n) + ' ' + p.v; }).join(', ')) + '">' + parts.map(function (p) { return p.v ? '<i class="t-' + p.tn + '" style="width:' + (p.v / tot * 100).toFixed(1) + '%"></i>' : ''; }).join('') + '</div>' +
      '<ul class="go12-lg">' + parts.map(function (p) { return '<li><i class="t-' + p.tn + '"></i><span>' + t(p.n) + '</span><b class="num">' + n0(p.v) + '</b></li>'; }).join('') + '</ul>';
  }
  function bigBox(items) { return '<div class="go12-bx">' + items.map(function (x) { return '<div class="go12-bx-i' + (x.tn ? ' go12-bx-' + x.tn : '') + '"><span>' + t(x.k) + '</span><b class="num">' + x.v + '</b>' + (x.s ? '<small>' + x.s + '</small>' : '') + '</div>'; }).join('') + '</div>'; }

  /* ================= NP-06 Data Migration ================= */
  var MSTEPS = G.MIG_STEPS.map(function (k) { return [k, G.MIG_STEP_N[k]]; });
  var BATCH_ST = { 'new': [L('Belum mulai', 'Not started'), 'mute'], extract: [L('Extract', 'Extracted'), 'info'], clean: [L('Clean', 'Cleaned'), 'info'], normalize: [L('Normalize', 'Normalized'), 'info'], map: [L('Map', 'Mapped'), 'info'],
    validate: [L('Tervalidasi', 'Validated'), 'info'], imported: [L('Diimpor', 'Imported'), 'info'], reconciled: [L('Terekonsiliasi', 'Reconciled'), 'info'], pending: [L('Menunggu persetujuan', 'Waiting for approval'), 'warn'], approved: [L('Disetujui', 'Approved'), 'ok'] };
  var ROW_ST = { ok: [L('Valid', 'Valid'), 'ok'], warning: [L('Warning', 'Warning'), 'warn'], error: [L('Error', 'Error'), 'crit'], rejected: [L('Ditolak', 'Rejected'), 'mute'] };
  var TGT = { 'cm.client': 'CLIENT-002', 'cm.contact': 'CONTACT-002', 'cm.contract': 'CONTRACT-002', 'cm.rate': 'RATE-002', 'fn.item': 'ITEM-002', 'fn.weight': 'ITEM-002', 'fn.supplier': 'PUR-007', 'fn.stock': 'INV-003',
    'fn.asset': 'AST-003', 'x.user': 'ADM-002', 'fn.invoice': 'AR-003', 'fn.expense': 'AP-002', 'fn.cashacc': 'CASH-002', 'lg.order': 'ORDER-003', 'fn.hpp': 'HPP-001', 'fn.price': 'PRICE-001' };
  var TGT_LIST = { 'cm.client': 'CLIENT-001', 'cm.property': 'CLIENT-001', 'cm.contact': 'CONTACT-001', 'cm.contract': 'CONTRACT-001', 'cm.rate': 'RATE-001', 'fn.item': 'ITEM-002', 'fn.weight': 'ITEM-002', 'fn.supplier': 'PUR-007', 'fn.stock': 'INV-003', 'fn.asset': 'AST-002', 'x.user': 'ADM-001', 'fn.invoice': 'AR-002', 'fn.expense': 'AP-001', 'fn.cashacc': 'CASH-001', 'lg.order': 'ORDER-001', 'fn.hpp': 'HPP-001', 'fn.price': 'PRICE-001' };
  function tgtLink(b, id) {
    if (!id) return '—';
    var s = TGT[b.target], rec = /^(fn\.hpp|fn\.price)$/.test(b.target) ? null : String(id).split(/[ @]/)[0];
    return s ? lnk(s, rec, mono2(id)) : mono2(id);
  }
  function canMig() { return can('go.mig.manage') && !mob(); }
  function migNext(b, sm) {
    if (!canMig()) return '';
    if (b.next && G.MIG_STEPS.indexOf(b.next) < 5) return A.btn('ghost', L('Jalankan s/d Validasi', 'Run to Validate'), 'play', { act: 'migrun', val: b.id, cls: 'btn-sm' });
    if (b.next === 'import') return b.summary.error ? A.btn('ghost', L('Tinjau ' + b.summary.error + ' error', 'Review ' + b.summary.error + ' errors'), 'alert', { go: 'MIG-002', rec: b.id, qs: 'st=error', cls: 'btn-sm' }) : A.btn('primary', L('Impor', 'Import'), 'upload', { act: 'migstep', val: b.id + '|import', cls: 'btn-sm' });
    if (b.next === 'reconcile') return A.btn('ghost', L('Rekonsiliasi', 'Reconcile'), 'scale', { act: 'migstep', val: b.id + '|reconcile', cls: 'btn-sm' });
    if (b.next === 'approve' && b.st === 'reconciled') return A.btn('ghost', L('Ajukan persetujuan', 'Request approval'), 'arrow', { act: 'migreq', val: b.id, cls: 'btn-sm' });
    if (b.st === 'pending') return A.btn('ghost', L('Lihat persetujuan', 'View approval'), 'arrow', { go: 'MIG-004', cls: 'btn-sm' });
    return '';
  }
  function reconChip(rc) { return rc ? chipOf(G.RECON_ST, rc.st) : '<span class="sub5">—</span>'; }
  // Shared migration actions (MIG-001 … MIG-004).
  var MIG_ACT = {
    migrun: function (el) {
      var id = el.getAttribute('data-val'), r = G.runPipeline(cx(), id, 'import');
      if (!r.ok) return fail(r);
      var s = r.batch.summary; P.after(L(id + ' tervalidasi: ' + s.valid + ' valid, ' + s.warning + ' warning, ' + s.error + ' error.', id + ' validated: ' + s.valid + ' valid, ' + s.warning + ' warnings, ' + s.error + ' errors.'), s.error ? 'warn' : 'ok');
    },
    migall: function () {
      var list = G.migration(cx()).batches.filter(function (b) { return b.done.length < 5; });
      act({ title: L('Jalankan pipeline semua sumber', 'Run the pipeline for every source'), icon: 'play', ok: L('Jalankan', 'Run'), reason: false,
        sub: t(L(list.length + ' batch dijalankan Extract → Clean → Normalize → Map → Validate. Tidak ada yang diimpor; impor tetap per batch setelah error ditinjau.', list.length + ' batches run Extract → Clean → Normalize → Map → Validate. Nothing is imported; import stays per batch after errors are reviewed.')),
        fn: function () { var last = { ok: true }; list.forEach(function (b) { var r = G.runPipeline(cx(), b.id, 'import'); if (!r.ok) last = r; }); return last; },
        done: L(list.length + ' batch tervalidasi.', list.length + ' batches validated.') });
    },
    migstep: function (el) {
      var p = el.getAttribute('data-val').split('|'), id = p[0], step = p[1], b = G.migBatch(cx(), id); if (!b) return;
      var s = b.summary;
      if (step === 'import') {
        return act({ title: L('Impor ' + id + ' · ' + T(b.n), 'Import ' + id + ' · ' + b.n[1]), icon: 'upload', ok: L('Impor sekarang', 'Import now'), reason: false,
          sub: t(L((s.valid + s.warning) + ' baris ditautkan ke master ' + T(OWNER[b.owner] || b.owner) + ' yang sudah ada atau di-staging sebagai MIGRATION, ' + s.rejected + ' baris ditolak tidak diimpor. Data engine pemilik tidak diubah.', (s.valid + s.warning) + ' rows are linked to existing ' + (OWNER[b.owner] || [0, b.owner])[1] + ' masters or staged as MIGRATION, ' + s.rejected + ' rejected rows are not imported. Owner engine data is not changed.')),
          fn: function () { return G.runStep(cx(), id, 'import'); }, done: L(id + ' diimpor (MIGRATION_EXECUTED).', id + ' imported (MIGRATION_EXECUTED).') });
      }
      var r = G.runStep(cx(), id, step); if (!r.ok) return fail(r);
      P.after(step === 'reconcile' ? L(id + ' direkonsiliasi.', id + ' reconciled.') : L(id + ': ' + T(G.MIG_STEP_N[step]) + ' selesai.', id + ': ' + G.MIG_STEP_N[step][1] + ' done.'));
    },
    migreq: function (el) {
      var id = el.getAttribute('data-val'), b = G.migBatch(cx(), id); if (!b) return;
      act({ title: L('Ajukan persetujuan ' + id, 'Request approval ' + id), icon: 'arrow', ok: L('Ajukan', 'Request'), reasonLabel: L('Catatan untuk approver', 'Note for the approver'),
        sub: t(L('Batch ' + T(b.n) + ' dikirim ke ' + (b.fin ? 'Owner dan Finance' : 'Owner') + '. Anda sebagai pengaju tidak bisa menyetujui sendiri (maker-checker).', 'Batch ' + b.n[1] + ' goes to ' + (b.fin ? 'the Owner and Finance' : 'the Owner') + '. As the requester you cannot approve it yourself (maker-checker).')),
        fn: function (v) { return G.requestMigApproval(cx(), id, v.reason); }, done: L(id + ' menunggu persetujuan.', id + ' is waiting for approval.') });
    },
    migappr: function (el) {
      var p = el.getAttribute('data-val').split('|'), id = p[0], role = p[1], b = G.migBatch(cx(), id); if (!b) return;
      var s = b.summary;
      act({ title: L('Setujui migrasi ' + id + ' sebagai ' + (role === 'finance' ? 'Finance' : 'Owner'), 'Approve migration ' + id + ' as ' + (role === 'finance' ? 'Finance' : 'Owner')), icon: 'checkc', ok: L('Setujui', 'Approve'),
        sub: t(L(T(b.n) + ': ' + s.linked + ' baris ditautkan, ' + s.staged + ' di-staging (MIGRATION), ' + s.rejected + ' ditolak. Persetujuan Anda dicatat di audit trail; batch selesai setelah ' + (b.fin ? 'Owner dan Finance' : 'Owner') + ' menyetujui.', b.n[1] + ': ' + s.linked + ' rows linked, ' + s.staged + ' staged (MIGRATION), ' + s.rejected + ' rejected. Your approval goes to the audit trail; the batch completes once ' + (b.fin ? 'the Owner and Finance' : 'the Owner') + ' approve.')),
        fn: function (v) { return G.approveMigration(cx(), id, v.reason); }, done: function (r) { return r.approved ? L(id + ' disetujui penuh (MIGRATION_APPROVED).', id + ' fully approved (MIGRATION_APPROVED).') : L('Persetujuan tercatat. Menunggu approver berikutnya.', 'Approval recorded. Waiting for the next approver.'); } });
    }
  };

  /* ---------- MIG-001 Data Migration Center ---------- */
  var MIG_TABS = [['', L('Semua', 'All'), null], ['act', L('Perlu tindakan', 'Needs action'), 'alert'], ['err', L('Ada error', 'Has errors'), 'xc'], ['pending', L('Menunggu persetujuan', 'Waiting approval'), 'clock'], ['approved', L('Disetujui', 'Approved'), 'checkc']];
  V['MIG-001'] = {
    render: function (c) {
      var m = G.migration(cx()); if (!m) return noAccess();
      var tab = c.q.tab || '', tot = m.totals, rc = G.reconciliation(cx()) || [];
      var rows = m.batches.filter(function (b) { return !tab || (tab === 'act' ? b.st !== 'approved' && b.st !== 'pending' : tab === 'err' ? b.summary.error > 0 : b.st === tab); });
      var started = m.batches.filter(function (b) { return b.done.length; }).length;
      var k = P.kpis([
        { k: L('Sumber data', 'Data sources'), v: n0(m.count), s: t(L(started + ' sudah diproses', started + ' processed')), icon: 'database' },
        { k: L('Total baris', 'Total rows'), v: n0(tot.total), s: t(L('baris lama ter-extract', 'legacy rows extracted')), icon: 'list' },
        { k: L('Valid', 'Valid'), v: n0(tot.valid), icon: 'checkc', tone: 'ok' },
        { k: L('Warning', 'Warning'), v: n0(tot.warning), icon: 'alert', tone: tot.warning ? 'warn' : null },
        { k: L('Error', 'Error'), v: n0(tot.error), icon: 'xc', tone: tot.error ? 'crit' : 'ok', go: tot.error ? 'MIG-002' : null, q: tot.error ? { st: 'error' } : null },
        { k: L('Rejected', 'Rejected'), v: n0(tot.rejected), icon: 'ban' },
        { k: L('Akurasi migrasi', 'Migration accuracy'), v: m.accuracy == null ? '—' : pct(m.accuracy), s: t(L('baris valid ÷ baris tidak ditolak', 'valid rows ÷ rows not rejected')), icon: 'target', tone: m.accuracy == null ? null : m.accuracy >= 98 ? 'ok' : 'warn' },
        { k: L('Batch disetujui', 'Batches approved'), v: m.approved + '/' + m.count, s: t(L(m.pending + ' menunggu persetujuan', m.pending + ' waiting for approval')), icon: 'shield', tone: m.approved === m.count ? 'ok' : m.pending ? 'appr' : null, go: 'MIG-004' }
      ], 'go12-k8');
      var flow = card(L('Pipeline migrasi (§31)', 'Migration pipeline (§31)'), pipe(MSTEPS, -1, { noNow: true, sub: function (i) { return m.batches.filter(function (b) { return b.done.length > i; }).length + '/' + m.count; } }) +
        '<p class="go12-cap">' + t(L('Angka di bawah tiap tahap = batch yang sudah melewatinya. Tidak ada impor buta: impor ditolak selama masih ada baris error (§34).', 'The number under each step = batches past it. No blind import: import is refused while error rows remain (§34).')) + '</p>', { icon: 'route', right: canMig() && m.batches.some(function (b) { return b.done.length < 5; }) ? A.btn('ghost', L('Jalankan semua s/d Validasi', 'Run all to Validate'), 'play', { act: 'migall', cls: 'btn-sm' }) : '' });
      var tbl = P.table(rows, [
        { h: L('Sumber', 'Source'), v: function (b) { return lnk('MIG-002', b.id, '<b>' + t(b.n) + '</b>') + '<small class="sub5">' + esc(b.id) + ' · ' + t(OWNER[b.owner] || b.owner) + '</small>'; } },
        { h: L('Jenis', 'Kind'), v: function (b) { return b.fin ? A.chip('appr', L('Finance', 'Finance'), 'coins') : A.chip('mute', b.kind === 'master' ? L('Master', 'Master') : L('Transaksi', 'Transaction')); } },
        { h: L('Progres', 'Progress'), v: function (b) { return dots(8, b.done.length) + '<small class="sub5">' + b.progress + '% · ' + (b.next ? t(L('berikutnya ', 'next ')) + t(G.MIG_STEP_N[b.next]) : t(L('selesai', 'done'))) + '</small>'; } },
        { h: L('Total', 'Total'), cls: 'r num', v: function (b) { return n0(b.summary.total); } },
        { h: L('Valid', 'Valid'), cls: 'r num', v: function (b) { return n0(b.summary.valid); } },
        { h: L('Warn', 'Warn'), cls: 'r num', v: function (b) { return b.summary.warning ? '<span class="go12-w">' + b.summary.warning + '</span>' : '0'; } },
        { h: L('Error', 'Error'), cls: 'r num', v: function (b) { return b.summary.error ? '<b class="go12-e">' + b.summary.error + '</b>' : '0'; } },
        { h: L('Ditolak', 'Rejected'), cls: 'r num', v: function (b) { return n0(b.summary.rejected); } },
        { h: L('Rekonsiliasi', 'Reconciliation'), v: function (b) { return b.recon && b.recon.id ? lnk('MIG-003', b.recon.id, reconChip(b.recon)) : reconChip(b.recon); } },
        { h: L('Status', 'Status'), v: function (b) { return chipOf(BATCH_ST, b.st); } },
        { h: '', v: function (b) { return migNext(b); } }
      ], function (b) { return { t: t(b.n) + ' · ' + esc(b.id), r: b.progress + '%', s: t(L('Valid ', 'Valid ')) + b.summary.valid + ' · ' + t(L('Error ', 'Error ')) + b.summary.error + ' · ' + t(L('Ditolak ', 'Rejected ')) + b.summary.rejected, chip: chipOf(BATCH_ST, b.st) }; }, null, { empty: tab === 'err' ? L('Tidak ada error migrasi.', 'No migration error.') : L('Tidak ada batch di filter ini.', 'No batch in this filter.') });
      var counts = { '': m.count, act: m.batches.filter(function (b) { return b.st !== 'approved' && b.st !== 'pending'; }).length, err: m.batches.filter(function (b) { return b.summary.error > 0; }).length, pending: m.pending, approved: m.approved };
      var list = card(L('Batch per sumber (§30)', 'Batches per source (§30)'), H.tabs(MIG_TABS.map(function (x) { return [x[0], x[1], x[2], counts[x[0]]]; }), tab, 'tab', { seg: true }) + tbl, { icon: 'layers' });
      var val = card(L('Ringkasan validasi (§34)', 'Validation summary (§34)'), tot.total ? stack([{ n: L('Valid', 'Valid'), v: tot.valid, tn: 'ok' }, { n: L('Warning', 'Warning'), v: tot.warning, tn: 'warn' }, { n: L('Error', 'Error'), v: tot.error, tn: 'crit' }, { n: L('Rejected', 'Rejected'), v: tot.rejected, tn: 'mute' }]) : A.empty(L('Belum ada baris yang di-extract.', 'No rows extracted yet.')), { icon: 'filecheck', link: ['MIG-002', L('Validasi', 'Validation')] });
      var rcn = card(L('Rekonsiliasi lama vs baru (§35)', 'Old vs new reconciliation (§35)'), '<ul class="go12-rl">' + rc.map(function (x) { return '<li>' + lnk('MIG-003', x.id, '<b>' + t(x.n) + '</b>') + '<span class="num ' + (x.diff ? 'go12-e' : '') + '">' + (x.diff ? (x.diff > 0 ? '+' : '') + rpj(x.diff) : rpj(0)) + '</span>' + chipOf(G.RECON_ST, x.st) + '</li>'; }).join('') + '</ul>' + srcC(L('lama = data migrasi, baru = JFFIN live', 'old = migration data, new = live JFFIN')), { icon: 'scale', link: ['MIG-003', L('Detail', 'Detail')] });
      return head(t(L('18 sumber data lama → JFRESH OS. Master yang sudah ada ditautkan (tanpa salinan), master baru di-staging sebagai MIGRATION sampai pemilik data membuatnya di layarnya sendiri.', '18 legacy data sources → JFRESH OS. Existing masters are linked (no copy); new masters are staged as MIGRATION until the data owner creates them in their own screen.')),
        A.btn('ghost', L('Persetujuan', 'Approvals'), 'shield', { go: 'MIG-004' }), L('pipeline JFGO + master pemilik', 'JFGO pipeline + owner masters')) +
        deskNote(L('Migrasi dirancang untuk PC. Di ponsel hanya status batch yang ditampilkan.', 'Migration is designed for PC. On a phone only the batch status is shown.')) + k + flow + '<div class="g21-10 go12-g">' + list + '<div class="col10">' + val + rcn + '</div></div>';
    },
    act: MIG_ACT
  };

  /* ---------- MIG-002 Migration Validation ---------- */
  var ROW_TABS = [['', L('Semua', 'All'), null], ['error', L('Error', 'Error'), 'xc'], ['warning', L('Warning', 'Warning'), 'alert'], ['ok', L('Valid', 'Valid'), 'checkc'], ['rejected', L('Ditolak', 'Rejected'), 'ban']];
  function oldKv(o) { return '<dl class="go12-ol">' + Object.keys(o || {}).slice(0, 6).map(function (k) { var v = o[k]; return '<div><dt>' + esc(k) + '</dt><dd>' + (v === '' || v == null ? '<i class="go12-e">' + t(L('kosong', 'empty')) + '</i>' : esc(typeof v === 'number' ? fmt.num(v, v % 1 ? 2 : 0) : v)) + '</dd></div>'; }).join('') + '</dl>'; }
  function issuesC(r) { return r.issues.length ? '<span class="go12-is">' + r.issues.map(function (i) { return A.chip(i.sev === 'error' ? 'crit' : 'warn', i.note ? cat(i.n, ' · ' + i.note) : i.n); }).join('') + '</span>' : '<span class="sub5">—</span>'; }
  function matchC(b, r) {
    if (r.rej) return '<span class="sub5">' + t(L('Ditolak: ', 'Rejected: ')) + esc(r.rej.reason) + ' · ' + esc(uname(r.rej.by)) + '</span>';
    if (r.match === 'existing') return tgtLink(b, r.target) + '<small class="sub5">' + t(L('master ada', 'existing master')) + (r.how ? ' · ' + esc(r.how) : '') + (r.res === 'linked' ? ' · ' + t(L('ditautkan', 'linked')) : '') + '</small>';
    if (r.match === 'dup') return tgtLink(b, r.target) + '<small class="sub5">' + t(L('duplikat baris #', 'duplicate of row #')) + esc(r.dupOf) + '</small>';
    if (r.match === 'new') return A.chip('info', r.res === 'staged' ? L('Staging (MIGRATION)', 'Staged (MIGRATION)') : L('Baru → staging', 'New → staging'));
    return '<span class="sub5">—</span>';
  }
  V['MIG-002'] = {
    title: function () { return L('Validasi Migrasi', 'Migration Validation'); },
    render: function (c) {
      var m = G.migration(cx()); if (!m) return noAccess();
      var id = c.q.b || c.rec || ((m.batches.filter(function (x) { return x.summary.error; })[0] || m.batches.filter(function (x) { return x.done.length && x.st !== 'approved'; })[0] || m.batches[0]).id);
      var b = G.migBatch(cx(), id); if (!b) return A.stateCard('empty', L('Batch tidak ditemukan.', 'Batch not found.'), A.backBtn());
      var s = b.summary, st = c.q.st || '', imported = b.done.indexOf('import') >= 0, manage = canMig() && !imported;
      var rows = b.rows.filter(function (r) { return !st || r.st === st; });
      var pick = '<label class="fb-f go12-pick"><span class="sr">' + t(L('Batch', 'Batch')) + '</span><select data-f="b">' + m.batches.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === b.id ? ' selected' : '') + '>' + esc(x.id) + ' · ' + t(x.n) + (x.summary.error ? ' (' + x.summary.error + ' error)' : '') + '</option>'; }).join('') + '</select></label>';
      var nextBtn = !canMig() ? '' : b.next && G.MIG_STEPS.indexOf(b.next) < 5 ? A.btn('primary', cat(L('Jalankan ', 'Run '), G.MIG_STEP_N[b.next]), 'play', { act: 'migstep1', val: b.id + '|' + b.next }) + A.btn('ghost', L('s/d Validasi', 'to Validate'), 'play', { act: 'migrun', val: b.id })
        : b.next === 'import' ? A.btn('primary', L('Impor', 'Import'), 'upload', { act: 'migstep', val: b.id + '|import' })
        : b.next === 'reconcile' ? A.btn('primary', L('Rekonsiliasi', 'Reconcile'), 'scale', { act: 'migstep', val: b.id + '|reconcile' })
        : b.next === 'approve' && b.st === 'reconciled' ? A.btn('primary', L('Ajukan persetujuan', 'Request approval'), 'arrow', { act: 'migreq', val: b.id }) : '';
      var hero = P8.hero({ id: b.id, icon: 'filecheck', title: t(b.n), sub: t(L('Target: ', 'Target: ')) + esc(b.target) + ' · ' + t(OWNER[b.owner] || b.owner), chips: chipOf(BATCH_ST, b.st) + (b.fin ? A.chip('appr', L('Berdampak keuangan', 'Finance-impacting'), 'coins') : ''),
        facts: [[L('Total baris', 'Total rows'), n0(s.total)], [L('Valid', 'Valid'), n0(s.valid), 'go12-ok'], [L('Warning', 'Warning'), n0(s.warning), s.warning ? 'go12-w' : ''], [L('Error', 'Error'), n0(s.error), s.error ? 'go12-e' : ''], [L('Ditolak', 'Rejected'), n0(s.rejected)], [L('Akurasi', 'Accuracy'), s.accuracy == null ? '—' : pct(s.accuracy)],
          imported ? [L('Ditautkan / staging', 'Linked / staged'), n0(s.linked) + ' / ' + n0(s.staged)] : [L('Baru', 'New'), n0(s.isNew)]],
        extra: '<div class="go12-hx">' + pipe(MSTEPS, b.done.length, { sm: true }) + (nextBtn ? '<div class="go12-ha">' + nextBtn + '</div>' : '') + '</div>' });
      var alert = b.next === 'import' && s.error ? note(t(L('Migration validation failed: ' + s.error + ' baris error. Tolak (dengan alasan) atau perbaiki setiap baris error sebelum impor (§34).', 'Migration validation failed: ' + s.error + ' error rows. Reject (with a reason) or fix every error row before import (§34).')), 'alert', 'crit') :
        imported ? note(t(L('Batch sudah diimpor: baris terkunci. Perubahan data lama berikutnya lewat batch baru.', 'The batch is imported: rows are locked. Further legacy changes go through a new batch.')), 'lock', 'info') : '';
      var counts = { '': b.rows.length, error: s.error, warning: s.warning, ok: s.valid, rejected: s.rejected };
      var tbl = b.rows.length ? P.table(rows, [
        { h: '#', cls: 'num', v: function (r) { return '<b>' + r.n + '</b>'; } },
        { h: L('Data lama', 'Legacy data'), v: function (r) { return oldKv(r.old); } },
        { h: L('Normalisasi', 'Normalized'), v: function (r) { var k = Object.keys(r.norm || {}); return k.length ? k.map(function (x) { return '<span class="go12-nm"><small>' + esc(x) + '</small> ' + esc(r.norm[x]) + '</span>'; }).join('') : '<span class="sub5">—</span>'; } },
        { h: L('Isu', 'Issues'), v: issuesC },
        { h: L('Pemetaan', 'Mapping'), v: function (r) { return matchC(b, r); } },
        { h: L('Status', 'Status'), v: function (r) { return chipOf(ROW_ST, r.st); } },
        manage ? { h: '', v: function (r) { return r.st === 'rejected' ? '' : '<span class="go12-ra">' + A.btn('ghost', L('Perbaiki', 'Fix'), 'edit', { act: 'fixrow', val: b.id + '|' + r.n, cls: 'btn-sm' }) + (r.st !== 'ok' ? A.btn('ghost', L('Tolak', 'Reject'), 'ban', { act: 'rejrow', val: b.id + '|' + r.n, cls: 'btn-sm' }) : '') + '</span>'; } } : null
      ].filter(Boolean), function (r) { return { t: '#' + r.n + ' · ' + esc(Object.keys(r.old).map(function (k) { return r.old[k]; }).filter(Boolean).slice(0, 2).join(' · ')), s: r.issues.map(function (i) { return T(i.n); }).map(esc).join(', ') || t(L('Tanpa isu', 'No issue')), chip: chipOf(ROW_ST, r.st) }; }, null,
        { empty: st === 'error' ? L('Tidak ada error migrasi.', 'No migration error.') : L('Tidak ada baris di filter ini.', 'No rows in this filter.') })
        : A.empty(L('Batch belum di-extract. Jalankan Extract untuk membaca data lama.', 'The batch is not extracted yet. Run Extract to read the legacy data.'));
      var main = card(L('Baris data lama', 'Legacy rows'), H.tabs(ROW_TABS.map(function (x) { return [x[0], x[1], x[2], counts[x[0]]]; }), st, 'st', { seg: true }) + tbl, { icon: 'list', count: b.rows.length });
      var stg = card(L('Staging master baru', 'Staged new masters'), b.staged.length ? '<ul class="go12-rl">' + b.staged.map(function (x) { var d = x.data || {}; return '<li><span>' + mono2(x.id) + ' <b>' + esc(d.name || d.no || d.ref || d.u || d.inv || Object.keys(d).map(function (k) { return d[k]; })[1] || '') + '</b></span>' + A.chip('info', L('MIGRATION', 'MIGRATION')) + '</li>'; }).join('') + '</ul>' +
        note(t(L('Belum menjadi data operasional. Pemilik data membuatnya di layarnya sendiri', 'Not operational data yet. The data owner creates it in their own screen')) + (TGT_LIST[b.target] ? ' · ' + lnk(TGT_LIST[b.target], null, t(L('buka layar pemilik', 'open the owner screen'))) : ''), 'info', 'info')
        : A.empty(imported ? L('Tidak ada master baru di batch ini.', 'No new master in this batch.') : L('Staging terisi setelah impor.', 'Staging fills after import.')), { icon: 'inbox', count: b.staged.length });
      var log = card(L('Riwayat langkah', 'Step history'), b.log.length ? '<ol class="go12-tl">' + b.log.map(function (l) { return '<li><b>' + t(G.MIG_STEP_N[l.step] || L2(l.step)) + '</b><span>' + when(l.at) + ' · ' + esc(uname(l.by)) + '</span>' + (l.after ? '<small>' + esc(Object.keys(l.after).map(function (k) { return k + ' ' + l.after[k]; }).join(' · ')) + '</small>' : '') + '</li>'; }).join('') + '</ol>' : A.empty(L('Belum ada langkah.', 'No step yet.')), { icon: 'history' });
      var issues = card(L('Jenis isu (§32)', 'Issue types (§32)'), '<ul class="go12-rl">' + Object.keys(G.ISSUES).filter(function (k) { return b.rows.some(function (r) { return r.issues.some(function (i) { return i.k === k; }); }); }).map(function (k) { var n = b.rows.filter(function (r) { return r.issues.some(function (i) { return i.k === k; }); }).length; return '<li><span>' + t(G.ISSUES[k]) + '</span><b class="num">' + n + '</b></li>'; }).join('') + '</ul>', { icon: 'filter' });
      return head(t(L('Duplikat, field kosong, satuan, tanggal, master usang dan referensi dicek per baris; baris yang cocok ditautkan ke ID master pemilik yang sudah ada.', 'Duplicates, missing fields, units, dates, obsolete masters and references are checked per row; matching rows link to the existing owner master id.')), pick, L('baris lama + master pemilik', 'legacy rows + owner masters')) +
        deskNote() + hero + alert + '<div class="g21-10 go12-g">' + main + '<div class="col10">' + (b.rows.length ? issues : '') + stg + log + '</div></div>';
    },
    act: Object.assign({}, MIG_ACT, {
      migstep1: function (el) { var p = el.getAttribute('data-val').split('|'), r = G.runStep(cx(), p[0], p[1]); if (!r.ok) return fail(r); P.after(L(T(G.MIG_STEP_N[p[1]]) + ' selesai.', G.MIG_STEP_N[p[1]][1] + ' done.')); },
      rejrow: function (el) {
        var p = el.getAttribute('data-val').split('|');
        act({ title: L('Tolak baris #' + p[1], 'Reject row #' + p[1]), icon: 'ban', ok: L('Tolak baris', 'Reject row'), sub: t(L('Baris tidak akan diimpor. Alasan wajib dan masuk audit trail (MIGRATION_ROW).', 'The row will not be imported. A reason is required and goes to the audit trail (MIGRATION_ROW).')),
          ph: L('mis. Data lama usang / klien sudah tutup', 'e.g. Obsolete legacy data / client closed'), fn: function (v) { return G.rejectRow(cx(), p[0], +p[1], v.reason); }, done: L('Baris #' + p[1] + ' ditolak.', 'Row #' + p[1] + ' rejected.') });
      },
      fixrow: function (el) {
        var p = el.getAttribute('data-val').split('|'), b = G.migBatch(cx(), p[0]); if (!b) return;
        var r = b.rows.filter(function (x) { return x.n === +p[1]; })[0]; if (!r) return;
        var keys = Object.keys(r.old);
        act({ title: L('Perbaiki baris #' + r.n, 'Fix row #' + r.n), icon: 'edit', ok: L('Simpan & cek ulang', 'Save & re-check'),
          sub: t(L('Nilai lama dikoreksi lalu semua langkah yang sudah jalan diulang untuk baris ini.', 'The legacy value is corrected, then every completed step re-runs for this row.')) + ' ' + issuesC(r),
          body: '<div class="go12-fg">' + keys.map(function (k) { return fld(L2(k), inp('f_' + k, r.old[k], { num: typeof r.old[k] === 'number' })); }).join('') + '</div>',
          fn: function (v) {
            var patch = {}; keys.forEach(function (k) { var nv = v['f_' + k]; if (nv == null) return; if (typeof r.old[k] === 'number') { var n = H.num(nv); if (n != null && !isNaN(n) && n !== r.old[k]) patch[k] = n; } else if (nv !== String(r.old[k] == null ? '' : r.old[k])) patch[k] = nv; });
            if (!Object.keys(patch).length) return { ok: false, msg: L('Belum ada nilai yang diubah.', 'No value changed yet.') };
            return G.fixRow(cx(), b.id, r.n, patch, v.reason);
          },
          done: function (x) { return x.row.st === 'error' ? L('Tersimpan, baris masih error.', 'Saved, the row still has an error.') : L('Baris #' + r.n + ' kini ' + T(ROW_ST[x.row.st][0]) + '.', 'Row #' + r.n + ' is now ' + ROW_ST[x.row.st][0][1] + '.'); } });
      }
    })
  };

  /* ---------- MIG-003 Reconciliation ---------- */
  V['MIG-003'] = {
    render: function (c) {
      var rc = G.reconciliation(cx()); if (!rc) return noAccess();
      var uid = me(), canExplain = (can('go.mig.manage') || can('go.fin.approve')) && !mob(), canAppr = (can('go.fin.approve') || can('go.mig.approve')) && !mob();
      var cnt = function (s) { return rc.filter(function (x) { return x.st === s; }).length; }, absDiff = rc.reduce(function (s, x) { return s + Math.abs(x.diff || 0); }, 0);
      var sel1 = c.rec ? rc.filter(function (x) { return x.id === c.rec; })[0] : null;
      var k = P.kpis([
        { k: L('Item rekonsiliasi', 'Reconciliation items'), v: rc.length, icon: 'scale' },
        { k: L('Reconciled', 'Reconciled'), v: cnt('reconciled'), icon: 'checkc', tone: 'ok' },
        { k: L('Difference', 'Difference'), v: cnt('difference'), icon: 'xc', tone: cnt('difference') ? 'crit' : 'ok' },
        { k: L('Review Required', 'Review Required'), v: cnt('review'), icon: 'alert', tone: cnt('review') ? 'warn' : null },
        { k: L('Approved', 'Approved'), v: cnt('approved'), icon: 'shield', tone: 'ok' },
        { k: L('Total selisih absolut', 'Total absolute difference'), v: rpj(absDiff), s: rp(absDiff), icon: 'coins', tone: absDiff ? 'crit' : 'ok' }
      ], 'go12-k8');
      function actions(x) {
        var h = '';
        if (x.st === 'difference' && canExplain) h += A.btn('ghost', L('Jelaskan selisih', 'Explain difference'), 'edit', { act: 'rcexp', val: x.id, cls: 'btn-sm' });
        if ((x.st === 'review' || x.st === 'reconciled') && canAppr) h += x.noteBy && x.noteBy === uid ? '<small class="sub5">' + t(L('Menunggu approver lain (maker-checker)', 'Waiting for another approver (maker-checker)')) + '</small>' : A.btn('primary', L('Setujui', 'Approve'), 'checkc', { act: 'rcappr', val: x.id, cls: 'btn-sm' });
        return h;
      }
      var tbl = P.table(rc, [
        { h: L('Item', 'Item'), v: function (x) { return lnk('MIG-003', x.id, '<b>' + t(x.n) + '</b>') + '<small class="sub5">' + esc(x.id) + (x.opening ? ' · ' + t(L('saldo awal', 'opening balance')) : '') + '</small>'; } },
        { h: L('Lama (data migrasi)', 'Old (migration data)'), cls: 'r num', v: function (x) { return rp(x.old) + '<small class="sub5">' + lnk('MIG-002', null, esc(x.src), { b: (G.migration(cx()).batches.filter(function (b) { return b.src === x.src; })[0] || {}).id }) + '</small>'; } },
        { h: L('Baru (JFRESH OS)', 'New (JFRESH OS)'), cls: 'r num', v: function (x) { return rp(x.new) + '<small class="sub5 mono6">' + esc(x.fn) + '</small>'; } },
        { h: L('Selisih', 'Difference'), cls: 'r num', v: function (x) { return x.diff ? '<b class="go12-e">' + (x.diff > 0 ? '+' : '') + rp(x.diff) + '</b><small class="sub5">' + (x.diffPct > 0 ? '+' : '') + pct(x.diffPct, 2) + '</small>' : '<span class="go12-ok">' + rp(0) + '</span>'; } },
        { h: L('Status', 'Status'), v: function (x) { return chipOf(G.RECON_ST, x.st); } },
        { h: L('Penjelasan / persetujuan', 'Explanation / approval'), v: function (x) { return (x.note ? '<span>' + esc(x.note) + '</span><small class="sub5">' + esc(uname(x.noteBy)) + '</small>' : '') + (x.appr ? '<small class="sub5">' + ic('checkc') + ' ' + esc(uname(x.appr.uid)) + ' · ' + when(x.appr.at) + '</small>' : '') || '<span class="sub5">—</span>'; } },
        { h: '', v: actions }
      ], function (x) { return { t: t(x.n), r: x.diff ? (x.diff > 0 ? '+' : '') + rpj(x.diff) : rpj(0), s: t(L('Lama ', 'Old ')) + rpj(x.old) + ' · ' + t(L('Baru ', 'New ')) + rpj(x.new), chip: chipOf(G.RECON_ST, x.st) }; });
      var legend = card(L('Status rekonsiliasi (§36)', 'Reconciliation status (§36)'), '<ul class="go12-rl">' + [['reconciled', L('Lama = baru, tanpa selisih.', 'Old = new, no difference.')], ['difference', L('Ada selisih, belum dijelaskan.', 'A difference, not explained yet.')], ['review', L('Selisih sudah dijelaskan, menunggu persetujuan Finance/Owner.', 'Explained, waiting for Finance/Owner approval.')], ['approved', L('Disetujui; tetap berlaku selama selisih tidak berubah.', 'Approved; stays valid while the difference is unchanged.')]].map(function (s) { return '<li>' + chipOf(G.RECON_ST, s[0]) + '<span>' + t(s[1]) + '</span></li>'; }).join('') + '</ul>', { icon: 'info' });
      var det = sel1 ? card(cat(L('Riwayat ', 'History '), sel1.n), kv([[L('Lama', 'Old'), rp(sel1.old)], [L('Baru', 'New'), rp(sel1.new) + ' ' + srcC(sel1.fn)], [L('Selisih', 'Difference'), rp(sel1.diff)], [L('Status', 'Status'), chipOf(G.RECON_ST, sel1.st)]]) +
        (sel1.log.length ? '<ol class="go12-tl">' + sel1.log.map(function (l) { return '<li><b>' + chipOf(G.RECON_ST, l.st) + '</b><span>' + when(l.at) + ' · ' + esc(uname(l.by)) + '</span><small>' + esc(l.note || '') + '</small></li>'; }).join('') + '</ol>' : A.empty(L('Belum ada riwayat.', 'No history yet.'))), { icon: 'history' }) : '';
      return head(t(L('Lama vs baru per saldo awal. Sisi baru dibaca langsung dari JFFIN — selisih harus terlihat, dijelaskan dan disetujui sebelum go-live (gate saldo awal).', 'Old vs new per opening balance. The new side is read live from JFFIN — every difference must be visible, explained and approved before go-live (opening-balance gate).')), '', L('JFFIN live (aging, AP aging, stok, aset, kas, bank)', 'live JFFIN (aging, AP aging, stock, assets, cash, bank)')) +
        deskNote() + k + '<div class="g21-10 go12-g">' + card(L('Rekonsiliasi (§35)', 'Reconciliation (§35)'), tbl, { icon: 'scale' }) + '<div class="col10">' + det + legend + '</div></div>';
    },
    act: {
      rcexp: function (el) {
        var id = el.getAttribute('data-val'), x = G.reconItem(cx(), id); if (!x) return;
        act({ title: cat(L('Jelaskan selisih · ', 'Explain difference · '), x.n), icon: 'edit', ok: L('Kirim ke review', 'Send to review'), reasonLabel: L('Penjelasan selisih', 'Difference explanation'),
          sub: t(L('Selisih ' + rp(x.diff) + ' (lama ' + rp(x.old) + ' vs baru ' + rp(x.new) + '). Status menjadi Review Required; orang lain yang menyetujui.', 'Difference ' + rp(x.diff) + ' (old ' + rp(x.old) + ' vs new ' + rp(x.new) + '). The status becomes Review Required; someone else approves.')),
          ph: L('mis. INV-2605-009 belum ada di JFFIN', 'e.g. INV-2605-009 is not in JFFIN'), fn: function (v) { return G.explainRecon(cx(), id, v.reason); }, done: L('Selisih dijelaskan — Review Required.', 'Difference explained — Review Required.') });
      },
      rcappr: function (el) {
        var id = el.getAttribute('data-val'), x = G.reconItem(cx(), id); if (!x) return;
        act({ title: cat(L('Setujui rekonsiliasi · ', 'Approve reconciliation · '), x.n), icon: 'checkc', ok: L('Setujui', 'Approve'),
          sub: t(L('Saya menyetujui saldo awal ' + T(x.n) + ': lama ' + rp(x.old) + ', baru ' + rp(x.new) + ', selisih ' + rp(x.diff) + '. Persetujuan gugur otomatis bila selisih berubah.', 'I approve the opening ' + x.n[1] + ': old ' + rp(x.old) + ', new ' + rp(x.new) + ', difference ' + rp(x.diff) + '. The approval lapses automatically if the difference changes.')) + (x.note ? '<br>' + t(L('Penjelasan: ', 'Explanation: ')) + esc(x.note) : ''),
          fn: function (v) { return G.approveRecon(cx(), id, v.reason); }, done: L('Rekonsiliasi disetujui.', 'Reconciliation approved.') });
      }
    }
  };

  /* ---------- MIG-004 Migration Approval ---------- */
  var APR_TABS = [['', L('Menunggu', 'Waiting'), 'clock'], ['ready', L('Siap diajukan', 'Ready to request'), 'arrow'], ['approved', L('Disetujui', 'Approved'), 'checkc'], ['all', L('Semua', 'All'), 'list']];
  V['MIG-004'] = {
    render: function (c) {
      var m = G.migration(cx()); if (!m) return noAccess();
      var tab = c.q.tab || '', uid = me(), dsk = !mob();
      var by = { '': function (b) { return b.st === 'pending'; }, ready: function (b) { return b.st === 'reconciled'; }, approved: function (b) { return b.st === 'approved'; }, all: function (b) { return true; } };
      var rows = m.batches.filter(by[tab] || by['']);
      function role(b, k) {
        var a = b.approvals.filter(function (x) { return x.role === k; })[0];
        var who = k === 'owner' ? L('Owner (Product Owner)', 'Owner (Product Owner)') : L('Finance (approver kedua)', 'Finance (second approver)');
        var btn = '';
        if (!a && b.st === 'pending' && dsk) {
          var mine = k === 'owner' ? can('go.mig.approve') : can('go.fin.approve') && !can('go.mig.approve');
          if (mine) btn = b.reqBy === uid ? '<small class="sub5">' + t(L('Anda pengaju — tidak bisa menyetujui sendiri', 'You requested it — you cannot approve it yourself')) + '</small>' : P8.xl('primary', k === 'owner' ? L('Setujui sebagai Owner', 'Approve as Owner') : L('Setujui sebagai Finance', 'Approve as Finance'), 'checkc', { act: 'migappr', val: b.id + '|' + k });
        }
        return '<li class="go12-ap' + (a ? ' go12-ap-ok' : '') + '">' + tick(!!a, !a) + '<span><b>' + t(who) + '</b><small>' + (a ? esc(uname(a.uid)) + ' · ' + when(a.at) + (a.reason ? ' · “' + esc(a.reason) + '”' : '') : b.st === 'pending' ? t(L('menunggu persetujuan', 'waiting for approval')) : '—') + '</small></span>' + btn + '</li>';
      }
      var list = rows.length ? '<div class="go12-cards">' + rows.map(function (b) {
        var s = b.summary, gate = b.recon && (b.recon.st === 'difference' || b.recon.st === 'review');
        return '<section class="card go12-ac"><div class="go12-ac-h"><div>' + lnk('MIG-002', b.id, '<b>' + t(b.n) + '</b>') + '<small class="sub5">' + esc(b.id) + ' · ' + t(OWNER[b.owner] || b.owner) + '</small></div>' + chipOf(BATCH_ST, b.st) + '</div>' +
          bigBox([{ k: L('Ditautkan', 'Linked'), v: n0(s.linked) }, { k: L('Staging', 'Staged'), v: n0(s.staged) }, { k: L('Ditolak', 'Rejected'), v: n0(s.rejected) }, { k: L('Akurasi', 'Accuracy'), v: s.accuracy == null ? '—' : pct(s.accuracy), tn: s.accuracy >= 98 ? 'ok' : 'warn' }]) +
          (b.recon ? '<p class="go12-ln">' + t(L('Rekonsiliasi: ', 'Reconciliation: ')) + (b.recon.id ? lnk('MIG-003', b.recon.id, reconChip(b.recon)) : reconChip(b.recon)) + (b.recon.diff ? ' <span class="num go12-e">' + rp(b.recon.diff) + '</span>' : '') + '</p>' : '') +
          (gate && b.st === 'pending' ? note(t(L('Selisih rekonsiliasi harus dijelaskan dan disetujui dulu di MIG-003 — persetujuan akan ditolak engine.', 'The reconciliation difference must be explained and approved in MIG-003 first — the engine will refuse the approval.')), 'alert', 'warn') : '') +
          (b.reqBy ? '<p class="go12-ln">' + ic('user') + ' ' + t(L('Diajukan oleh ', 'Requested by ')) + '<b>' + esc(uname(b.reqBy)) + '</b></p>' : '') +
          (b.st === 'pending' || b.st === 'approved' ? '<ul class="go12-aps">' + b.needs.map(function (k) { return role(b, k); }).join('') + '</ul>' : '') +
          (b.st === 'reconciled' && can('go.mig.manage') && dsk ? '<div class="go12-ac-f">' + A.btn('primary', L('Ajukan persetujuan', 'Request approval'), 'arrow', { act: 'migreq', val: b.id }) + '</div>' : '') + '</section>';
      }).join('') + '</div>' : A.empty(tab === '' ? L('Tidak ada migrasi yang menunggu persetujuan.', 'No migration is waiting for approval.') : tab === 'ready' ? L('Belum ada batch yang selesai rekonsiliasi.', 'No batch has finished reconciliation yet.') : L('Belum ada batch di sini.', 'No batch here yet.'));
      var counts = { '': m.pending, ready: m.batches.filter(by.ready).length, approved: m.approved, all: m.count };
      var who = note(t(L('Owner menyetujui setiap batch; batch berdampak keuangan (HPP, persediaan, aset, AR, AP, kas, bank) juga butuh Finance. Pengaju tidak pernah menyetujui batch-nya sendiri.', 'The Owner approves every batch; finance-impacting batches (HPP, inventory, assets, AR, AP, cash, bank) also need Finance. A requester never approves their own batch.')), 'shield', 'info');
      return head(t(L('Persetujuan akhir migrasi per batch (maker-checker). Persetujuan tercatat di audit trail sebagai MIGRATION_APPROVED.', 'Final migration approval per batch (maker-checker). Approvals go to the audit trail as MIGRATION_APPROVED.')), '', L('pipeline JFGO', 'JFGO pipeline')) +
        deskNote(L('Persetujuan dilakukan di iPad atau desktop. Di ponsel hanya status.', 'Approvals are done on iPad or desktop. On a phone only the status is shown.')) + who + H.tabs(APR_TABS.map(function (x) { return [x[0], x[1], x[2], counts[x[0]]]; }), tab, 'tab', { seg: true }) + list;
    },
    act: MIG_ACT
  };

  /* ================= NP-08 UAT & operational validation ================= */
  var DEV_IC = { mobile: 'phone', ipad: 'tablet', desktop: 'monitor' };
  function devC(d) { return '<span class="go12-dv">' + ic(DEV_IC[d] || 'monitor') + '<span>' + t(G.DEVICES[d] || L2(d)) + '</span></span>'; }
  function uatSt(u) { return chipOf(G.UAT_ST, u.st); }
  function sevC(s) { return chipOf(G.SEV, s, s === 'critical' ? 'alert' : null); }
  function uatList(list, o) {
    o = o || {};
    return P.table(list, [
      { h: L('ID', 'ID'), v: function (u) { return lnk('UAT-002', u.id, mono2(u.id)); } },
      { h: L('Grup / role', 'Group / role'), v: function (u) { return '<b>' + t(u.groupN) + '</b><small class="sub5">' + esc(u.role) + '</small>'; } },
      { h: L('Skenario', 'Scenario'), v: function (u) { return t(u.scenario) + '<small class="sub5">' + esc(u.module) + '</small>'; } },
      { h: L('Tester', 'Tester'), v: function (u) { return esc(u.testerName || u.tester); } },
      { h: L('Device', 'Device'), v: function (u) { return devC(u.device); } },
      { h: L('Severity', 'Severity'), v: function (u) { return sevC(u.sev); } },
      { h: L('Status', 'Status'), v: uatSt }
    ], function (u) { return { t: esc(u.id) + ' · ' + t(u.scenario), s: t(u.groupN) + ' · ' + esc(u.testerName || u.tester) + ' · ' + T(G.DEVICES[u.device] || L2(u.device)), chip: uatSt(u) + ' ' + sevC(u.sev) }; }, function (u) { return href('UAT-002', u.id); }, { empty: o.empty || L('Tidak ada kasus UAT di filter ini.', 'No UAT case in this filter.') });
  }

  /* ---------- UAT-001 UAT Command Center ---------- */
  V['UAT-001'] = {
    render: function (c) {
      var s = G.uatSummary(cx()); if (!s) return noAccess();
      var g = c.q.g || '', stf = c.q.st || '';
      var list = G.uat(cx(), { group: g || null, st: stf || null }), usb = G.usability(cx()), strug = usb.filter(function (u) { return u.struggle; }).length;
      var k = P.kpis([
        { k: L('Total skenario', 'Total scenarios'), v: s.total, icon: 'clipboard' },
        { k: L('Pass', 'Pass'), v: s.counts.pass, icon: 'checkc', tone: 'ok', go: 'UAT-001', q: { st: 'pass' } },
        { k: L('Fail', 'Fail'), v: s.counts.fail, icon: 'xc', tone: s.counts.fail ? 'crit' : 'ok', go: 'UAT-001', q: { st: 'fail' } },
        { k: L('Blocked', 'Blocked'), v: s.counts.blocked, icon: 'ban', tone: s.counts.blocked ? 'warn' : null, go: 'UAT-001', q: { st: 'blocked' } },
        { k: L('Retest', 'Retest'), v: s.counts.retest, icon: 'refresh', tone: 'info', go: 'UAT-001', q: { st: 'retest' } },
        { k: L('Pass rate', 'Pass rate'), v: pct(s.passPct, 0), s: t(L('target ≥ 95% untuk go-live', 'target ≥ 95% for go-live')), icon: 'target', tone: s.passPct >= 95 ? 'ok' : 'warn' },
        { k: L('Completion', 'Completion'), v: pct(s.completion, 0), s: t(L('tanpa retest / blocked', 'excluding retest / blocked')), icon: 'gauge' }
      ], 'go12-k8');
      var gt = H.tabs([['', L('Semua grup', 'All groups'), null, s.total]].concat(s.groups.map(function (x) { return [x.k, x.n, null, x.pass + '/' + x.total]; })), g, 'g', { seg: true, label: L('Grup tester', 'Tester groups') });
      var cases = card(L('Kasus UAT (§45)', 'UAT cases (§45)'), gt + (stf ? '<p class="go12-ln">' + t(L('Filter status: ', 'Status filter: ')) + uatSt({ st: stf }) + ' <a class="lnk5" href="' + H.qhref({ st: null }) + '">' + t(L('hapus filter', 'clear filter')) + '</a></p>' : '') + uatList(list), { icon: 'clipboard', count: list.length });
      var crit = card(L('Isu UAT Critical terbuka (§47)', 'Open Critical UAT issues (§47)'), s.openCritical.length ? '<ul class="go12-rl">' + s.openCritical.map(function (u) { return '<li>' + lnk('UAT-002', u.id, '<b>' + esc(u.id) + '</b> ' + t(u.scenario)) + uatSt(u) + '</li>'; }).join('') + '</ul>' + note(t(L('Tidak ada go-live dengan isu UAT Critical yang belum selesai.', 'No go-live with unresolved Critical UAT issues.')), 'alert', 'crit') : A.empty(L('Tidak ada isu UAT kritis.', 'No critical UAT issue.')), { icon: 'alert', count: s.openCritical.length });
      var roles = Object.keys(s.coverage);
      var cov = card(L('Device UAT (§49)', 'Device UAT (§49)'), '<div class="tblw hide-m"><table class="tbl dense go12-cov"><thead><tr><th>' + t(L('Role', 'Role')) + '</th>' + ['mobile', 'ipad', 'desktop'].map(function (d) { return '<th class="c">' + ic(DEV_IC[d]) + '<span class="sr">' + t(G.DEVICES[d]) + '</span></th>'; }).join('') + '</tr></thead><tbody>' +
        roles.map(function (r) { return '<tr><th>' + esc(r) + '</th>' + ['mobile', 'ipad', 'desktop'].map(function (d) { var x = s.coverage[r][d]; return '<td class="c">' + (x.n ? '<span class="go12-cv go12-cv-' + (x.pass === x.n ? 'ok' : x.pass ? 'warn' : 'crit') + '">' + x.pass + '/' + x.n + '</span>' : '<span class="sub5">—</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="go12-cap hide-d hide-t">' + ['mobile', 'ipad', 'desktop'].map(function (d) { return t(G.DEVICES[d]) + ' ' + s.devices[d]; }).join(' · ') + '</p>', { icon: 'tablet' });
      var us = card(L('Usability frontline (§48)', 'Frontline usability (§48)'), bigBox([{ k: L('Tugas dites', 'Tasks tested'), v: usb.length }, { k: L('Kesulitan', 'Struggling'), v: strug, tn: strug ? 'warn' : 'ok' }]) + (strug ? note(t(L('Pengguna kesulitan → perbaiki UI dulu, jangan hanya menambah training.', 'Users struggle → improve the UI first, do not rely only on more training.')), 'bulb', 'warn') : ''), { icon: 'users', link: ['UAT-004', L('Hasil', 'Results')] });
      var cyc = s.cycles || [];
      var so = card(L('Sign-off UAT', 'UAT sign-off'), (cyc.length ? '<ul class="go12-rl">' + cyc.map(function (y) { return '<li><b>' + esc(y.id) + '</b><span>' + when(y.at) + ' · ' + esc(uname(y.by)) + ' · ' + pct(y.passPct, 0) + '</span>' + A.chip('ok', L('UAT_COMPLETED', 'UAT_COMPLETED')) + '</li>'; }).join('') + '</ul>' : '<p class="go12-cap">' + t(L('Belum ada siklus UAT yang di-sign-off.', 'No UAT cycle signed off yet.')) + '</p>') +
        (can('go.uat.manage') && !mob() ? '<div class="go12-ac-f">' + P8.xl(s.canSignOff ? 'primary' : 'ghost', L('Sign-off siklus UAT', 'Sign off the UAT cycle'), 'checkc', { act: 'signoff' }) + '</div>' + (s.canSignOff ? '' : '<p class="go12-cap">' + t(L('Engine menolak sign-off selama masih ada isu Critical terbuka.', 'The engine refuses sign-off while Critical issues remain open.')) + '</p>') : ''), { icon: 'filecheck' });
      return head(t(L('Validasi oleh pengguna asli di lapangan: 8 grup tester, kasus per role dan device, hasil Pass / Fail / Blocked / Retest.', 'Validation by real users in the field: 8 tester groups, cases per role and device, Pass / Fail / Blocked / Retest results.')), A.btn('ghost', L('Evidence', 'Evidence'), 'camera', { go: 'UAT-003' }), L('JFGO UAT', 'JFGO UAT')) +
        k + '<div class="g21-10 go12-g">' + cases + '<div class="col10">' + crit + so + us + cov + '</div></div>';
    },
    act: {
      signoff: function () {
        var s = G.uatSummary(cx()), names = {}; (s.openCritical || []).forEach(function (u) { names[u.id] = cat(u.id + ' ', u.scenario); });
        act({ title: L('Sign-off siklus UAT', 'Sign off the UAT cycle'), icon: 'checkc', ok: L('Sign-off', 'Sign off'), names: names,
          sub: t(L('Pass rate ' + pct(s.passPct, 0) + ' dari ' + s.total + ' kasus. Sign-off dicatat sebagai UAT_COMPLETED dan menjadi input readiness go-live. Ditolak bila ada isu Critical terbuka (§47).', 'Pass rate ' + pct(s.passPct, 0) + ' of ' + s.total + ' cases. Sign-off is recorded as UAT_COMPLETED and feeds go-live readiness. Refused while Critical issues are open (§47).')),
          fn: function (v) { return G.signOffUat(cx(), v.reason); }, done: function (r) { return L('Siklus ' + r.cycle.id + ' di-sign-off.', 'Cycle ' + r.cycle.id + ' signed off.'); } });
      }
    }
  };

  /* ---------- UAT-002 UAT Scenario (tester's own cases work on a phone) ---------- */
  function recordDlg(u, status) {
    var mgr = can('go.uat.manage'), lab = { pass: L('PASS', 'PASS'), fail: L('FAIL', 'FAIL'), blocked: L('BLOCKED', 'BLOCKED') }[status];
    act({ title: cat(cat(L('Catat hasil ', 'Record result '), lab), ' · ' + u.id), icon: status === 'pass' ? 'checkc' : status === 'fail' ? 'xc' : 'ban', ok: cat(L('Simpan ', 'Save '), lab), reason: false,
      sub: t(L('Expected: ', 'Expected: ')) + esc(u.expected),
      body: fld(L('Hasil aktual', 'Actual result'), area('actual', status === 'pass' ? (u.actual && u.st === 'pass' ? u.actual : 'Sesuai expected') : '', L('Apa yang terjadi?', 'What happened?')), { req: status !== 'pass', wide: true }) +
        fld(L('Device yang dipakai', 'Device used'), sel('device', Object.keys(G.DEVICES).map(function (d) { return [d, G.DEVICES[d]]; }), u.device || dev())) +
        fld(L('Evidence (nama file / foto)', 'Evidence (file / photo name)'), inp('evidence', '', { ph: L('mis. foto-ut001.jpg', 'e.g. photo-ut001.jpg') })) +
        (mgr ? fld(L('Severity (QA lead)', 'Severity (QA lead)'), sel('sev', [['', L('Tidak diubah', 'Unchanged')]].concat(Object.keys(G.SEV).map(function (k) { return [k, G.SEV[k][0]]; })), '')) : ''),
      fn: function (v) { var o = { status: status, actual: v.actual, device: v.device, evidence: v.evidence ? [v.evidence] : [] }; if (v.sev) o.sev = v.sev; return G.recordUat(cx(), u.id, o); },
      done: cat(cat(L('Hasil ', 'Result '), lab), L(' tersimpan.', ' saved.')) });
  }
  function canRecord(u) { var c0 = A.ctx(); return can('go.uat.manage') || (c0 && u.testerUid === c0.uid && (can('go.uat.test') || !!c0.client)); }
  V['UAT-002'] = {
    title: function (rec) { return rec ? L('Skenario UAT ' + rec, 'UAT Scenario ' + rec) : L('Skenario UAT Saya', 'My UAT Scenarios'); },
    render: function (c) {
      var c0 = cx();
      if (!c.rec) {
        var mine = G.myUat(c0), all = can('go.uat.view');
        var my = card(L('Kasus UAT saya', 'My UAT cases'), mine.length ? '<div class="go12-uc">' + mine.map(function (u) {
          return '<a class="go12-uci" href="' + href('UAT-002', u.id) + '"><span class="go12-uci-h">' + mono2(u.id) + uatSt(u) + '</span><b>' + t(u.scenario) + '</b><small>' + esc(u.module) + ' · ' + devC(u.device) + '</small></a>';
        }).join('') + '</div>' : A.empty(L('Tidak ada kasus UAT untuk Anda.', 'No UAT case assigned to you.')), { icon: 'clipboard', count: mine.length });
        return head(t(L('Jalankan skenario tanpa panduan, lalu catat Pass / Fail / Blocked dengan bukti.', 'Run the scenario without guidance, then record Pass / Fail / Blocked with evidence.')), all ? A.btn('ghost', L('UAT Command Center', 'UAT Command Center'), 'grid', { go: 'UAT-001' }) : '') + my + (all ? card(L('Semua kasus', 'All cases'), uatList(G.uat(c0)), { icon: 'list' }) : '');
      }
      var u = G.uatCase(c0, c.rec); if (!u) return noAccess();
      var rec = canRecord(u), mgr = can('go.uat.manage');
      var hero = P8.hero({ id: u.id, icon: 'clipboard', title: t(u.scenario), sub: esc(u.module) + ' · ' + t(u.groupN) + ' · ' + esc(u.role), chips: uatSt(u) + sevC(u.sev) + devC(u.device),
        facts: [[L('Tester', 'Tester'), esc(u.testerName || u.tester)], [L('Role', 'Role'), esc(u.role)], [L('Severity', 'Severity'), t(G.SEV[u.sev][2])], [L('Evidence', 'Evidence'), u.evidence.length + ' ' + t(L('file', 'files'))]] });
      var spec = card(L('Skenario (§45)', 'Scenario (§45)'), kv([[L('Prasyarat', 'Precondition'), t(u.pre)], [L('Langkah', 'Steps'), esc(u.steps)], [L('Expected', 'Expected'), '<b>' + esc(u.expected) + '</b>'], [L('Aktual', 'Actual'), u.actual ? esc(u.actual) : '<span class="sub5">' + t(L('belum diisi', 'not filled yet')) + '</span>']]), { icon: 'list' });
      var ev = card(L('Evidence', 'Evidence'), (u.evidence.length ? '<ul class="go12-ev">' + u.evidence.map(function (e) { return '<li>' + ic(/\.(png|jpe?g|webp|gif)$/i.test(e) ? 'image' : 'file') + '<span>' + esc(e) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada bukti.', 'No evidence yet.'))), { icon: 'camera', link: ['UAT-003', L('Kelola', 'Manage'), u.id] });
      var log = card(L('Riwayat hasil', 'Result history'), u.log.length ? '<ol class="go12-tl">' + u.log.map(function (l) { return '<li><b>' + uatSt(l) + '</b><span>' + when(l.at) + ' · ' + esc(uname(l.by)) + '</span>' + (l.actual ? '<small>' + esc(l.actual) + '</small>' : '') + '</li>'; }).join('') + '</ol>' : A.empty(L('Belum ada hasil tercatat di siklus ini.', 'No result recorded in this cycle yet.')), { icon: 'history' });
      var bar = rec ? P8.abar(P8.xl('primary', L('PASS', 'PASS'), 'checkc', { act: 'rec', val: 'pass', cls: 'go12-pass' }) + P8.xl('danger', L('FAIL', 'FAIL'), 'xc', { act: 'rec', val: 'fail' }) + P8.xl('ghost', L('BLOCKED', 'BLOCKED'), 'ban', { act: 'rec', val: 'blocked' }) +
        (mgr && (u.st === 'fail' || u.st === 'blocked') ? A.btn('blue', L('Tandai Retest', 'Mark Retest'), 'refresh', { act: 'retest' }) : '')) : note(t(L('Hanya tester kasus ini atau QA lead yang dapat mencatat hasil.', 'Only this case\'s tester or the QA lead can record a result.')), 'lock', 'info');
      return head(t(L('Ikuti langkah apa adanya. Bila gagal, tulis yang terjadi — jangan diakali.', 'Follow the steps as written. If it fails, write what happened — do not work around it.')), A.backBtn('ghost')) +
        hero + (u.critical ? note(t(L('Kasus Critical terbuka: memblokir sign-off UAT dan gate go-live.', 'Open Critical case: blocks UAT sign-off and the go-live gate.')), 'alert', 'crit') : '') + '<div class="g2-10 go12-g">' + spec + '<div class="col10">' + ev + log + '</div></div>' + bar;
    },
    act: {
      rec: function (el) { var u = G.uatCase(cx(), A.S.rec); if (u) recordDlg(u, el.getAttribute('data-val')); },
      retest: function () {
        var id = A.S.rec;
        act({ title: L('Tandai Retest ' + id, 'Mark Retest ' + id), icon: 'refresh', ok: L('Tandai Retest', 'Mark Retest'), reasonLabel: L('Catatan perbaikan', 'Fix note'),
          sub: t(L('Kasus dikembalikan ke tester untuk dites ulang setelah perbaikan.', 'The case goes back to the tester for a retest after the fix.')), fn: function (v) { return G.markRetest(cx(), id, v.reason); }, done: L('Ditandai Retest.', 'Marked Retest.') });
      }
    }
  };

  /* ---------- UAT-003 UAT Evidence ---------- */
  V['UAT-003'] = {
    render: function (c) {
      var list = G.uat(cx()), cur = c.rec ? G.uatCase(cx(), c.rec) : null;
      if (c.rec && !cur) return noAccess();
      var miss = list.filter(function (u) { return !u.evidence.length && u.st !== 'retest'; });
      var tbl = P.table(list, [
        { h: L('Kasus', 'Case'), v: function (u) { return lnk('UAT-003', u.id, mono2(u.id)) + '<small class="sub5">' + t(u.scenario) + '</small>'; } },
        { h: L('Tester', 'Tester'), v: function (u) { return esc(u.testerName || u.tester); } },
        { h: L('Status', 'Status'), v: uatSt },
        { h: L('Evidence', 'Evidence'), v: function (u) { return u.evidence.length ? '<span class="go12-ev1">' + ic('camera') + ' ' + u.evidence.length + '</span>' : A.chip('warn', L('Belum ada bukti', 'No evidence yet'), 'alert'); } }
      ], function (u) { return { t: esc(u.id) + ' · ' + t(u.scenario), r: u.evidence.length + ' ' + ic('camera'), chip: uatSt(u) }; }, function (u) { return href('UAT-003', u.id); }, { empty: L('Tidak ada kasus UAT untuk Anda.', 'No UAT case assigned to you.') });
      var det = cur ? card(cat(L('Evidence ', 'Evidence '), cur.id), '<p class="go12-ln"><b>' + t(cur.scenario) + '</b> ' + uatSt(cur) + '</p>' +
        (cur.evidence.length ? '<ul class="go12-ev">' + cur.evidence.map(function (e) { return '<li>' + ic(/\.(png|jpe?g|webp|gif)$/i.test(e) ? 'image' : 'file') + '<span>' + esc(e) + '</span></li>'; }).join('') + '</ul>' : A.empty(L('Belum ada bukti.', 'No evidence yet.'))) +
        (canRecord(cur) ? '<div class="go12-up"><label class="btn btn-ghost go12-file">' + ic('camera') + '<span>' + t(L('Ambil / pilih foto', 'Take / pick a photo')) + '</span><input type="file" accept="image/*,application/pdf" capture="environment" id="go12-file"></label>' + A.btn('primary', L('Tambah evidence', 'Add evidence'), 'plus', { act: 'addev' }) + '</div>' : ''), { icon: 'camera', link: ['UAT-002', L('Skenario', 'Scenario'), cur.id] })
        : card(L('Pilih kasus', 'Pick a case'), A.empty(L('Pilih kasus UAT untuk melihat atau menambah bukti.', 'Pick a UAT case to view or add evidence.')), { icon: 'camera' });
      return head(t(L('Foto, screenshot atau dokumen yang membuktikan hasil UAT. Kasus tanpa bukti ditandai.', 'Photos, screenshots or documents that prove a UAT result. Cases without evidence are flagged.')), '') +
        (miss.length ? note(t(L(miss.length + ' kasus belum punya bukti.', miss.length + ' cases have no evidence yet.')), 'alert', 'warn') : '') +
        '<div class="g21-10 go12-g">' + card(L('Kasus & bukti', 'Cases & evidence'), tbl, { icon: 'list', count: list.length }) + det + '</div>';
    },
    act: {
      addev: function () {
        var id = A.S.rec, f = document.getElementById('go12-file'), name = f && f.files && f.files[0] ? f.files[0].name : '';
        act({ title: L('Tambah evidence ' + id, 'Add evidence ' + id), icon: 'camera', ok: L('Tambah', 'Add'), reason: false,
          body: fld(L('Nama file / keterangan bukti', 'File name / evidence label'), inp('name', name, { ph: L('mis. foto-pod-ut008.jpg', 'e.g. photo-pod-ut008.jpg') }), { req: true, wide: true }),
          fn: function (v) { return G.addEvidence(cx(), id, v.name); }, done: L('Evidence ditambahkan.', 'Evidence added.') });
      }
    }
  };

  /* ---------- UAT-004 Usability Result ---------- */
  var FLAG_N = { time: L('Waktu > 150% target', 'Time > 150% of target'), errors: L('≥ 2 error', '≥ 2 errors'), questions: L('≥ 2 pertanyaan', '≥ 2 questions'), difficulty: L('Kesulitan ≥ 4', 'Difficulty ≥ 4') };
  V['UAT-004'] = {
    render: function () {
      var rows = G.usability(cx()); if (!can('go.uat.view')) return noAccess();
      var strug = rows.filter(function (r) { return r.struggle; }), help = rows.filter(function (r) { return r.help; }).length;
      var ratio = rows.length ? rows.reduce(function (s, r) { return s + r.time / r.target; }, 0) / rows.length * 100 : null;
      var k = P.kpis([
        { k: L('Tugas dites', 'Tasks tested'), v: rows.length, icon: 'clipboard' },
        { k: L('Pengguna kesulitan', 'Users struggling'), v: strug.length, icon: 'alert', tone: strug.length ? 'warn' : 'ok' },
        { k: L('Waktu vs target', 'Time vs target'), v: ratio == null ? '—' : pct(ratio, 0), s: t(L('rata-rata', 'average')), icon: 'clock', tone: ratio > 120 ? 'warn' : 'ok' },
        { k: L('Help dipakai', 'Help used'), v: help + '/' + rows.length, icon: 'help' }
      ], 'go12-k8');
      var tbl = P.table(rows, [
        { h: L('Pengguna', 'User'), v: function (r) { return '<b>' + esc(r.userName || r.user) + '</b><small class="sub5">' + esc(r.id) + '</small>'; } },
        { h: L('Tugas (tanpa panduan)', 'Task (no guidance)'), v: function (r) { return t(r.task); } },
        { h: L('Device', 'Device'), v: function (r) { return devC(r.device); } },
        { h: L('Waktu', 'Time'), v: function (r) { return P.bar(r.time, Math.max(r.time, r.target * 1.5), r.time > r.target * 1.5 ? 'crit' : r.time > r.target ? 'warn' : 'ok') + '<small class="sub5">' + r.time + ' / ' + r.target + ' ' + t(L('dtk', 'sec')) + '</small>'; } },
        { h: L('Tap', 'Taps'), cls: 'r num', v: function (r) { return r.taps; } },
        { h: L('Error', 'Errors'), cls: 'r num', v: function (r) { return r.errors >= 2 ? '<b class="go12-e">' + r.errors + '</b>' : r.errors; } },
        { h: L('Tanya', 'Questions'), cls: 'r num', v: function (r) { return r.questions >= 2 ? '<b class="go12-e">' + r.questions + '</b>' : r.questions; } },
        { h: L('Help', 'Help'), v: function (r) { return r.help ? A.chip('info', L('Ya', 'Yes')) : '<span class="sub5">—</span>'; } },
        { h: L('Kesulitan', 'Difficulty'), cls: 'r num', v: function (r) { return (r.diff >= 4 ? '<b class="go12-e">' + r.diff + '</b>' : r.diff) + '/5'; } },
        { h: L('Rekomendasi', 'Recommendation'), v: function (r) { return r.struggle ? A.chip('warn', L('Perbaiki UI dulu', 'Improve UI first'), 'bulb') + '<small class="sub5">' + r.flags.map(function (f) { return T(FLAG_N[f]); }).map(esc).join(', ') + '</small>' : A.chip('ok', r.recN); } }
      ], function (r) { return { t: esc(r.userName || r.user) + ' · ' + t(r.task), r: r.time + 's', s: t(G.DEVICES[r.device]) + ' · ' + r.taps + ' tap · ' + r.errors + ' error · ' + t(L('kesulitan ', 'difficulty ')) + r.diff + '/5', chip: r.struggle ? A.chip('warn', L('Perbaiki UI dulu', 'Improve UI first')) : A.chip('ok', r.recN) }; }, null, { empty: L('Belum ada tes usability.', 'No usability test yet.') });
      var rc = strug.length ? P.rec({ title: L('Rekomendasi usability', 'Usability recommendation'), icon: 'bulb', tone: 'warn',
        sig: L(strug.length + ' dari ' + rows.length + ' tugas membuat pengguna kesulitan.', strug.length + ' of ' + rows.length + ' tasks make users struggle.'),
        why: strug.map(function (r) { return L((r.userName || r.user) + ' — ' + T(r.task) + ': ' + r.flags.map(function (f) { return FLAG_N[f][0]; }).join(', '), (r.userName || r.user) + ' — ' + r.task[1] + ': ' + r.flags.map(function (f) { return FLAG_N[f][1]; }).join(', ')); }),
        impact: L('Lebih lambat di lapangan, salah input, dan ketergantungan pada training ulang.', 'Slower in the field, input mistakes and dependence on re-training.'),
        rec: L('Perbaiki UI dulu — jangan hanya menambah training (§48).', 'Improve the UI first — do not rely only on more training (§48).'),
        act: { n: L('Masukkan ke Improvement Backlog', 'Add to the Improvement Backlog'), s: 'OPT-003', i: 'plus' } }) : '';
      var canAdd = (can('go.uat.manage') || (can('go.uat.view') && can('go.opt.view'))) && !mob();
      return head(t(L('Tugas diberikan tanpa panduan; diukur waktu, jumlah tap, error, pertanyaan, bantuan dan kesulitan (§48).', 'Tasks are given without guidance; time, taps, errors, questions, help and difficulty are measured (§48).')), canAdd ? A.btn('primary', L('Catat tes usability', 'Record usability test'), 'plus', { act: 'addusb' }) : '', L('JFGO UAT', 'JFGO UAT')) +
        k + rc + card(L('Hasil per tugas', 'Results per task'), tbl, { icon: 'users', count: rows.length });
    },
    act: {
      addusb: function () {
        var us = (X ? X.USERS : []).filter(function (u) { return u.status !== 'inactive'; }).map(function (u) { return [u.u, L(X.fullName(u) + ' (' + u.u + ')')]; });
        act({ title: L('Catat tes usability', 'Record usability test'), icon: 'users', ok: L('Simpan', 'Save'), reason: false,
          body: '<div class="go12-fg">' + fld(L('Pengguna', 'User'), sel('user', us, 'putu'), { req: true }) + fld(L('Device', 'Device'), sel('device', Object.keys(G.DEVICES).map(function (d) { return [d, G.DEVICES[d]]; }), 'mobile'), { req: true }) +
            fld(L('Tugas', 'Task'), inp('task', '', { ph: L('mis. Timbang & simpan receiving', 'e.g. Weigh & save a receiving') }), { req: true, wide: true }) +
            fld(L('Target (detik)', 'Target (sec)'), inp('target', '60', { num: true }), { req: true }) + fld(L('Waktu aktual (detik)', 'Actual time (sec)'), inp('time', '', { num: true }), { req: true }) +
            fld(L('Jumlah tap', 'Taps'), inp('taps', '0', { num: true })) + fld(L('Error', 'Errors'), inp('errors', '0', { num: true })) + fld(L('Pertanyaan', 'Questions'), inp('questions', '0', { num: true })) +
            fld(L('Kesulitan (1–5)', 'Difficulty (1–5)'), sel('diff', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']], '2')) +
            '<label class="go12-cb"><input type="checkbox" name="help"><span>' + t(L('Memakai Smart Help', 'Used Smart Help')) + '</span></label></div>',
          fn: function (v) { function n(k) { var x = H.num(v[k]); return x == null ? (k === 'time' ? NaN : 0) : x; } return G.addUsability(cx(), { user: v.user, task: v.task, device: v.device, target: n('target'), time: n('time'), taps: n('taps'), errors: n('errors'), questions: n('questions'), help: !!v.help, diff: +v.diff }); },
          done: function (r) { return r.usability.struggle ? L('Tersimpan — pengguna kesulitan: perbaiki UI dulu.', 'Saved — the user struggles: improve the UI first.') : L('Tersimpan — lancar.', 'Saved — smooth.'); } });
      }
    }
  };

  /* ================= NP-10 Pilot, reset, cut-off, production start ================= */
  var RSTEPS = [['mode', L('Mode', 'Mode')], ['cutoff', L('Cut-off', 'Cut-off')], ['scope', L('Scope', 'Scope')], ['deps', L('Dependensi', 'Dependencies')], ['preview', L('Preview', 'Preview')], ['snapshot', L('Snapshot', 'Snapshot')], ['approved', L('Approval', 'Approval')], ['executed', L('Eksekusi', 'Execute')], ['reconciled', L('Rekonsiliasi', 'Reconcile')], ['ready', L('Siap Produksi', 'Ready')]];
  var RST = { draft: [L('Draft', 'Draft'), 'mute'], pending: [L('Menunggu persetujuan', 'Waiting for approval'), 'warn'], approved: [L('Disetujui', 'Approved'), 'info'], executed: [L('Dieksekusi', 'Executed'), 'info'], reconciled: [L('Terekonsiliasi', 'Reconciled'), 'info'], ready: [L('Siap produksi', 'Ready for production'), 'ok'], rolled_back: [L('Di-rollback', 'Rolled back'), 'warn'] };
  var MODE_D = { dummy_only: L('Arsipkan data DUMMY dan TEST; master dan data asli tetap.', 'Archive DUMMY and TEST data; masters and real data stay.'), keep_real: L('Sisakan data REAL + MIGRATION; dummy, test dan turunan sistemnya diarsip.', 'Keep REAL + MIGRATION; dummy, test and their system-generated records are archived.'),
    cutoff: L('Bersihkan transaksi non-asli sampai tanggal cut-off.', 'Clean non-real transactions up to the cut-off date.'), soft: L('Soft erase dummy/test — bisa dipulihkan 30 hari.', 'Soft-erase dummy/test — recoverable for 30 days.'), full_clean: L('Mulai bersih: juga staging MIGRATION. Master asli tidak pernah dihapus.', 'Clean start: MIGRATION staging too. Real masters are never deleted.') };
  var CLS_T = { DUMMY: 'warn', TEST: 'info', MIGRATION: 'appr', REAL: 'ok', SYSTEM: 'mute' };
  function clsC(k, n) { return '<span class="go12-cls go12-cls-' + k.toLowerCase() + '">' + t(G.CLASSES[k] || L2(k)) + (n != null ? ' <b>' + n + '</b>' : '') + '</span>'; }
  function rstC(r) { return chipOf(RST, r.st); }
  function canDesk(perm) { return can(perm) && !mob(); }
  function modN(mod) { var m = G.MODS[mod]; return m ? t(m.n) : esc(mod); }
  function createDlg(mode) {
    act({ title: L('Permintaan reset baru', 'New reset request'), icon: 'refresh', ok: L('Buat permintaan', 'Create request'),
      sub: t(L('Membuat RSB (Reset Batch) berstatus draft. Belum ada data yang berubah: berikutnya scope, dependency check, preview, snapshot dan persetujuan.', 'Creates a draft RSB (Reset Batch). No data changes yet: next come scope, dependency check, preview, snapshot and approval.')),
      body: fld(L('Mode reset (§69)', 'Reset mode (§69)'), radios('mode', Object.keys(G.RESET_MODES).map(function (k) { return [k, G.RESET_MODES[k].n, MODE_D[k]]; }), mode || 'dummy_only'), { req: true, wide: true }) +
        fld(L('Tindakan', 'Action'), radios('action', [['soft_erase', G.RESET_ACTIONS.soft_erase, L('Disarankan — bisa dipulihkan', 'Preferred — recoverable')], ['archive', G.RESET_ACTIONS.archive, L('Arsip, bisa dipulihkan', 'Archive, recoverable')], ['delete', G.RESET_ACTIONS.delete, L('Hanya DUMMY/TEST, tidak bisa dipulihkan', 'DUMMY/TEST only, never recoverable'), 'crit']], 'soft_erase'), { req: true, wide: true }),
      fn: function (v) { return G.createReset(cx(), { mode: v.mode, action: v.action, reason: v.reason, device: dev() }); },
      go: function (r) { return ['CUT-003', r.reset.id]; }, done: function (r) { return L(r.reset.id + ' dibuat (RESET_REQUESTED).', r.reset.id + ' created (RESET_REQUESTED).'); } });
  }

  /* ---------- CUT-001 Go-Live Preparation ---------- */
  V['CUT-001'] = {
    render: function () {
      var c0 = cx(), pr = G.prep(c0); if (!pr) return noAccess();
      var pl = G.pilot(c0), par = G.parallel(c0), co = G.cutoff(c0), ps = G.productionStart(), dec = G.lastDecision(), sn = (G.snapshots(c0) || [])[0];
      var it = {}; pr.items.forEach(function (i) { it[i.k] = i; });
      var flow = [['pilot', L('Pilot', 'Pilot'), pl && (pl.st === 'running' || pl.st === 'done')], ['parallel', L('Parallel', 'Parallel'), par && par.match === par.rows.length], ['cleanup', L('Cleanup', 'Cleanup'), it.dummy && it.dummy.ok], ['cutoff', L('Cut-Off', 'Cut-Off'), co && co.st === 'set'],
        ['snapshot', L('Snapshot', 'Snapshot'), it.snapshot && it.snapshot.ok], ['approval', L('Approval', 'Approval'), dec && dec.decision !== 'NO-GO'], ['golive', L('Go Live', 'Go Live'), !!ps]];
      var hero = P8.hero({ id: ps ? 'PRODUCTION_START_DATE' : 'PRE-GO-LIVE', icon: 'flag', title: ps ? t(L('JFRESH OS LIVE sejak ', 'JFRESH OS LIVE since ')) + esc(ps.date) : t(L('Persiapan go-live', 'Go-live preparation')),
        sub: co ? t(L('Cut-off ', 'Cut-off ')) + esc(co.at) + ' → ' + t(L('Production start ', 'Production start ')) + esc(co.start) : '', chips: ps ? A.chip('ok', L('LIVE', 'LIVE'), 'checkc') : A.chip('warn', L('PRE-GO-LIVE', 'PRE-GO-LIVE'), 'clock'),
        facts: [[L('Checklist lulus', 'Checklist passed'), pr.pass + '/' + pr.total + ' · ' + pct(pr.pct, 0)], [L('Hard requirement gagal', 'Hard requirements failing'), String(pr.hardFail.length), pr.hardFail.length ? 'go12-e' : 'go12-ok'], [L('Keputusan Go/No-Go', 'Go/No-Go decision'), dec ? esc(dec.decision) : t(L('belum ada', 'none yet'))], [L('Snapshot terakhir', 'Latest snapshot'), sn ? esc(sn.id) + ' · ' + esc(sn.at) : '—']],
        extra: '<div class="go12-hx"><ol class="go12-pp go12-pp-free" aria-label="' + t(L('Alur cutover', 'Cutover flow')) + '">' + flow.map(function (f, i) { return '<li class="' + (f[2] ? 'done' : '') + '"><span class="go12-pp-n">' + (f[2] ? ic('check') : i + 1) + '</span><b>' + t(f[1]) + '</b><small>' + t(f[2] ? L('selesai', 'done') : L('belum', 'pending')) + '</small></li>'; }).join('') + '</ol></div>' });
      var chk = card(L('Checklist Prepare for Go-Live (§81)', 'Prepare for Go-Live checklist (§81)'), '<ul class="go12-ck">' + pr.items.map(function (i) {
        return '<li class="go12-ck-' + i.st + '">' + tick(i.ok, !i.hard) + '<span><b>' + t(i.n) + '</b>' + (i.hard ? '' : ' <small class="go12-soft">' + t(L('soft', 'soft')) + '</small>') + '<small>' + (i.v == null ? '' : Array.isArray(i.v) ? t(i.v) : esc(i.v)) + '</small></span>' + (i.s ? lnk(i.s, null, ic('chevr'), null) : '') + '</li>';
      }).join('') + '</ul>', { icon: 'checkc', count: pr.pass + '/' + pr.total });
      var pil = pl ? card(L('Pilot run (§66)', 'Pilot run (§66)'), kv([[L('Klien', 'Clients'), pl.clients.map(function (id, i) { return lnk('CLIENT-002', id, esc(pl.clientNames[i])); }).join(', ')], [L('Properti', 'Properties'), esc(pl.props.join(', '))], [L('Shift', 'Shifts'), esc(pl.shifts.join(', '))], [L('Tim', 'Teams'), esc(pl.teams.join(', '))], [L('Periode', 'Period'), esc(pl.from) + ' → ' + esc(pl.to)], [L('Status', 'Status'), A.chip(pl.st === 'running' ? 'info' : pl.st === 'done' ? 'ok' : 'mute', L2(pl.st))]]) +
        (canDesk('go.cutoff.manage') && !ps ? '<div class="go12-ac-f">' + A.btn('ghost', L('Ubah pilot', 'Edit pilot'), 'edit', { act: 'pilot' }) + '</div>' : ''), { icon: 'target' }) : '';
      var prl = par ? card(L('Parallel run: proses lama vs JFRESH OS (§67)', 'Parallel run: existing process vs JFRESH OS (§67)'), P.table(par.rows, [
        { h: L('Bandingkan', 'Compare'), v: function (r) { return '<b>' + t(r.n) + '</b>'; } },
        { h: L('Proses lama', 'Existing'), cls: 'r num', v: function (r) { return /Rp|IDR/.test(r.n[1]) ? rpj(r.old) : n0(r.old, r.old % 1 ? 1 : 0); } },
        { h: 'JFRESH OS', cls: 'r num', v: function (r) { return (/Rp|IDR/.test(r.n[1]) ? rpj(r.new) : n0(r.new, r.new % 1 ? 1 : 0)) + '<small class="sub5 mono6">' + esc(r.src) + '</small>'; } },
        { h: L('Selisih', 'Difference'), cls: 'r num', v: function (r) { return r.diff ? '<span class="' + (r.st === 'match' ? '' : 'go12-e') + '">' + (r.diff > 0 ? '+' : '') + (/Rp|IDR/.test(r.n[1]) ? rpj(r.diff) : n0(r.diff, 1)) + '</span><small class="sub5">' + pct(r.diffPct, 1) + '</small>' : '0'; } },
        { h: L('Status', 'Status'), v: function (r) { return A.chip(r.st === 'match' ? 'ok' : r.st === 'review' ? 'warn' : 'crit', r.st === 'match' ? L('Cocok', 'Match') : r.st === 'review' ? L('Review', 'Review') : L('Selisih', 'Difference')); } }
      ], function (r) { return { t: t(r.n), r: r.diff ? pct(r.diffPct, 1) : '0', chip: A.chip(r.st === 'match' ? 'ok' : r.st === 'review' ? 'warn' : 'crit', r.st === 'match' ? L('Cocok', 'Match') : r.st === 'review' ? L('Review', 'Review') : L('Selisih', 'Difference')) }; }) + '<p class="go12-cap">' + t(L(par.match + '/' + par.rows.length + ' cocok (≤ 0,5%). Klien pilot saja; sisi JFRESH OS dibaca langsung dari engine pemilik.', par.match + '/' + par.rows.length + ' match (≤ 0.5%). Pilot clients only; the JFRESH OS side is read live from the owner engines.')) + '</p>', { icon: 'swap' }) : '';
      var nav = card(L('Langkah cutover', 'Cutover steps'), '<div class="rls">' + [['CUT-002', 'refresh', L('Reset Center', 'Reset Center'), L('Bersihkan dummy dengan preview & dual approval', 'Clean dummy data with preview & dual approval')], ['CUT-004', 'database', L('Snapshot', 'Snapshot'), L('Baseline yang bisa dipulihkan', 'Recoverable baseline')], ['CUT-005', 'history', L('Riwayat reset', 'Reset history'), L('Lihat & restore', 'View & restore')], ['CUT-006', 'calendar', L('Cut-off', 'Cut-off'), co ? co.at : ''], ['CUT-007', 'flag', L('Production Start', 'Production Start'), ps ? L('LIVE', 'LIVE') : L('START PRODUCTION', 'START PRODUCTION')]].filter(function (x) { return H.open(x[0]); }).map(function (x) { return A.rowLink({ href: href(x[0]), icon: x[1], t: t(x[2]), s: Array.isArray(x[3]) ? t(x[3]) : esc(x[3]) }); }).join('') + '</div>', { icon: 'route' });
      return head(t(L('Transisi aman dari data uji ke produksi nyata: pilot, parallel run, pembersihan dummy, cut-off, snapshot, persetujuan, lalu START PRODUCTION.', 'Safe transition from test data to real production: pilot, parallel run, dummy cleanup, cut-off, snapshot, approval, then START PRODUCTION.')), '', L('JFGO + engine pemilik', 'JFGO + owner engines')) +
        deskNote() + hero + '<div class="g21-10 go12-g">' + '<div class="col10">' + chk + prl + '</div><div class="col10">' + nav + pil + '</div></div>';
    },
    act: {
      pilot: function () {
        var pl = G.pilot(cx()), CM = window.JFCOMM, cls = CM && CM.clients ? CM.clients().filter(function (x) { return x.status === 'active'; }).map(function (x) { return [x.id, L(x.n + ' (' + x.id + ')')]; }) : [];
        act({ title: L('Ubah pilot run', 'Edit pilot run'), icon: 'target', ok: L('Simpan', 'Save'),
          body: fld(L('Klien pilot', 'Pilot clients'), checks('clients', cls, pl.clients), { wide: true }) + '<div class="go12-fg">' + fld(L('Dari', 'From'), inp('from', pl.from, { type: 'date' })) + fld(L('Sampai', 'To'), inp('to', pl.to, { type: 'date' })) +
            fld(L('Status', 'Status'), sel('st', [['planned', L('Direncanakan', 'Planned')], ['running', L('Berjalan', 'Running')], ['done', L('Selesai', 'Done')]], pl.st)) + '</div>',
          fn: function (v) { if (!v.clients || !v.clients.length) return { ok: false, msg: L('Pilih minimal satu klien.', 'Pick at least one client.') }; return G.setPilot(cx(), { clients: v.clients, from: v.from, to: v.to, st: v.st }, v.reason); }, done: L('Pilot diperbarui.', 'Pilot updated.') });
      }
    }
  };

  /* ---------- CUT-002 Reset Center ---------- */
  V['CUT-002'] = {
    render: function () {
      var c0 = cx(), rs = G.resets(c0), cl = G.classes(c0); if (!cl) return noAccess();
      var live = G.isLive(), req = canDesk('go.reset.request');
      var modes = card(L('Mode reset (§69)', 'Reset modes (§69)'), '<div class="go12-md">' + Object.keys(G.RESET_MODES).map(function (k) {
        var m = G.RESET_MODES[k];
        return '<div class="go12-md-i"><b>' + t(m.n) + '</b><small>' + t(MODE_D[k]) + '</small><span class="go12-md-c">' + m.cls.map(function (x) { return clsC(x); }).join('') + '</span>' + (req ? A.btn('ghost', L('Pilih', 'Choose'), 'arrow', { act: 'newreset', val: k, cls: 'btn-sm' }) : '') + '</div>';
      }).join('') + '</div>' + (live ? note(t(L('Setelah Production Start hanya DUMMY/TEST yang bisa dibersihkan; data asli dan terlindungi tidak pernah dihapus permanen (§74).', 'After Production Start only DUMMY/TEST can be cleaned; real and protected data is never hard-deleted (§74).')), 'lock', 'warn') : ''), { icon: 'layers' });
      var active = rs.filter(function (r) { return ['ready', 'rolled_back'].indexOf(r.st) < 0; });
      var list = card(L('Permintaan reset aktif', 'Active reset requests'), P.table(active, [
        { h: L('Reset batch', 'Reset batch'), v: function (r) { return lnk('CUT-003', r.id, mono2(r.id)) + '<small class="sub5">' + when(r.at) + '</small>'; } },
        { h: L('Mode', 'Mode'), v: function (r) { return '<b>' + t(r.modeN) + '</b><small class="sub5">' + t(r.actionN) + '</small>'; } },
        { h: L('Diminta oleh', 'Requested by'), v: function (r) { return esc(r.requesterName); } },
        { h: L('Langkah', 'Step'), v: function (r) { return dots(10, r.stepIdx + 1) + '<small class="sub5">' + t(RSTEPS[r.stepIdx][1]) + ' · ' + (r.stepIdx + 1) + '/10</small>'; } },
        { h: L('Persetujuan', 'Approval'), v: function (r) { return r.needs.map(function (k) { var a = r.approvals.some(function (x) { return x.role === k; }); return A.chip(a ? 'ok' : 'mute', k === 'owner' ? L('Owner', 'Owner') : L('Finance', 'Finance'), a ? 'checkc' : 'clock'); }).join(' '); } },
        { h: L('Status', 'Status'), v: rstC }
      ], function (r) { return { t: esc(r.id) + ' · ' + t(r.modeN), s: esc(r.requesterName) + ' · ' + t(RSTEPS[r.stepIdx][1]), chip: rstC(r) }; }, function (r) { return href('CUT-003', r.id); }, { empty: L('Tidak ada permintaan reset aktif.', 'No active reset request.') }), { icon: 'refresh', count: active.length, link: ['CUT-005', L('Riwayat', 'History')] });
      var tot = cl.totals;
      var clsT = card(L('Klasifikasi data per modul (§68)', 'Data classification per module (§68)'), '<div class="go12-cls-t">' + Object.keys(G.CLASSES).map(function (k) { return clsC(k, n0(tot[k])); }).join('') + '</div>' + P.table(cl.rows, [
        { h: L('Modul', 'Module'), v: function (r) { return '<b>' + t(r.n) + '</b><small class="sub5">' + esc(r.mod) + '</small>'; } },
        { h: L('Pemilik', 'Owner'), v: function (r) { return t(OWNER[r.eng] || r.eng); } },
        { h: 'DUMMY', cls: 'r num', v: function (r) { return r.counts.DUMMY ? '<b class="go12-w">' + r.counts.DUMMY + '</b>' : '0'; } },
        { h: 'TEST', cls: 'r num', v: function (r) { return n0(r.counts.TEST); } },
        { h: 'MIGRATION', cls: 'r num', v: function (r) { return n0(r.counts.MIGRATION); } },
        { h: 'REAL', cls: 'r num', v: function (r) { return n0(r.counts.REAL); } },
        { h: 'SYSTEM', cls: 'r num', v: function (r) { return n0(r.counts.SYSTEM); } },
        { h: L('Diarsip', 'Erased'), cls: 'r num', v: function (r) { return r.erased ? '<b>' + r.erased + '</b>' : '0'; } },
        { h: '', v: function (r) { return r.protected ? A.chip('info', L('Terlindungi', 'Protected'), 'lock') : ''; } }
      ], function (r) { return { t: t(r.n), r: n0(r.total), s: Object.keys(G.CLASSES).filter(function (k) { return r.counts[k]; }).map(function (k) { return k + ' ' + r.counts[k]; }).join(' · ') + (r.erased ? ' · ' + T(L('diarsip ', 'erased ')) + r.erased : '') }; }), { icon: 'tag' });
      var prot = card(L('Proteksi hard delete (§74)', 'Hard delete protection (§74)'), '<ul class="go12-rl">' + Object.keys(G.PROTECTED).map(function (k) { return '<li>' + ic('lock') + '<span>' + t(G.PROTECTED[k]) + '</span></li>'; }).join('') + '</ul>' + note(t(L('Setelah produksi gunakan: ', 'After production use: ')) + G.ALTERNATIVES.map(function (a) { return '<b>' + t(a) + '</b>'; }).join(' · '), 'shield', 'info'), { icon: 'shield' });
      return head(t(L('Bersihkan data dummy dengan aman: setiap reset wajib preview, snapshot dan persetujuan sebelum eksekusi. Soft erase disarankan agar bisa dipulihkan.', 'Clean dummy data safely: every reset needs a preview, a snapshot and approval before execution. Soft erase is preferred so it stays recoverable.')),
        req ? A.btn('primary', L('BERSIHKAN DATA DUMMY', 'CLEAN DUMMY DATA'), 'refresh', { act: 'newreset', val: 'dummy_only' }) + A.btn('ghost', L('Permintaan reset', 'Reset request'), 'plus', { act: 'newreset' }) : '', L('klasifikasi dari engine pemilik', 'classification from the owner engines')) +
        deskNote(L('Reset, hapus permanen dan restore hanya di desktop/iPad (§113). Di ponsel hanya status.', 'Reset, permanent delete and restore are desktop/iPad only (§113). On a phone only the status is shown.')) +
        '<div class="g21-10 go12-g"><div class="col10">' + list + clsT + '</div><div class="col10">' + modes + prot + '</div></div>';
    },
    act: { newreset: function (el) { createDlg(el.getAttribute('data-val')); } }
  };

  /* ---------- CUT-003 Reset Preview (the reset workflow §77) ---------- */
  var SCOPE_MODS = ['lg.order', 'pr.receiving', 'pr.batch', 'dl.delivery', 'fn.billing', 'fn.invoice', 'fn.payment', 'fn.journal', 'fn.expense', 'fn.appay', 'fn.cash'];
  function scopeTxt(sc) {
    sc = sc || {}; var p = [];
    if (sc.mods && sc.mods.length) p.push(T(L('Modul: ', 'Modules: ')) + sc.mods.map(function (m) { return G.MODS[m] ? T(G.MODS[m].n) : m; }).join(', '));
    if (sc.from || sc.to) p.push((sc.from || '…') + ' → ' + (sc.to || '…'));
    if (sc.month) p.push(T(L('Bulan ', 'Month ')) + sc.month);
    if (sc.cl) p.push(T(L('Klien ', 'Client ')) + sc.cl); if (sc.source) p.push(T(L('Sumber ', 'Source ')) + sc.source); if (sc.env) p.push('Env ' + sc.env); if (sc.status) p.push('Status ' + sc.status);
    return p.length ? esc(p.join(' · ')) : t(L('Semua modul transaksi, semua tanggal (sesuai mode)', 'Every transaction module, every date (per mode)'));
  }
  function previewBlock(pv, r) {
    if (!pv) return '';
    var del = r.action === 'delete';
    var box = bigBox([{ k: L('Akan dipertahankan', 'Will retain'), v: n0(pv.retain.count), tn: 'ok' }, { k: L('Akan diarsipkan', 'Will archive'), v: n0(pv.archive.count), tn: pv.archive.count ? 'info' : null },
      { k: L('Akan dihapus permanen', 'Will delete'), v: n0(pv.del.count), tn: pv.del.count ? 'crit' : null }, { k: L('Bisa dipulihkan', 'Recoverable'), v: n0(pv.recoverable), s: del ? t(L('hapus permanen tidak bisa dipulihkan', 'permanent delete is never recoverable')) : t(L(G.RETENTION_DAYS + ' hari', G.RETENTION_DAYS + ' days')), tn: del ? 'crit' : 'ok' },
      { k: L('Dependensi', 'Dependencies'), v: n0(pv.dependencies.chains), s: t(L(pv.dependencies.kept.length + ' rantai dipertahankan utuh', pv.dependencies.kept.length + ' chains kept whole')) }]);
    var mods = (del ? pv.del.byModule : pv.archive.byModule) || [];
    var tbl = mods.length ? P.table(mods, [
      { h: L('Modul', 'Module'), v: function (m) { return '<b>' + t(m.n) + '</b><small class="sub5">' + esc(m.mod) + '</small>'; } },
      { h: L('Jumlah', 'Count'), cls: 'r num', v: function (m) { return n0(m.count); } },
      { h: L('Klasifikasi', 'Classification'), v: function (m) { return Object.keys(m.classes).map(function (k) { return clsC(k, m.classes[k]); }).join(''); } },
      { h: L('Contoh ID', 'Sample ids'), v: function (m) { return '<span class="go12-ids">' + m.sample.map(mono2).join(' ') + '</span>'; } }
    ], function (m) { return { t: t(m.n), r: n0(m.count), s: m.sample.slice(0, 3).join(', ') }; }) : A.empty(L('Tidak ada record yang terdampak.', 'No record is affected.'));
    var ret = Object.keys(pv.retain.byModule || {}).map(function (k) { return modN(k) + ' ' + pv.retain.byModule[k]; }).join(' · ');
    return card(L('Preview reset (§79)', 'Reset preview (§79)'), box + (pv.finance ? note(t(L('Berdampak keuangan: butuh persetujuan Finance selain Owner (§80).', 'Finance-impacting: needs Finance approval besides the Owner (§80).')), 'coins', 'warn') : '') + tbl +
      '<p class="go12-cap"><b>' + t(L('Dipertahankan: ', 'Retained: ')) + '</b>' + ret + '</p>' + srcC(cat(L('preview ', 'preview '), pv.at + ' · hash ' + pv.hash)), { icon: 'eye' });
  }
  V['CUT-003'] = {
    title: function (rec) { return rec ? L('Preview Reset ' + rec, 'Reset Preview ' + rec) : L('Preview Reset', 'Reset Preview'); },
    render: function (c) {
      var c0 = cx(), all = G.resets(c0); if (!can('go.cut.view')) return noAccess();
      var r = c.rec ? G.reset(c0, c.rec) : all.filter(function (x) { return ['ready', 'rolled_back'].indexOf(x.st) < 0; })[0] || all[0];
      if (!r) return head(t(L('Pratinjau reset: apa yang dipertahankan, diarsip, dihapus dan dependensinya.', 'Reset preview: what is retained, archived, deleted and its dependencies.'))) + A.stateCard('empty', L('Belum ada riwayat reset.', 'No reset history yet.'), H.open('CUT-002') ? A.btn('primary', L('Buka Reset Center', 'Open Reset Center'), 'refresh', { go: 'CUT-002' }) : '');
      var si = r.stepIdx, uid = me(), d = !mob(), pre = si < 5, req = can('go.reset.request') && d && pre;
      var steps = pipe(RSTEPS, r.st === 'ready' ? 10 : si + 1, { sm: true, label: L('Reset workflow (§77)', 'Reset workflow (§77)') });
      var hero = P8.hero({ id: r.id, icon: 'refresh', title: t(r.modeN), sub: t(L('Diminta oleh ', 'Requested by ')) + '<b>' + esc(r.requesterName) + '</b> · ' + when(r.at) + ' · “' + esc(r.reason) + '”', chips: rstC(r) + A.chip(r.action === 'delete' ? 'crit' : 'info', r.actionN) + (r.fin ? A.chip('appr', L('Berdampak keuangan', 'Finance-impacting'), 'coins') : ''),
        facts: [[L('Cut-off', 'Cut-off'), r.cutoff ? esc(r.cutoff.at) : (r.mode === 'cutoff' ? t(L('belum diatur', 'not set')) : t(L('tidak dipakai', 'not used')))], [L('Scope', 'Scope'), scopeTxt(r.scope)], [L('Snapshot', 'Snapshot'), r.snap ? lnk('CUT-004', r.snap, mono2(r.snap)) : '—'], [L('Record', 'Records'), r.count ? n0(r.count) : r.preview ? n0(r.preview.archive.count + r.preview.del.count) : '—']],
        extra: '<div class="go12-hx">' + steps + '</div>' });
      // Step panel: one block per step, each with its own action when allowed.
      function blk(k, title, done, body, action) { return '<li class="go12-sb' + (done ? ' go12-sb-done' : '') + '"><div class="go12-sb-h">' + tick(done, !done) + '<b>' + t(title) + '</b>' + (action ? '<span class="go12-sb-a">' + action + '</span>' : '') + '</div>' + (body ? '<div class="go12-sb-b">' + body + '</div>' : '') + '</li>'; }
      var B = '';
      if (r.mode === 'cutoff') B += blk('cutoff', L('Atur cut-off', 'Set the cut-off'), !!r.cutoff, r.cutoff ? esc(r.cutoff.at) : t(L('Mode cut-off butuh tanggal & jam cut-off.', 'Cut-off mode needs a cut-off date & time.')), req ? A.btn('ghost', L('Atur cut-off', 'Set cut-off'), 'calendar', { act: 'rcut', cls: 'btn-sm' }) : '');
      B += blk('scope', L('Pilih scope (§73)', 'Select the scope (§73)'), si >= 2, scopeTxt(r.scope), req ? A.btn('ghost', L('Atur scope', 'Set scope'), 'filter', { act: 'rscope', cls: 'btn-sm' }) : '');
      B += blk('deps', L('Dependency check (§78)', 'Dependency check (§78)'), si >= 3, r.deps ? '<p class="go12-ln">' + t(L(r.deps.targets + ' record dalam ' + r.deps.chains + ' rantai · ' + r.deps.pulled.length + ' turunan sistem ikut · orphan ' + r.deps.orphans, r.deps.targets + ' records in ' + r.deps.chains + ' chains · ' + r.deps.pulled.length + ' system records follow · orphans ' + r.deps.orphans)) + '</p>' +
        (r.deps.kept.length ? '<details class="go12-dt"><summary>' + t(L(r.deps.kept.length + ' rantai dipertahankan utuh karena memuat data asli/migrasi', r.deps.kept.length + ' chains kept whole because they hold real/migrated data')) + '</summary><ul class="go12-rl">' + r.deps.kept.slice(0, 12).map(function (k) { return '<li><span>' + mono2(k.chain) + ' · ' + k.sample.map(esc).join(' → ') + '</span>' + clsC(k.because.cls) + '</li>'; }).join('') + '</ul></details>' : '') : t(L('Order → Produksi → Delivery → POD → Invoice → Payment → Jurnal dicek utuh; tidak boleh ada orphan.', 'Order → Production → Delivery → POD → Invoice → Payment → Journal are checked whole; no orphans allowed.')),
        req && si >= 0 ? A.btn('ghost', L('Jalankan dependency check', 'Run dependency check'), 'link', { act: 'rdeps', cls: 'btn-sm' }) : '');
      B += blk('preview', L('Preview (§79)', 'Preview (§79)'), si >= 4, r.preview ? t(L('Preview siap — lihat panel di bawah.', 'Preview ready — see the panel below.')) : t(L('Tunjukkan apa yang dipertahankan, diarsip, dihapus, bisa dipulihkan, dan dependensinya sebelum ada tombol eksekusi.', 'Shows what is retained, archived, deleted, recoverable and the dependencies before any execute button.')),
        req && si >= 3 ? A.btn('ghost', L('Buat preview', 'Build preview'), 'eye', { act: 'rprev', cls: 'btn-sm' }) : '');
      B += blk('snapshot', L('CREATE SNAPSHOT (§76)', 'CREATE SNAPSHOT (§76)'), !!r.snap, r.snap ? lnk('CUT-004', r.snap, mono2(r.snap)) + ' ' + t(L('— baseline yang bisa dipulihkan.', '— recoverable baseline.')) : t(L('Wajib sebelum persetujuan dan eksekusi.', 'Required before approval and execution.')),
        si === 4 && canDesk('go.snapshot') ? A.btn('primary', L('CREATE SNAPSHOT', 'CREATE SNAPSHOT'), 'database', { act: 'rsnap', cls: 'btn-sm' }) : '');
      var appr = r.needs.map(function (k) {
        var a = r.approvals.filter(function (x) { return x.role === k; })[0], mine = k === 'owner' ? can('go.reset.approve') : can('go.fin.approve') && !can('go.reset.approve');
        var b = !a && si === 5 && mine && d ? (r.by === uid ? '<small class="sub5">' + t(L('Anda pengaju — tidak bisa menyetujui sendiri', 'You requested it — you cannot approve it yourself')) + '</small>' : A.btn('primary', k === 'owner' ? L('Setujui sebagai Owner', 'Approve as Owner') : L('Setujui sebagai Finance', 'Approve as Finance'), 'checkc', { act: 'rappr', cls: 'btn-sm' })) : '';
        return '<li class="go12-ap' + (a ? ' go12-ap-ok' : '') + '">' + tick(!!a, !a) + '<span><b>' + t(k === 'owner' ? L('Disetujui oleh Owner', 'Approved by Owner') : L('Disetujui oleh Finance', 'Approved by Finance')) + '</b><small>' + (a ? esc(uname(a.uid)) + ' · ' + when(a.at) : si >= 5 ? t(L('menunggu persetujuan', 'waiting for approval')) : '—') + '</small></span>' + b + '</li>';
      }).join('');
      B += blk('approved', L('Dual approval (§80)', 'Dual approval (§80)'), si >= 6, '<ul class="go12-aps"><li class="go12-ap go12-ap-ok">' + tick(true) + '<span><b>' + t(L('Diminta oleh', 'Requested by')) + '</b><small>' + esc(r.requesterName) + ' · ' + when(r.at) + '</small></span></li>' + appr + '</ul>', '');
      B += blk('executed', L('Eksekusi', 'Execute'), si >= 7, r.execAt ? t(L(n0(r.count) + ' record di-' + (r.action === 'delete' ? 'hapus' : 'soft erase') + ' oleh ', n0(r.count) + ' records ' + (r.action === 'delete' ? 'deleted' : 'soft-erased') + ' by ')) + esc(uname(r.execBy)) + ' · ' + when(r.execAt) : t(L('Hanya setelah preview, snapshot dan persetujuan lengkap. Data engine pemilik tidak diubah (soft erase di JFGO).', 'Only after preview, snapshot and full approval. Owner engine data is not changed (soft erase in JFGO).')),
        si === 6 && canDesk('go.reset.execute') ? A.btn('danger', L('EKSEKUSI RESET', 'EXECUTE RESET'), 'zap', { act: 'rexec', cls: 'btn-sm' }) : '');
      B += blk('reconciled', L('Rekonsiliasi', 'Reconcile'), si >= 8, r.recon ? t(L('Orphan ' + r.recon.orphans.length + ' · diarsip ' + r.recon.erased + ' / preview ' + r.recon.expected, 'Orphans ' + r.recon.orphans.length + ' · erased ' + r.recon.erased + ' / preview ' + r.recon.expected)) + ' ' + (r.recon.ok ? A.chip('ok', L('Cocok', 'Match'), 'checkc') : A.chip('crit', L('Tidak cocok', 'Mismatch'), 'alert')) : '',
        si === 7 && (canDesk('go.reset.execute') || canDesk('go.reset.request')) ? A.btn('ghost', L('Rekonsiliasi', 'Reconcile'), 'scale', { act: 'rrecon', cls: 'btn-sm' }) : '');
      B += blk('ready', L('Siap produksi', 'Ready for production'), r.st === 'ready', r.st === 'ready' ? t(L('Reset selesai. Restore tersedia di Riwayat Reset selama masa retensi.', 'Reset complete. Restore is available in Reset History within retention.')) : '',
        si === 8 && (canDesk('go.reset.execute') || canDesk('go.reset.request')) ? A.btn('primary', L('Tandai siap produksi', 'Mark ready for production'), 'flag', { act: 'rready', cls: 'btn-sm' }) : '');
      var flow = card(L('Reset workflow (§77)', 'Reset workflow (§77)'), '<ol class="go12-sbl">' + B + '</ol>' + (!pre && si < 7 ? note(t(L('Scope terkunci setelah snapshot. Untuk mengubah, buat permintaan reset baru.', 'The scope is locked after the snapshot. To change it, create a new reset request.')), 'lock', 'info') : ''), { icon: 'route' });
      var log = card(L('Log', 'Log'), '<ol class="go12-tl">' + r.log.slice(0, 14).map(function (l) { return '<li><b>' + esc(l.step) + '</b><span>' + when(l.at) + ' · ' + esc(uname(l.by)) + '</span>' + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</li>'; }).join('') + '</ol>', { icon: 'history' });
      var others = all.filter(function (x) { return x.id !== r.id; }).slice(0, 6);
      var oth = others.length ? card(L('Reset lain', 'Other resets'), '<div class="rls">' + others.map(function (x) { return A.rowLink({ href: href('CUT-003', x.id), icon: 'refresh', t: esc(x.id) + ' · ' + t(x.modeN), s: esc(x.requesterName), chip: rstC(x) }); }).join('') + '</div>', { icon: 'list' }) : '';
      return head(t(L('Setiap reset: mode → cut-off → scope → dependency check → preview → snapshot → persetujuan → eksekusi → rekonsiliasi → siap produksi.', 'Every reset: mode → cut-off → scope → dependency check → preview → snapshot → approval → execute → reconcile → ready for production.')), A.backBtn('ghost')) +
        deskNote(L('Reset hanya bisa dijalankan dan disetujui di desktop/iPad (§113). Di ponsel hanya status dan preview.', 'Resets can only be run and approved on desktop/iPad (§113). On a phone only the status and preview are shown.')) + hero +
        '<div class="g21-10 go12-g"><div class="col10">' + flow + previewBlock(r.preview, r) + '</div><div class="col10">' + log + oth + '</div></div>';
    },
    act: {
      rcut: function () {
        var id = A.S.rec || (G.resets(cx())[0] || {}).id, co = G.cutoff(cx());
        act({ title: L('Cut-off untuk ' + id, 'Cut-off for ' + id), icon: 'calendar', ok: L('Simpan', 'Save'), reason: false,
          body: fld(L('Cut-off (YYYY-MM-DD HH:MM)', 'Cut-off (YYYY-MM-DD HH:MM)'), inp('at', co && co.at, { ph: L('2026-10-31 23:59') }), { req: true, wide: true }),
          fn: function (v) { return G.setResetCutoff(cx(), id, { at: v.at, device: dev() }); }, done: L('Cut-off reset diatur.', 'Reset cut-off set.') });
      },
      rscope: function () {
        var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.reset(cx(), id), sc = (r && r.scope) || {}, CM = window.JFCOMM;
        var cls = CM && CM.clients ? CM.clients().map(function (x) { return [x.id, L(x.n)]; }) : [];
        act({ title: L('Scope reset ' + id + ' (§73)', 'Reset scope ' + id + ' (§73)'), icon: 'filter', ok: L('Simpan scope', 'Save scope'), reason: false,
          sub: t(L('Kosongkan untuk semua. Mengubah scope menghapus dependency check & preview sebelumnya.', 'Leave empty for all. Changing the scope clears the previous dependency check & preview.')),
          body: fld(L('Modul', 'Modules'), checks('mods', SCOPE_MODS.map(function (m) { return [m, G.MODS[m].n]; }), sc.mods || []), { wide: true }) +
            '<div class="go12-fg">' + fld(L('Dari tanggal', 'From date'), inp('from', sc.from, { type: 'date' })) + fld(L('Sampai tanggal', 'To date'), inp('to', sc.to, { type: 'date' })) + fld(L('Bulan', 'Month'), inp('month', sc.month, { type: 'month' })) +
            fld(L('Klien', 'Client'), sel('cl', [['', L('Semua', 'All')]].concat(cls), sc.cl)) + fld(L('Sumber data', 'Data source'), sel('source', [['', L('Sesuai mode', 'Per mode')]].concat(Object.keys(G.CLASSES).map(function (k) { return [k, G.CLASSES[k]]; })), sc.source)) +
            fld(L('Environment', 'Environment'), sel('env', [['', L('Semua', 'All')], ['UAT', 'UAT'], ['PRD', 'PRD']], sc.env)) + '</div>',
          fn: function (v) { var s = {}; if (v.mods && v.mods.length) s.mods = v.mods; ['from', 'to', 'month', 'cl', 'source', 'env'].forEach(function (k) { if (v[k]) s[k] = v[k]; }); return G.setResetScope(cx(), id, s, { device: dev() }); }, done: L('Scope disimpan.', 'Scope saved.') });
      },
      rdeps: function () { var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.dependencyCheck(cx(), id, { device: dev() }); if (!r.ok) return fail(r); P.after(L('Dependency check: ' + r.deps.targets + ' record, ' + r.deps.chains + ' rantai, orphan 0.', 'Dependency check: ' + r.deps.targets + ' records, ' + r.deps.chains + ' chains, 0 orphans.')); },
      rprev: function () { var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.previewReset(cx(), id, { device: dev() }); if (!r.ok) return fail(r); P.after(L('Preview siap: ' + r.preview.archive.count + ' diarsip, ' + r.preview.del.count + ' dihapus, ' + r.preview.retain.count + ' dipertahankan.', 'Preview ready: ' + r.preview.archive.count + ' archived, ' + r.preview.del.count + ' deleted, ' + r.preview.retain.count + ' retained.')); },
      rsnap: function () {
        var id = A.S.rec || (G.resets(cx())[0] || {}).id;
        act({ title: L('CREATE SNAPSHOT untuk ' + id, 'CREATE SNAPSHOT for ' + id), icon: 'database', ok: L('Buat snapshot', 'Create snapshot'),
          sub: t(L('Menyimpan salinan seluruh state engine + checksum sebagai baseline yang bisa dipulihkan, lalu reset menunggu persetujuan.', 'Stores a copy of every engine state + checksum as a recoverable baseline; the reset then waits for approval.')),
          fn: function (v) { return G.createSnapshot(cx(), { reason: v.reason, reset: id }); }, done: function (r) { return L(r.snapshot.id + ' dibuat · checksum ' + r.snapshot.checksum + '.', r.snapshot.id + ' created · checksum ' + r.snapshot.checksum + '.'); } });
      },
      rappr: function () {
        var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.reset(cx(), id), pv = r.preview;
        act({ title: L('Setujui reset ' + id, 'Approve reset ' + id), icon: 'checkc', ok: L('Setujui reset', 'Approve reset'),
          sub: t(L(T(r.modeN) + ' · ' + T(r.actionN) + ': ' + pv.archive.count + ' diarsip, ' + pv.del.count + ' dihapus permanen, ' + pv.retain.count + ' dipertahankan, ' + pv.recoverable + ' bisa dipulihkan. Snapshot ' + r.snap + '. Diminta oleh ' + r.requesterName + '.', r.modeN[1] + ' · ' + r.actionN[1] + ': ' + pv.archive.count + ' archived, ' + pv.del.count + ' permanently deleted, ' + pv.retain.count + ' retained, ' + pv.recoverable + ' recoverable. Snapshot ' + r.snap + '. Requested by ' + r.requesterName + '.')),
          fn: function (v) { return G.approveReset(cx(), id, v.reason, { device: dev() }); }, done: function (x) { return x.approved ? L('Reset disetujui penuh — siap dieksekusi.', 'Reset fully approved — ready to execute.') : L('Persetujuan tercatat. Menunggu approver berikutnya.', 'Approval recorded. Waiting for the next approver.'); } });
      },
      rexec: function () {
        var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.reset(cx(), id), pv = r.preview, n = pv.archive.count + pv.del.count;
        act({ title: L('EKSEKUSI RESET ' + id, 'EXECUTE RESET ' + id), icon: 'zap', ok: L('Eksekusi sekarang', 'Execute now'), reason: false, check: 'ack',
          sub: t(L(n + ' record akan di-' + (r.action === 'delete' ? 'HAPUS PERMANEN (tidak bisa dipulihkan)' : 'soft erase (bisa dipulihkan ' + G.RETENTION_DAYS + ' hari)') + ' sesuai preview. ' + pv.retain.count + ' record dipertahankan. Baseline: ' + r.snap + '. Bila data berubah sejak preview, engine menolak.', n + ' records will be ' + (r.action === 'delete' ? 'PERMANENTLY DELETED (never recoverable)' : 'soft-erased (recoverable for ' + G.RETENTION_DAYS + ' days)') + ' as previewed. ' + pv.retain.count + ' records are retained. Baseline: ' + r.snap + '. If data changed since the preview the engine refuses.')),
          body: '<label class="go12-cb"><input type="checkbox" name="ack"><span>' + t(L('Saya sudah memeriksa preview dan dependensinya.', 'I have checked the preview and its dependencies.')) + '</span></label>',
          fn: function () { return G.executeReset(cx(), id, { device: dev() }); }, done: function (x) { return L(x.count + ' record diproses (RESET_EXECUTED). Lanjutkan rekonsiliasi.', x.count + ' records processed (RESET_EXECUTED). Continue with reconciliation.'); } });
      },
      rrecon: function () { var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.reconcileReset(cx(), id); if (!r.ok) return fail(r); P.after(L('Rekonsiliasi reset cocok — tanpa orphan.', 'Reset reconciliation matches — no orphans.')); },
      rready: function () { var id = A.S.rec || (G.resets(cx())[0] || {}).id, r = G.markResetReady(cx(), id); if (!r.ok) return fail(r); P.after(L(id + ' siap produksi.', id + ' ready for production.')); }
    }
  };

  /* ---------- CUT-004 Snapshot ---------- */
  V['CUT-004'] = {
    render: function (c) {
      var c0 = cx(), list = G.snapshots(c0); if (!can('go.cut.view') && !can('go.snapshot')) return noAccess();
      var cur = c.rec ? G.snapshot(c0, c.rec) : list[0], live = G.isLive(), irr = G.irreversible();
      var k = P.kpis([
        { k: L('Snapshot', 'Snapshots'), v: list.length, icon: 'database' },
        { k: L('Terbaru', 'Latest'), v: list[0] ? esc(list[0].id) : '—', s: list[0] ? t(L(list[0].ageDays + ' hari lalu', list[0].ageDays + ' days ago')) : t(L('belum ada', 'none yet')), icon: 'clock', tone: list[0] && list[0].ageDays <= 7 ? 'ok' : 'warn' },
        { k: L('Terverifikasi', 'Verified'), v: list.filter(function (s) { return s.verified && s.verified.ok; }).length, s: t(L('round trip checksum', 'checksum round trip')), icon: 'checkc' },
        { k: L('Kejadian tak terbatalkan', 'Irreversible events'), v: irr.length, s: t(L('pembayaran / POD sejak produksi', 'payments / PODs since production')), icon: 'lock', tone: irr.length ? 'warn' : null }
      ], 'go12-k8');
      var tbl = P.table(list, [
        { h: L('Snapshot', 'Snapshot'), v: function (s) { return lnk('CUT-004', s.id, mono2(s.id)) + '<small class="sub5">' + when(s.at) + '</small>'; } },
        { h: L('Dibuat oleh', 'Created by'), v: function (s) { return esc(uname(s.by)) + '<small class="sub5">' + esc(s.reason) + '</small>'; } },
        { h: L('Checksum', 'Checksum'), v: function (s) { return mono2(s.checksum) + '<small class="sub5">' + kb(s.size) + ' · ' + s.engines.length + ' engine</small>'; } },
        { h: L('Reset', 'Reset'), v: function (s) { return s.reset ? lnk('CUT-003', s.reset, mono2(s.reset)) : '—'; } },
        { h: L('Verifikasi', 'Verification'), v: function (s) { return s.verified ? (s.verified.ok ? A.chip('ok', L('Cocok', 'Match'), 'checkc') : A.chip('crit', L('Gagal', 'Failed'), 'alert')) : A.chip('mute', L('Belum', 'Not yet')); } },
        { h: '', v: function (s) { return '<span class="go12-ra">' + (can('go.snapshot') || can('go.cut.view') ? A.btn('ghost', L('Verifikasi', 'Verify'), 'refresh', { act: 'verify', val: s.id, cls: 'btn-sm' }) : '') + (canDesk('go.reset.approve') ? A.btn('ghost', L('Rollback', 'Rollback'), 'history', { act: 'rollback', val: s.id, cls: 'btn-sm' }) : '') + '</span>'; } }
      ], function (s) { return { t: esc(s.id) + ' · ' + esc(s.at), r: mono2(s.checksum), s: esc(uname(s.by)) + ' · ' + esc(s.reason), chip: s.verified && s.verified.ok ? A.chip('ok', L('Cocok', 'Match')) : '' }; }, null, { empty: L('Belum ada snapshot.', 'No snapshot yet.') });
      var det = cur ? card(cat(L('Isi ', 'Contents '), cur.id), kv([[L('Dibuat', 'Created'), when(cur.at) + ' · ' + esc(uname(cur.by))], [L('Alasan', 'Reason'), esc(cur.reason)], [L('Checksum', 'Checksum'), mono2(cur.checksum)], [L('Ukuran', 'Size'), kb(cur.size)], [L('Isi tersimpan di perangkat ini', 'Payload on this device'), cur.payload ? A.chip('ok', L('Ya', 'Yes')) : A.chip('warn', L('Hanya metadata', 'Metadata only'))]]) +
        '<div class="tblw"><table class="tbl dense"><thead><tr><th>' + t(L('Engine', 'Engine')) + '</th><th class="r">' + t(L('Record', 'Records')) + '</th></tr></thead><tbody>' + Object.keys(cur.counts).map(function (e) { return '<tr><td>' + t(OWNER[e] || L2(e)) + '</td><td class="r num">' + n0(cur.counts[e]) + '</td></tr>'; }).join('') + '</tbody></table></div>', { icon: 'database' }) : '';
      var rb = card(L('Rollback terkendali (§84)', 'Controlled rollback (§84)'), note(t(L('Rollback mengembalikan status reset (soft erase) ke kondisi snapshot. Data engine pemilik tidak pernah diubah. Ditolak setelah kejadian nyata yang tidak bisa dibatalkan (pembayaran, POD).', 'Rollback returns the reset (soft erase) state to the snapshot. Owner engine data is never changed. Refused after irreversible real-world events (payments, PODs).')), 'history', irr.length ? 'warn' : 'info') +
        (irr.length ? '<ul class="go12-rl">' + irr.slice(0, 6).map(function (e) { return '<li>' + mono2(e.id) + '<span>' + esc(e.mod) + ' · ' + when(e.at) + '</span></li>'; }).join('') + '</ul>' : ''), { icon: 'history' });
      return head(t(L('Sebelum reset besar: CREATE SNAPSHOT. Snapshot menyimpan baseline yang bisa dipulihkan dan diverifikasi dengan checksum (§76).', 'Before a major reset: CREATE SNAPSHOT. A snapshot stores a recoverable baseline verified by checksum (§76).')),
        canDesk('go.snapshot') ? A.btn('primary', L('CREATE SNAPSHOT', 'CREATE SNAPSHOT'), 'database', { act: 'snapnew' }) : '', L('state semua engine', 'every engine state')) +
        deskNote() + k + '<div class="g21-10 go12-g">' + card(L('Daftar snapshot', 'Snapshots'), tbl, { icon: 'list', count: list.length }) + '<div class="col10">' + det + rb + '</div></div>';
    },
    act: {
      snapnew: function () {
        act({ title: L('CREATE SNAPSHOT', 'CREATE SNAPSHOT'), icon: 'database', ok: L('Buat snapshot', 'Create snapshot'), sub: t(L('Salinan seluruh state engine + checksum. Tidak mengubah data apa pun.', 'A copy of every engine state + checksum. Changes no data.')),
          fn: function (v) { return G.createSnapshot(cx(), { reason: v.reason }); }, done: function (r) { return L(r.snapshot.id + ' dibuat (SNAPSHOT_CREATED).', r.snapshot.id + ' created (SNAPSHOT_CREATED).'); } });
      },
      verify: function (el) {
        var r = G.verifySnapshot(cx(), el.getAttribute('data-val')); if (!r.ok) return fail(r);
        P.after(r.match ? L('Checksum & jumlah record cocok (' + r.ms + ' ms).', 'Checksum & record counts match (' + r.ms + ' ms).') : cat(L('Verifikasi gagal: ', 'Verification failed: '), r.why || L('checksum tidak cocok', 'checksum mismatch')), r.match ? 'ok' : 'crit');
      },
      rollback: function (el) {
        var id = el.getAttribute('data-val'), s = G.snapshot(cx(), id);
        act({ title: L('Rollback ke ' + id, 'Roll back to ' + id), icon: 'history', ok: L('Rollback', 'Roll back'), confirm: 'ROLLBACK',
          sub: t(L('Status reset dikembalikan ke kondisi ' + id + ' (' + s.at + '). Reset yang dieksekusi setelahnya menjadi “di-rollback”. Ditolak bila sudah ada pembayaran atau POD nyata setelah production start.', 'The reset state returns to ' + id + ' (' + s.at + '). Resets executed after it become “rolled back”. Refused when real payments or PODs exist after production start.')),
          fn: function (v) { return G.rollback(cx(), id, { reason: v.reason, device: dev() }); }, done: L('Rollback selesai (ROLLBACK_EXECUTED).', 'Rollback complete (ROLLBACK_EXECUTED).') });
      }
    }
  };

  /* ---------- CUT-005 Reset History ---------- */
  V['CUT-005'] = {
    render: function (c) {
      var c0 = cx(), rs = G.resets(c0); if (!can('go.cut.view')) return noAccess();
      var cur = c.rec ? G.reset(c0, c.rec) : null;
      var tbl = P.table(rs, [
        { h: L('Reset batch', 'Reset batch'), v: function (r) { return lnk('CUT-005', r.id, mono2(r.id)) + '<small class="sub5">' + when(r.at) + '</small>'; } },
        { h: L('Mode', 'Mode'), v: function (r) { return '<b>' + t(r.modeN) + '</b><small class="sub5">' + t(r.actionN) + '</small>'; } },
        { h: L('Diminta / dieksekusi', 'Requested / executed'), v: function (r) { return esc(r.requesterName) + '<small class="sub5">' + (r.execBy ? esc(uname(r.execBy)) + ' · ' + when(r.execAt) : '—') + '</small>'; } },
        { h: L('Record', 'Records'), cls: 'r num', v: function (r) { return n0(r.count); } },
        { h: L('Dipulihkan', 'Restored'), cls: 'r num', v: function (r) { return n0(r.restored.length); } },
        { h: L('Status', 'Status'), v: function (r) { return rstC(r) + (r.canRestore ? ' ' + A.chip('info', L('Bisa restore', 'Restorable'), 'refresh') : ''); } }
      ], function (r) { return { t: esc(r.id) + ' · ' + t(r.modeN), r: n0(r.count), s: esc(r.requesterName) + ' · ' + when(r.at), chip: rstC(r) }; }, function (r) { return href('CUT-005', r.id); }, { empty: L('Belum ada riwayat reset.', 'No reset history yet.') });
      var det = '';
      if (cur) {
        var er = G.erasedList(c0, { rsb: cur.id, all: true }), open = er.filter(function (e) { return !e.restored; }), canR = cur.canRestore && canDesk('go.reset.execute');
        det = card(cat(L('Isi ', 'Contents '), cur.id), kv([[L('Mode', 'Mode'), t(cur.modeN) + ' · ' + t(cur.actionN)], [L('Alasan', 'Reason'), esc(cur.reason)], [L('Snapshot', 'Snapshot'), cur.snap ? lnk('CUT-004', cur.snap, mono2(cur.snap)) : '—'], [L('Retensi', 'Retention'), t(L(G.RETENTION_DAYS + ' hari sejak eksekusi', G.RETENTION_DAYS + ' days from execution'))]]) +
          (er.length ? (canR ? '<div class="go12-ac-f">' + A.btn('ghost', L('Restore terpilih', 'Restore selected'), 'refresh', { act: 'rsel' }) + A.btn('primary', L('Restore semua', 'Restore all'), 'refresh', { act: 'rall' }) + '</div>' : '') +
            '<div class="tblw go12-er"><table class="tbl dense"><thead><tr>' + (canR ? '<th><span class="sr">' + t(L('Pilih', 'Pick')) + '</span></th>' : '') + '<th>' + t(L('Record', 'Record')) + '</th><th>' + t(L('Modul', 'Module')) + '</th><th>' + t(L('Klasifikasi', 'Class')) + '</th><th>' + t(L('Status asli', 'Original status')) + '</th><th>' + t(L('Status', 'Status')) + '</th></tr></thead><tbody>' +
            er.slice(0, 120).map(function (e) { return '<tr>' + (canR ? '<td>' + (e.restored ? '' : '<input type="checkbox" class="go12-pick1" value="' + esc(e.id) + '" aria-label="' + esc(e.id) + '">') + '</td>' : '') + '<td>' + mono2(e.id) + '</td><td>' + modN(e.mod) + '</td><td>' + clsC(e.cls) + '</td><td>' + esc(e.orig || '—') + '</td><td>' + (e.restored ? A.chip('ok', L('Dipulihkan', 'Restored'), 'checkc') : A.chip(e.kind === 'deleted' ? 'crit' : 'info', e.kind === 'deleted' ? L('Dihapus', 'Deleted') : e.kind === 'archived' ? L('Diarsip', 'Archived') : L('Soft erase', 'Soft erased'))) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
            (er.length > 120 ? '<p class="go12-cap">' + t(L('Menampilkan 120 dari ' + er.length + '.', 'Showing 120 of ' + er.length + '.')) + '</p>' : '') + '<p class="go12-cap">' + t(L(open.length + ' masih diarsip. Restore satu record ikut memulihkan seluruh rantainya.', open.length + ' still erased. Restoring one record brings back its whole chain.')) + '</p>'
            : A.empty(L('Reset ini belum dieksekusi.', 'This reset is not executed yet.'))) +
          (!cur.canRestore && er.length ? note(t(cur.action === 'delete' ? L('Data yang dihapus permanen tidak bisa di-restore.', 'Permanently deleted records cannot be restored.') : G.isLive() ? L('Setelah Production Start, data dummy tidak dikembalikan ke data operasional.', 'After Production Start dummy data is not brought back into operations.') : L('Restore tidak tersedia untuk reset ini.', 'Restore is not available for this reset.')), 'lock', 'info') : ''), { icon: 'history' });
      }
      return head(t(L('View Reset, Restore Selected, Restore All sesuai kebijakan retensi (§72). Soft erase mencatat batch, tanggal, pelaku, alasan dan status asli (§71).', 'View Reset, Restore Selected, Restore All per the retention policy (§72). Soft erase records the batch, date, actor, reason and original status (§71).')), '', L('JFGO soft erase', 'JFGO soft erase')) +
        deskNote() + (cur ? '<div class="g2-10 go12-g">' + card(L('Riwayat reset', 'Reset history'), tbl, { icon: 'list', count: rs.length }) + det + '</div>' : card(L('Riwayat reset', 'Reset history'), tbl, { icon: 'list', count: rs.length }));
    },
    act: {
      rsel: function () {
        var id = A.S.rec, ids = Array.prototype.map.call(document.querySelectorAll('.go12-pick1:checked'), function (x) { return x.value; });
        if (!ids.length) return A.toast(L('Pilih minimal satu record.', 'Pick at least one record.'), 'warn');
        act({ title: L('Restore ' + ids.length + ' record', 'Restore ' + ids.length + ' records'), icon: 'refresh', ok: L('Restore', 'Restore'), sub: t(L('Record terpilih beserta seluruh rantainya (order → produksi → delivery → invoice …) dipulihkan.', 'The picked records and their whole chains (order → production → delivery → invoice …) are restored.')) + ' <span class="go12-ids">' + ids.slice(0, 8).map(mono2).join(' ') + '</span>',
          fn: function (v) { return G.restoreReset(cx(), id, { ids: ids, reason: v.reason, device: dev() }); }, done: function (r) { return L(r.restored + ' record dipulihkan (RESTORE_EXECUTED).', r.restored + ' records restored (RESTORE_EXECUTED).'); } });
      },
      rall: function () {
        var id = A.S.rec, n = G.erasedList(cx(), { rsb: id }).length;
        act({ title: L('Restore semua ' + id, 'Restore all ' + id), icon: 'refresh', ok: L('Restore semua', 'Restore all'), sub: t(L(n + ' record dari ' + id + ' dikembalikan ke data aktif.', n + ' records of ' + id + ' return to active data.')),
          fn: function (v) { return G.restoreReset(cx(), id, { all: true, reason: v.reason, device: dev() }); }, done: function (r) { return L(r.restored + ' record dipulihkan.', r.restored + ' records restored.'); } });
      }
    }
  };

  /* ---------- CUT-006 Cut-Off ---------- */
  V['CUT-006'] = {
    render: function () {
      var co = G.cutoff(cx()); if (!co) return noAccess();
      var live = G.isLive(), ps = G.productionStart(), man = canDesk('go.cutoff.manage') && !live;
      var main = card(L('Cut-off & production start (§75)', 'Cut-off & production start (§75)'), bigBox([{ k: L('Cut-off', 'Cut-off'), v: esc(co.at), s: t(co.kind === 'monthly' ? L('Cut-off bulanan ' + co.month, 'Monthly cut-off ' + co.month) : L('Cut-off tanggal', 'Date cut-off')) },
        { k: L('Production start', 'Production start'), v: esc(co.start), tn: 'info' }, { k: L('Status', 'Status'), v: co.st === 'set' ? t(L('Ditetapkan', 'Set')) : t(L('Draft', 'Draft')), tn: co.st === 'set' ? 'ok' : 'warn', s: co.by ? esc(uname(co.by)) + ' · ' + when(co.setAt) : t(L('belum ditetapkan', 'not set yet')) }]) +
        (co.reason ? '<p class="go12-ln">' + t(L('Alasan: ', 'Reason: ')) + esc(co.reason) + '</p>' : '') +
        (live ? note(t(L('Cut-off terkunci: produksi dimulai ', 'Cut-off locked: production started ')) + esc(ps.date) + '.', 'lock', 'info') : man ? '<div class="go12-ac-f">' + A.btn('primary', L('Tetapkan cut-off tanggal', 'Set date cut-off'), 'calendar', { act: 'codate' }) + A.btn('ghost', L('Cut-off bulanan', 'Monthly cut-off'), 'calendar', { act: 'comonth' }) + '</div>' : ''), { icon: 'calendar' });
      var ex = card(L('Contoh (§75)', 'Example (§75)'), kv([[L('Cut-off', 'Cut-off'), '31 Oct 2026 23:59'], [L('Production start', 'Production start'), '1 Nov 2026 00:00']]) + note(t(L('Data sebelum cut-off bisa dibersihkan dengan mode “Reset berdasarkan cut-off”. Mulai production start, transaksi baru dihitung REAL.', 'Data before the cut-off can be cleaned with the “Reset by cut-off” mode. From production start, new transactions count as REAL.')), 'info', 'info'), { icon: 'info' });
      return head(t(L('Satu batas waktu untuk semua modul: sebelum cut-off adalah masa uji/migrasi, sesudah production start adalah data produksi nyata.', 'One time boundary for every module: before the cut-off is test/migration time, after production start is real production data.')), '', L('JFGO COF-001', 'JFGO COF-001')) + deskNote() + '<div class="g21-10 go12-g">' + main + ex + '</div>';
    },
    act: {
      codate: function () {
        var co = G.cutoff(cx());
        act({ title: L('Tetapkan cut-off tanggal', 'Set the date cut-off'), icon: 'calendar', ok: L('Tetapkan', 'Set'), sub: t(L('Production start harus setelah cut-off. Dicatat sebagai CUTOFF_SET.', 'Production start must be after the cut-off. Recorded as CUTOFF_SET.')),
          body: '<div class="go12-fg">' + fld(L('Cut-off (YYYY-MM-DD HH:MM)', 'Cut-off (YYYY-MM-DD HH:MM)'), inp('at', co.at, { ph: L('2026-10-31 23:59') }), { req: true }) + fld(L('Production start (YYYY-MM-DD HH:MM)', 'Production start (YYYY-MM-DD HH:MM)'), inp('start', co.start, { ph: L('2026-11-01 00:00') }), { req: true }) + '</div>',
          fn: function (v) { return G.setCutoff(cx(), { kind: 'date', at: v.at, start: v.start, reason: v.reason }); }, done: L('Cut-off ditetapkan.', 'Cut-off set.') });
      },
      comonth: function () {
        var co = G.cutoff(cx());
        act({ title: L('Cut-off bulanan', 'Monthly cut-off'), icon: 'calendar', ok: L('Tetapkan', 'Set'), sub: t(L('Cut-off = hari terakhir bulan 23:59, production start = tanggal 1 bulan berikutnya 00:00.', 'Cut-off = last day of the month 23:59, production start = the 1st of the next month 00:00.')),
          body: fld(L('Bulan', 'Month'), inp('month', co.month || String(co.at).slice(0, 7), { type: 'month' }), { req: true, wide: true }),
          fn: function (v) { return G.setCutoff(cx(), { kind: 'monthly', month: v.month, reason: v.reason }); }, done: L('Cut-off bulanan ditetapkan.', 'Monthly cut-off set.') });
      }
    }
  };

  /* ---------- CUT-007 Production Start ---------- */
  var START_S = { snapshot: 'CUT-004', dummy: 'CUT-002', master: 'DATA-001', inventory: 'MIG-003', ar: 'MIG-003', ap: 'MIG-003', cashbank: 'MIG-003', users: 'ADM-001', roles: 'ADM-003', migration: 'MIG-001', audit: 'SEC-002', cutoff: 'CUT-006', decision: 'LIVE-004', gates: 'LIVE-004' };
  var EFFECTS = [L('Penomoran live dimulai', 'Live numbering begins'), L('KPI mulai dihitung', 'KPI begins'), L('Pelaporan produksi dimulai', 'Production reporting begins'), L('Pelaporan keuangan dimulai', 'Financial reporting begins'), L('Data uji dikeluarkan dari laporan operasional', 'Test data excluded from operational reporting')];
  V['CUT-007'] = {
    render: function () {
      var c0 = cx(); if (!can('go.cut.view')) return noAccess();
      var chk = G.startCheck(c0), ps = chk.started, co = G.cutoff(c0), dec = G.lastDecision();
      var hero = P8.hero({ id: 'PRODUCTION_START_DATE', icon: 'flag', title: ps ? t(L('JFRESH OS LIVE', 'JFRESH OS LIVE')) : t(L('Production Start', 'Production Start')), sub: ps ? t(L('Dimulai ', 'Started ')) + esc(ps.date) + ' · ' + esc(ps.byName) : t(L('Rencana: ', 'Planned: ')) + esc(co ? co.start : '—'),
        chips: ps ? A.chip('ok', L('LIVE', 'LIVE'), 'checkc') : A.chip('warn', L('PRE-GO-LIVE', 'PRE-GO-LIVE'), 'clock'),
        facts: ps ? [[L('Tanggal produksi', 'Production date'), esc(ps.date)], [L('Cut-off', 'Cut-off'), esc(ps.cutoff)], [L('Keputusan', 'Decision'), esc(ps.decision) + ' · ' + n0(ps.score, 1)], [L('Versi', 'Version'), esc(ps.version)], [L('Ditekan pada', 'Pressed at'), when(ps.at)]]
          : [[L('Syarat lulus', 'Requirements passed'), (chk.items.length - chk.failed.length) + '/' + chk.items.length, chk.ok ? 'go12-ok' : 'go12-e'], [L('Cut-off', 'Cut-off'), co ? esc(co.at) : '—'], [L('Keputusan Go/No-Go', 'Go/No-Go decision'), dec ? esc(dec.decision) : t(L('belum ada', 'none yet'))]] });
      var list = card(L('Hard requirement (§82)', 'Hard requirements (§82)'), '<ul class="go12-ck">' + chk.items.map(function (i) { return '<li class="go12-ck-' + (i.ok ? 'pass' : 'fail') + '">' + tick(i.ok) + '<span><b>' + t(i.n) + '</b></span>' + (START_S[i.k] ? lnk(START_S[i.k], null, ic('chevr')) : '') + '</li>'; }).join('') + '</ul>', { icon: 'checkc', count: (chk.items.length - chk.failed.length) + '/' + chk.items.length });
      var eff = card(L('Mulai saat START PRODUCTION (§83)', 'From START PRODUCTION on (§83)'), '<ul class="go12-ck">' + EFFECTS.map(function (e) { return '<li class="go12-ck-' + (ps ? 'pass' : 'warn') + '">' + tick(!!ps, !ps) + '<span><b>' + t(e) + '</b></span></li>'; }).join('') + '</ul>' + note(t(L('PRODUCTION_START_DATE tidak bisa diubah setelah ditetapkan.', 'PRODUCTION_START_DATE can never be changed once set.')), 'lock', 'info'), { icon: 'flag' });
      var dc = card(L('Keputusan Go/No-Go', 'Go/No-Go decision'), dec ? kv([[L('Keputusan', 'Decision'), A.chip(dec.decision === 'NO-GO' ? 'crit' : dec.decision === 'GO' ? 'ok' : 'warn', L2(dec.decision))], [L('Oleh', 'By'), esc(dec.byName) + ' · ' + when(dec.at)], [L('Skor readiness', 'Readiness score'), n0(dec.score, 1)], [L('Alasan', 'Reason'), esc(dec.reason)]]) : A.empty(L('Belum ada keputusan Go/No-Go.', 'No Go/No-Go decision yet.')), { icon: 'scale', link: H.open('LIVE-004') ? ['LIVE-004', L('Go/No-Go', 'Go/No-Go')] : null });
      var btn = '';
      if (!ps && can('go.start.approve')) {
        btn = mob() ? '' : chk.ok ? '<div class="go12-start">' + P8.xl('primary', L('START PRODUCTION', 'START PRODUCTION'), 'flag', { act: 'start' }) + '<p>' + t(L('Semua syarat lulus. Keputusan ini permanen.', 'All requirements pass. This decision is permanent.')) + '</p></div>'
          : '<div class="go12-start go12-start-off"><button type="button" class="btn btn-primary btn-xl" disabled aria-disabled="true">' + ic('lock') + '<span>' + t(L('START PRODUCTION', 'START PRODUCTION')) + '</span></button><p>' + t(L('Terkunci: ' + chk.failed.length + ' syarat belum lulus — ', 'Locked: ' + chk.failed.length + ' requirements not met — ')) + chk.items.filter(function (i) { return !i.ok; }).map(function (i) { return t(i.n); }).join(', ') + '</p></div>';
      } else if (!ps) btn = note(t(L('Hanya Owner (Product Owner) yang dapat menekan START PRODUCTION — keputusan manusia, bukan sistem.', 'Only the Owner (Product Owner) can press START PRODUCTION — a human decision, not the system\'s.')), 'shield', 'info');
      var after = ps ? card(L('Setelah produksi', 'After production'), kv([[L('Kejadian tak terbatalkan', 'Irreversible events'), n0(G.irreversible().length)], [L('Alasan', 'Reason'), esc(ps.reason)]]) + (H.open('LIVE-001') ? '<div class="go12-ac-f">' + A.btn('primary', L('Go-Live Command Center', 'Go-Live Command Center'), 'grid', { go: 'LIVE-001' }) + A.btn('ghost', L('Rollback terkendali', 'Controlled rollback'), 'history', { go: 'CUT-004' }) + '</div>' : ''), { icon: 'checkc' }) : '';
      return head(t(L('Penanda produksi yang immutable. START PRODUCTION hanya aktif bila semua hard requirement lulus dan keputusan Go/No-Go = GO.', 'The immutable production marker. START PRODUCTION is enabled only when every hard requirement passes and the Go/No-Go decision is GO.')), '', L('JFGO startCheck + readiness', 'JFGO startCheck + readiness')) +
        deskNote(L('START PRODUCTION tidak pernah tersedia di ponsel (§113). Buka di desktop atau iPad.', 'START PRODUCTION is never available on a phone (§113). Open it on desktop or iPad.')) + hero + btn + '<div class="g2-10 go12-g">' + (ps ? after + eff : list + '<div class="col10">' + dc + eff + '</div>') + '</div>';
    },
    act: {
      start: function () {
        var co = G.cutoff(cx()), dec = G.lastDecision(), chk = G.startCheck(cx()), names = {}; chk.items.forEach(function (i) { names[i.k] = i.n; });
        act({ title: L('START PRODUCTION', 'START PRODUCTION'), icon: 'flag', ok: L('START PRODUCTION', 'START PRODUCTION'), confirm: 'START PRODUCTION', names: names,
          sub: t(L('PRODUCTION_START_DATE = ' + co.start + ' (cut-off ' + co.at + ') berdasarkan keputusan ' + (dec ? dec.decision : '—') + '. Mulai saat ini: penomoran live, KPI, pelaporan produksi dan keuangan dimulai; data uji dikeluarkan dari laporan. Penanda ini permanen dan tidak bisa diubah.', 'PRODUCTION_START_DATE = ' + co.start + ' (cut-off ' + co.at + ') based on the ' + (dec ? dec.decision : '—') + ' decision. From now on: live numbering, KPIs, production and financial reporting begin; test data is excluded from reports. This marker is permanent and can never be changed.')),
          fn: function (v) { return G.startProduction(cx(), { reason: v.reason, device: dev() }); }, done: function (r) { return L('JFRESH OS LIVE — PRODUCTION_START_DATE ' + r.start.date + '.', 'JFRESH OS LIVE — PRODUCTION_START_DATE ' + r.start.date + '.'); } });
      }
    }
  };
})();

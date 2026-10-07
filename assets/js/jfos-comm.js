/* ==========================================================================
   JFRESH OS — Client & Commercial engine (Phase 6 · NP 1.0)
   Client groups and properties, contacts with scope, service catalog and
   client service configuration, versioned contracts, effective-dated rate
   cards, SLA rules with precedence and a live SLA clock, documents with
   versions, the commercial timeline, renewals, commercial alerts, the
   approval inbox, Client Health, profitability, growth, risk and
   opportunities.

   One engine for the app (app/screens-comm*.js), the Phase 6 pages
   (phase6/) and the automated tests (tools/test-comm.js). Every protected
   action checks a permission first (§62) and writes an audit entry (§60).
   Nothing is deleted (§61): records become inactive, archived,
   terminated or get a new version. AR comes from the Phase 5 finance
   ledger, never from a copy (§50). Prototype only: a production backend
   must repeat these rules on the server.
   ========================================================================== */
(function (root) {
  var D = root.JFCOMM_DATA || (typeof require !== 'undefined' ? require('./jfos-comm-data.js') : null);
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var M = { version: 'Phase 6 · NP 1.0', date: '2026-10-06', D: D };
  var DAY = 864e5, HOUR = 36e5, JT = 1e6;
  function r1(x) { return Math.round(x * 10) / 10; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a) { return a.reduce(function (s, x) { return s + (+x || 0); }, 0); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function by(arr, k, v) { for (var i = 0; i < arr.length; i++) if (arr[i][k] === v) return arr[i]; return null; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function T(x) { return Array.isArray(x) ? x[0] : (x == null ? '' : String(x)); }
  // 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM' → ms (UTC, so the result never depends on the device time zone)
  function ms(s) { if (typeof s === 'number') return s; var p = String(s).split(/[-: T]/); return Date.UTC(+p[0], +p[1] - 1, +p[2], +(p[3] || 0), +(p[4] || 0)); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function isoT(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  function addDays(d, n) { return iso(ms(d) + n * DAY); }
  M.TODAY = D.today;
  M.days = function (from, to) { return Math.round((ms(to) - ms(from || M.TODAY)) / DAY); };
  M.ms = ms; M.iso = iso; M.isoT = isoT; M.addDays = addDays;

  M.MSG = {
    noperm: L('Anda tidak memiliki izin untuk tindakan ini.', 'You do not have permission for this action.'),
    notfound: L('Data tidak ditemukan.', 'Record not found.'),
    invalid: L('Periksa data dan coba lagi.', 'Check the data and try again.'),
    reason: L('Alasan wajib diisi.', 'A reason is required.'),
    scope: L('Data ini berada di luar akun Anda.', 'This record is outside your account.'),
    rateSave: L('Rate Card belum berhasil disimpan. Periksa data dan coba lagi.', 'The Rate Card could not be saved. Check the data and try again.'),
    self: L('Pengaju tidak dapat menyetujui permintaannya sendiri.', 'A requester cannot approve their own request.')
  };

  /* ---------- Permissions (§62–§63) ---------- */
  M.PERMS = {
    'com.client.view': L('Lihat klien', 'View clients'), 'com.client.create': L('Buat klien', 'Create clients'), 'com.client.edit': L('Ubah klien', 'Edit clients'),
    'com.property.view': L('Lihat property', 'View properties'), 'com.property.create': L('Buat property', 'Create properties'), 'com.property.edit': L('Ubah property', 'Edit properties'),
    'com.contact.view': L('Lihat kontak klien', 'View client contacts'), 'com.contact.manage': L('Kelola kontak & peran', 'Manage contacts & roles'),
    'com.service.view': L('Lihat katalog & layanan klien', 'View catalog & client services'), 'com.service.edit': L('Atur layanan klien', 'Configure client services'),
    'com.contract.view': L('Lihat kontrak', 'View contracts'), 'com.contract.create': L('Buat kontrak', 'Create contracts'), 'com.contract.edit': L('Ubah kontrak / versi baru', 'Edit contracts / new version'), 'com.contract.approve': L('Setujui kontrak & syarat khusus', 'Approve contracts & special terms'),
    'com.rate.view': L('Lihat harga & Rate Card', 'View pricing & Rate Cards'), 'com.rate.edit': L('Ajukan perubahan Rate Card', 'Request Rate Card changes'), 'com.rate.approve': L('Setujui Rate Card & diskon', 'Approve Rate Cards & discounts'),
    'com.sla.view': L('Lihat SLA', 'View SLA'), 'com.sla.edit': L('Ubah aturan SLA', 'Edit SLA rules'), 'com.sla.approve': L('Setujui pengecualian SLA', 'Approve SLA exceptions'), 'com.sla.clock': L('Jalankan SLA clock (pause / resume)', 'Run the SLA clock (pause / resume)'),
    'com.credit.edit': L('Ajukan limit kredit & termin', 'Request credit limits & terms'), 'com.credit.approve': L('Setujui limit kredit', 'Approve credit limits'), 'com.cn.approve': L('Putuskan credit note komersial', 'Decide commercial credit notes'),
    'com.renewal.view': L('Lihat renewal', 'View renewals'), 'com.renewal.manage': L('Kelola renewal', 'Manage renewals'),
    'com.opp.view': L('Lihat opportunity', 'View opportunities'), 'com.opp.manage': L('Kelola opportunity & follow-up', 'Manage opportunities & follow-ups'),
    'com.doc.view': L('Lihat dokumen klien', 'View client documents'), 'com.doc.manage': L('Kelola dokumen klien', 'Manage client documents'),
    'com.health.view': L('Lihat Client Health', 'View Client Health'), 'com.health.adjust': L('Koreksi & bobot Client Health', 'Client Health adjustment & weights'),
    'com.margin.view': L('Lihat biaya, margin & profitabilitas', 'View cost, margin & profitability'), 'com.finance.view': L('Lihat AR, kredit & perilaku bayar klien', 'View client AR, credit & payment behaviour'),
    'com.approval.view': L('Lihat inbox persetujuan komersial', 'View the commercial approval inbox'), 'com.alert.view': L('Lihat alert komersial', 'View commercial alerts'), 'com.history.view': L('Lihat timeline komersial', 'View the commercial timeline'),
    'com.portal': L('Portal klien: layanan & kontrak sendiri', 'Client portal: own services & contracts')
  };
  var ALL6 = Object.keys(M.PERMS).filter(function (p) { return p !== 'com.portal'; });
  M.ROLE_PERMS = {
    owner: ALL6,
    // §54 Sales / Account Manager: full commercial access by permission; no approvals, no cost or margin (§63).
    sales: ['com.client.view', 'com.client.create', 'com.client.edit', 'com.property.view', 'com.property.create', 'com.property.edit', 'com.contact.view', 'com.contact.manage', 'com.service.view', 'com.service.edit',
      'com.contract.view', 'com.contract.create', 'com.contract.edit', 'com.rate.view', 'com.rate.edit', 'com.sla.view', 'com.credit.edit', 'com.renewal.view', 'com.renewal.manage', 'com.opp.view', 'com.opp.manage',
      'com.doc.view', 'com.doc.manage', 'com.health.view', 'com.finance.view', 'com.approval.view', 'com.alert.view', 'com.history.view'],
    // §54 Finance: payment terms, credit, AR, billing relationship, financial risk.
    finance: ['com.client.view', 'com.property.view', 'com.contact.view', 'com.contract.view', 'com.rate.view', 'com.credit.edit', 'com.cn.approve', 'com.finance.view', 'com.margin.view', 'com.health.view',
      'com.doc.view', 'com.approval.view', 'com.alert.view', 'com.history.view', 'com.renewal.view'],
    // §54 Operations: service, SLA, pickup schedule, instructions, operational contacts. No pricing, no margin.
    opsmgr: ['com.client.view', 'com.property.view', 'com.property.edit', 'com.contact.view', 'com.contact.manage', 'com.service.view', 'com.service.edit', 'com.sla.view', 'com.sla.edit', 'com.sla.clock', 'com.alert.view', 'com.approval.view'],
    supervisor: ['com.property.view', 'com.contact.view', 'com.service.view', 'com.sla.view', 'com.sla.clock', 'com.alert.view'],
    operator: [], driver: [], qc: [],
    client: ['com.portal']
  };
  // §63: pricing is commercial data. Remove the Phase 2 rate view from roles that must not see it.
  M.ROLE_REMOVE = { supervisor: ['com.rate.view'], opsmgr: ['com.rate.view'] };
  function can(ctx, p) { return !p || !!(ctx && ctx.perms && ctx.perms.indexOf(p) >= 0); }
  M.can = can;
  function empId(ctx) { return ctx && (ctx.employee ? ctx.employee.id : ctx.emp || ctx.uid) || 'system'; }
  M.empId = empId;

  /* ---------- Labels ---------- */
  M.CLIENT_TYPES = { personal: L('Personal', 'Personal'), hotel: L('Hotel', 'Hotel'), resort: L('Resort', 'Resort'), villa: L('Villa', 'Villa'), spa: L('Spa', 'Spa'), fnb: L('Restoran / F&B', 'Restaurant / F&B'), corporate: L('Korporat', 'Corporate'), other: L('Hospitality lain', 'Other hospitality') };
  M.CLIENT_ST = { prospect: [L('Prospek', 'Prospect'), 'info'], active: [L('Aktif', 'Active'), 'ok'], onhold: [L('Ditahan', 'On Hold'), 'warn'], inactive: [L('Tidak aktif', 'Inactive'), 'mute'], terminated: [L('Diakhiri', 'Terminated'), 'crit'] };
  M.PROP_ST = { active: [L('Aktif', 'Active'), 'ok'], onhold: [L('Ditahan', 'On Hold'), 'warn'], inactive: [L('Tidak aktif', 'Inactive'), 'mute'], closed: [L('Tutup', 'Closed'), 'crit'] };
  M.BILLING = { group: L('Tagihan ke grup', 'Billed to the group'), client: L('Tagihan ke klien', 'Billed to the client'), property: L('Tagihan per property', 'Billed per property') };
  M.CT_ROLES = [
    ['decision', L('Pengambil Keputusan', 'Decision Maker'), 'g'], ['contract', L('Kontak Kontrak', 'Contract Contact'), 'g'], ['renewal', L('Kontak Renewal', 'Renewal Contact'), 'g'], ['pricing', L('Kontak Harga', 'Pricing Contact'), 'g'],
    ['escalation', L('Eskalasi Komersial', 'Commercial Escalation'), 'g'], ['billing', L('Kontak Tagihan', 'Billing Contact'), 'f'], ['payment', L('Kontak Pembayaran', 'Payment Contact'), 'f'], ['ar', L('Kontak AR', 'AR Contact'), 'f'], ['tax', L('Kontak Pajak', 'Tax Contact'), 'f'],
    ['operational', L('Kontak Operasional', 'Operational Contact'), 'p'], ['pickup', L('Kontak Pickup', 'Pickup Contact'), 'p'], ['delivery', L('Kontak Pengiriman', 'Delivery Contact'), 'p'], ['complaint', L('Kontak Komplain', 'Complaint Contact'), 'p'],
    ['emergency', L('Kontak Darurat', 'Emergency Contact'), 'p'], ['housekeeping', L('Kontak Housekeeping', 'Housekeeping Contact'), 'p']
  ];
  M.CT_SCOPE = { all: L('Semua property', 'All properties'), sel: L('Property terpilih', 'Selected properties'), single: L('Satu property', 'Single property') };
  M.PREF = { wa: 'WhatsApp', phone: L('Telepon', 'Phone'), email: 'Email' };
  M.CTR_ST = { draft: [L('Draft', 'Draft'), 'mute'], review: [L('Review', 'Review'), 'info'], approved: [L('Disetujui', 'Approved'), 'info'], active: [L('Aktif', 'Active'), 'ok'], expiring: [L('Segera berakhir', 'Expiring'), 'warn'], expired: [L('Berakhir', 'Expired'), 'crit'], terminated: [L('Diakhiri', 'Terminated'), 'crit'], archived: [L('Versi lama', 'Superseded'), 'mute'], returned: [L('Dikembalikan', 'Returned'), 'warn'], rejected: [L('Ditolak', 'Rejected'), 'crit'] };
  M.RC_ST = { draft: [L('Draft', 'Draft'), 'mute'], review: [L('Menunggu persetujuan', 'Awaiting approval'), 'info'], scheduled: [L('Terjadwal', 'Scheduled'), 'info'], active: [L('Aktif', 'Active'), 'ok'], expiring: [L('Segera berakhir', 'Expiring'), 'warn'], expired: [L('Berakhir', 'Expired'), 'crit'], archived: [L('Versi lama', 'Superseded'), 'mute'], rejected: [L('Ditolak', 'Rejected'), 'crit'] };
  M.RENEW = { auto: L('Perpanjang otomatis', 'Auto-renew'), manual: L('Perpanjang manual', 'Manual renewal'), none: L('Tanpa perpanjangan', 'No renewal') };
  M.CYCLE = { weekly: L('Mingguan', 'Weekly'), biweekly: L('2 mingguan', 'Bi-weekly'), monthly: L('Bulanan', 'Monthly') };
  M.UNITS = { kg: L('per kg', 'per kg'), pcs: L('per pcs', 'per pcs'), item: L('per item', 'per item'), cat: L('per kategori', 'per category'), pkg: L('paket', 'package') };
  M.PRICING_MODELS = [['kg', L('Per Kg', 'Per Kg')], ['pcs', L('Per Pcs', 'Per Pcs')], ['item', L('Per Item', 'Per Item')], ['cat', L('Per Kategori', 'Per Category')], ['pkg', L('Paket', 'Package')], ['min', L('Minimum Charge', 'Minimum Charge')], ['exp', L('Express Surcharge', 'Express Surcharge')], ['spc', L('Special Treatment Charge', 'Special Treatment Charge')]];
  M.SLA_ST = { ontrack: [L('On Track', 'On Track'), 'ok'], atrisk: [L('At Risk', 'At Risk'), 'warn'], late: [L('Late', 'Late'), 'crit'], done: [L('Selesai tepat waktu', 'Completed on time'), 'ok'], donelate: [L('Selesai terlambat', 'Completed late'), 'crit'], paused: [L('Dijeda', 'Paused'), 'info'] };
  M.PRI = { high: L('Tinggi', 'High'), normal: L('Normal', 'Normal'), low: L('Rendah', 'Low') };
  M.WIN = { weekend: L('Akhir pekan', 'Weekend'), weekday: L('Hari kerja', 'Weekday'), night: L('Malam (18:00–06:00)', 'Night (18:00–06:00)') };
  M.DOC_TYPES = { contract: L('Kontrak', 'Contract'), ratecard: L('Rate Card', 'Rate Card'), sla: L('SLA', 'SLA'), proposal: L('Proposal', 'Proposal'), quotation: L('Quotation', 'Quotation'), mou: L('MoU', 'MoU'), invoiceagr: L('Perjanjian Invoice', 'Invoice Agreement'), tax: L('Dokumen Pajak', 'Tax Document'), corr: L('Korespondensi', 'Correspondence'), complaint: L('Dokumen Komplain', 'Complaint Document'), meeting: L('Notulen Rapat', 'Meeting Notes'), other: L('Lainnya', 'Other') };
  M.DOC_ST = { active: [L('Aktif', 'Active'), 'ok'], superseded: [L('Versi lama', 'Superseded'), 'mute'], draft: [L('Draft', 'Draft'), 'info'], expired: [L('Kedaluwarsa', 'Expired'), 'crit'], archived: [L('Diarsipkan', 'Archived'), 'mute'], void: [L('Dibatalkan', 'Void'), 'crit'] };
  M.STAGES = [['upcoming', L('Upcoming Expiry', 'Upcoming Expiry')], ['review', L('Account Review', 'Account Review')], ['proposal', L('Proposal', 'Proposal')], ['negotiation', L('Negosiasi', 'Negotiation')], ['approval', L('Approval', 'Approval')], ['renewed', L('Renewed', 'Renewed')]];
  M.RISK = { high: [L('Tinggi', 'High'), 'crit'], medium: [L('Sedang', 'Medium'), 'warn'], low: [L('Rendah', 'Low'), 'ok'] };
  M.APR_KINDS = {
    contract: { n: L('Kontrak', 'Contract'), icon: 'contract', p: 'com.contract.approve' }, rate: { n: L('Rate Card', 'Rate Card'), icon: 'tag', p: 'com.rate.approve' },
    discount: { n: L('Diskon', 'Discount'), icon: 'percent', p: 'com.rate.approve' }, credit: { n: L('Limit Kredit', 'Credit Limit'), icon: 'coins', p: 'com.credit.approve' },
    special: { n: L('Syarat Khusus', 'Special Commercial Term'), icon: 'star', p: 'com.contract.approve' }, slaexc: { n: L('Pengecualian SLA', 'SLA Exception'), icon: 'clock', p: 'com.sla.approve' },
    creditnote: { n: L('Credit Note Komersial', 'Commercial Credit Note'), icon: 'file', p: 'com.cn.approve' }, terms: { n: L('Termin Pembayaran', 'Payment Terms'), icon: 'calendar', p: 'com.credit.approve' }
  };
  M.APR_ST = { pending: [L('Menunggu', 'Pending'), 'info'], approved: [L('Disetujui', 'Approved'), 'ok'], rejected: [L('Ditolak', 'Rejected'), 'crit'], returned: [L('Dikembalikan untuk revisi', 'Returned for revision'), 'warn'], draft: [L('Draft', 'Draft'), 'mute'] };
  M.OPP_STAGES = [['identified', L('Teridentifikasi', 'Identified')], ['qualified', L('Terkualifikasi', 'Qualified')], ['proposal', L('Proposal', 'Proposal')], ['negotiation', L('Negosiasi', 'Negotiation')], ['won', L('Menang', 'Won')], ['lost', L('Kalah', 'Lost')]];
  M.OPP_TYPES = { service: L('Tambah layanan', 'Add new service'), volume: L('Tambah volume', 'Increase volume'), property: L('Property baru', 'Add new property'), extension: L('Perpanjangan kontrak', 'Contract extension'), express: L('Layanan express', 'Express service'), superexpress: L('Super Express', 'Super Express'), premium: L('Premium Care', 'Premium Care'), special: L('Special Treatment', 'Special Treatment'), newclient: L('Klien baru', 'New client') };
  M.HEALTH_ST = { healthy: [L('Healthy', 'Healthy'), 'ok'], attention: [L('Need Attention', 'Need Attention'), 'warn'], risk: [L('At Risk', 'At Risk'), 'orange'], critical: [L('Critical', 'Critical'), 'crit'], nodata: [L('Data belum lengkap', 'Incomplete data'), 'mute'] };
  M.SEV = { crit: [L('Kritis', 'Critical'), 'crit', 3], warn: [L('Peringatan', 'Warning'), 'warn', 2], info: [L('Info', 'Info'), 'info', 1] };
  M.TASK_KINDS = { followup: [L('Follow-up', 'Follow-up'), 'phone'], meeting: [L('Meeting', 'Meeting'), 'calendar'], proposal: [L('Proposal', 'Proposal'), 'file'], note: [L('Catatan', 'Note'), 'edit'], escalate: [L('Eskalasi risiko', 'Risk escalation'), 'alert'] };
  M.EVENTS = {
    'CLIENT.CREATE': L('Klien dibuat', 'Client created'), 'CLIENT.EDIT': L('Data klien diubah', 'Client edited'), 'CLIENT.STATUS': L('Status klien diubah', 'Client status changed'), 'AM.CHANGE': L('Account Manager diganti', 'Account Manager changed'),
    'PROPERTY.ADD': L('Property ditambahkan', 'Property added'), 'PROPERTY.EDIT': L('Property diubah', 'Property edited'), 'PROPERTY.STATUS': L('Status property diubah', 'Property status changed'),
    'CONTACT.ADD': L('Kontak ditambahkan', 'Contact added'), 'CONTACT.EDIT': L('Kontak diubah', 'Contact edited'), 'CONTACT.ROLE': L('Peran kontak diubah', 'Contact role changed'), 'CONTACT.STATUS': L('Kontak dinonaktifkan / diaktifkan', 'Contact deactivated / activated'),
    'SERVICE.CONFIG': L('Layanan klien diatur', 'Client service configured'), 'SERVICE.MASTER': L('Harga master layanan diubah', 'Service master price changed'),
    'PROPOSAL.SENT': L('Proposal dikirim', 'Proposal sent'), 'CONTRACT.DRAFT': L('Draft kontrak dibuat', 'Contract draft created'), 'CONTRACT.SIGNED': L('Kontrak ditandatangani', 'Contract signed'), 'CONTRACT.VERSION': L('Versi kontrak baru', 'New contract version'),
    'CONTRACT.STATUS': L('Status kontrak diubah', 'Contract status changed'), 'CONTRACT.RENEWED': L('Kontrak diperpanjang', 'Contract renewed'), 'TERMS.CHANGE': L('Termin pembayaran diubah', 'Payment terms changed'),
    'RATE.REQUEST': L('Perubahan tarif diajukan', 'Rate change requested'), 'RATE.UPDATE': L('Tarif diperbarui', 'Rate updated'), 'RATE.OVERLAP': L('Peringatan tumpang tindih tarif', 'Rate overlap warning'),
    'SLA.REVIEW': L('SLA direview', 'SLA reviewed'), 'SLA.RULE': L('Aturan SLA diubah', 'SLA rule changed'), 'SLA.CLOCK': L('SLA clock', 'SLA clock'),
    'CREDIT.CHANGE': L('Limit kredit diubah', 'Credit limit changed'), 'CREDIT.EXCEEDED': L('Limit kredit terlampaui', 'Credit limit exceeded'), 'PAYMENT.ISSUE': L('Masalah pembayaran', 'Payment issue'),
    'COMPLAINT.OPEN': L('Komplain dibuka', 'Complaint opened'), 'COMPLAINT.RESOLVE': L('Komplain diselesaikan', 'Complaint resolved'),
    'RENEWAL.START': L('Renewal dimulai', 'Renewal started'), 'RENEWAL.DISCUSS': L('Diskusi renewal', 'Renewal discussion'), 'RENEWAL.STAGE': L('Tahap renewal berubah', 'Renewal stage changed'),
    'DOC.ADD': L('Dokumen ditambahkan', 'Document added'), 'DOC.VERSION': L('Versi dokumen baru', 'New document version'), 'DOC.STATUS': L('Status dokumen diubah', 'Document status changed'),
    'APPROVAL.REQUEST': L('Persetujuan diminta', 'Approval requested'), 'APPROVAL.APPROVE': L('Disetujui', 'Approved'), 'APPROVAL.REJECT': L('Ditolak', 'Rejected'), 'APPROVAL.RETURN': L('Dikembalikan untuk revisi', 'Returned for revision'),
    'OPP.CREATE': L('Opportunity dibuat', 'Opportunity created'), 'OPP.STAGE': L('Tahap opportunity berubah', 'Opportunity stage changed'),
    'TASK.CREATE': L('Tindakan Account Manager', 'Account Manager action'), 'TASK.DONE': L('Tindakan selesai', 'Action done'), 'HEALTH.ADJUST': L('Koreksi manual Client Health', 'Client Health manual adjustment'), 'HEALTH.WEIGHTS': L('Bobot Client Health diubah', 'Client Health weights changed'),
    'CREDITNOTE.ISSUE': L('Credit note diterbitkan', 'Credit note issued'), 'SPECIAL.TERM': L('Syarat khusus diterapkan', 'Special term applied'), 'ACCESS.DENIED': L('Tindakan ditolak (tanpa izin)', 'Action denied (no permission)')
  };

  /* ---------- State (browser: localStorage · node: memory) ---------- */
  var bCache = {}, hCache = {};
  var KEY = 'jfos-comm-v1', mem = {}, st = null, T0 = Date.now(), SIM = ms(D.simNow);
  var clock = function () { return SIM + (Date.now() - T0); };
  var ls = null;
  try { ls = root.localStorage || null; if (ls) { ls.setItem('__jfc', '1'); ls.removeItem('__jfc'); } } catch (e) { ls = null; }
  M.HEALTH_DIMS = [
    { k: 'revenue', n: L('Revenue', 'Revenue'), w: 10, icon: 'coins', src: 'billing' }, { k: 'revGrowth', n: L('Pertumbuhan Revenue', 'Revenue Growth'), w: 10, icon: 'trend', src: 'billing' },
    { k: 'volGrowth', n: L('Pertumbuhan Volume', 'Volume Growth'), w: 10, icon: 'package', src: 'billing' }, { k: 'sla', n: 'SLA', w: 15, icon: 'clock', src: 'sla' },
    { k: 'complaint', n: L('Komplain', 'Complaint'), w: 10, icon: 'message', src: 'complaint' }, { k: 'payment', n: L('Perilaku Bayar', 'Payment Behaviour'), w: 10, icon: 'calendar', src: 'finance' },
    { k: 'ar', n: 'AR Aging', w: 10, icon: 'clock', src: 'finance' }, { k: 'contract', n: L('Status Kontrak', 'Contract Status'), w: 10, icon: 'contract', src: 'contract' },
    { k: 'retention', n: L('Risiko Retensi', 'Retention Risk'), w: 5, icon: 'shield', src: 'renewal' }, { k: 'profit', n: L('Profitabilitas', 'Profitability'), w: 10, icon: 'percent', src: 'billing' }
  ];
  function seed() {
    var w = {}; M.HEALTH_DIMS.forEach(function (d) { w[d.k] = d.w; });
    return {
      v: 1, clients: clone(D.CLIENTS), props: clone(D.PROPERTIES), contacts: clone(D.CONTACTS), services: clone(D.SERVICES), cs: clone(D.CLIENT_SERVICES),
      contracts: clone(D.CONTRACTS), rcs: clone(D.RATECARDS), rch: clone(D.RATE_CHANGES), sla: clone(D.SLA_RULES), orders: clone(D.SLA_ORDERS), docs: clone(D.DOCS), tl: clone(D.TIMELINE),
      rnw: clone(D.RENEWALS), apr: clone(D.APPROVALS), opps: clone(D.OPPS), tasks: [], audit: [], cn: [], hadj: [], seen: {},
      cfg: { warn: [90, 60, 30, 15, 7], slaTh: [75, 90, 100], hw: w, bands: [80, 65, 50], stall: 21 }
    };
  }
  function S() {
    if (st) return st;
    try { var raw = ls ? ls.getItem(KEY) : mem[KEY]; st = raw ? JSON.parse(raw) : null; } catch (e) { st = null; }
    if (!st || st.v !== 1) { st = seed(); save(); }
    return st;
  }
  function save() { bCache = {}; hCache = {}; try { var s = JSON.stringify(st); if (ls) ls.setItem(KEY, s); else mem[KEY] = s; } catch (e) {} }
  M.state = S; M.save = save;
  M._reset = function () { st = seed(); save(); };
  M._setClock = function (fn) { clock = fn; };
  M.now = function () { return clock(); };
  M.cfg = function () { return S().cfg; };

  /* ---------- Audit (§60) and timeline (§35–§36) ---------- */
  M.audit = function (ev, ctx, o) {
    o = o || {};
    var e = { at: M.now(), ev: ev, uid: ctx && ctx.uid || null, by: ctx && (ctx.name || ctx.fullName) || 'system', emp: empId(ctx), cl: o.cl || null, rec: o.rec || null,
      from: o.from == null ? null : String(o.from), to: o.to == null ? null : String(o.to), reason: o.reason || null, appr: o.appr || null };
    S().audit.unshift(e); if (S().audit.length > 500) S().audit.length = 500; save();
    return e;
  };
  M.auditLog = function (cl) { return S().audit.filter(function (e) { return !cl || e.cl === cl; }); };
  function deny(ctx, what) { M.audit('ACCESS.DENIED', ctx, { rec: what }); return { ok: false, code: 'noperm', msg: M.MSG.noperm }; }
  function bad(msg, code) { return { ok: false, code: code || 'invalid', msg: msg || M.MSG.invalid }; }
  function tlAdd(cl, ev, ctx, o) { var e = Object.assign({ at: isoT(M.now()), cl: cl, ev: ev, by: empId(ctx), from: null, to: null, reason: null, doc: null, rec: null, prop: null }, o || {}); S().tl.push(e); save(); return e; }
  M.timeline = function (cl, f) {
    f = f || {};
    return S().tl.filter(function (e) { return (!cl || e.cl === cl) && (!f.ev || e.ev.indexOf(f.ev) === 0) && (!f.prop || e.prop === f.prop); })
      .slice().sort(function (a, b) { return ms(b.at) - ms(a.at); });
  };
  M.TL_GROUPS = [['', L('Semua', 'All')], ['CONTRACT', L('Kontrak', 'Contract')], ['RATE', L('Tarif', 'Rate')], ['SLA', 'SLA'], ['COMPLAINT', L('Komplain', 'Complaint')], ['RENEWAL', 'Renewal'], ['PAYMENT', L('Pembayaran', 'Payment')], ['PROPOSAL', 'Proposal']];

  /* ---------- Lookups ---------- */
  M.clients = function () { return S().clients; };
  M.client = function (id) { return by(S().clients, 'id', id); };
  M.prop = function (id) { return by(S().props, 'id', id); };
  M.contact = function (id) { return by(S().contacts, 'id', id); };
  M.service = function (id) { return by(S().services, 'id', id); };
  M.services = function () { return S().services; };
  M.propsOf = function (cl, all) { return S().props.filter(function (p) { return p.cl === cl && (all || p.status !== 'closed'); }); };
  M.am = function (id) { var a = by(D.AMS, 'id', id); return a ? a.n : id; };
  var EMP = { 'EMP-010': 'Komang Ops', 'EMP-021': 'Saraswati', 'EMP-030': 'Budi Santoso', 'EMP-040': 'Ayu Lestari', 'EMP-041': 'Sari Dewi', 'EMP-050': 'Aji Jaens' };
  M.empName = function (id) { return EMP[id] || M.am(id) || id || '—'; };
  M.clientName = function (id) { var c = M.client(id); return c ? c.n : id; };
  M.propName = function (id) { var p = M.prop(id); return p ? p.n : id; };
  M.svcName = function (id) { var s = M.service(id); return s ? s.n : id; };
  // Record → client, for the app's record-scope check (§55): every Phase 6 record id resolves to its client.
  M.recordOf = function (rec) {
    if (!rec) return null;
    var s = S(), x = M.client(rec) || null;
    if (x) return { cl: x.id };
    x = M.prop(rec) || M.contact(rec) || by(s.opps, 'id', rec) || by(s.docs, 'id', rec) || by(s.contracts, 'no', rec) || by(s.rcs, 'id', rec) || by(s.apr, 'id', rec) || by(s.orders, 'id', rec);
    if (!x) { var r = by(s.sla, 'id', rec); if (r && r.cl) return { cl: r.cl }; return null; }
    if (x.cl) return { cl: x.cl };
    if (x.prop) { var p = M.prop(x.prop); return p ? { cl: p.cl } : null; }
    return null;
  };

  /* ---------- Client isolation and sensitive data (§55, §63) ---------- */
  M.isClient = function (ctx) { return !!(ctx && ctx.client); };
  M.canSeeClient = function (ctx, cl) { return !ctx || !ctx.client || ctx.client === cl; };
  M.visibleClients = function (ctx) { return S().clients.filter(function (c) { return M.canSeeClient(ctx, c.id); }); };
  M.SENSITIVE = { price: 'com.rate.view', margin: 'com.margin.view', credit: 'com.finance.view', finance: 'com.finance.view' };
  M.canSee = function (ctx, what) { return can(ctx, M.SENSITIVE[what]); };
  // Masked copy of a client for a viewer without finance permission.
  M.clientView = function (ctx, id) {
    var c = M.client(id); if (!c || !M.canSeeClient(ctx, id)) return null;
    var o = clone(c); if (!M.canSee(ctx, 'credit')) { o.credit = null; o.masked = true; }
    return o;
  };

  /* ---------- Contracts (§16–§20) ---------- */
  M.contractVersions = function (no) { return S().contracts.filter(function (c) { return c.no === no; }).sort(function (a, b) { return b.v - a.v; }); };
  M.contractV = function (no, v) { return S().contracts.filter(function (c) { return c.no === no && c.v === +v; })[0] || null; };
  var IN_FORCE = ['active', 'archived', 'expired', 'approved', 'terminated'];
  // Version in force on a date (§19): historical transactions keep pointing at their own version.
  M.contractOn = function (no, date) {
    var d = ms(date || M.TODAY);
    return M.contractVersions(no).filter(function (c) { return IN_FORCE.indexOf(c.status) >= 0 && ms(c.eff) <= d && ms(c.start) <= d; })[0] || null;
  };
  // Current = the version in force today, else the newest version (draft / review / future).
  M.contract = function (no) { var v = M.contractVersions(no); if (!v.length) return null; var now = M.contractOn(no, M.TODAY); if (now && now.status !== 'archived') return now; return v[0]; };
  M.ctrStatus = function (c) {
    if (!c) return 'draft';
    if (['draft', 'review', 'terminated', 'archived', 'returned', 'rejected'].indexOf(c.status) >= 0) return c.status;
    var left = M.days(M.TODAY, c.end);
    if (c.status === 'expired' || left < 0) return 'expired';
    if (ms(c.start) > ms(M.TODAY)) return 'approved';
    if (left <= M.cfg().warn[0]) return 'expiring';
    return c.status === 'approved' ? 'approved' : 'active';
  };
  M.contractNos = function () { return uniq(S().contracts.map(function (c) { return c.no; })); };
  M.contracts = function (ctx, f) {
    f = f || {};
    return M.contractNos().map(function (no) { return M.contract(no); }).filter(function (c) {
      if (!M.canSeeClient(ctx, c.cl)) return false;
      if (f.cl && c.cl !== f.cl) return false;
      if (f.prop && c.props.indexOf(f.prop) < 0) return false;
      if (f.st && M.ctrStatus(c) !== f.st) return false;
      if (f.q) { var q = f.q.toLowerCase(), s = [c.no, M.clientName(c.cl)].concat(c.props.map(M.propName)).join(' ').toLowerCase(); if (s.indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return ms(a.end) - ms(b.end); });
  };
  M.activeContracts = function (cl) { return M.contracts(null, { cl: cl }).filter(function (c) { var s = M.ctrStatus(c); return s === 'active' || s === 'expiring'; }); };
  M.contractsForProp = function (prop, date) { return M.contractNos().map(function (no) { return M.contractOn(no, date); }).filter(function (c) { return c && c.props.indexOf(prop) >= 0 && ms(c.end) >= ms(date || M.TODAY); }); };
  M.CTR_FIELDS = [
    ['props', L('Property', 'Properties')], ['start', L('Mulai', 'Start')], ['end', L('Berakhir', 'End')], ['renew', L('Tipe perpanjangan', 'Renewal type')], ['terms', L('Termin pembayaran', 'Payment terms')],
    ['credit', L('Syarat kredit', 'Credit terms')], ['scope', L('Lingkup layanan', 'Service scope')], ['sla', 'SLA'], ['rc', 'Rate Card'], ['minVol', L('Volume minimum', 'Minimum volume')], ['pickup', L('Jadwal pickup', 'Pickup schedule')],
    ['cycle', L('Siklus tagihan', 'Billing cycle')], ['tax', L('Aturan pajak', 'Tax rule')], ['special', L('Syarat khusus', 'Special conditions')], ['attach', L('Lampiran', 'Attachments')], ['owner', L('Pemilik kontrak', 'Contract owner')], ['approver', 'Approver'], ['notes', L('Catatan', 'Notes')]
  ];
  function fmtField(k, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '—';
    if (k === 'props') return v.map(M.propName).join(', ');
    if (k === 'scope') return v.map(M.svcName).join(', ');
    if (k === 'terms') return 'Net ' + v;
    if (k === 'minVol') return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' kg/' + T(L('bulan', 'month'));
    if (k === 'renew') return T(M.RENEW[v] || v);
    if (k === 'cycle') return T(M.CYCLE[v] || v);
    if (k === 'owner' || k === 'approver') return M.empName(v);
    if (k === 'attach') return v.join(', ');
    return T(v);
  }
  M.fmtField = fmtField;
  // §20 side-by-side comparison; changed fields flagged.
  M.compare = function (no, va, vb) {
    var a = M.contractV(no, va), b = M.contractV(no, vb);
    if (!a || !b) return null;
    var rows = M.CTR_FIELDS.map(function (f) { var o = fmtField(f[0], a[f[0]]), n = fmtField(f[0], b[f[0]]); return { k: f[0], n: f[1], old: o, now: n, changed: o !== n }; });
    return { a: a, b: b, rows: rows, changed: rows.filter(function (r) { return r.changed; }).length };
  };
  function nextCtrNo() { var y = M.TODAY.slice(0, 4), n = S().contracts.filter(function (c) { return c.no.indexOf('CTR-' + y) === 0; }).map(function (c) { return +c.no.slice(9); }); return 'CTR-' + y + '-' + String((n.length ? Math.max.apply(null, n) : 0) + 1).padStart(3, '0'); }
  function ctrValidate(d) {
    if (!d.cl || !M.client(d.cl)) return L('Pilih klien.', 'Choose a client.');
    if (!d.props || !d.props.length) return L('Pilih minimal satu property.', 'Choose at least one property.');
    if (d.props.some(function (p) { var x = M.prop(p); return !x || x.cl !== d.cl; })) return L('Property harus milik klien yang sama.', 'Properties must belong to the same client.');
    if (!d.start || !d.end || ms(d.end) <= ms(d.start)) return L('Tanggal berakhir harus setelah tanggal mulai.', 'The end date must be after the start date.');
    if (d.terms == null || isNaN(d.terms) || d.terms < 0 || d.terms > 120) return L('Termin pembayaran 0–120 hari.', 'Payment terms 0–120 days.');
    if (d.minVol != null && (isNaN(d.minVol) || d.minVol < 0)) return L('Volume minimum tidak valid.', 'Invalid minimum volume.');
    return null;
  }
  M.createContract = function (ctx, d) {
    if (!can(ctx, 'com.contract.create')) return deny(ctx, 'contract');
    var err = ctrValidate(d); if (err) return bad(err);
    var c = Object.assign({ no: nextCtrNo(), v: 1, renew: 'manual', status: 'draft', terms: 30, credit: L('Limit sesuai master klien', 'Limit per client master'), scope: [], sla: null, rc: null, minVol: 0, pickup: L('Setiap hari', 'Daily'), cycle: 'monthly', tax: L('PPN 11%', 'VAT 11%'), special: '', attach: [], notes: '', owner: empId(ctx), approver: 'EMP-050', reason: L('Draft kontrak baru', 'New contract draft'), by: empId(ctx), apprBy: null, at: isoT(M.now()), strat: null }, d);
    c.eff = c.start;
    S().contracts.push(c); save();
    M.audit('CONTRACT.DRAFT', ctx, { cl: c.cl, rec: c.no, to: 'v1' }); tlAdd(c.cl, 'CONTRACT.DRAFT', ctx, { rec: c.no });
    return { ok: true, contract: c };
  };
  // §19 New version: never overwrite. The new version goes to review and the approval inbox.
  M.newVersion = function (ctx, no, changes, reason, eff) {
    if (!can(ctx, 'com.contract.edit')) return deny(ctx, no);
    var cur = M.contract(no); if (!cur) return bad(M.MSG.notfound, 'notfound');
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    if (M.contractVersions(no).some(function (c) { return c.status === 'review'; })) return bad(L('Masih ada versi yang menunggu persetujuan.', 'A version is still waiting for approval.'), 'pending');
    var n = Object.assign(clone(cur), changes || {}, { v: M.contractVersions(no)[0].v + 1, status: 'review', reason: L(reason, reason), by: empId(ctx), apprBy: null, at: isoT(M.now()), eff: eff || M.TODAY });
    var err = ctrValidate(n); if (err) return bad(err);
    if (ms(n.eff) < ms(n.start) || ms(n.eff) > ms(n.end)) return bad(L('Tanggal berlaku harus di dalam periode kontrak.', 'The effective date must be inside the contract period.'));
    var cmp = M.CTR_FIELDS.filter(function (f) { return fmtField(f[0], cur[f[0]]) !== fmtField(f[0], n[f[0]]); });
    if (!cmp.length) return bad(L('Tidak ada perubahan dibanding versi sekarang.', 'Nothing changed from the current version.'), 'nochange');
    S().contracts.push(n); save();
    var a = M.request(ctx, 'contract', { cl: n.cl, prop: n.props.length === 1 ? n.props[0] : null, rec: no, ver: n.v, from: no + ' v' + cur.v, to: no + ' v' + n.v, reason: L(reason, reason), eff: n.eff, impact: 0, attach: '' }, true);
    M.audit('CONTRACT.VERSION', ctx, { cl: n.cl, rec: no, from: 'v' + cur.v, to: 'v' + n.v, reason: reason });
    return { ok: true, contract: n, approval: a.approval, changed: cmp.length };
  };
  M.CTR_FLOW = { draft: ['review', 'archived'], review: ['approved', 'draft'], approved: ['active', 'terminated'], active: ['terminated'], expiring: ['terminated'], returned: ['review', 'archived'] };
  M.setContractStatus = function (ctx, no, v, to, reason) {
    var c = M.contractV(no, v); if (!c) return bad(M.MSG.notfound, 'notfound');
    var from = M.ctrStatus(c), allowed = M.CTR_FLOW[from] || [];
    if (allowed.indexOf(to) < 0) return bad(L('Perubahan status ini tidak diizinkan.', 'This status change is not allowed.'), 'flow');
    var need = to === 'approved' || to === 'active' ? 'com.contract.approve' : 'com.contract.edit';
    if (!can(ctx, need)) return deny(ctx, no);
    if ((to === 'terminated' || to === 'archived' || to === 'draft') && (!reason || !String(reason).trim())) return bad(M.MSG.reason, 'reason');
    if (to === 'review') { c.status = 'review'; save(); M.request(ctx, 'contract', { cl: c.cl, prop: c.props.length === 1 ? c.props[0] : null, rec: no, ver: c.v, from: '—', to: no + ' v' + c.v, reason: c.reason, eff: c.eff, impact: 0 }, true); }
    else { c.status = to; if (to === 'approved' || to === 'active') c.apprBy = empId(ctx); save(); }
    M.audit('CONTRACT.STATUS', ctx, { cl: c.cl, rec: no + ' v' + v, from: from, to: to, reason: reason });
    tlAdd(c.cl, 'CONTRACT.STATUS', ctx, { rec: no, from: T(M.CTR_ST[from][0]), to: T(M.CTR_ST[to][0]), reason: reason ? L(reason, reason) : null });
    return { ok: true };
  };

  /* ---------- Rate cards and pricing (§21–§26, §72) ---------- */
  M.rcVersions = function (id) { return S().rcs.filter(function (r) { return r.id === id; }).sort(function (a, b) { return b.v - a.v; }); };
  M.rcV = function (id, v) { return S().rcs.filter(function (r) { return r.id === id && r.v === +v; })[0] || null; };
  M.rcStatus = function (r) {
    if (!r) return 'draft';
    if (['draft', 'review', 'rejected', 'archived'].indexOf(r.status) >= 0) return r.status;
    if (ms(r.eff) > ms(M.TODAY)) return 'scheduled';
    if (r.status === 'expired' || (r.exp && ms(r.exp) < ms(M.TODAY))) return M.rcVersions(r.id).some(function (x) { return x.v > r.v && ['active'].indexOf(x.status) >= 0; }) ? 'archived' : 'expired';
    if (r.exp && M.days(M.TODAY, r.exp) <= 30) return 'expiring';
    return 'active';
  };
  // The version that applies today (else the newest one).
  M.rateCard = function (id) { var v = M.rcVersions(id); return v.filter(function (r) { return ['active', 'expiring'].indexOf(M.rcStatus(r)) >= 0; })[0] || v.filter(function (r) { return M.rcStatus(r) === 'scheduled'; })[0] || v[0] || null; };
  M.rateCards = function (ctx, f) {
    f = f || {};
    return uniq(S().rcs.map(function (r) { return r.id; })).map(M.rateCard).filter(function (r) {
      if (!M.canSeeClient(ctx, r.cl)) return false;
      if (f.cl && r.cl !== f.cl) return false;
      if (f.st && M.rcStatus(r) !== f.st) return false;
      if (f.q) { var q = f.q.toLowerCase(); if ((r.id + ' ' + r.n + ' ' + M.clientName(r.cl)).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });
  };
  M.lineFinal = function (l) { return Math.round(l.client * (1 - (l.disc || 0) / 100) + (l.sur || 0)); };
  var PRICED = ['active', 'archived', 'expired'];
  /* rateOn(): the client rate valid on a date (§26). A property card beats the client card; then the higher
     priority; then the newer version. Master price is used only when no card exists (personal clients). */
  M.rateOn = function (prop, svc, date, o) {
    o = o || {};
    var p = M.prop(prop); if (!p) return null;
    var d = ms(date || M.TODAY), sv = M.service(svc);
    var cands = S().rcs.filter(function (r) {
      return r.cl === p.cl && (!r.prop || r.prop === prop) && PRICED.indexOf(r.status) >= 0 && ms(r.eff) <= d && (!r.exp || ms(r.exp) >= d) && r.lines.some(function (l) { return l.svc === svc && l.status !== 'inactive'; });
    }).sort(function (a, b) { return (b.prop ? 1 : 0) - (a.prop ? 1 : 0) || (b.prio || 0) - (a.prio || 0) || b.v - a.v; });
    if (cands.length) {
      var r = cands[0], l = r.lines.filter(function (x) { return x.svc === svc; })[0];
      return { rate: M.lineFinal(l), client: l.client, line: l, rc: r.id, v: r.v, src: r.prop ? 'property' : 'client', master: sv ? sv.price : null, cands: cands.map(function (x) { return x.id + ' v' + x.v; }) };
    }
    if (o.legacy) {
      // Months before the first stored card: bill at the earliest known client rate (the terms in force then).
      var early = S().rcs.filter(function (r) { return r.cl === p.cl && (!r.prop || r.prop === prop) && PRICED.indexOf(r.status) >= 0 && r.lines.some(function (l) { return l.svc === svc; }); }).sort(function (a, b) { return ms(a.eff) - ms(b.eff); })[0];
      if (early) { var el = early.lines.filter(function (x) { return x.svc === svc; })[0]; return { rate: M.lineFinal(el), client: el.client, line: el, rc: early.id, v: early.v, src: 'legacy', master: sv ? sv.price : null, cands: [] }; }
    }
    return sv ? { rate: sv.price, client: sv.price, line: null, rc: null, v: null, src: 'master', master: sv.price, cands: [] } : null;
  };
  // §26 invoice lines keep the rate of their own pricing date.
  M.priceLine = function (line) { var r = M.rateOn(line.prop, line.svc, line.date); return Object.assign({}, line, { rate: r.rate, rc: r.rc, v: r.v, src: r.src, amount: Math.round(r.rate * line.qty), ctr: (M.contractsForProp(line.prop, line.date)[0] || {}).no || null }); };
  M.invoiceLines = function (cl) { return D.INVOICE_LINES.filter(function (l) { return !cl || l.cl === cl; }).map(M.priceLine); };
  // §72 overlapping active rates for the same client / property / service without a priority rule.
  M.rateOverlaps = function (rc) {
    var out = [];
    S().rcs.forEach(function (o) {
      if (o === rc || o.id === rc.id || o.cl !== rc.cl || (o.prop || null) !== (rc.prop || null) || ['active', 'review'].indexOf(o.status) < 0) return;
      if ((o.prio || 0) !== (rc.prio || 0)) return;
      var a1 = ms(rc.eff), a2 = rc.exp ? ms(rc.exp) : Infinity, b1 = ms(o.eff), b2 = o.exp ? ms(o.exp) : Infinity;
      if (a1 > b2 || b1 > a2) return;
      var svcs = rc.lines.map(function (l) { return l.svc; }).filter(function (s) { return o.lines.some(function (l) { return l.svc === s; }); });
      if (svcs.length) out.push({ rc: o.id, v: o.v, svcs: svcs, from: iso(Math.max(a1, b1)), to: isFinite(Math.min(a2, b2)) ? iso(Math.min(a2, b2)) : null });
    });
    return out;
  };
  /* §25 Rate change: Draft → Review → Approval → Effective. Stores old, new, difference %, reason, effective
     date, requester and approver. The client rate is never changed by a master price change (§24). */
  M.rateChangeCheck = function (rcId, svc, to, eff) {
    var cur = M.rateCard(rcId); if (!cur) return { ok: false, msg: M.MSG.notfound };
    var line = cur.lines.filter(function (l) { return l.svc === svc; })[0];
    if (to == null || isNaN(to) || to <= 0) return { ok: false, msg: L('Tarif baru harus lebih dari 0.', 'The new rate must be above 0.') };
    if (!eff || ms(eff) < ms(M.TODAY)) return { ok: false, msg: L('Tanggal berlaku tidak boleh di masa lalu: invoice lama tidak dihitung ulang.', 'The effective date cannot be in the past: old invoices are never recalculated.') };
    if (cur.exp && ms(eff) > ms(cur.exp)) return { ok: false, msg: L('Tanggal berlaku melewati masa berlaku Rate Card.', 'The effective date is after the Rate Card expiry.') };
    var from = line ? line.client : null, diff = from ? r1((to - from) / from * 100) : null;
    var sv = M.service(svc), warn = [];
    if (sv && to < sv.price * 0.8) warn.push(L('Tarif lebih dari 20% di bawah harga master.', 'Rate is more than 20% below the master price.'));
    if (diff != null && Math.abs(diff) > 15) warn.push(L('Perubahan lebih dari 15%.', 'Change above 15%.'));
    var pending = S().apr.filter(function (a) { return a.kind === 'rate' && a.rec === rcId && a.svc === svc && a.st === 'pending'; });
    if (pending.length) return { ok: false, msg: L('Masih ada perubahan tarif layanan ini yang menunggu persetujuan.', 'A rate change for this service is still waiting for approval.') };
    return { ok: true, from: from, diff: diff, warn: warn, cur: cur, line: line };
  };
  M.requestRateChange = function (ctx, rcId, svc, to, eff, reason, o) {
    o = o || {};
    if (!can(ctx, 'com.rate.edit')) return deny(ctx, rcId);
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    var chk = M.rateChangeCheck(rcId, svc, +to, eff); if (!chk.ok) return bad(chk.msg);
    var rc = chk.cur, impactKg = M.svcVolume(rc, svc);
    var a = M.request(ctx, 'rate', { cl: rc.cl, prop: rc.prop, rec: rcId, svc: svc, from: chk.from, to: +to, diff: chk.diff, reason: L(reason, reason), eff: eff, impact: chk.from != null ? Math.round((+to - chk.from) * impactKg) : 0, attach: o.attach || '' }, false, o.draft);
    M.audit('RATE.REQUEST', ctx, { cl: rc.cl, rec: rcId + ' · ' + svc, from: chk.from, to: to, reason: reason });
    if (!o.draft) tlAdd(rc.cl, 'RATE.REQUEST', ctx, { rec: rcId, from: M.svcName(svc) + ' Rp ' + chk.from, to: M.svcName(svc) + ' Rp ' + to, reason: L(reason, reason) });
    return { ok: true, approval: a.approval, warn: chk.warn, diff: chk.diff };
  };
  // §25 discount on a client rate line: same approval path as a rate change.
  M.requestDiscount = function (ctx, rcId, svc, disc, eff, reason, o) {
    o = o || {};
    if (!can(ctx, 'com.rate.edit')) return deny(ctx, rcId);
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    var cur = M.rateCard(rcId); if (!cur) return bad(M.MSG.notfound, 'notfound');
    var line = cur.lines.filter(function (l) { return l.svc === svc; })[0];
    if (!line) return bad(L('Layanan ini belum ada di Rate Card. Ajukan tarifnya dulu.', 'This service is not on the Rate Card yet. Request its rate first.'));
    disc = +disc;
    if (isNaN(disc) || disc < 0 || disc > 50) return bad(L('Diskon 0–50%.', 'Discount 0–50%.'));
    if (disc === (line.disc || 0)) return bad(L('Diskon sama dengan yang berlaku.', 'Same as the current discount.'), 'nochange');
    if (!eff || ms(eff) < ms(M.TODAY)) return bad(L('Tanggal berlaku tidak boleh di masa lalu: invoice lama tidak dihitung ulang.', 'The effective date cannot be in the past: old invoices are never recalculated.'));
    if (S().apr.some(function (a) { return (a.kind === 'rate' || a.kind === 'discount') && a.rec === rcId && a.svc === svc && a.st === 'pending'; })) return bad(L('Masih ada perubahan tarif layanan ini yang menunggu persetujuan.', 'A rate change for this service is still waiting for approval.'));
    var vol = M.svcVolume(cur, svc), impact = -Math.round(line.client * (disc - (line.disc || 0)) / 100 * vol);
    var a = M.request(ctx, 'discount', { cl: cur.cl, prop: cur.prop, rec: rcId, svc: svc, from: line.disc || 0, to: disc, diff: r1(disc - (line.disc || 0)), reason: L(reason, reason), eff: eff, impact: impact, attach: o.attach || '' });
    M.audit('RATE.REQUEST', ctx, { cl: cur.cl, rec: rcId + ' · ' + svc, from: (line.disc || 0) + '%', to: disc + '%', reason: reason });
    tlAdd(cur.cl, 'RATE.REQUEST', ctx, { rec: rcId, from: M.svcName(svc) + ' ' + T(L('diskon', 'discount')) + ' ' + (line.disc || 0) + '%', to: M.svcName(svc) + ' ' + T(L('diskon', 'discount')) + ' ' + disc + '%', reason: L(reason, reason) });
    return { ok: true, approval: a.approval, impact: impact };
  };
  // Monthly volume of a service under a card (for the revenue impact of a change).
  M.svcVolume = function (rc, svc) { var props = rc.prop ? [rc.prop] : M.propsOf(rc.cl).map(function (p) { return p.id; }); return Math.round(sum(props.map(function (p) { var b = M.billing(p, 12); return b && b.svcs[svc] ? b.svcs[svc].qty : 0; }))); };
  function applyRate(ctx, a) {
    var cur = M.rateCard(a.rec); if (!cur) return;
    var n = clone(cur); n.v = M.rcVersions(a.rec)[0].v + 1; n.eff = a.eff; n.status = 'active';
    // A change that starts after the card's expiry (e.g. a renewal term) gets its own one-year validity.
    if (n.exp && ms(a.eff) > ms(n.exp)) n.exp = addDays(a.eff, 364); n.by = a.by; n.approver = empId(ctx); n.at = isoT(M.now()); n.reason = a.reason;
    var line = n.lines.filter(function (l) { return l.svc === a.svc; })[0];
    if (a.kind === 'rate') { if (line) line.client = a.to; else n.lines.push({ svc: a.svc, item: L('Semua item', 'All items'), cat: null, disc: 0, minQty: 0, minCharge: 0, sur: 0, tax: 11, status: 'active', client: a.to }); }
    if (a.kind === 'discount' && line) line.disc = +a.to;
    // The old version keeps its values; only its validity ends the day before.
    cur.exp = addDays(a.eff, -1); if (ms(a.eff) <= ms(M.TODAY)) cur.status = 'archived';
    S().rcs.push(n);
    S().rch.push({ id: 'RCH-' + String(S().rch.length + 1).padStart(3, '0'), rc: a.rec, svc: a.svc, from: a.kind === 'discount' ? (line ? line.client : null) : a.from, to: a.kind === 'discount' ? M.lineFinal(line) : a.to, disc: a.kind === 'discount' ? a.to : null, eff: a.eff, reason: a.reason, by: a.by, appr: empId(ctx), at: isoT(M.now()) });
    tlAdd(a.cl, 'RATE.UPDATE', ctx, { rec: a.rec, from: M.svcName(a.svc) + (a.kind === 'discount' ? ' ' + T(L('diskon', 'discount')) + ' ' + a.from + '%' : ' Rp ' + a.from), to: M.svcName(a.svc) + (a.kind === 'discount' ? ' ' + T(L('diskon', 'discount')) + ' ' + a.to + '%' : ' Rp ' + a.to), reason: a.reason });
  }
  M.rateHistory = function (rcId) { return S().rch.filter(function (h) { return !rcId || h.rc === rcId; }).slice().sort(function (a, b) { return ms(b.at) - ms(a.at); }); };
  // §24 changing the master price never touches client rates; it reports how many client lines stay as they are.
  M.setMasterPrice = function (ctx, svc, price, reason) {
    if (!can(ctx, 'com.rate.approve')) return deny(ctx, svc);
    var s = M.service(svc); if (!s) return bad(M.MSG.notfound, 'notfound');
    if (!price || isNaN(price) || price <= 0) return bad(L('Harga harus lebih dari 0.', 'The price must be above 0.'));
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    var from = s.price; s.price = +price; save();
    var kept = S().rcs.filter(function (r) { return M.rcStatus(r) === 'active' || M.rcStatus(r) === 'expiring'; }).reduce(function (n, r) { return n + r.lines.filter(function (l) { return l.svc === svc; }).length; }, 0);
    M.audit('SERVICE.MASTER', ctx, { rec: svc, from: from, to: price, reason: reason });
    return { ok: true, kept: kept };
  };

  /* ---------- Services (§13–§15) ---------- */
  M.svcConfig = function (prop) { return S().cs.filter(function (x) { return x.prop === prop; }); };
  M.svcRow = function (prop, svc) { return S().cs.filter(function (x) { return x.prop === prop && x.svc === svc; })[0] || null; };
  // One service line for a property: master vs client values, the rate from the Rate Card (data reuse §59), SLA from the rules.
  M.svcLine = function (prop, svc) {
    var cfg = M.svcRow(prop, svc), sv = M.service(svc), p = M.prop(prop), r = M.rateOn(prop, svc, M.TODAY), sl = M.slaFor({ cl: p.cl, prop: prop, svc: svc });
    return { prop: prop, svc: svc, sv: sv, cfg: cfg, active: !!(cfg && cfg.active), master: sv.price, rate: r ? r.rate : null, rateSrc: r ? r.src : null, rc: r ? r.rc : null, masterSla: sv.sla, sla: sl.rule ? sl.tat : sv.sla, slaRule: sl.rule ? sl.rule.id : null,
      custom: !!(cfg && ((r && r.src !== 'master' && r.rate !== sv.price) || (sl.rule && sl.tat !== sv.sla) || cfg.instr)) };
  };
  M.saveSvcConfig = function (ctx, prop, svc, d) {
    if (!can(ctx, 'com.service.edit')) return deny(ctx, prop);
    var p = M.prop(prop), sv = M.service(svc); if (!p || !sv) return bad(M.MSG.notfound, 'notfound');
    if (d.minCharge != null && (isNaN(d.minCharge) || d.minCharge < 0)) return bad(L('Minimum charge tidak valid.', 'Invalid minimum charge.'));
    var row = M.svcRow(prop, svc), from = row ? (row.active ? 'on' : 'off') : 'none';
    if (!row) { row = { prop: prop, svc: svc, active: true, rate: null, sla: null, instr: '', items: '', pickup: L('Ikut jadwal pickup property', 'Follows the property pickup schedule'), express: false, minCharge: 0, notes: '' }; S().cs.push(row); }
    ['active', 'instr', 'items', 'express', 'minCharge', 'notes', 'pickup'].forEach(function (k) { if (d[k] !== undefined) row[k] = (k === 'instr' || k === 'items' || k === 'notes' || k === 'pickup') && typeof d[k] === 'string' ? L(d[k], d[k]) : d[k]; });
    save();
    M.audit('SERVICE.CONFIG', ctx, { cl: p.cl, rec: prop + ' · ' + svc, from: from, to: row.active ? 'on' : 'off' });
    tlAdd(p.cl, 'SERVICE.CONFIG', ctx, { prop: prop, rec: svc, from: from, to: row.active ? 'on' : 'off' });
    return { ok: true, row: row };
  };

  /* ---------- SLA (§27–§32, §73) ---------- */
  function winOk(win, at) { if (!win) return true; var t = new Date(ms(at)), dow = t.getUTCDay(), h = t.getUTCHours(); if (win === 'weekend') return dow === 0 || dow === 6; if (win === 'weekday') return dow > 0 && dow < 6; if (win === 'night') return h >= 18 || h < 6; return true; }
  // Precedence (§31): property > client > service > item category > priority > day/time window.
  M.SLA_PREC = [['prop', 32, L('Property', 'Property')], ['cl', 16, L('Klien', 'Client')], ['svc', 8, L('Layanan', 'Service')], ['cat', 4, L('Kategori item', 'Item category')], ['pri', 2, L('Prioritas', 'Priority')], ['win', 1, L('Hari / jam', 'Day / time')]];
  M.slaSpec = function (r) { return sum(M.SLA_PREC.map(function (p) { return r[p[0]] ? p[1] : 0; })); };
  M.slaFor = function (q) {
    q = q || {}; var at = q.at || isoT(M.now()), d = ms(at.slice(0, 10));
    var m = S().sla.filter(function (r) {
      return r.status === 'active' && ms(r.eff) <= d && (!r.exp || ms(r.exp) >= d) &&
        (!r.cl || r.cl === q.cl) && (!r.prop || r.prop === q.prop) && (!r.svc || r.svc === q.svc) && (!r.cat || T(r.cat) === T(q.cat)) && (!r.pri || r.pri === q.pri) && winOk(r.win, at);
    }).sort(function (a, b) { return M.slaSpec(b) - M.slaSpec(a); });
    var top = m[0] || null, tie = top ? m.filter(function (r) { return r !== top && M.slaSpec(r) === M.slaSpec(top) && r.tat !== top.tat; }) : [];
    return { rule: top, tat: top ? top.tat : (M.service(q.svc) || { sla: 24 }).sla, chain: m, conflict: tie.length ? tie : null };
  };
  // §73 rules with the same keys and overlapping dates but different targets = conflict without precedence.
  M.slaConflicts = function (rule) {
    var list = rule ? [rule] : S().sla, out = [];
    list.forEach(function (a) {
      S().sla.forEach(function (b) {
        if (a === b || a.id === b.id || b.status !== 'active' || (rule ? false : a.id > b.id)) return;
        if (M.SLA_PREC.some(function (p) { return T(a[p[0]] || '') !== T(b[p[0]] || ''); })) return;
        var a1 = ms(a.eff), a2 = a.exp ? ms(a.exp) : Infinity, b1 = ms(b.eff), b2 = b.exp ? ms(b.exp) : Infinity;
        if (a1 > b2 || b1 > a2 || a.tat === b.tat) return;
        out.push({ a: a.id, b: b.id, tatA: a.tat, tatB: b.tat });
      });
    });
    return out;
  };
  M.saveSlaRule = function (ctx, d) {
    if (!can(ctx, 'com.sla.edit')) return deny(ctx, 'sla');
    if (!d.n || !d.tat || isNaN(d.tat) || d.tat <= 0 || d.tat > 240) return bad(L('Nama dan target waktu (1–240 jam) wajib diisi.', 'Name and turnaround (1–240 hours) are required.'));
    if (!d.eff) return bad(L('Tanggal berlaku wajib diisi.', 'The effective date is required.'));
    var r = Object.assign({ id: d.id || 'SLA-' + String(S().sla.length + 1).padStart(3, '0') + 'N', cl: null, prop: null, svc: null, cat: null, pri: null, win: null, pickCut: '09:00', delCut: '17:00', esc: L('75% Info · 90% Warning · 100% Late', '75% Info · 90% Warning · 100% Late'), penalty: '', comp: '', review: L('Kuartalan', 'Quarterly'), exp: null, status: 'active' }, d, { n: typeof d.n === 'string' ? L(d.n, d.n) : d.n, tat: +d.tat });
    var conf = M.slaConflicts(r);
    if (conf.length && !d.force) return { ok: false, code: 'conflict', msg: L('Aturan ini bentrok dengan ' + conf.map(function (c) { return c.b; }).join(', ') + ' tanpa urutan prioritas. Ubah cakupan atau tanggal berlaku.', 'This rule conflicts with ' + conf.map(function (c) { return c.b; }).join(', ') + ' without precedence. Change its scope or effective date.'), conflicts: conf };
    S().sla.push(r); save();
    M.audit('SLA.RULE', ctx, { cl: r.cl, rec: r.id, to: r.tat + 'h' });
    if (r.cl) tlAdd(r.cl, 'SLA.RULE', ctx, { rec: r.id, prop: r.prop, to: r.tat + ' ' + T(L('jam', 'hours')) });
    return { ok: true, rule: r };
  };
  // §30 SLA clock: start, pause (reason), resume, complete; every state has a timestamp.
  M.clock = function (o, now) {
    var t = now == null ? M.now() : now, p = M.prop(o.prop), q = M.slaFor({ cl: p ? p.cl : null, prop: o.prop, svc: o.svc, cat: o.cat, pri: o.pri, at: o.ev[0][1] });
    var tat = q.tat, act = 0, run = null, paused = false, done = null, pausedMs = 0, pStart = null;
    o.ev.forEach(function (e) {
      var at = ms(e[1]);
      if (e[0] === 'start' || e[0] === 'resume') { if (pStart != null) { pausedMs += at - pStart; pStart = null; } run = at; paused = false; }
      if (e[0] === 'pause' && run != null) { act += at - run; run = null; paused = true; pStart = at; }
      if (e[0] === 'complete') { if (run != null) act += at - run; run = null; done = at; paused = false; }
    });
    if (run != null) act += t - run;
    var used = act / HOUR, pct = r1(used / tat * 100), th = M.cfg().slaTh;
    var due = ms(o.ev[0][1]) + tat * HOUR + pausedMs + (pStart != null ? t - pStart : 0);
    var stt = done ? (pct <= 100 ? 'done' : 'donelate') : paused ? 'paused' : pct >= th[2] ? 'late' : pct >= th[0] ? 'atrisk' : 'ontrack';
    var lvl = done ? null : pct >= th[2] ? 'crit' : pct >= th[1] ? 'warn' : pct >= th[0] ? 'info' : null;
    return { id: o.id, o: o, tat: tat, rule: q.rule, used: r1(used), left: r1(tat - used), pct: pct, st: stt, lvl: lvl, due: due, paused: paused, done: done };
  };
  M.orders = function (ctx, f) {
    f = f || {};
    return S().orders.filter(function (o) { var p = M.prop(o.prop); return p && M.canSeeClient(ctx, p.cl) && (!f.cl || p.cl === f.cl) && (!f.prop || o.prop === f.prop); }).map(function (o) { return M.clock(o); })
      .sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || b.pct - a.pct; });
  };
  M.clockAct = function (ctx, id, act, reason) {
    if (!can(ctx, 'com.sla.clock')) return deny(ctx, id);
    var o = by(S().orders, 'id', id); if (!o) return bad(M.MSG.notfound, 'notfound');
    var c = M.clock(o), last = o.ev[o.ev.length - 1][0];
    var ok = { pause: !c.done && !c.paused, resume: c.paused, complete: !c.done && !c.paused }[act];
    if (!ok) return bad(L('Tindakan ini tidak sesuai status SLA saat ini.', 'This action does not match the current SLA state.'), 'flow');
    if (act === 'pause' && (!reason || !String(reason).trim())) return bad(L('Alasan jeda wajib diisi.', 'A pause reason is required.'), 'reason');
    var at = isoT(Math.max(M.now(), ms(o.ev[o.ev.length - 1][1]) + 60000));
    o.ev.push(act === 'pause' ? [act, at, L(reason, reason)] : [act, at]); save();
    M.audit('SLA.CLOCK', ctx, { cl: (M.prop(o.prop) || {}).cl, rec: id, from: last, to: act, reason: reason || null });
    return { ok: true, clock: M.clock(o) };
  };
  // §51 SLA performance per property / client, from the operations feed + live clocks.
  M.slaPerf = function (cl, prop) {
    var props = prop ? [prop] : M.propsOf(cl, true).map(function (p) { return p.id; }), on = 0, risk = 0, late = 0, tatW = 0, rows = [];
    props.forEach(function (p) { var m = D.SLA_MONTH[p] || {}; Object.keys(m).forEach(function (s) { var x = m[s], n = x[0] + x[1] + x[2]; on += x[0]; risk += x[1]; late += x[2]; tatW += x[3] * n; rows.push({ prop: p, svc: s, on: x[0], risk: x[1], late: x[2], n: n, tat: x[3], ot: r1((x[0] + x[1]) / n * 100) }); }); });
    var n = on + risk + late;
    return { n: n, on: on, risk: risk, late: late, ot: n ? r1((on + risk) / n * 100) : null, avgTat: n ? r1(tatW / n) : null, rows: rows, live: S().orders.filter(function (o) { return props.indexOf(o.prop) >= 0; }).map(function (o) { return M.clock(o); }) };
  };
  M.slaRules = function (ctx, f) {
    f = f || {};
    return S().sla.filter(function (r) { return (!r.cl || M.canSeeClient(ctx, r.cl)) && (!ctx || !ctx.client || r.cl === ctx.client) && (!f.cl || r.cl === f.cl || (!r.cl && f.std)) && (!f.prop || !r.prop || r.prop === f.prop); })
      .sort(function (a, b) { return M.slaSpec(b) - M.slaSpec(a); });
  };

  /* ---------- Documents (§33–§34, §70) ---------- */
  M.docs = function (ctx, f) {
    f = f || {};
    return S().docs.filter(function (d) {
      if (!M.canSeeClient(ctx, d.cl)) return false;
      if (ctx && ctx.client && !d.share) return false;
      if (f.cl && d.cl !== f.cl) return false;
      if (f.type && d.type !== f.type) return false;
      if (f.st && d.status !== f.st) return false;
      if (f.prop && d.prop && d.prop !== f.prop) return false;
      if (f.ctr && d.ctr !== f.ctr) return false;
      if (!f.all && d.status === 'superseded' && !f.st) return false;
      if (f.q) { var q = f.q.toLowerCase(); if ((d.id + ' ' + d.n + ' ' + d.file + ' ' + M.clientName(d.cl)).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return ms(b.date) - ms(a.date); });
  };
  M.docVersions = function (doc) { return S().docs.filter(function (d) { return d.cl === doc.cl && d.type === doc.type && d.n === doc.n && (d.ctr || null) === (doc.ctr || null); }).sort(function (a, b) { return b.v - a.v; }); };
  // A new file for an existing document becomes a new version; the old one is kept as superseded (§70).
  M.addDoc = function (ctx, d) {
    if (!can(ctx, 'com.doc.manage')) return deny(ctx, 'doc');
    if (!d.n || !d.type || !M.DOC_TYPES[d.type] || !d.cl || !M.client(d.cl)) return bad(L('Nama, tipe dan klien dokumen wajib diisi.', 'Document name, type and client are required.'));
    if (!d.file) return bad(L('Pilih file dokumen.', 'Choose the document file.'));
    if (d.exp && d.eff && ms(d.exp) < ms(d.eff)) return bad(L('Tanggal kedaluwarsa harus setelah tanggal berlaku.', 'The expiry date must be after the effective date.'));
    var prev = S().docs.filter(function (x) { return x.cl === d.cl && x.type === d.type && x.n === d.n && (x.ctr || null) === (d.ctr || null) && x.status === 'active'; })[0];
    var n = { id: 'DOC-' + String(S().docs.length + 1000).slice(-4) + 'N', n: d.n, type: d.type, cl: d.cl, prop: d.prop || null, ctr: d.ctr || null, v: prev ? prev.v + 1 : 1, date: M.TODAY, eff: d.eff || null, exp: d.exp || null, by: empId(ctx), status: 'active', file: d.file, share: !!d.share, notes: d.notes || '' };
    if (prev) prev.status = 'superseded';
    S().docs.push(n); save();
    M.audit(prev ? 'DOC.VERSION' : 'DOC.ADD', ctx, { cl: d.cl, rec: n.id, from: prev ? prev.id + ' v' + prev.v : null, to: n.id + ' v' + n.v });
    tlAdd(d.cl, prev ? 'DOC.VERSION' : 'DOC.ADD', ctx, { doc: n.id, prop: n.prop, rec: n.ctr, from: prev ? 'v' + prev.v : null, to: 'v' + n.v });
    return { ok: true, doc: n, superseded: prev ? prev.id : null };
  };
  M.setDocStatus = function (ctx, id, to, reason) {
    if (!can(ctx, 'com.doc.manage')) return deny(ctx, id);
    var d = by(S().docs, 'id', id); if (!d) return bad(M.MSG.notfound, 'notfound');
    if (['archived', 'void', 'active'].indexOf(to) < 0) return bad();
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    var from = d.status; d.status = to; save();
    M.audit('DOC.STATUS', ctx, { cl: d.cl, rec: id, from: from, to: to, reason: reason });
    tlAdd(d.cl, 'DOC.STATUS', ctx, { doc: id, from: from, to: to, reason: L(reason, reason) });
    return { ok: true };
  };

  /* ---------- Contacts (§7–§12) ---------- */
  M.contacts = function (ctx, f) {
    f = f || {};
    return S().contacts.filter(function (c) {
      if (!M.canSeeClient(ctx, c.cl)) return false;
      if (f.cl && c.cl !== f.cl) return false;
      if (f.prop && !(c.scope === 'all' || c.props.indexOf(f.prop) >= 0)) return false;
      if (f.level && c.level !== f.level) return false;
      if (f.role && c.roles.indexOf(f.role) < 0) return false;
      if (!f.all && !c.active) return false;
      if (f.q) { var q = f.q.toLowerCase(); if ([c.n, c.pos, c.phone, c.email, M.clientName(c.cl)].concat(c.props.map(M.propName)).join(' ').toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return (a.level === 'group' ? 0 : 1) - (b.level === 'group' ? 0 : 1) || a.n.localeCompare(b.n); });
  };
  M.scopeLabel = function (c) { return c.scope === 'all' ? T(M.CT_SCOPE.all) : c.props.map(M.propName).join(', '); };
  /* §12 Smart contact recommendation: commercial topics go to group decision makers, operations to the
     property supervisor, invoices to finance, complaints to the property complaint contact + escalation. */
  M.PURPOSES = [
    ['contract', L('Kontrak / harga / renewal', 'Contract / pricing / renewal'), ['decision', 'contract', 'pricing', 'renewal'], 'group', ['escalation']],
    ['ops', L('Pickup / pengiriman / masalah laundry', 'Pickup / delivery / laundry issue'), ['operational', 'pickup', 'delivery', 'housekeeping'], 'property', ['escalation']],
    ['billing', L('Invoice / pembayaran', 'Invoice / payment'), ['billing', 'payment', 'ar', 'tax'], 'any', []],
    ['complaint', L('Komplain', 'Complaint'), ['complaint'], 'property', ['escalation']],
    ['emergency', L('Darurat', 'Emergency'), ['emergency'], 'property', ['escalation']]
  ];
  M.recommend = function (cl, prop, purpose) {
    var P = by(M.PURPOSES.map(function (p) { return { k: p[0], n: p[1], roles: p[2], lvl: p[3], esc: p[4] }; }), 'k', purpose) || null; if (!P) return null;
    var pool = S().contacts.filter(function (c) { return c.cl === cl && c.active && (!prop || c.scope === 'all' || c.props.indexOf(prop) >= 0); });
    function score(c) {
      var hit = P.roles.filter(function (r) { return c.roles.indexOf(r) >= 0; }).length; if (!hit) return -1;
      var s = hit * 10 + (P.roles[0] && c.roles.indexOf(P.roles[0]) >= 0 ? 5 : 0);
      if (P.lvl === 'group') s += c.level === 'group' ? 20 : 0;
      if (P.lvl === 'property') s += c.level === 'property' && prop && c.props.indexOf(prop) >= 0 ? (c.scope === 'single' ? 25 : 18) : c.level === 'group' ? -8 : 0;
      return s;
    }
    var primary = pool.map(function (c) { return { c: c, s: score(c) }; }).filter(function (x) { return x.s >= 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.c; });
    var esc = P.esc.length ? pool.filter(function (c) { return primary.indexOf(c) !== 0 && P.esc.some(function (r) { return c.roles.indexOf(r) >= 0; }); }) : [];
    var why = { contract: L('Topik kontrak, harga dan renewal diputuskan di tingkat grup.', 'Contract, pricing and renewal are decided at group level.'), ops: L('Masalah harian ditangani PIC operasional property, bukan GM.', 'Daily issues go to the property operations PIC, not the GM.'), billing: L('Invoice dan pembayaran ke kontak finance / accounting.', 'Invoices and payments go to the finance / accounting contact.'), complaint: L('Komplain ke kontak komplain property; eskalasi bila perlu.', 'Complaints go to the property complaint contact; escalate when needed.'), emergency: L('Kontak darurat property, lalu eskalasi.', 'Property emergency contact, then escalation.') }[purpose];
    return { purpose: P, primary: primary.slice(0, 2), escalation: esc.slice(0, 1), why: why };
  };
  M.saveContact = function (ctx, d) {
    if (!can(ctx, 'com.contact.manage')) return deny(ctx, 'contact');
    if (!d.n || !String(d.n).trim()) return bad(L('Nama kontak wajib diisi.', 'Contact name is required.'));
    if (!d.cl || !M.client(d.cl)) return bad(L('Pilih klien.', 'Choose a client.'));
    if (!d.phone && !d.email) return bad(L('Isi telepon / WhatsApp atau email.', 'Enter a phone / WhatsApp or email.'));
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return bad(L('Format email tidak valid.', 'Invalid email format.'));
    var props = d.scope === 'all' ? [] : (d.props || []);
    if (d.scope === 'single' && props.length !== 1) return bad(L('Cakupan satu property: pilih tepat satu property.', 'Single-property scope: choose exactly one property.'));
    if (d.scope === 'sel' && props.length < 1) return bad(L('Pilih property untuk cakupan terpilih.', 'Choose the properties for the selected scope.'));
    if (props.some(function (p) { var x = M.prop(p); return !x || x.cl !== d.cl; })) return bad(L('Property harus milik klien yang sama.', 'Properties must belong to the same client.'));
    if (!d.roles || !d.roles.length) return bad(L('Pilih minimal satu peran kontak.', 'Choose at least one contact role.'));
    var c = d.id ? M.contact(d.id) : null, isNew = !c;
    var before = c ? { roles: c.roles.join(','), scope: c.scope + ':' + c.props.join(',') } : null;
    if (!c) { c = { id: 'CT-' + (900 + S().contacts.length), active: true, notes: '' }; S().contacts.push(c); }
    Object.assign(c, { n: String(d.n).trim(), pos: d.pos || '', dept: d.dept || '', cl: d.cl, level: d.level || (d.scope === 'all' ? 'group' : 'property'), scope: d.scope || 'single', props: props, phone: d.phone || '', wa: d.wa || d.phone || '', email: d.email || '', pref: d.pref || 'wa', roles: d.roles.slice() });
    if (d.notes !== undefined) c.notes = d.notes;
    save();
    if (isNew) { M.audit('CONTACT.ADD', ctx, { cl: d.cl, rec: c.id, to: c.n }); tlAdd(d.cl, 'CONTACT.ADD', ctx, { rec: c.id, to: c.n }); }
    else {
      if (before.roles !== c.roles.join(',')) { M.audit('CONTACT.ROLE', ctx, { cl: d.cl, rec: c.id, from: before.roles, to: c.roles.join(','), reason: d.reason }); tlAdd(d.cl, 'CONTACT.ROLE', ctx, { rec: c.id, from: before.roles, to: c.roles.join(', ') }); }
      else M.audit('CONTACT.EDIT', ctx, { cl: d.cl, rec: c.id, from: before.scope, to: c.scope + ':' + c.props.join(',') });
    }
    return { ok: true, contact: c };
  };
  M.setContactActive = function (ctx, id, active, reason) {
    if (!can(ctx, 'com.contact.manage')) return deny(ctx, id);
    var c = M.contact(id); if (!c) return bad(M.MSG.notfound, 'notfound');
    if (!active && (!reason || !String(reason).trim())) return bad(M.MSG.reason, 'reason');
    c.active = !!active; save();
    M.audit('CONTACT.STATUS', ctx, { cl: c.cl, rec: id, from: active ? 'inactive' : 'active', to: active ? 'active' : 'inactive', reason: reason });
    return { ok: true };
  };

  /* ---------- Client & property master (§3–§4, §57–§59) ---------- */
  function nextId(pre, arr, key) { var n = arr.map(function (x) { return +String(x[key || 'id']).replace(/\D/g, '').slice(0, 2); }).filter(function (x) { return !isNaN(x); }); return pre + String(Math.max.apply(null, n.concat([0])) + 1).padStart(2, '0'); }
  M.saveClient = function (ctx, d) {
    var c = d.id ? M.client(d.id) : null, isNew = !c;
    if (!can(ctx, isNew ? 'com.client.create' : 'com.client.edit')) return deny(ctx, d.id || 'client');
    if (!d.n || !String(d.n).trim()) return bad(L('Nama klien wajib diisi.', 'Client name is required.'));
    if (!M.CLIENT_TYPES[d.type]) return bad(L('Pilih jenis klien.', 'Choose the client type.'));
    if (d.status && !M.CLIENT_ST[d.status]) return bad();
    if (d.terms != null && (isNaN(d.terms) || d.terms < 0 || d.terms > 120)) return bad(L('Termin pembayaran 0–120 hari.', 'Payment terms 0–120 days.'));
    if (d.tax && !/^[\d.\-]{15,20}$/.test(d.tax)) return bad(L('Format NPWP tidak valid.', 'Invalid tax ID format.'));
    var dup = S().clients.filter(function (x) { return x !== c && x.n.toLowerCase() === String(d.n).trim().toLowerCase(); })[0];
    if (dup) return bad(L('Nama klien sudah dipakai oleh ' + dup.id + '.', 'The client name is already used by ' + dup.id + '.'), 'dup');
    var out = { ok: true, pending: [] };
    if (isNew) {
      c = { id: nextId('CL-', S().clients), n: '', legal: '', group: false, type: 'hotel', ind: '', tax: '', bill: '', addr: '', city: '', status: 'prospect', start: M.TODAY, am: empId(ctx), terms: 30, credit: 0, cur: 'IDR', taxable: true, notes: '' };
      S().clients.push(c);
    }
    var old = clone(c);
    ['n', 'legal', 'type', 'tax', 'addr', 'bill', 'city', 'am', 'taxable', 'notes', 'group'].forEach(function (k) { if (d[k] !== undefined) c[k] = k === 'n' ? String(d[k]).trim() : d[k]; });
    if (d.ind !== undefined) c.ind = typeof d.ind === 'string' ? L(d.ind, d.ind) : d.ind;
    if (isNew) { if (d.terms != null) c.terms = +d.terms; if (d.credit != null) c.credit = +d.credit; if (d.status) c.status = d.status; }
    else {
      // Status, payment terms and credit limit are controlled changes (§60).
      if (d.status && d.status !== c.status) { if (!d.reason) return bad(M.MSG.reason, 'reason'); c.status = d.status; M.audit('CLIENT.STATUS', ctx, { cl: c.id, rec: c.id, from: old.status, to: c.status, reason: d.reason }); tlAdd(c.id, 'CLIENT.STATUS', ctx, { from: T(M.CLIENT_ST[old.status][0]), to: T(M.CLIENT_ST[c.status][0]), reason: L(d.reason, d.reason) }); }
      if (d.terms != null && +d.terms !== c.terms) { var a1 = M.request(ctx, 'terms', { cl: c.id, rec: c.id, from: c.terms, to: +d.terms, reason: L(d.reason || '—', d.reason || '—'), eff: M.TODAY, impact: 0 }); if (a1.ok) out.pending.push(a1.approval.id); else return a1; }
      if (d.credit != null && +d.credit !== c.credit) { var a2 = M.requestCredit(ctx, c.id, +d.credit, d.reason || '—'); if (a2.ok) out.pending.push(a2.approval.id); else return a2; }
      if (d.am && d.am !== old.am) { M.audit('AM.CHANGE', ctx, { cl: c.id, rec: c.id, from: M.am(old.am), to: M.am(d.am), reason: d.reason }); tlAdd(c.id, 'AM.CHANGE', ctx, { from: M.am(old.am), to: M.am(d.am), reason: d.reason ? L(d.reason, d.reason) : null }); }
    }
    save();
    M.audit(isNew ? 'CLIENT.CREATE' : 'CLIENT.EDIT', ctx, { cl: c.id, rec: c.id, to: c.n });
    if (isNew) tlAdd(c.id, 'CLIENT.CREATE', ctx, { to: c.n });
    out.client = c; return out;
  };
  M.requestCredit = function (ctx, cl, to, reason) {
    if (!can(ctx, 'com.credit.edit')) return deny(ctx, cl);
    var c = M.client(cl); if (!c) return bad(M.MSG.notfound, 'notfound');
    if (isNaN(to) || to < 0) return bad(L('Limit kredit tidak valid.', 'Invalid credit limit.'));
    if (!reason || !String(reason).trim() || reason === '—') return bad(M.MSG.reason, 'reason');
    return M.request(ctx, 'credit', { cl: cl, rec: cl, from: c.credit, to: to, reason: L(reason, reason), eff: M.TODAY, impact: to - c.credit });
  };
  M.saveProperty = function (ctx, d) {
    var p = d.id ? M.prop(d.id) : null, isNew = !p;
    if (!can(ctx, isNew ? 'com.property.create' : 'com.property.edit')) return deny(ctx, d.id || 'property');
    if (!d.n || !String(d.n).trim()) return bad(L('Nama property wajib diisi.', 'Property name is required.'));
    var cl = M.client(d.cl || (p && p.cl)); if (!cl) return bad(L('Pilih klien (grup) property ini.', 'Choose the client (group) of this property.'));
    if (S().props.some(function (x) { return x !== p && x.cl === cl.id && x.n.toLowerCase() === String(d.n).trim().toLowerCase(); })) return bad(L('Nama property sudah ada di klien ini.', 'This client already has a property with that name.'), 'dup');
    if (d.status && !M.PROP_ST[d.status]) return bad();
    ['op', 'bill', 'pick', 'cmp'].forEach(function (k) { if (d[k] && (!M.contact(d[k]) || M.contact(d[k]).cl !== cl.id)) d[k] = null; });
    var old = p ? clone(p) : null, stAud = false;
    if (isNew) {
      var n = M.propsOf(cl.id, true).length, id = 'PR-' + cl.id.slice(3) + String.fromCharCode(65 + n);
      p = { id: id, n: '', cl: cl.id, type: cl.type, addr: cl.addr, city: cl.city, op: null, bill: null, pick: null, cmp: null, pickup: L('Belum dijadwalkan', 'Not scheduled'), delivery: L('Belum dijadwalkan', 'Not scheduled'), billing: 'client', status: 'active', start: M.TODAY, instr: '', notes: '' };
      S().props.push(p);
    }
    ['n', 'type', 'addr', 'city', 'op', 'bill', 'pick', 'cmp', 'billing', 'notes'].forEach(function (k) { if (d[k] !== undefined && d[k] !== null) p[k] = k === 'n' ? String(d[k]).trim() : d[k]; });
    ['pickup', 'delivery', 'instr'].forEach(function (k) { if (d[k] !== undefined) p[k] = typeof d[k] === 'string' ? L(d[k], d[k]) : d[k]; });
    if (d.status && old && d.status !== old.status) {
      if (!d.reason) return bad(M.MSG.reason, 'reason');
      p.status = d.status; stAud = true; M.audit('PROPERTY.STATUS', ctx, { cl: cl.id, rec: p.id, from: old.status, to: p.status, reason: d.reason }); tlAdd(cl.id, 'PROPERTY.STATUS', ctx, { prop: p.id, from: T(M.PROP_ST[old.status][0]), to: T(M.PROP_ST[p.status][0]), reason: L(d.reason, d.reason) });
    } else if (d.status && isNew) p.status = d.status;
    save();
    if (!stAud) M.audit(isNew ? 'PROPERTY.ADD' : 'PROPERTY.EDIT', ctx, { cl: cl.id, rec: p.id, to: p.n });
    if (isNew) tlAdd(cl.id, 'PROPERTY.ADD', ctx, { prop: p.id, to: p.n });
    return { ok: true, prop: p };
  };

  /* ---------- Billing, revenue, profitability (§44) ---------- */
  var BB = {}; D.BILLING_BASE.forEach(function (b) { BB[b[0]] = { prop: b[0], base: b[1], g: b[2], revKg: b[3], costKg: b[4], ord: b[5], first: b[6], mix: b[7] }; });
  M.billing = function (prop, i) {
    if (i == null) i = 12;
    var key = prop + '|' + i; if (bCache[key] !== undefined) return bCache[key];
    var b = BB[prop]; if (!b || i < b.first || (D.BILLING_STOP[prop] != null && i >= D.BILLING_STOP[prop])) return (bCache[key] = null);
    var kg = Math.round(b.base * (1 + b.g * i) * D.SEASON[i]), date = D.MONTHS[i] + '-15', svcs = {}, rev = 0, cost = 0, keys = Object.keys(b.mix);
    var share = {}; keys.forEach(function (s) { share[s] = b.mix[s]; });
    keys.forEach(function (s) { var st = D.SVC_START[prop + '|' + s]; if (st != null && i < st) { share[keys[0]] += share[s]; share[s] = 0; } });
    keys.forEach(function (s) {
      if (!share[s]) return;
      var skg = kg * share[s], sv = M.service(s), pcsKg = D.PCS_KG[s], qty = sv && sv.unit === 'pcs' ? Math.round(skg / (pcsKg || 1)) : Math.round(skg);
      var r = M.rateOn(prop, s, date, { legacy: true }), srev = Math.round(qty * (r ? r.rate : b.revKg)), scost = Math.round(skg * b.costKg * (D.SVC_COST[s] || 1));
      svcs[s] = { svc: s, kg: Math.round(skg), qty: qty, unit: sv ? sv.unit : 'kg', rate: r ? r.rate : null, rc: r ? r.rc : null, v: r ? r.v : null, src: r ? r.src : null, rev: srev, cost: scost };
      rev += srev; cost += scost;
    });
    return (bCache[key] = { prop: prop, i: i, m: D.MONTHS[i], kg: kg, orders: Math.round(kg / 100 * b.ord * 10), rev: rev, cost: cost, svcs: svcs });
  };
  M._clearCache = function () { bCache = {}; hCache = {}; };
  function agg(list) { var o = { kg: 0, rev: 0, cost: 0, orders: 0 }; list.forEach(function (b) { if (!b) return; o.kg += b.kg; o.rev += b.rev; o.cost += b.cost; o.orders += b.orders; }); o.contrib = o.rev - o.cost; o.margin = o.rev ? r1(o.contrib / o.rev * 100) : null; o.costKg = o.kg ? Math.round(o.cost / o.kg) : null; o.profitKg = o.kg ? Math.round(o.contrib / o.kg) : null; o.revKg = o.kg ? Math.round(o.rev / o.kg) : null; return o; }
  M.clientMonth = function (cl, i) { return agg(M.propsOf(cl, true).map(function (p) { return M.billing(p.id, i); })); };
  M.series = function (cl, key, prop) { return D.MONTHS.map(function (m, i) { var x = prop ? agg([M.billing(prop, i)]) : M.clientMonth(cl, i); return x[key || 'rev']; }); };
  // §44 Client → Property → Service → source (rate card line, cost per kg).
  M.profit = function (cl, i) {
    if (i == null) i = 12;
    var props = M.propsOf(cl, true).map(function (p) {
      var b = M.billing(p.id, i), x = agg([b]);
      var svcs = b ? Object.keys(b.svcs).map(function (s) { var v = b.svcs[s]; return Object.assign({}, v, { contrib: v.rev - v.cost, margin: v.rev ? r1((v.rev - v.cost) / v.rev * 100) : null, costKg: v.kg ? Math.round(v.cost / v.kg) : null, profitKg: v.kg ? Math.round((v.rev - v.cost) / v.kg) : null, costPcs: v.unit === 'pcs' && v.qty ? Math.round(v.cost / v.qty) : null, profitPcs: v.unit === 'pcs' && v.qty ? Math.round((v.rev - v.cost) / v.qty) : null }); }).sort(function (a, b2) { return b2.rev - a.rev; }) : [];
      return Object.assign({ prop: p.id, n: p.n, svcs: svcs, costPerKgBase: (BB[p.id] || {}).costKg || null }, x);
    }).filter(function (p) { return p.rev > 0; });
    var tot = agg(props.map(function (p) { return { kg: p.kg, rev: p.rev, cost: p.cost, orders: p.orders }; }));
    return Object.assign({ cl: cl, i: i, m: D.MONTHS[i], props: props }, tot);
  };
  M.portfolio = function (ctx, i) {
    return M.visibleClients(ctx).map(function (c) { var p = M.profit(c.id, i); return { cl: c.id, n: c.n, rev: p.rev, cost: p.cost, contrib: p.contrib, margin: p.margin, kg: p.kg, profitKg: p.profitKg }; }).filter(function (x) { return x.rev > 0; }).sort(function (a, b) { return b.rev - a.rev; });
  };

  /* ---------- Finance connection (§50): reads the Phase 5 ledger ---------- */
  function ledger() {
    var F = root.JFPERF && root.JFPERF.D ? root.JFPERF.D : (root.JFPERF_DATA || null);
    if (!F && typeof require !== 'undefined') { try { F = require('./jfos-perf-data.js'); } catch (e) { F = null; } }
    return F && F.FIN ? F.FIN : null;
  }
  // Joins the open invoices of the Phase 6 clients to the one AR ledger (idempotent).
  M.joinLedger = function () {
    var F = ledger(); if (!F) return 0;
    var n = 0; D.AR_EXTRA.forEach(function (x) { if (!F.ar.some(function (y) { return y.inv === x.inv; })) { F.ar.push(clone(x)); n++; } });
    return n;
  };
  M.finance = function (cl) {
    var F = ledger(), c = M.client(cl); if (!c) return null;
    var items = F ? F.ar.filter(function (x) { return x.cl === cl; }).map(function (x) { var age = M.days(x.due, M.TODAY); return Object.assign({}, x, { age: age, bucket: age <= 0 ? 'current' : age <= 30 ? 'b30' : age <= 60 ? 'b60' : age <= 90 ? 'b90' : 'b90p' }); }) : [];
    var total = sum(items.map(function (x) { return x.amt; })), overdue = sum(items.filter(function (x) { return x.age > 0; }).map(function (x) { return x.amt; }));
    var buckets = { current: 0, b30: 0, b60: 0, b90: 0, b90p: 0 }; items.forEach(function (x) { buckets[x.bucket] += x.amt; });
    var oldest = items.length ? Math.max.apply(null, items.map(function (x) { return x.age; })) : 0;
    return { src: F ? 'ledger' : null, items: items, total: total, overdue: overdue, overdueShare: total ? r1(overdue / total * 100) : 0, buckets: buckets, oldest: oldest, credit: c.credit, util: c.credit ? r1(total / c.credit * 100) : null, over: c.credit ? total > c.credit : false, terms: c.terms, payDays: D.PAY_DAYS[cl] != null ? D.PAY_DAYS[cl] : null };
  };

  /* ---------- Complaints (§52) ---------- */
  M.complaints = function (cl, prop) {
    var list = D.COMPLAINTS.filter(function (x) { return x.cl === cl && (!prop || x.prop === prop); });
    var trend = D.COMPLAINT_MONTH[cl] || null, m = M.clientMonth(cl, 12);
    return { list: list, open: list.filter(function (x) { return x.st === 'open'; }).length, resolved: list.filter(function (x) { return x.st === 'resolved'; }).length, claim: sum(list.map(function (x) { return x.claim; })),
      damage: list.filter(function (x) { return x.type === 'damage'; }).length, lost: list.filter(function (x) { return x.type === 'lost'; }).length, trend: trend, rate: trend && m.kg ? r1(trend[12] / (m.kg / 1000) * 100) / 100 : null };
  };

  /* ---------- Renewals (§37–§39, §71) ---------- */
  M.renewalOf = function (no) { return by(S().rnw, 'ctr', no); };
  M.renewalCard = function (no) {
    var c = M.contract(no); if (!c) return null;
    var r = M.renewalOf(no), left = M.days(M.TODAY, c.end), next = S().contracts.filter(function (x) { return x.renewalOf === no; })[0] || null;
    var stage = r ? r.stage : (left <= M.cfg().warn[0] ? 'upcoming' : null);
    var stalled = !!(r && r.stage === 'negotiation' && M.days(r.since, M.TODAY) > M.cfg().stall);
    return { no: no, c: c, cl: c.cl, props: c.props, end: c.end, left: left, am: c.owner, stage: stage, st: M.ctrStatus(c), next: r ? r.next : L('Mulai review akun', 'Start the account review'), follow: r ? r.follow : addDays(M.TODAY, 7), risk: r ? r.risk : (left < 30 ? 'high' : 'medium'), opp: r ? r.opp : '', r: r, stalled: stalled, newCtr: next ? next.no : null, since: r ? r.since : null };
  };
  M.renewals = function (ctx, f) {
    f = f || {};
    return M.contractNos().map(M.renewalCard).filter(function (x) {
      if (!x || !M.canSeeClient(ctx, x.cl)) return false;
      if (x.c.renewalOf) return false;
      if (['draft', 'review', 'terminated'].indexOf(x.st) >= 0) return false;
      if (!x.stage && x.left > M.cfg().warn[0]) return false;
      if (f.stage && x.stage !== f.stage) return false;
      if (f.bucket && M.bucketOf(x) !== f.bucket && !(f.bucket === 'prog' && x.r && ['review', 'proposal', 'negotiation'].indexOf(x.stage) >= 0) && !(f.bucket === 'appr' && x.stage === 'approval')) return false;
      return true;
    }).sort(function (a, b) { return a.left - b.left; });
  };
  M.bucketOf = function (x) { return x.left < 0 ? 'expired' : x.left <= 30 ? 'd30' : x.left <= 60 ? 'd60' : x.left <= 90 ? 'd90' : null; };
  M.BUCKETS = [['d30', L('Berakhir ≤ 30 hari', 'Expiring in 30 days')], ['d60', L('31–60 hari', 'In 60 days')], ['d90', L('61–90 hari', 'In 90 days')], ['expired', L('Sudah berakhir', 'Expired')], ['prog', L('Renewal berjalan', 'Renewal in progress')], ['appr', L('Menunggu approval', 'Approval pending')]];
  M.renewalBuckets = function (ctx) {
    var all = M.renewals(ctx), o = {};
    M.BUCKETS.forEach(function (b) { o[b[0]] = all.filter(function (x) { return b[0] === 'prog' ? x.r && ['review', 'proposal', 'negotiation'].indexOf(x.stage) >= 0 : b[0] === 'appr' ? x.stage === 'approval' : M.bucketOf(x) === b[0]; }); });
    return o;
  };
  M.startRenewal = function (ctx, no, note) {
    if (!can(ctx, 'com.renewal.manage')) return deny(ctx, no);
    var c = M.contract(no); if (!c) return bad(M.MSG.notfound, 'notfound');
    if (M.renewalOf(no)) return bad(L('Renewal untuk kontrak ini sudah berjalan.', 'A renewal for this contract is already running.'), 'dup');
    var r = { ctr: no, stage: 'review', since: M.TODAY, next: L(note || 'Review akun dan volume', note || 'Review account and volume'), follow: addDays(M.TODAY, 7), risk: M.days(M.TODAY, c.end) < 30 ? 'high' : 'medium', opp: '', owner: empId(ctx) };
    S().rnw.push(r); save();
    M.audit('RENEWAL.START', ctx, { cl: c.cl, rec: no, to: 'review' }); tlAdd(c.cl, 'RENEWAL.START', ctx, { rec: no });
    return { ok: true, renewal: r };
  };
  M.moveRenewal = function (ctx, no, stage, o) {
    o = o || {};
    if (!can(ctx, 'com.renewal.manage')) return deny(ctx, no);
    var r = M.renewalOf(no), c = M.contract(no); if (!r || !c) return bad(M.MSG.notfound, 'notfound');
    var keys = M.STAGES.map(function (s) { return s[0]; });
    if (keys.indexOf(stage) < 0) return bad();
    if (stage === 'renewed' && !S().contracts.some(function (x) { return x.renewalOf === no && ['active', 'approved'].indexOf(x.status) >= 0; })) return bad(L('Renewed hanya setelah kontrak baru disetujui.', 'Renewed only after the new contract is approved.'), 'flow');
    var from = r.stage; r.stage = stage; r.since = M.TODAY; if (o.next) r.next = L(o.next, o.next); if (o.follow) r.follow = o.follow; if (o.risk && M.RISK[o.risk]) r.risk = o.risk; save();
    M.audit('RENEWAL.STAGE', ctx, { cl: c.cl, rec: no, from: from, to: stage, reason: o.note || null });
    tlAdd(c.cl, 'RENEWAL.STAGE', ctx, { rec: no, from: T(by(M.STAGES.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', from).n), to: T(by(M.STAGES.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', stage).n), reason: o.note ? L(o.note, o.note) : null });
    return { ok: true };
  };
  // §71 expiry warning level for a date: the smallest configured threshold that is still ≥ days left.
  M.warnLevel = function (end) { var left = M.days(M.TODAY, end), w = M.cfg().warn.slice().sort(function (a, b) { return a - b; }); if (left < 0) return { left: left, th: 0 }; for (var i = 0; i < w.length; i++) if (left <= w[i]) return { left: left, th: w[i] }; return { left: left, th: null }; };

  /* ---------- Approvals (§41, §75) ---------- */
  M.request = function (ctx, kind, d, skipPerm, draft) {
    var k = M.APR_KINDS[kind]; if (!k) return bad();
    if (!skipPerm) { var need = { rate: 'com.rate.edit', discount: 'com.rate.edit', credit: 'com.credit.edit', terms: 'com.credit.edit', contract: 'com.contract.edit', special: 'com.contract.edit', slaexc: 'com.sla.edit', creditnote: 'com.credit.edit' }[kind]; if (!can(ctx, need) && !(kind === 'creditnote' && can(ctx, 'com.rate.edit')) && !(kind === 'slaexc' && can(ctx, 'com.sla.clock'))) return deny(ctx, kind); }
    if (!d.reason || !T(d.reason).trim() || T(d.reason) === '—') return bad(M.MSG.reason, 'reason');
    var a = Object.assign({ id: 'APC-' + String(S().apr.length + 1).padStart(3, '0'), kind: kind, prop: null, svc: null, attach: '', impact: 0, by: empId(ctx), at: isoT(M.now()), st: draft ? 'draft' : 'pending', revBy: null, revAt: null, note: null }, d);
    S().apr.push(a); save();
    M.audit('APPROVAL.REQUEST', ctx, { cl: a.cl, rec: a.id + ' · ' + a.rec, from: a.from, to: a.to, reason: T(a.reason) });
    return { ok: true, approval: a };
  };
  M.approvals = function (ctx, f) {
    f = f || {};
    return S().apr.filter(function (a) {
      if (!M.canSeeClient(ctx, a.cl)) return false;
      if (f.st === 'pending' && a.st !== 'pending') return false;
      if (f.st === 'done' && ['approved', 'rejected', 'returned'].indexOf(a.st) < 0) return false;
      if (f.kind && a.kind !== f.kind) return false;
      if (f.cl && a.cl !== f.cl) return false;
      // Viewers see what they can decide and what they asked for.
      if (f.mine && !(can(ctx, M.APR_KINDS[a.kind].p) || a.by === empId(ctx))) return false;
      return true;
    }).map(function (a) { return Object.assign({ canAct: a.st === 'pending' && can(ctx, M.APR_KINDS[a.kind].p) && a.by !== empId(ctx), mine: a.by === empId(ctx) }, a); })
      .sort(function (a, b) { return (a.st === 'pending' ? 0 : 1) - (b.st === 'pending' ? 0 : 1) || ms(b.at) - ms(a.at); });
  };
  M.approval = function (id) { return by(S().apr, 'id', id); };
  M.decide = function (ctx, id, decision, note) {
    var a = M.approval(id); if (!a) return bad(M.MSG.notfound, 'notfound');
    if (a.st !== 'pending') return bad(L('Permintaan ini sudah diputuskan.', 'This request has already been decided.'), 'done');
    if (!can(ctx, M.APR_KINDS[a.kind].p)) return deny(ctx, id);
    if (a.by === empId(ctx)) return bad(M.MSG.self, 'self');
    if (['approve', 'reject', 'return'].indexOf(decision) < 0) return bad();
    if (decision !== 'approve' && (!note || !String(note).trim())) return bad(M.MSG.reason, 'reason');
    a.st = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'returned'; a.revBy = empId(ctx); a.revAt = isoT(M.now()); a.note = note ? L(note, note) : null;
    if (decision === 'approve') applyApproval(ctx, a);
    else if (a.kind === 'contract' && a.ver) { var cv = M.contractV(a.rec, a.ver); if (cv && cv.status === 'review') cv.status = decision === 'reject' ? 'rejected' : 'returned'; }
    save();
    M.audit(decision === 'approve' ? 'APPROVAL.APPROVE' : decision === 'reject' ? 'APPROVAL.REJECT' : 'APPROVAL.RETURN', ctx, { cl: a.cl, rec: a.id + ' · ' + a.rec, from: a.from, to: a.to, reason: note || null, appr: { by: a.revBy, at: a.revAt, decision: a.st } });
    tlAdd(a.cl, decision === 'approve' ? 'APPROVAL.APPROVE' : decision === 'reject' ? 'APPROVAL.REJECT' : 'APPROVAL.RETURN', ctx, { rec: a.rec, prop: a.prop, from: a.from != null ? String(T(a.from)) : null, to: a.to != null ? String(T(a.to)) : null, reason: a.note || a.reason });
    return { ok: true, approval: a };
  };
  // Approved requests take effect through the normal versioned paths (never an overwrite of history).
  function applyApproval(ctx, a) {
    var c;
    switch (a.kind) {
      case 'rate': case 'discount': applyRate(ctx, a); break;
      case 'credit': c = M.client(a.cl); if (c) { tlAdd(a.cl, 'CREDIT.CHANGE', ctx, { from: c.credit, to: a.to, reason: a.reason }); c.credit = +a.to; } break;
      case 'terms': c = M.client(a.cl); if (c) { tlAdd(a.cl, 'TERMS.CHANGE', ctx, { from: 'Net ' + c.terms, to: 'Net ' + a.to, reason: a.reason }); c.terms = +a.to; } break;
      case 'contract': {
        var v = a.ver ? M.contractV(a.rec, a.ver) : M.contractVersions(a.rec)[0]; if (!v) break;
        var live = ms(v.eff) <= ms(M.TODAY) && ms(v.start) <= ms(M.TODAY);
        if (v.v > 1) M.contractVersions(a.rec).forEach(function (o) { if (o !== v && live && ['active', 'approved'].indexOf(o.status) >= 0) o.status = 'archived'; });
        v.status = live ? 'active' : 'approved'; v.apprBy = empId(ctx);
        tlAdd(a.cl, v.v > 1 ? 'CONTRACT.VERSION' : 'CONTRACT.SIGNED', ctx, { rec: a.rec, from: a.from, to: a.to, reason: a.reason });
        if (v.renewalOf) { var r = M.renewalOf(v.renewalOf); if (r) { r.stage = 'renewed'; r.since = M.TODAY; } tlAdd(a.cl, 'CONTRACT.RENEWED', ctx, { rec: v.renewalOf, to: v.no }); }
        break;
      }
      case 'special': c = by(S().contracts, 'no', a.rec); if (c) { var cur = M.contract(a.rec); if (cur) cur.special = a.to; tlAdd(a.cl, 'SPECIAL.TERM', ctx, { rec: a.rec, from: a.from, to: a.to }); } break;
      case 'slaexc': {
        var base = by(S().sla, 'id', a.rec), p = a.prop ? M.prop(a.prop) : null;
        S().sla.push(Object.assign(clone(base || {}), { id: 'SLA-EXC-' + a.id.slice(4), n: L('Pengecualian ' + (p ? p.n : a.cl), 'Exception ' + (p ? p.n : a.cl)), cl: a.cl, prop: a.prop, svc: base ? base.svc : null, tat: +a.to, eff: a.eff, exp: base && base.exp ? base.exp : null, status: 'active', reviewDue: null }));
        tlAdd(a.cl, 'SLA.RULE', ctx, { prop: a.prop, rec: a.rec, from: a.from + ' ' + T(L('jam', 'hours')), to: a.to + ' ' + T(L('jam', 'hours')), reason: a.reason });
        break;
      }
      case 'creditnote': S().cn.push({ id: 'CN-' + a.id.slice(4), inv: a.rec, cl: a.cl, amt: +a.to, at: isoT(M.now()), appr: empId(ctx) }); tlAdd(a.cl, 'CREDITNOTE.ISSUE', ctx, { rec: a.rec, to: a.to }); break;
    }
  }
  M.resubmit = function (ctx, id, changes) {
    var a = M.approval(id); if (!a) return bad(M.MSG.notfound, 'notfound');
    if (a.by !== empId(ctx)) return deny(ctx, id);
    if (['returned', 'draft'].indexOf(a.st) < 0) return bad(L('Hanya permintaan draft atau yang dikembalikan yang bisa diajukan ulang.', 'Only drafts or returned requests can be resubmitted.'), 'flow');
    Object.assign(a, changes || {}, { st: 'pending', at: isoT(M.now()) });
    if (a.kind === 'contract' && a.ver) { var cv = M.contractV(a.rec, a.ver); if (cv) cv.status = 'review'; }
    save(); M.audit('APPROVAL.REQUEST', ctx, { cl: a.cl, rec: a.id + ' · ' + a.rec, from: a.from, to: a.to, reason: T(a.reason) });
    return { ok: true };
  };

  /* ---------- Client Health (§42–§43, §66, §74) ---------- */
  function bandOf(s) { var b = M.cfg().bands; return s == null ? 'nodata' : s >= b[0] ? 'healthy' : s >= b[1] ? 'attention' : s >= b[2] ? 'risk' : 'critical'; }
  M.band = bandOf;
  function metrics(cl, i) {
    var c = M.client(cl), now = M.clientMonth(cl, i), prev = M.clientMonth(cl, i - 1), ly = i >= 12 ? M.clientMonth(cl, i - 12) : null, q3 = i >= 3 ? M.clientMonth(cl, i - 3) : null, fin = M.finance(cl), sla = M.slaPerf(cl);
    var act = M.activeContracts(cl), next = act.slice().sort(function (a, b) { return ms(a.end) - ms(b.end); })[0] || null, expired = M.contracts(null, { cl: cl }).filter(function (x) { return M.ctrStatus(x) === 'expired'; }), cm = D.COMPLAINT_MONTH[cl];
    var rnws = M.contracts(null, { cl: cl }).map(function (x) { return M.renewalCard(x.no); }).filter(function (x) { return x && x.r; });
    return { c: c, now: now, prev: prev, ly: ly, q3: q3, fin: fin, sla: sla, next: next, act: act, expired: expired, cm: cm, rnws: rnws, tgt: D.REV_TARGET[cl] || null };
  }
  function dimScore(k, m, i) {
    var v = null, s = null, unit = '', note = null, src = null;
    switch (k) {
      case 'revenue': if (m.now.rev && m.tgt) { v = r1(m.now.rev / m.tgt * 100); s = clamp((v - 50) * 2, 0, 100); unit = '%'; note = L('Revenue bulan ini vs target', 'This month\'s revenue vs target'); src = 'HEALTH-001'; } break;
      // Growth over 3 months, season-adjusted, so this month and last month are scored the same way (trend §42).
      case 'revGrowth': if (m.now.rev && m.q3 && m.q3.rev) { v = r1(((m.now.rev / D.SEASON[i]) / (m.q3.rev / D.SEASON[i - 3]) - 1) * 100); s = clamp(70 + v * 6, 0, 100); unit = '%'; note = L('Revenue 3 bulan, disesuaikan musim', 'Revenue over 3 months, season-adjusted'); } break;
      case 'volGrowth': if (m.now.kg && m.q3 && m.q3.kg) { v = r1(((m.now.kg / D.SEASON[i]) / (m.q3.kg / D.SEASON[i - 3]) - 1) * 100); s = clamp(70 + v * 6, 0, 100); unit = '%'; note = L('Volume kg 3 bulan, disesuaikan musim', 'Volume kg over 3 months, season-adjusted'); } break;
      case 'sla': if (m.sla.ot != null && m.now.kg) { v = m.sla.ot; s = clamp((v - 80) / 18 * 100, 0, 100); unit = '%'; note = L('On-time % (on track + at risk)', 'On-time % (on track + at risk)'); } break;
      case 'complaint': if (m.cm && m.now.kg) { var cnt = m.cm[i], open = D.COMPLAINTS.filter(function (x) { return x.cl === m.c.id && x.st === 'open'; }).length; v = Math.round(cnt / (m.now.kg / 1000) * 100) / 100; s = clamp(100 - v * 40 - (i === 12 ? open * 4 : 0), 0, 100); unit = '/1.000 kg'; note = L('Komplain per 1.000 kg, dikurangi komplain terbuka', 'Complaints per 1,000 kg, less open complaints'); } break;
      case 'payment': if (D.PAY_DAYS[m.c.id] != null && m.now.kg && m.c.terms > 0) { v = D.PAY_DAYS[m.c.id]; s = clamp(100 - v * 2.5, 0, 100); unit = L(' hari', ' days'); note = L('Rata-rata hari bayar lewat jatuh tempo (6 bulan)', 'Average days paid after due date (6 months)'); } break;
      case 'ar': if (m.fin && m.fin.src && m.now.kg && m.c.terms > 0) { v = m.fin.overdueShare; s = clamp(100 - v * 0.8 - Math.max(0, m.fin.oldest - 30) * 0.5, 0, 100); unit = '%'; note = L('Porsi AR jatuh tempo dan umur tertua', 'Overdue AR share and oldest age'); } break;
      case 'contract': if (m.c.type !== 'personal') { if (m.next) { var left = M.days(M.TODAY, m.next.end); v = left; var renewing = M.renewalOf(m.next.no); s = left > 90 ? 100 : left > 30 ? (renewing ? 85 : 75) : (renewing ? 65 : 50); unit = L(' hari', ' days'); note = L('Hari sampai kontrak terdekat berakhir', 'Days until the nearest contract ends'); } else if (m.expired.length) { v = M.days(M.TODAY, m.expired[0].end); s = 15; unit = L(' hari', ' days'); note = L('Kontrak sudah berakhir', 'Contract already ended'); } else if (m.c.status === 'active') { v = 0; s = 0; note = L('Belum ada kontrak aktif', 'No active contract'); } } break;
      case 'retention': if (m.c.type !== 'personal' && m.c.status !== 'prospect') { var worst = m.rnws.map(function (r) { return (r.risk === 'high' ? 30 : r.risk === 'medium' ? 60 : 90) - (r.stalled ? 15 : 0); }); s = worst.length ? Math.min.apply(null, worst) : m.expired.length ? 20 : 90; v = s; note = L('Risiko renewal (tinggi 30 · sedang 60 · rendah 90, negosiasi macet −15)', 'Renewal risk (high 30 · medium 60 · low 90, stalled negotiation −15)'); } break;
      case 'profit': if (m.now.rev) { v = m.now.margin; s = clamp((v - 10) / 25 * 100, 0, 100); unit = '%'; note = L('Margin kontribusi', 'Contribution margin'); } break;
    }
    return { v: v, s: s == null ? null : r1(s), unit: unit, note: note };
  }
  M.health = function (cl, i) {
    if (i == null) i = 12;
    var key = cl + '|' + i; if (hCache[key]) return hCache[key];
    var c = M.client(cl); if (!c) return null;
    var m = metrics(cl, i), w = M.cfg().hw, dims = M.HEALTH_DIMS.map(function (d) { var x = dimScore(d.k, m, i); return Object.assign({ k: d.k, n: d.n, icon: d.icon, src: d.src, w: w[d.k] }, x, { st: bandOf(x.s) }); });
    var have = dims.filter(function (d) { return d.s != null; }), wsum = sum(have.map(function (d) { return d.w; }));
    have.forEach(function (d) { d.ew = r1(d.w / wsum * 100); d.ws = r1(d.s * d.w / wsum); });
    var score = have.length >= 4 ? r1(sum(have.map(function (d) { return d.s * d.w; })) / wsum) : null;
    var adj = sum(S().hadj.filter(function (a) { return a.cl === cl; }).map(function (a) { return a.delta; }));
    if (score != null && adj && i === 12) score = r1(clamp(score + adj, 0, 100));
    var missing = dims.filter(function (d) { return d.s == null; });
    var excluded = missing.filter(function (d) { return (d.k === 'contract' || d.k === 'retention' || d.k === 'sla') && c.type === 'personal' || (d.k === 'payment' || d.k === 'ar') && c.terms === 0; });
    var gaps = missing.filter(function (d) { return excluded.indexOf(d) < 0; });
    var h = { cl: cl, i: i, score: score, st: bandOf(score), dims: dims, wsum: wsum, adj: adj, incomplete: gaps.length > 0, gaps: gaps.map(function (d) { return d.k; }), excluded: excluded.map(function (d) { return d.k; }), at: M.now(), calc: D.MONTHS[i] };
    if (i === 12) { var p = M.health(cl, 11); h.prev = p ? p.score : null; h.trend = p && p.score != null && score != null ? r1(score - p.score) : null; dims.forEach(function (d) { var pd = p ? by(p.dims, 'k', d.k) : null; d.trend = pd && pd.s != null && d.s != null ? r1(d.s - pd.s) : null; }); }
    return (hCache[key] = h);
  };
  M.trendKey = function (d) { return d == null ? 'stable' : d >= 2 ? 'up' : d <= -2 ? 'down' : 'stable'; };
  M.SOURCES = {
    billing: { n: L('Billing & volume (bulan tutup)', 'Billing & volume (closed month)'), at: '2026-09-30 23:59', max: 40 * 24 * 60 },
    sla: { n: L('SLA operasional', 'Operations SLA'), at: '2026-10-06 12:30', max: 120 },
    complaint: { n: L('Komplain & quality', 'Complaints & quality'), at: '2026-10-06 11:50', max: 24 * 60 },
    finance: { n: L('AR & pembayaran (Financial Health)', 'AR & payments (Financial Health)'), at: '2026-10-06 08:00', max: 24 * 60 },
    contract: { n: L('Kontrak', 'Contracts'), at: null, max: 0 }, renewal: { n: L('Renewal', 'Renewal'), at: null, max: 0 }
  };
  // §74 freshness of each source (live sources have no age).
  M.sourceAge = function (k) { var s = M.SOURCES[k]; if (!s || !s.at) return { k: k, n: s ? s.n : k, min: 0, live: true, stale: false, at: M.now() }; var min = Math.max(0, Math.round((M.now() - ms(s.at)) / 60000)); return { k: k, n: s.n, at: ms(s.at), min: min, stale: min > s.max, live: false }; };
  // §66 drill-down: dimension → metric → property → service → source.
  M.explain = function (cl, k) {
    var h = M.health(cl); if (!h) return null;
    var d = by(h.dims, 'k', k); if (!d) return null;
    var props = M.propsOf(cl, true).map(function (p) {
      var b = M.billing(p.id, 12), ly = M.billing(p.id, 9), pr = M.billing(p.id, 11), sl = M.slaPerf(cl, p.id), x = { prop: p.id, n: p.n, v: null, unit: d.unit, svcs: [] };
      if (!b) return null;
      if (k === 'revenue') { x.v = b.rev; x.unit = 'Rp'; x.svcs = Object.keys(b.svcs).map(function (s) { var v = b.svcs[s]; return { svc: s, v: v.rev, unit: 'Rp', src: (v.rc ? v.rc + ' v' + v.v : T(L('Harga master', 'Master price'))) + ' · ' + v.qty + ' ' + v.unit + ' × Rp ' + v.rate }; }); }
      if (k === 'revGrowth') { x.v = ly && ly.rev ? r1(((b.rev / D.SEASON[12]) / (ly.rev / D.SEASON[9]) - 1) * 100) : null; x.unit = '%'; x.svcs = Object.keys(b.svcs).map(function (s) { var a = b.svcs[s], o = ly && ly.svcs[s]; return { svc: s, v: o && o.rev ? r1((a.rev / o.rev - 1) * 100) : null, unit: '%', src: o ? 'Rp ' + o.rate + ' → Rp ' + a.rate : T(L('Layanan baru', 'New service')) }; }); }
      if (k === 'volGrowth') { x.v = ly && ly.kg ? r1(((b.kg / D.SEASON[12]) / (ly.kg / D.SEASON[9]) - 1) * 100) : null; x.unit = '%'; x.svcs = Object.keys(b.svcs).map(function (s) { var a = b.svcs[s], o = ly && ly.svcs[s]; return { svc: s, v: o && o.kg ? r1((a.kg / o.kg - 1) * 100) : null, unit: '%', src: (o ? o.kg : 0) + ' → ' + a.kg + ' kg' }; }); }
      if (k === 'sla') { x.v = sl.ot; x.unit = '%'; x.svcs = sl.rows.map(function (r) { return { svc: r.svc, v: r.ot, unit: '%', src: r.on + ' on track · ' + r.risk + ' at risk · ' + r.late + ' late · TAT ' + r.tat + 'h' }; }); }
      if (k === 'complaint') { var cp = D.COMPLAINTS.filter(function (y) { return y.prop === p.id; }); x.v = cp.length; x.unit = T(L(' komplain', ' complaints')); x.svcs = cp.map(function (y) { return { svc: null, v: null, unit: '', src: y.id + ' · ' + y.type + ' · ' + y.st + ' · ' + y.date, rec: y.id }; }); }
      if (k === 'profit') { x.v = b.rev ? r1((b.rev - b.cost) / b.rev * 100) : null; x.unit = '%'; x.svcs = Object.keys(b.svcs).map(function (s) { var v = b.svcs[s]; return { svc: s, v: v.rev ? r1((v.rev - v.cost) / v.rev * 100) : null, unit: '%', src: 'Rp ' + Math.round(v.cost / Math.max(1, v.kg)) + '/kg ' + T(L('biaya', 'cost')) }; }); }
      return x;
    }).filter(Boolean);
    var src = { revenue: 'billing', revGrowth: 'billing', volGrowth: 'billing', sla: 'SLA-001', complaint: 'complaint', payment: 'finance', ar: 'finance', contract: 'CONTRACT-001', retention: 'RENEW-001', profit: 'billing' }[k];
    return { h: h, d: d, props: ['payment', 'ar', 'contract', 'retention'].indexOf(k) >= 0 ? [] : props, src: src, fin: k === 'ar' || k === 'payment' ? M.finance(cl) : null };
  };
  M.adjustHealth = function (ctx, cl, delta, reason) {
    if (!can(ctx, 'com.health.adjust')) return deny(ctx, cl);
    if (isNaN(delta) || !delta || Math.abs(delta) > 10) return bad(L('Koreksi maksimal ±10 poin.', 'Adjustment of at most ±10 points.'));
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    var before = M.health(cl).score;
    S().hadj.push({ cl: cl, delta: +delta, reason: reason, by: empId(ctx), at: isoT(M.now()) }); save(); hCache = {};
    M.audit('HEALTH.ADJUST', ctx, { cl: cl, rec: cl, from: before, to: M.health(cl).score, reason: reason });
    return { ok: true, score: M.health(cl).score };
  };
  M.setHealthWeights = function (ctx, w, reason) {
    if (!can(ctx, 'com.health.adjust')) return deny(ctx, 'weights');
    var keys = M.HEALTH_DIMS.map(function (d) { return d.k; }), tot = sum(keys.map(function (k) { return +w[k]; }));
    if (keys.some(function (k) { return isNaN(+w[k]) || +w[k] < 0; })) return bad();
    if (Math.abs(tot - 100) > 0.01) return bad(L('Total bobot harus 100%. Sekarang ' + tot + '%.', 'Weights must total 100%. Now ' + tot + '%.'), 'weights');
    if (!reason || !String(reason).trim()) return bad(M.MSG.reason, 'reason');
    var from = JSON.stringify(M.cfg().hw); keys.forEach(function (k) { M.cfg().hw[k] = +w[k]; }); save(); hCache = {};
    M.audit('HEALTH.WEIGHTS', ctx, { rec: 'health', from: from, to: JSON.stringify(M.cfg().hw), reason: reason });
    return { ok: true };
  };

  /* ---------- Growth (§45), risk (§46), opportunities (§47–§48), insight (§53) ---------- */
  M.growth = function (cl) {
    var n = M.clientMonth(cl, 12), p = M.clientMonth(cl, 11), ly = M.clientMonth(cl, 0);
    var svcNow = uniq(M.propsOf(cl, true).map(function (x) { var b = M.billing(x.id, 12); return b ? Object.keys(b.svcs).map(function (s) { return x.id + '|' + s; }) : []; }).reduce(function (a, b) { return a.concat(b); }, []));
    var svcLy = uniq(M.propsOf(cl, true).map(function (x) { var b = M.billing(x.id, 0); return b ? Object.keys(b.svcs).filter(function (s) { return b.svcs[s].rev > 0; }).map(function (s) { return x.id + '|' + s; }) : []; }).reduce(function (a, b) { return a.concat(b); }, []));
    var added = svcNow.filter(function (k) { return svcLy.indexOf(k) < 0; });
    var newProps = M.propsOf(cl, true).filter(function (x) { return M.days(x.start, M.TODAY) <= 365 && x.status === 'active'; });
    var cross = sum(added.map(function (k) { var pp = k.split('|'), b = M.billing(pp[0], 12); return b && b.svcs[pp[1]] ? b.svcs[pp[1]].rev : 0; }));
    return { mom: p.rev ? r1((n.rev / p.rev - 1) * 100) : null, yoy: ly.rev ? r1((n.rev / ly.rev - 1) * 100) : null, vol: ly.kg ? r1((n.kg / ly.kg - 1) * 100) : null, volMom: p.kg ? r1((n.kg / p.kg - 1) * 100) : null,
      svcAdded: added, svcNow: svcNow.length, svcLy: svcLy.length, newProps: newProps.map(function (x) { return x.id; }), cross: cross, crossShare: n.rev ? r1(cross / n.rev * 100) : 0, rev: n.rev, revLy: ly.rev, revPrev: p.rev };
  };
  M.risks = function (cl) {
    var out = [], h = M.health(cl), g = M.growth(cl), cp = M.complaints(cl), fin = M.finance(cl), pr = M.profit(cl), sla = M.slaPerf(cl), c = M.client(cl);
    function add(k, sev, t, src, rec) { out.push({ k: k, sev: sev, t: t, src: src, rec: rec || null }); }
    if (g.mom != null && g.mom <= -5) add('revdecline', g.mom <= -10 ? 'crit' : 'warn', L('Revenue turun ' + Math.abs(g.mom) + '% dibanding bulan lalu.', 'Revenue down ' + Math.abs(g.mom) + '% from last month.'), 'HEALTH-001');
    if (cp.open >= 2 || (cp.rate != null && cp.rate > 0.3)) add('complaint', cp.open >= 3 ? 'crit' : 'warn', L(cp.open + ' komplain terbuka; ' + (cp.trend ? cp.trend[12] : 0) + ' komplain bulan lalu.', cp.open + ' open complaints; ' + (cp.trend ? cp.trend[12] : 0) + ' complaints last month.'), 'HISTORY-001');
    if (fin && fin.overdue > 0 && (fin.overdueShare >= 60 || fin.oldest > 30)) add('ar', fin.oldest > 45 ? 'crit' : 'warn', L('AR jatuh tempo ' + fin.overdueShare + '%, tertua ' + fin.oldest + ' hari.', 'Overdue AR ' + fin.overdueShare + '%, oldest ' + fin.oldest + ' days.'), 'FIN-005');
    if (fin && fin.over) add('credit', 'crit', L('AR melewati limit kredit (' + fin.util + '%).', 'AR above the credit limit (' + fin.util + '%).'), 'CLIENT-002', cl);
    if (pr.margin != null && pr.margin < 20) add('margin', pr.margin < 15 ? 'crit' : 'warn', L('Margin kontribusi ' + pr.margin + '%.', 'Contribution margin ' + pr.margin + '%.'), 'HEALTH-001');
    M.activeContracts(cl).forEach(function (x) { var l = M.days(M.TODAY, x.end); if (l <= 60) add('expiring', l <= 30 ? 'crit' : 'warn', L('Kontrak ' + x.no + ' berakhir dalam ' + l + ' hari.', 'Contract ' + x.no + ' ends in ' + l + ' days.'), 'CONTRACT-002', x.no); });
    M.contracts(null, { cl: cl }).filter(function (x) { return M.ctrStatus(x) === 'expired'; }).forEach(function (x) { add('expired', 'crit', L('Kontrak ' + x.no + ' sudah berakhir tanpa perpanjangan.', 'Contract ' + x.no + ' ended without renewal.'), 'CONTRACT-002', x.no); });
    if (sla.ot != null && sla.ot < 97) add('sla', sla.ot < 95 ? 'crit' : 'warn', L('On-time SLA ' + sla.ot + '% (' + sla.late + ' terlambat).', 'On-time SLA ' + sla.ot + '% (' + sla.late + ' late).'), 'SLA-001');
    var minVol = M.activeContracts(cl).reduce(function (s, x) { return s + (x.minVol || 0); }, 0), kg = M.clientMonth(cl, 12).kg;
    if (minVol && kg < minVol) add('lowvol', 'warn', L('Volume ' + kg + ' kg di bawah minimum kontrak ' + minVol + ' kg.', 'Volume ' + kg + ' kg below the contract minimum ' + minVol + ' kg.'), 'CONTRACT-002', M.activeContracts(cl)[0].no);
    M.propsOf(cl, true).forEach(function (p) { var a = M.billing(p.id, 12), b = M.billing(p.id, 9); if (a && b && a.kg / D.SEASON[12] < b.kg / D.SEASON[9] * 0.985) add('svctrend', 'warn', L(p.n + ': volume turun 3 bulan berturut.', p.n + ': volume down for 3 months.'), 'PROPERTY-002', p.id); });
    var rank = { crit: 0, warn: 1, info: 2 }, order = ['expired', 'credit', 'expiring', 'ar', 'sla', 'complaint', 'margin', 'revdecline', 'lowvol', 'svctrend'];
    return out.sort(function (a, b) { return rank[a.sev] - rank[b.sev] || order.indexOf(a.k) - order.indexOf(b.k); });
  };
  M.opps = function (ctx, f) {
    f = f || {};
    return S().opps.filter(function (o) { return M.canSeeClient(ctx, o.cl) && (!f.cl || o.cl === f.cl) && (!f.stage || o.stage === f.stage) && (!f.owner || o.owner === f.owner) && (!f.type || o.type === f.type) && (!f.open || ['won', 'lost'].indexOf(o.stage) < 0); })
      .map(function (o) { return Object.assign({ weighted: Math.round(o.rev * o.prob / 100) }, o); })
      .sort(function (a, b) { var r = function (x) { return ['won', 'lost'].indexOf(x.stage) >= 0 ? 1 : 0; }; return r(a) - r(b) || ms(a.due) - ms(b.due); });
  };
  M.opp = function (id) { return by(S().opps, 'id', id); };
  M.saveOpp = function (ctx, d) {
    if (!can(ctx, 'com.opp.manage')) return deny(ctx, 'opp');
    if (!d.n || !d.cl || !M.client(d.cl)) return bad(L('Nama opportunity dan klien wajib diisi.', 'Opportunity name and client are required.'));
    if (!M.OPP_TYPES[d.type]) return bad(L('Pilih tipe opportunity.', 'Choose the opportunity type.'));
    if (isNaN(d.rev) || d.rev < 0 || isNaN(d.prob) || d.prob < 0 || d.prob > 100) return bad(L('Potensi revenue dan probabilitas (0–100%) harus valid.', 'Potential revenue and probability (0–100%) must be valid.'));
    if (d.prop && (!M.prop(d.prop) || M.prop(d.prop).cl !== d.cl)) return bad(L('Property harus milik klien yang sama.', 'The property must belong to the same client.'));
    var o = d.id ? M.opp(d.id) : null, isNew = !o;
    if (!o) { o = { id: 'OPP-' + String(S().opps.length + 1).padStart(3, '0'), stage: 'identified', notes: '' }; S().opps.push(o); }
    Object.assign(o, { n: typeof d.n === 'string' ? L(d.n, d.n) : d.n, cl: d.cl, prop: d.prop || null, type: d.type, rev: +d.rev, margin: d.margin == null || d.margin === '' ? null : +d.margin, prob: +d.prob, owner: d.owner || empId(ctx), next: typeof d.next === 'string' ? L(d.next, d.next) : d.next || L('—', '—'), due: d.due || addDays(M.TODAY, 14) });
    if (d.notes !== undefined) o.notes = d.notes;
    save();
    if (isNew) { M.audit('OPP.CREATE', ctx, { cl: d.cl, rec: o.id, to: T(o.n) }); tlAdd(d.cl, 'OPP.CREATE', ctx, { rec: o.id, prop: o.prop, to: T(o.n) }); }
    return { ok: true, opp: o };
  };
  M.moveOpp = function (ctx, id, stage, note) {
    if (!can(ctx, 'com.opp.manage')) return deny(ctx, id);
    var o = M.opp(id); if (!o) return bad(M.MSG.notfound, 'notfound');
    if (!by(M.OPP_STAGES.map(function (s) { return { k: s[0] }; }), 'k', stage)) return bad();
    if (stage === 'lost' && (!note || !String(note).trim())) return bad(M.MSG.reason, 'reason');
    var from = o.stage; o.stage = stage; if (stage === 'won') o.prob = 100; if (stage === 'lost') o.prob = 0; save();
    M.audit('OPP.STAGE', ctx, { cl: o.cl, rec: id, from: from, to: stage, reason: note || null }); tlAdd(o.cl, 'OPP.STAGE', ctx, { rec: id, from: from, to: stage, reason: note ? L(note, note) : null });
    return { ok: true };
  };
  // Suggested opportunities: active properties without a service their peers already use (§47).
  M.suggestOpps = function (cl) {
    var props = M.propsOf(cl).filter(function (p) { return p.status === 'active'; }), out = [];
    var used = uniq(S().cs.filter(function (x) { return x.active && props.some(function (p) { return p.id === x.prop; }); }).map(function (x) { return x.svc; }));
    props.forEach(function (p) { used.forEach(function (s) { if (!M.svcRow(p.id, s) || !M.svcRow(p.id, s).active) out.push({ prop: p.id, svc: s, t: L('Tawarkan ' + M.svcName(s) + ' ke ' + p.n, 'Offer ' + M.svcName(s) + ' to ' + p.n) }); }); });
    return out.filter(function (x) { return !S().opps.some(function (o) { return o.cl === cl && ['won', 'lost'].indexOf(o.stage) < 0 && ((o.props || []).indexOf(x.prop) >= 0 || o.prop === x.prop) && T(o.n).indexOf(M.svcName(x.svc)) >= 0; }); }).slice(0, 4);
  };
  M.insight = function (cl) {
    var c = M.client(cl), g = M.growth(cl), h = M.health(cl), risks = M.risks(cl), opps = M.opps(null, { cl: cl, open: true });
    var props = M.propsOf(cl, true).map(function (p) { var a = M.billing(p.id, 12), b = M.billing(p.id, 0); return { p: p, d: a && b ? a.rev - b.rev : a ? a.rev : 0, a: a, b: b }; }).sort(function (x, y) { return y.d - x.d; });
    var top = props[0], exp = M.clientMonth(cl, 12), svcAdd = g.svcAdded.map(function (k) { return M.svcName(k.split('|')[1]); });
    var what = g.yoy == null ? L('Belum ada revenue untuk dibandingkan.', 'No revenue to compare yet.') : L('Revenue ' + c.n + (g.yoy >= 0 ? ' naik ' : ' turun ') + Math.abs(g.yoy) + '% dibanding bulan yang sama tahun lalu (MoM ' + (g.mom >= 0 ? '+' : '') + g.mom + '%).', c.n + ' revenue ' + (g.yoy >= 0 ? 'up ' : 'down ') + Math.abs(g.yoy) + '% from the same month last year (MoM ' + (g.mom >= 0 ? '+' : '') + g.mom + '%).');
    var why = top && top.d > 0 ? L('Kontribusi terbesar dari ' + top.p.n + (top.b ? ' (volume ' + (top.b.kg ? Math.round((top.a.kg / top.b.kg - 1) * 100) : 0) + '%)' : ' (property baru)') + (svcAdd.length ? ' dan layanan baru ' + uniq(svcAdd).join(', ') : '') + '.', 'Biggest contribution from ' + top.p.n + (top.b ? ' (volume ' + (top.b.kg ? Math.round((top.a.kg / top.b.kg - 1) * 100) : 0) + '%)' : ' (new property)') + (svcAdd.length ? ' and new services ' + uniq(svcAdd).join(', ') : '') + '.') : top ? L('Penurunan terbesar di ' + props[props.length - 1].p.n + '.', 'Biggest decline at ' + props[props.length - 1].p.n + '.') : L('—', '—');
    var r0 = risks[0], o0 = opps.sort(function (a, b) { return b.rev * b.prob - a.rev * a.prob; })[0];
    var nextC = M.activeContracts(cl).sort(function (a, b) { return ms(a.end) - ms(b.end); })[0];
    var action = nextC && M.days(M.TODAY, nextC.end) <= 90 ? (M.renewalOf(nextC.no) ? L('Lanjutkan renewal ' + nextC.no + ' (' + T(by(M.STAGES.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', M.renewalOf(nextC.no).stage).n) + ') dan jadwalkan review layanan.', 'Continue renewal ' + nextC.no + ' (' + T(by(M.STAGES.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', M.renewalOf(nextC.no).stage).n) + ') and schedule a service review.') : L('Mulai renewal ' + nextC.no + ' dan jadwalkan review layanan.', 'Start renewal ' + nextC.no + ' and schedule a service review.')) : r0 ? L('Tindak lanjuti: ' + T(r0.t), 'Follow up: ' + (Array.isArray(r0.t) ? r0.t[1] : r0.t)) : L('Pertahankan layanan dan jadwalkan review kuartalan.', 'Keep service steady and schedule the quarterly review.');
    return { what: what, why: why, risk: r0 ? r0.t : L('Tidak ada risiko besar terdeteksi.', 'No major risk detected.'), riskRec: r0 || null, opp: o0 ? o0.n : L('Belum ada opportunity terbuka.', 'No open opportunity yet.'), oppRec: o0 || null, action: action, h: h, exp: exp };
  };

  /* ---------- Account Manager actions (§49) ---------- */
  M.addTask = function (ctx, cl, d) {
    var need = d.kind === 'escalate' ? 'com.client.view' : 'com.opp.manage';
    if (!can(ctx, need)) return deny(ctx, cl);
    if (!M.TASK_KINDS[d.kind]) return bad();
    if (!d.t || !String(d.t).trim()) return bad(L('Isi keterangan tindakan.', 'Describe the action.'));
    if (d.kind !== 'note' && (!d.due || ms(d.due) < ms(M.TODAY))) return bad(L('Tanggal tindak lanjut harus hari ini atau setelahnya.', 'The follow-up date must be today or later.'));
    var t = { id: 'TSK-' + String(S().tasks.length + 1).padStart(3, '0'), cl: cl, prop: d.prop || null, kind: d.kind, t: String(d.t).trim(), due: d.kind === 'note' ? null : d.due, by: empId(ctx), at: isoT(M.now()), done: false, rec: d.rec || null };
    S().tasks.push(t); save();
    M.audit('TASK.CREATE', ctx, { cl: cl, rec: t.id, to: d.kind, reason: t.t });
    tlAdd(cl, d.kind === 'escalate' ? 'TASK.CREATE' : d.kind === 'proposal' ? 'PROPOSAL.SENT' : 'TASK.CREATE', ctx, { rec: t.rec || t.id, prop: t.prop, to: T(M.TASK_KINDS[d.kind][0]), reason: L(t.t, t.t) });
    return { ok: true, task: t };
  };
  M.tasks = function (cl) { return S().tasks.filter(function (t) { return !cl || t.cl === cl; }).slice().sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || ms(a.due || a.at) - ms(b.due || b.at); }); };
  M.doneTask = function (ctx, id) { var t = by(S().tasks, 'id', id); if (!t) return bad(M.MSG.notfound, 'notfound'); if (t.by !== empId(ctx) && !can(ctx, 'com.opp.manage')) return deny(ctx, id); t.done = true; save(); M.audit('TASK.DONE', ctx, { cl: t.cl, rec: id }); return { ok: true }; };

  /* ---------- Commercial alerts (§40, §67, §71) ----------
     Each alert names the roles that should see it, so no role gets an alert it cannot act on. */
  var SALES = ['sales', 'owner'], FIN = ['finance', 'owner'], OPS = ['opsmgr', 'supervisor', 'owner'];
  M.ALERT_KINDS = { ctrexp: L('Kontrak segera berakhir', 'Contract expires soon'), ctrexpired: L('Kontrak berakhir', 'Contract expired'), rcexp: L('Rate Card segera berakhir', 'Rate Card expires soon'), slareview: L('Review SLA jatuh tempo', 'SLA review due'), terms: L('Termin pembayaran berubah', 'Payment terms changed'), credit: L('Limit kredit terlampaui', 'Credit limit exceeded'), ar: L('AR tinggi', 'High AR'), stalled: L('Negosiasi macet', 'Negotiation stalled'), health: L('Client Health menurun', 'Client health declining'), slaconf: L('Aturan SLA bentrok', 'Conflicting SLA rules'), rateov: L('Tarif tumpang tindih', 'Overlapping rates') };
  M.alerts = function (ctx, f) {
    f = f || {};
    var out = [], value = {}; M.portfolio(null).forEach(function (x, i) { value[x.cl] = { rev: x.rev, rank: i + 1, margin: x.margin }; });
    function add(o) { var v = value[o.cl] || { rev: 0, rank: 99, margin: 0 }; out.push(Object.assign({ rev: 0, profit: 0, days: 999, sla: 0, cv: v.rev, roles: SALES }, o)); }
    M.contractNos().forEach(function (no) {
      var c = M.contract(no), st = M.ctrStatus(c), r = M.renewalOf(no); if (c.renewalOf || ['draft', 'review', 'terminated'].indexOf(st) >= 0) return;
      var w = M.warnLevel(c.end), rev = sum(c.props.map(function (p) { var b = M.billing(p, 12); return b ? b.rev : 0; })), pf = sum(c.props.map(function (p) { var b = M.billing(p, 12); return b ? b.rev - b.cost : 0; }));
      if (st === 'expired' && !(r && r.stage === 'renewed')) add({ id: 'AL-X-' + no, k: 'ctrexpired', sev: 'crit', cl: c.cl, rec: no, go: 'CONTRACT-002', t: L(M.clientName(c.cl) + ': kontrak ' + no + ' berakhir ' + Math.abs(w.left) + ' hari lalu.', M.clientName(c.cl) + ': contract ' + no + ' ended ' + Math.abs(w.left) + ' days ago.'), rev: rev, profit: pf, days: w.left, roles: SALES.concat(['finance']) });
      else if (w.th != null && w.left >= 0 && !(r && r.stage === 'renewed')) add({ id: 'AL-E' + w.th + '-' + no, k: 'ctrexp', sev: w.th <= 30 ? 'crit' : w.th <= 60 ? 'warn' : 'info', cl: c.cl, rec: no, go: 'RENEW-002', t: L(M.clientName(c.cl) + ': kontrak ' + no + ' berakhir dalam ' + w.left + ' hari' + (r ? ' · renewal: ' + T(by(M.STAGES.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', r.stage).n) : ' · renewal belum dimulai') + '.', M.clientName(c.cl) + ': contract ' + no + ' ends in ' + w.left + ' days' + (r ? ' · renewal: ' + by(M.STAGES.map(function (s) { return { k: s[0], n: s[1] }; }), 'k', r.stage).n[1] : ' · renewal not started') + '.'), th: w.th, rev: rev, profit: pf, days: w.left });
      if (r && r.stage === 'negotiation' && M.days(r.since, M.TODAY) > M.cfg().stall) add({ id: 'AL-S-' + no, k: 'stalled', sev: 'warn', cl: c.cl, rec: no, go: 'RENEW-002', t: L(M.clientName(c.cl) + ': negosiasi ' + no + ' tidak bergerak ' + M.days(r.since, M.TODAY) + ' hari.', M.clientName(c.cl) + ': negotiation on ' + no + ' has not moved for ' + M.days(r.since, M.TODAY) + ' days.'), rev: rev, profit: pf, days: w.left });
    });
    uniq(S().rcs.map(function (r) { return r.id; })).forEach(function (id) {
      var r = M.rateCard(id), s = M.rcStatus(r); if (s !== 'expiring') return;
      var left = M.days(M.TODAY, r.exp), ctr = r.ctr ? M.contract(r.ctr) : null;
      if (ctr && ctr.end === r.exp) return;  // same date as its contract: the contract alert covers it (no duplicate).
      add({ id: 'AL-R-' + id, k: 'rcexp', sev: left <= 15 ? 'crit' : 'warn', cl: r.cl, rec: id, go: 'RATE-002', t: L(M.clientName(r.cl) + ': ' + r.n + ' berakhir dalam ' + left + ' hari.', M.clientName(r.cl) + ': ' + r.n + ' expires in ' + left + ' days.'), days: left, roles: SALES.concat(['finance']) });
    });
    S().sla.forEach(function (r) { if (r.reviewDue && r.status === 'active') { var l = M.days(M.TODAY, r.reviewDue); if (l <= 14) add({ id: 'AL-V-' + r.id, k: 'slareview', sev: l <= 7 ? 'warn' : 'info', cl: r.cl, rec: r.id, go: 'SLA-002', t: L(M.clientName(r.cl) + ': review ' + T(r.n) + ' jatuh tempo dalam ' + l + ' hari.', M.clientName(r.cl) + ': review of ' + r.n[1] + ' due in ' + l + ' days.'), days: l, sla: 1, roles: OPS.concat(['sales']) }); } });
    M.slaConflicts().forEach(function (x) { var r = by(S().sla, 'id', x.a); add({ id: 'AL-C-' + x.a + x.b, k: 'slaconf', sev: 'warn', cl: r.cl, rec: x.a, go: 'SLA-002', t: L('Aturan SLA ' + x.a + ' dan ' + x.b + ' bentrok tanpa urutan prioritas.', 'SLA rules ' + x.a + ' and ' + x.b + ' conflict without precedence.'), sla: 1, roles: OPS }); });
    S().tl.filter(function (e) { return e.ev === 'TERMS.CHANGE' && M.days(e.at.slice(0, 10), M.TODAY) <= 30; }).forEach(function (e, i) { add({ id: 'AL-T-' + e.cl + i, k: 'terms', sev: 'info', cl: e.cl, rec: e.cl, go: 'CLIENT-002', t: L(M.clientName(e.cl) + ': termin pembayaran berubah ' + e.from + ' → ' + e.to + '.', M.clientName(e.cl) + ': payment terms changed ' + e.from + ' → ' + e.to + '.'), roles: FIN.concat(['sales']) }); });
    S().clients.forEach(function (c) {
      if (c.status === 'prospect') return;
      var fin = M.finance(c.id); if (!fin || !fin.total) return;
      var v = value[c.id] || { margin: 0 };
      if (fin.over) add({ id: 'AL-K-' + c.id, k: 'credit', sev: 'crit', cl: c.id, rec: c.id, go: 'CLIENT-002', t: L(c.n + ': AR ' + Math.round(fin.total / JT) + ' jt melewati limit kredit ' + Math.round(fin.credit / JT) + ' jt (' + fin.util + '%).', c.n + ': AR ' + Math.round(fin.total / JT) + 'M above the ' + Math.round(fin.credit / JT) + 'M credit limit (' + fin.util + '%).'), rev: fin.total - fin.credit, profit: Math.round((fin.total - fin.credit) * (v.margin || 0) / 100), roles: FIN.concat(['sales']) });
      else if (fin.overdue > 0 && (fin.oldest > 30 || fin.overdueShare >= 50)) add({ id: 'AL-A-' + c.id, k: 'ar', sev: fin.oldest > 45 ? 'crit' : 'warn', cl: c.id, rec: c.id, go: 'CLIENT-002', t: L(c.n + ': AR jatuh tempo ' + Math.round(fin.overdue / JT * 10) / 10 + ' jt, tertua ' + fin.oldest + ' hari.', c.n + ': overdue AR ' + Math.round(fin.overdue / JT * 10) / 10 + 'M, oldest ' + fin.oldest + ' days.'), rev: fin.overdue, roles: FIN.concat(['sales']) });
      var h = M.health(c.id); if (h && h.trend != null && h.trend <= -3) add({ id: 'AL-H-' + c.id, k: 'health', sev: h.st === 'critical' || h.st === 'risk' ? 'warn' : 'info', cl: c.id, rec: c.id, go: 'HEALTH-001', t: L(c.n + ': Client Health turun ' + Math.abs(h.trend) + ' poin ke ' + h.score + '.', c.n + ': Client Health down ' + Math.abs(h.trend) + ' points to ' + h.score + '.'), roles: SALES });
    });
    var role = ctx ? (ctx.exp || ctx.roleKey) : null, rank = { crit: 3, warn: 2, info: 1 };
    var seen = S().seen;
    return out.filter(function (a) { return (!ctx || (!ctx.client && a.roles.indexOf(role) >= 0)) && M.canSeeClient(ctx, a.cl) && (!f.cl || a.cl === f.cl) && (!f.k || a.k === f.k) && (!f.sev || a.sev === f.sev); })
      .map(function (a) { return Object.assign({ ack: !!seen[a.id] }, a); })
      // §67 severity → revenue impact → profit impact → expiry → client value → SLA impact
      .sort(function (a, b) { return rank[b.sev] - rank[a.sev] || b.rev - a.rev || b.profit - a.profit || a.days - b.days || b.cv - a.cv || b.sla - a.sla; });
  };
  M.ackAlert = function (ctx, id) { if (!can(ctx, 'com.alert.view')) return deny(ctx, id); S().seen[id] = { by: empId(ctx), at: isoT(M.now()) }; save(); return { ok: true }; };

  /* ---------- Search (§57–§58) and Client 360 summary (§5–§6) ---------- */
  M.searchClients = function (ctx, f) {
    f = f || {};
    var q = (f.q || '').toLowerCase().trim();
    return M.visibleClients(ctx).filter(function (c) {
      if (f.type && c.type !== f.type) return false;
      if (f.status && c.status !== f.status) return false;
      if (f.am && c.am !== f.am) return false;
      if (f.city && c.city !== f.city && !M.propsOf(c.id, true).some(function (p) { return p.city === f.city; })) return false;
      if (f.health) { var h = M.health(c.id); if (!h || h.st !== f.health) return false; }
      if (f.renewal) { var rs = M.contracts(null, { cl: c.id }).map(function (x) { return M.renewalCard(x.no); }).filter(Boolean); if (f.renewal === 'none' ? rs.some(function (x) { return x.stage; }) : !rs.some(function (x) { return x.stage === f.renewal || (f.renewal === 'due' && x.left <= 90 && x.left >= 0); })) return false; }
      if (!q) return true;
      var dq = q.replace(/\D/g, ''); if (dq.charAt(0) === '0') dq = '62' + dq.slice(1);
      if (dq.length >= 6 && S().contacts.some(function (x) { return x.cl === c.id && x.phone.replace(/\D/g, '').indexOf(dq) >= 0; })) return true;
      var hay = [c.id, c.n, c.legal].concat(M.propsOf(c.id, true).map(function (p) { return p.n + ' ' + p.id; }), S().contacts.filter(function (x) { return x.cl === c.id; }).map(function (x) { return x.n + ' ' + x.phone.replace(/\s/g, '') + ' ' + x.phone + ' ' + x.email; }), S().contracts.filter(function (x) { return x.cl === c.id; }).map(function (x) { return x.no; })).join(' ').toLowerCase();
      return hay.indexOf(q) >= 0 || hay.indexOf(q.replace(/\s/g, '')) >= 0;
    });
  };
  M.searchProps = function (ctx, f) {
    f = f || {};
    var q = (f.q || '').toLowerCase().trim();
    return S().props.filter(function (p) {
      if (!M.canSeeClient(ctx, p.cl)) return false;
      if (f.cl && p.cl !== f.cl) return false;
      if (f.status && p.status !== f.status) return false;
      if (f.city && p.city !== f.city) return false;
      if (f.svc && !M.svcConfig(p.id).some(function (x) { return x.svc === f.svc && x.active; })) return false;
      if (f.sla && !S().sla.some(function (r) { return r.id === f.sla && (r.prop === p.id || (r.cl === p.cl && !r.prop)); })) return false;
      if (f.pic && p.op !== f.pic) return false;
      if (!q) return true;
      var op = M.contact(p.op);
      return [p.id, p.n, M.clientName(p.cl), p.city, op ? op.n : ''].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  };
  M.cities = function () { return uniq(S().props.map(function (p) { return p.city; }).concat(S().clients.map(function (c) { return c.city; }))).sort(); };
  M.summary = function (ctx, cl) {
    var c = M.client(cl); if (!c || !M.canSeeClient(ctx, cl)) return null;
    var props = M.propsOf(cl, true), act = M.activeContracts(cl), next = act.slice().sort(function (a, b) { return ms(a.end) - ms(b.end); })[0] || null, g = M.growth(cl), fin = M.canSee(ctx, 'finance') ? M.finance(cl) : null, sla = M.slaPerf(cl), h = M.health(cl), cp = M.complaints(cl);
    var slaRule = M.slaFor({ cl: cl, svc: (M.svcConfig((props[0] || {}).id)[0] || {}).svc }).rule;
    return { c: c, health: h, props: props, activeProps: props.filter(function (p) { return p.status === 'active'; }).length, rev: g.rev, revGrowth: g.mom, yoy: g.yoy, ar: fin ? fin.total : null, overdue: fin ? fin.overdue : null, sla: sla.ot, slaRule: slaRule, activeContracts: act.length, next: next, nextLeft: next ? M.days(M.TODAY, next.end) : null, openComplaints: cp.open, openOpps: M.opps(ctx, { cl: cl, open: true }).length };
  };
  // §55 client portal: only the signed-in client's own data, never another client's.
  M.portal = function (ctx) {
    if (!ctx || !ctx.client) return null;
    var cl = ctx.client, c = M.client(cl); if (!c) return null;
    var props = M.propsOf(cl).filter(function (p) { return p.status !== 'inactive'; });
    return { c: c, props: props.map(function (p) { return { p: p, svcs: M.svcConfig(p.id).filter(function (x) { return x.active; }).map(function (x) { return M.svcLine(p.id, x.svc); }), op: M.contact(p.op), cmp: M.contact(p.cmp) }; }),
      contracts: M.activeContracts(cl).concat(M.contracts(ctx, { cl: cl }).filter(function (x) { return ['approved'].indexOf(M.ctrStatus(x)) >= 0; })), docs: M.docs(ctx, { cl: cl }), sla: M.slaPerf(cl), am: M.am(c.am) };
  };

  /* ---------- Screens (§64), navigation and install ---------- */
  function sc(id, n, a, p, np, nv, icon, pur, emp, o) {
    return Object.assign({ id: id, n: n, a: a, p: p, np: np, nv: nv, icon: icon, pur: pur, dom: 'com', lvl: 3, p6: true, nb: [], bf: [], aud: [],
      emp: emp || L('Belum ada data.', 'No data yet.'), err: L('Data komersial belum berhasil dimuat. Coba lagi.', 'Commercial data could not be loaded. Try again.'), warn: L('Ada data yang perlu perhatian.', 'Some data needs attention.'), ok: L('Tersimpan.', 'Saved.') }, o || {});
  }
  M.SCREENS = [
    sc('CLIENT-001', L('Daftar Klien', 'Client List'), 'T05', 'com.client.view', 'NP-01', 'NV-01', 'users', L('Cari klien berdasarkan nama, property, kode, telepon, kontak atau nomor kontrak.', 'Find clients by name, property, code, phone, contact or contract number.'), L('Belum ada klien. Tambahkan klien pertama.', 'No clients yet. Add the first client.')),
    sc('CLIENT-002', 'Client 360', 'T03', 'com.client.view', 'NP-01', 'NV-01', 'hotel', L('Satu tampilan klien: health, revenue, AR, property, kontak, kontrak, harga, SLA, dokumen, riwayat, opportunity.', 'One client view: health, revenue, AR, properties, contacts, contracts, pricing, SLA, documents, history, opportunities.'), L('Belum ada property.', 'No property yet.')),
    sc('CLIENT-003', L('Buat / Ubah Klien', 'Create / Edit Client'), 'T06', 'com.client.edit', 'NP-01', 'NV-01', 'edit', L('Data master klien; status, termin dan limit kredit lewat persetujuan.', 'Client master data; status, terms and credit limit through approval.')),
    sc('PROPERTY-001', L('Daftar Property', 'Property List'), 'T05', 'com.property.view', 'NP-01', 'NV-01', 'hotel', L('Semua property / outlet dengan grup, PIC, layanan, SLA dan status.', 'Every property / outlet with group, PIC, services, SLA and status.'), L('Belum ada property.', 'No property yet.')),
    sc('PROPERTY-002', L('Detail Property', 'Property Detail'), 'T03', 'com.property.view', 'NP-01', 'NV-01', 'hotel', L('PIC, jadwal pickup, layanan, tarif, SLA, instruksi dan kontrak satu property.', 'PICs, pickup schedule, services, rates, SLA, instructions and contracts of one property.'), L('Belum ada layanan aktif.', 'No active service yet.')),
    sc('PROPERTY-003', L('Buat / Ubah Property', 'Create / Edit Property'), 'T06', 'com.property.edit', 'NP-01', 'NV-01', 'edit', L('Data property; alamat dan PIC diambil dari data klien yang sudah ada.', 'Property data; address and PICs reuse existing client data.')),
    sc('CONTACT-001', L('Direktori Kontak', 'Contact Directory'), 'T05', 'com.contact.view', 'NP-02', 'NV-02', 'idcard', L('Kontak tingkat grup dan property dengan peran, cakupan dan rekomendasi siapa dihubungi.', 'Group and property contacts with roles, scope and a who-to-contact recommendation.'), L('Belum ada contact.', 'No contact yet.')),
    sc('CONTACT-002', L('Detail Kontak', 'Contact Detail'), 'T03', 'com.contact.view', 'NP-02', 'NV-02', 'user', L('Peran, cakupan property dan cara menghubungi satu kontak.', 'Roles, property scope and how to reach one contact.')),
    sc('SERVICE-001', L('Katalog Layanan', 'Service Catalog'), 'T05', 'com.service.view', 'NP-03', 'NV-03', 'washer', L('Standar global: kode, unit, harga master, SLA standar, proses, item.', 'Global standard: code, unit, master price, standard SLA, process, items.'), L('Belum ada layanan di katalog.', 'No service in the catalog yet.')),
    sc('SERVICE-002', L('Layanan per Klien', 'Client Service Selection'), 'T05', 'com.service.view', 'NP-03', 'NV-03', 'layers', L('Layanan yang aktif per property: tarif klien vs master, SLA khusus, instruksi.', 'Services enabled per property: client vs master rate, custom SLA, instructions.'), L('Belum ada layanan aktif untuk property ini.', 'No active service for this property yet.')),
    sc('CONTRACT-001', L('Daftar Kontrak', 'Contract List'), 'T05', 'com.contract.view', 'NP-04', 'NV-04', 'contract', L('Kontrak per klien dan property dengan status, masa berlaku dan versi.', 'Contracts per client and property with status, validity and version.'), L('Belum ada kontrak aktif.', 'No active contract yet.')),
    sc('CONTRACT-002', L('Detail Kontrak', 'Contract Detail'), 'T03', 'com.contract.view', 'NP-04', 'NV-04', 'contract', L('Isi kontrak, property, Rate Card, SLA, versi dan lampiran.', 'Contract terms, properties, Rate Card, SLA, versions and attachments.'), L('Belum ada kontrak aktif.', 'No active contract yet.')),
    sc('CONTRACT-003', L('Editor Kontrak', 'Contract Editor'), 'T06', 'com.contract.edit', 'NP-04', 'NV-04', 'edit', L('Buat draft atau versi baru; tidak pernah menimpa versi lama.', 'Create a draft or a new version; never overwrites an old version.')),
    sc('CONTRACT-004', L('Perbandingan Versi', 'Version Comparison'), 'T08', 'com.contract.view', 'NP-04', 'NV-04', 'scale', L('Nilai lama vs nilai baru per field, perubahan disorot.', 'Old vs new value per field, changes highlighted.'), L('Belum ada versi lain untuk dibandingkan.', 'No other version to compare yet.')),
    sc('RATE-001', L('Daftar Rate Card', 'Rate Card List'), 'T05', 'com.rate.view', 'NP-05', 'NV-05', 'tag', L('Rate Card per klien / property dengan masa berlaku, versi dan status.', 'Rate Cards per client / property with validity, version and status.'), L('Belum ada Rate Card.', 'No Rate Card yet.')),
    sc('RATE-002', L('Detail Rate Card', 'Rate Card Detail'), 'T03', 'com.rate.view', 'NP-05', 'NV-05', 'tag', L('Baris tarif master vs klien, riwayat perubahan dan harga invoice historis.', 'Master vs client rate lines, change history and historical invoice pricing.'), L('Belum ada Rate Card.', 'No Rate Card yet.')),
    sc('RATE-003', L('Editor Tarif', 'Rate Editor'), 'T06', 'com.rate.edit', 'NP-05', 'NV-05', 'edit', L('Ajukan perubahan tarif: lama, baru, selisih %, alasan, tanggal berlaku.', 'Request a rate change: old, new, difference %, reason, effective date.'), L('Belum ada Rate Card.', 'No Rate Card yet.'), { err: L('Rate Card belum berhasil disimpan. Periksa data dan coba lagi.', 'The Rate Card could not be saved. Check the data and try again.') }),
    sc('SLA-001', L('Dashboard SLA', 'SLA Dashboard'), 'T08', 'com.sla.view', 'NP-06', 'NV-06', 'clock', L('SLA berjalan (clock), on-time per klien, aturan dan hirarki override.', 'Running SLA clocks, on-time per client, rules and override hierarchy.'), L('Belum ada order dengan SLA berjalan.', 'No order with a running SLA yet.')),
    sc('SLA-002', L('Detail SLA', 'SLA Detail'), 'T03', 'com.sla.view', 'NP-06', 'NV-06', 'clock', L('Satu aturan SLA atau satu SLA clock: target, cutoff, eskalasi, penalti, riwayat.', 'One SLA rule or one SLA clock: target, cutoffs, escalation, penalty, history.')),
    sc('DOC-001', L('Pusat Dokumen Klien', 'Client Document Center'), 'T05', 'com.doc.view', 'NP-07', 'NV-07', 'file', L('Kontrak, Rate Card, SLA, proposal, MoU, pajak, komplain, notulen dengan versi.', 'Contracts, Rate Cards, SLA, proposals, MoU, tax, complaint and meeting documents with versions.'), L('Belum ada dokumen.', 'No document yet.')),
    sc('HISTORY-001', L('Timeline Komersial', 'Commercial Timeline'), 'T05', 'com.history.view', 'NP-07', 'NV-07', 'history', L('Satu timeline: siapa, kapan, nilai lama, nilai baru, alasan, dokumen.', 'One timeline: who, when, old value, new value, reason, document.'), L('Belum ada riwayat komersial.', 'No commercial history yet.')),
    sc('RENEW-001', L('Dashboard Renewal', 'Renewal Dashboard'), 'T08', 'com.renewal.view', 'NP-08', 'NV-08', 'refresh', L('Kontrak berakhir 30/60/90 hari, pipeline renewal dan tindakan berikutnya.', 'Contracts ending in 30/60/90 days, renewal pipeline and next actions.'), L('Tidak ada kontrak yang perlu diperpanjang dalam 90 hari.', 'No contract needs renewal within 90 days.')),
    sc('RENEW-002', L('Detail Renewal', 'Renewal Detail'), 'T03', 'com.renewal.view', 'NP-08', 'NV-08', 'refresh', L('Kartu renewal: sisa hari, tahap, risiko, opportunity, follow-up.', 'Renewal card: days left, stage, risk, opportunity, follow-up.')),
    sc('APPROVAL-001', L('Inbox Persetujuan Komersial', 'Commercial Approval Inbox'), 'T05', 'com.approval.view', 'NP-08', 'NV-08', 'filecheck', L('Kontrak, Rate Card, diskon, limit kredit, syarat khusus, pengecualian SLA, credit note.', 'Contracts, Rate Cards, discounts, credit limits, special terms, SLA exceptions, credit notes.'), L('Tidak ada yang menunggu persetujuan.', 'Nothing is waiting for approval.')),
    sc('COM-ALERT-001', L('Alert Komersial', 'Commercial Alerts'), 'T05', 'com.alert.view', 'NP-08', 'NV-08', 'bell', L('Alert sesuai peran, diurutkan menurut keparahan, dampak revenue, profit, jatuh tempo, nilai klien dan SLA.', 'Role-filtered alerts sorted by severity, revenue, profit, due date, client value and SLA impact.'), L('Tidak ada alert komersial.', 'No commercial alerts.')),
    sc('HEALTH-001', L('Client Health', 'Client Health Dashboard'), 'T08', 'com.health.view', 'NP-09', 'NV-09', 'gauge', L('Health score per klien, profitabilitas, growth, risiko dan insight.', 'Health score per client, profitability, growth, risk and insight.'), L('Belum ada klien aktif dengan data cukup.', 'No active client with enough data yet.')),
    sc('OPP-001', L('Daftar Opportunity', 'Opportunity List'), 'T05', 'com.opp.view', 'NP-09', 'NV-09', 'sparkles', L('Opportunity per klien: tipe, potensi revenue, probabilitas, tahap, next action.', 'Opportunities per client: type, potential revenue, probability, stage, next action.'), L('Belum ada opportunity.', 'No opportunity yet.')),
    sc('OPP-002', L('Detail Opportunity', 'Opportunity Detail'), 'T03', 'com.opp.view', 'NP-09', 'NV-09', 'sparkles', L('Satu opportunity dengan tahap, next action dan riwayat.', 'One opportunity with stage, next action and history.')),
    sc('CLT-COM-001', L('Layanan & Kontrak Saya', 'My Services & Contract'), 'T03', 'com.portal', 'NP-01', 'NV-01', 'contract', L('Portal klien: property, layanan, SLA, kontrak dan dokumen milik sendiri saja.', 'Client portal: own properties, services, SLA, contract and documents only.'), L('Belum ada kontrak aktif.', 'No active contract yet.'), { dom: 'clt' })
  ];
  M.screen = function (id) { return by(M.SCREENS, 'id', id); };
  M.PARENTS = {
    'CLIENT-002': ['CLIENT-001', 'HEALTH-001'], 'CLIENT-003': ['CLIENT-001'], 'PROPERTY-002': ['PROPERTY-001', 'CLIENT-002'], 'PROPERTY-003': ['PROPERTY-001'], 'CONTACT-002': ['CONTACT-001'],
    'SERVICE-002': ['SERVICE-001'], 'CONTRACT-002': ['CONTRACT-001'], 'CONTRACT-003': ['CONTRACT-001'], 'CONTRACT-004': ['CONTRACT-002'], 'RATE-002': ['RATE-001'], 'RATE-003': ['RATE-001'],
    'SLA-002': ['SLA-001'], 'RENEW-002': ['RENEW-001'], 'OPP-002': ['OPP-001']
  };
  // Phase 2 commercial screens keep working: their routes open the Phase 6 screen (one commercial truth).
  M.ALIAS = { 'COM-CLI-001': 'CLIENT-001', 'COM-CLI-002': 'CLIENT-002', 'COM-PRP-001': 'PROPERTY-001', 'COM-CTR-001': 'CONTRACT-001', 'COM-CTR-002': 'CONTRACT-002', 'COM-RTC-001': 'RATE-001', 'COM-RTC-002': 'RATE-002', 'COM-SLA-001': 'SLA-001', 'COM-DOC-001': 'DOC-001', 'COM-RNW-001': 'RENEW-001', 'RPT-CLI-001': 'HEALTH-001' };
  function N(k, l, i, s) { return { k: k, l: l, i: i, s: s }; }
  function G(k, l, i, sub) { return { k: k, l: l, i: i, sub: sub }; }
  var MENU = { k: 'menu', l: L('Menu', 'Menu'), i: 'menu' };
  var COM_FULL = [N('cli', L('Klien', 'Clients'), 'users', 'CLIENT-001'), N('prp', L('Property', 'Properties'), 'hotel', 'PROPERTY-001'), N('ctc', L('Kontak', 'Contacts'), 'idcard', 'CONTACT-001'), N('svc', L('Layanan', 'Services'), 'washer', 'SERVICE-001'),
    N('ctr', L('Kontrak', 'Contracts'), 'contract', 'CONTRACT-001'), N('rate', 'Rate Card', 'tag', 'RATE-001'), N('sla', 'SLA', 'clock', 'SLA-001'), N('doc', L('Dokumen', 'Documents'), 'file', 'DOC-001'), N('hist', L('Timeline', 'Timeline'), 'history', 'HISTORY-001')];
  var COM_GROW = [N('hlth', 'Client Health', 'gauge', 'HEALTH-001'), N('rnw', 'Renewal', 'refresh', 'RENEW-001'), N('opp', 'Opportunity', 'sparkles', 'OPP-001'), N('apc', L('Persetujuan Komersial', 'Commercial Approvals'), 'filecheck', 'APPROVAL-001'), N('alc', L('Alert Komersial', 'Commercial Alerts'), 'bell', 'COM-ALERT-001')];
  M.NAV = {
    owner: { replace: ['g-com', G('g-com', L('Klien & Komersial', 'Clients & Commercial'), 'briefcase', COM_GROW.concat(COM_FULL).concat([N('com', L('Laporan Komersial', 'Commercial Report'), 'chart', 'RPT-COM-001')]))] },
    sales: {
      nav: [N('home', L('Dashboard', 'Dashboard'), 'grid', 'HOM-SAL-001'), G('g-cli', L('Klien & Property', 'Clients & Properties'), 'users', COM_FULL.slice(0, 4)), G('g-ctr', L('Kontrak & Harga', 'Contracts & Pricing'), 'contract', COM_FULL.slice(4, 7)),
        G('g-grow', L('Renewal & Growth', 'Renewal & Growth'), 'trend', COM_GROW.slice(0, 3).concat([COM_GROW[4], COM_GROW[3]])), G('g-rec', L('Dokumen & Riwayat', 'Documents & History'), 'file', COM_FULL.slice(7))],
      mnav: [N('cli', L('Klien', 'Clients'), 'users', 'CLIENT-001'), N('ctc', L('Kontak', 'Contacts'), 'idcard', 'CONTACT-001'), N('alc', L('Alert', 'Alerts'), 'bell', 'COM-ALERT-001'), N('rnw', 'Renewal', 'refresh', 'RENEW-001'), MENU]
    },
    finance: { add: [G('g-com', L('Klien & Kredit', 'Clients & Credit'), 'briefcase', [N('cli', L('Klien', 'Clients'), 'users', 'CLIENT-001'), N('hlth', 'Client Health', 'gauge', 'HEALTH-001'), N('apc', L('Persetujuan Komersial', 'Commercial Approvals'), 'filecheck', 'APPROVAL-001'), N('alc', L('Alert Komersial', 'Commercial Alerts'), 'bell', 'COM-ALERT-001'), N('ctr', L('Kontrak', 'Contracts'), 'contract', 'CONTRACT-001'), N('rate', 'Rate Card', 'tag', 'RATE-001'), N('rnw', 'Renewal', 'refresh', 'RENEW-001'), N('doc', L('Dokumen', 'Documents'), 'file', 'DOC-001'), N('hist', L('Timeline', 'Timeline'), 'history', 'HISTORY-001')])] },
    opsmgr: { add: [G('g-com', L('Klien & SLA', 'Clients & SLA'), 'hotel', [N('sla', 'SLA', 'clock', 'SLA-001'), N('prp', L('Property', 'Properties'), 'hotel', 'PROPERTY-001'), N('ctc', L('Kontak', 'Contacts'), 'idcard', 'CONTACT-001'), N('svc', L('Layanan', 'Services'), 'washer', 'SERVICE-001'), N('cli', L('Klien', 'Clients'), 'users', 'CLIENT-001'), N('alc', L('Alert Komersial', 'Commercial Alerts'), 'bell', 'COM-ALERT-001')])] },
    supervisor: { add: [G('g-com', L('Property & SLA', 'Properties & SLA'), 'hotel', [N('sla', 'SLA', 'clock', 'SLA-001'), N('prp', L('Property', 'Properties'), 'hotel', 'PROPERTY-001'), N('ctc', L('Kontak', 'Contacts'), 'idcard', 'CONTACT-001'), N('svc', L('Layanan', 'Services'), 'washer', 'SERVICE-001')])] },
    client: { insert: [1, N('mine', L('Layanan & Kontrak', 'Services & Contract'), 'contract', 'CLT-COM-001')] }
  };
  // Plant of the Phase 6 clients (record scope for staff with one plant, §63).
  M.CLIENT_PLANT = { 'CL-07': 'PL-01', 'CL-08': 'PL-01', 'CL-09': 'PL-02', 'CL-10': 'PL-02', 'CL-11': 'PL-01', 'CL-12': 'PL-02' };
  /* install(): joins Phase 6 permissions, screens and menus to the shared config and access roles,
     and the Phase 6 open invoices to the Phase 5 AR ledger. Safe to call more than once. */
  M.install = function (C, X, P) {
    if (!C || C.__p6) return; C.__p6 = true;
    Object.keys(M.PERMS).forEach(function (k) { C.PERMS[k] = M.PERMS[k]; });
    function addP(list, extra) { extra.forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); }); }
    function rmP(list, rm) { rm.forEach(function (p) { var i = list.indexOf(p); if (i >= 0) list.splice(i, 1); }); }
    Object.keys(M.ROLE_PERMS).forEach(function (r) {
      var role = C.ROLES[r], xr = X && X.ROLES[r];
      if (role) { addP(role.perms, M.ROLE_PERMS[r]); rmP(role.perms, M.ROLE_REMOVE[r] || []); }
      if (xr && xr.perms) { addP(xr.perms, M.ROLE_PERMS[r]); rmP(xr.perms, M.ROLE_REMOVE[r] || []); }
    });
    Object.keys(M.NAV).forEach(function (r) {
      var cfg = M.NAV[r], role = C.ROLES[r]; if (!role) return;
      if (cfg.nav) role.nav = cfg.nav;
      if (cfg.mnav) role.mnav = cfg.mnav;
      if (cfg.replace) { var i = role.nav.map(function (n) { return n.k; }).indexOf(cfg.replace[0]); if (i >= 0) role.nav[i] = cfg.replace[1]; else role.nav.push(cfg.replace[1]); }
      if (cfg.insert) { role.nav.splice(cfg.insert[0], 0, cfg.insert[1]); if (role.mnav) role.mnav.splice(Math.min(cfg.insert[0], role.mnav.length), 0, cfg.insert[1]); }
      if (cfg.add) role.nav = role.nav.concat(cfg.add);
    });
    if (X && X.CLIENT_PLANT) Object.keys(M.CLIENT_PLANT).forEach(function (k) { if (!X.CLIENT_PLANT[k]) X.CLIENT_PLANT[k] = M.CLIENT_PLANT[k]; });
    var orig = C.screen, extra = {};
    M.SCREENS.forEach(function (s) { extra[s.id] = s; });
    C.screen = function (id) { return extra[id] || orig(id); };
    C.SCREENS_P6 = M.SCREENS;
    M.joinLedger();
    if (P) { var pn = P.clientName; P.clientName = function (id) { var c = M.client(id); return c ? c.n : pn(id); }; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.JFCOMM = M;
})(typeof window !== 'undefined' ? window : this);

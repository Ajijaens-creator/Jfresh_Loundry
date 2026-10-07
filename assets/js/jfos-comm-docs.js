/* ==========================================================================
   JFRESH OS — Phase 6 documentation data (Client & Commercial · NP Version
   1.0). Used by phase6/*.html only; the app reads the engine (jfos-comm.js),
   never this file.
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var APP = '../app/login.html?next=';
  function go(role, id) { return APP + encodeURIComponent('#/' + role + '/' + id) + '#/'; }

  var VISUALS = [
    { k: 'NV-00', f: 'nv01-09-overview.jpg', t: L('Ringkasan NV-01 sampai NV-09', 'NV-01 to NV-09 overview') },
    { k: 'NV-01', f: 'nv01-client-property-master.jpg', t: L('Client & Property Master', 'Client & Property Master') },
    { k: 'NV-02', f: 'nv02-contact-stakeholder.jpg', t: L('Contact & Stakeholder', 'Contact & Stakeholder') },
    { k: 'NV-03', f: 'nv03-service-commercial-offering.jpg', t: L('Service & Commercial Offering', 'Service & Commercial Offering') },
    { k: 'NV-04', f: 'nv04-contract-management.jpg', t: L('Contract Management', 'Contract Management') },
    { k: 'NV-05', f: 'nv05-rate-card-pricing.jpg', t: L('Rate Card & Pricing', 'Rate Card & Pricing') },
    { k: 'NV-06', f: 'nv06-sla-service-agreement.jpg', t: L('SLA & Service Agreement', 'SLA & Service Agreement') },
    { k: 'NV-07', f: 'nv07-documents-commercial-history.jpg', t: L('Dokumen & Riwayat Komersial', 'Documents & Commercial History') },
    { k: 'NV-08', f: 'nv08-renewal-approval-alerts.jpg', t: L('Renewal, Persetujuan & Alert', 'Renewal, Approval & Alerts') },
    { k: 'NV-09', f: 'nv09-client-health-profitability-growth.jpg', t: L('Client Health, Profitabilitas & Growth', 'Client Health, Profitability & Growth') }
  ];

  var NP = [
    { k: 'NP-01', id: 'np01', ic: 'users', v: 'NV-01', t: L('Client & Property Master', 'Client & Property Master'),
      d: L('Satu klien, banyak property. Client 360 sebagai pintu masuk komersial utama.', 'One client, many properties. Client 360 is the main commercial entry point.'),
      built: [L('Klien (grup) dan property adalah record terpisah; contoh Jaens Spa Group dengan 4 property', 'Client (group) and property are separate records; Jaens Spa Group with 4 properties as the example'), L('Client 360: header §5, ringkasan §6 dan 12 tab', 'Client 360: §5 header, §6 summary and 12 tabs'), L('Pencarian §57: nama, property, kode, telepon, kontak, nomor kontrak; 6 filter', '§57 search: name, property, code, phone, contact, contract number; 6 filters'), L('Termin dan limit kredit lewat persetujuan; status wajib alasan', 'Terms and credit limit go through approval; status needs a reason'), L('Portal klien hanya data sendiri (§55)', 'Client portal shows own data only (§55)')],
      links: [[L('Buka Client 360', 'Open Client 360'), go('owner', 'CLIENT-002/CL-07')], [L('Daftar klien', 'Client list'), go('sales', 'CLIENT-001')], [L('Sebagai klien', 'As a client'), go('client', 'CLT-COM-001')]] },
    { k: 'NP-02', id: 'np02', ic: 'idcard', v: 'NV-02', t: L('Contact & Stakeholder', 'Contact & Stakeholder'),
      d: L('Kontak tingkat grup dan property, banyak peran per kontak, dan rekomendasi siapa yang dihubungi.', 'Group-level and property-level contacts, many roles per contact, and a recommendation of whom to call.'),
      built: [L('Cakupan Semua / Terpilih / Satu property', 'All / Selected / Single property scope'), L('15 peran kontak; satu kontak bisa banyak peran', '15 contact roles; one contact can hold many'), L('Rekomendasi cerdas §12 per topik dengan kontak eskalasi', '§12 smart recommendation per topic with escalation contact'), L('Telepon, WhatsApp, email langsung dari HP', 'Phone, WhatsApp, email straight from the phone'), L('Nonaktif, tidak dihapus', 'Deactivate, never delete')],
      links: [[L('Direktori kontak', 'Contact directory'), go('sales', 'CONTACT-001')], [L('Detail kontak GM', 'GM contact detail'), go('sales', 'CONTACT-002/CT-071')]] },
    { k: 'NP-03', id: 'np03', ic: 'washer', v: 'NV-03', t: L('Service & Commercial Offering', 'Service & Commercial Offering'),
      d: L('Katalog layanan global dan konfigurasi layanan per property, dibedakan dengan jelas.', 'Global service catalog and per-property service configuration, clearly separated.'),
      built: [L('10 layanan katalog: kode, unit, harga master, SLA standar, proses, item', '10 catalog services: code, unit, master price, standard SLA, process, items'), L('Layanan per property: aktif, tarif khusus, SLA khusus, instruksi, minimum, express', 'Per-property services: active, custom rate, custom SLA, instructions, minimum, express'), L('Label Standar vs Khusus di setiap baris', 'Standard vs Custom label on every row'), L('Tarif tidak diubah di sini; lewat Rate Card', 'Rates are not edited here; they go through the Rate Card')],
      links: [[L('Katalog layanan', 'Service catalog'), go('owner', 'SERVICE-001')], [L('Layanan per klien', 'Client services'), go('owner', 'SERVICE-002')]] },
    { k: 'NP-04', id: 'np04', ic: 'contract', v: 'NV-04', t: L('Contract Management', 'Contract Management'),
      d: L('Kontrak multi-property dengan versi; versi lama tidak pernah ditimpa.', 'Multi-property contracts with versions; an old version is never overwritten.'),
      built: [L('7 status dengan stepper lifecycle', '7 statuses with a lifecycle stepper'), L('Versi baru → review → persetujuan → aktif; versi lama diarsipkan', 'New version → review → approval → active; old version archived'), L('Perbandingan berdampingan dengan field berubah disorot', 'Side-by-side comparison with changed fields highlighted'), L('Editor hanya di desktop/iPad; HP melihat ringkasan', 'Editor on desktop/iPad only; mobile shows a summary')],
      links: [[L('Detail kontrak Jaens', 'Jaens contract detail'), go('owner', 'CONTRACT-002/CTR-2025-022')], [L('Bandingkan versi', 'Compare versions'), go('owner', 'CONTRACT-004/CTR-2025-022')]] },
    { k: 'NP-05', id: 'np05', ic: 'tag', v: 'NV-05', t: L('Rate Card & Pricing', 'Rate Card & Pricing'),
      d: L('Harga master ≠ harga klien. Perubahan tarif lewat alur Draft → Review → Approval → Effective.', 'Master price ≠ client price. Rate changes go Draft → Review → Approval → Effective.'),
      built: [L('8 model harga: kg, pcs, item, kategori, paket, minimum, express, special', '8 pricing models: kg, pcs, item, category, package, minimum, express, special'), L('Pratinjau selisih % dan dampak revenue sebelum diajukan', 'Difference % and revenue impact preview before sending'), L('Invoice lama tetap memakai tarif pada tanggal invoice', 'Old invoices keep the rate valid on their date'), L('Peringatan tarif tumpang tindih (§72)', 'Overlapping rate warning (§72)'), L('Harga hanya untuk izin com.rate.view', 'Pricing only with com.rate.view')],
      links: [[L('Detail Rate Card', 'Rate Card detail'), go('owner', 'RATE-002/RC-07')], [L('Ajukan tarif', 'Request a rate'), go('sales', 'RATE-003/RC-07')]] },
    { k: 'NP-06', id: 'np06', ic: 'clock', v: 'NV-06', t: L('SLA & Service Agreement', 'SLA & Service Agreement'),
      d: L('Aturan SLA dengan hirarki override, SLA clock dan eskalasi.', 'SLA rules with an override hierarchy, the SLA clock and escalation.'),
      built: [L('Clock: start, pause (alasan wajib), resume, complete dengan timestamp', 'Clock: start, pause (reason required), resume, complete with timestamps'), L('Eskalasi 75% info · 90% warning · 100% late', 'Escalation 75% info · 90% warning · 100% late'), L('Penguji hirarki: property > klien > layanan > kategori > prioritas > hari', 'Hierarchy tester: property > client > service > category > priority > day'), L('Aturan bentrok ditolak tanpa prioritas (§73)', 'Conflicting rules refused without precedence (§73)')],
      links: [[L('Dashboard SLA', 'SLA dashboard'), go('owner', 'SLA-001')], [L('Detail SLA clock', 'SLA clock detail'), go('owner', 'SLA-002/ORD-2610-04123')]] },
    { k: 'NP-07', id: 'np07', ic: 'history', v: 'NV-07', t: L('Dokumen & Riwayat Komersial', 'Documents & Commercial History'),
      d: L('Pusat dokumen dengan versi, dan satu timeline komersial terpadu.', 'A versioned document center and one integrated commercial timeline.'),
      built: [L('12 jenis dokumen; versi baru tidak menimpa file lama', '12 document types; a new version never replaces the old file'), L('Timeline: siapa, kapan, lama, baru, alasan, dokumen, record', 'Timeline: who, when, old, new, reason, document, record'), L('Audit log lengkap untuk owner', 'Full audit log for the owner'), L('Arsip, bukan hapus', 'Archive, not delete')],
      links: [[L('Pusat dokumen', 'Document center'), go('owner', 'DOC-001')], [L('Timeline Jaens', 'Jaens timeline'), go('owner', 'HISTORY-001?cl=CL-07')]] },
    { k: 'NP-08', id: 'np08', ic: 'refresh', v: 'NV-08', t: L('Renewal, Persetujuan & Alert', 'Renewal, Approval & Alerts'),
      d: L('Renewal dimulai sebelum kontrak berakhir; semua perubahan komersial lewat inbox persetujuan.', 'Renewal starts before expiry; every commercial change goes through the approval inbox.'),
      built: [L('Bucket 30/60/90 hari, berakhir, berjalan, menunggu approval', '30/60/90-day, expired, in-progress and approval-pending buckets'), L('Pipeline 6 tahap; Renewed hanya setelah kontrak baru disetujui', '6-stage pipeline; Renewed only after the new contract is approved'), L('Inbox 7 jenis: approve, reject, return; tidak bisa setujui sendiri', '7 request types: approve, reject, return; no self-approval'), L('Alert sesuai peran, diurutkan §67', 'Role-filtered alerts sorted per §67')],
      links: [[L('Dashboard renewal', 'Renewal dashboard'), go('sales', 'RENEW-001')], [L('Inbox persetujuan', 'Approval inbox'), go('owner', 'APPROVAL-001')], [L('Alert', 'Alerts'), go('owner', 'COM-ALERT-001')]] },
    { k: 'NP-09', id: 'np09', ic: 'gauge', v: 'NV-09', t: L('Client Health, Profitabilitas & Growth', 'Client Health, Profitability & Growth'),
      d: L('Health score 10 dimensi yang bisa dijelaskan, profitabilitas, growth, risiko dan opportunity.', 'An explainable 10-dimension health score, profitability, growth, risk and opportunities.'),
      built: [L('10 dimensi dengan skor, bobot, tren, status; bobot total 100%', '10 dimensions with score, weight, trend, status; weights total 100%'), L('Drill-down sampai sumber transaksi / keuangan / SLA / komplain', 'Drill-down to transaction / finance / SLA / complaint source'), L('Kesegaran data dan peringatan data belum lengkap', 'Data freshness and incomplete-data warning'), L('Insight WHAT · WHY · RISK · OPPORTUNITY · ACTION', 'WHAT · WHY · RISK · OPPORTUNITY · ACTION insight'), L('Margin hanya untuk izin com.margin.view', 'Margin only with com.margin.view')],
      links: [[L('Client Health', 'Client Health'), go('owner', 'HEALTH-001')], [L('Health Jaens', 'Jaens health'), go('owner', 'HEALTH-001?cl=CL-07')], [L('Opportunity', 'Opportunities'), go('sales', 'OPP-001')]] }
  ];

  // Lifecycle (§0) linked to its screen
  var MODEL = {
    flow: ['Client', 'Property', 'Contact', 'Service', 'Contract', 'Rate Card', 'SLA', 'Document', 'Renewal', 'Client Health', 'Profitability', 'Growth'],
    tree: ['Client Company / Group', 'Property / Outlet', 'Contract', 'Rate Card', 'SLA'],
    links: { 'Client': 'CLIENT-001', 'Client Company / Group': 'CLIENT-002', 'Property': 'PROPERTY-001', 'Property / Outlet': 'PROPERTY-001', 'Contact': 'CONTACT-001', 'Service': 'SERVICE-001', 'Contract': 'CONTRACT-001', 'Rate Card': 'RATE-001', 'SLA': 'SLA-001', 'Document': 'DOC-001', 'Renewal': 'RENEW-001', 'Client Health': 'HEALTH-001', 'Profitability': 'HEALTH-001', 'Growth': 'HEALTH-001' }
  };

  // §65 per screen: entry, primary data, primary action, secondary actions, filters, validation, audit, NB, Phase 3 components
  function sp(entry, data, act, sec, flt, val, aud, nb, cmp) { return { entry: entry, data: data, act: act, sec: sec, flt: flt, val: val, aud: aud, nb: nb, cmp: cmp }; }
  var NONE = L('Tidak ada input', 'No input');
  var SPEC = {
    'CLIENT-001': sp(L('Menu Klien & Property › Klien', 'Clients & Properties menu › Clients'), L('Klien, tipe, status, AM, lokasi, health, renewal, revenue', 'Client, type, status, AM, location, health, renewal, revenue'), L('Buka Client 360', 'Open Client 360'), L('Buat klien', 'Create client'), L('Tipe, status, AM, lokasi, health, renewal + pencarian §57', 'Type, status, AM, location, health, renewal + §57 search'), NONE, '—', 'NB-02', 'Tile, Table/CardList, Filter, Chip, Ring'),
    'CLIENT-002': sp(L('Daftar klien, Health, alert, pencarian', 'Client list, Health, alerts, search'), L('Header §5, ringkasan §6, 12 tab', '§5 header, §6 summary, 12 tabs'), L('Follow-up, meeting, proposal, opportunity', 'Follow-up, meeting, proposal, opportunity'), L('Catatan, eskalasi risiko, ajukan harga, tambah property', 'Note, escalate risk, request pricing, add property'), L('Tab, plant', 'Tab, plant'), L('Tugas: judul dan tanggal wajib', 'Task: title and date required'), 'TASK.CREATE', 'NB-02', 'Header, Tile, Tabs, Insight, Card, Ring'),
    'CLIENT-003': sp(L('Client 360 › Edit, daftar › Buat', 'Client 360 › Edit, list › Create'), L('17 field master klien §3', '17 client master fields §3'), L('Simpan', 'Save'), L('Ajukan termin / limit kredit', 'Request terms / credit limit'), '—', L('Kode unik, nama, tipe, alamat wajib; status butuh alasan; termin & kredit lewat persetujuan', 'Unique code, name, type, address required; status needs a reason; terms & credit via approval'), 'CLIENT.CREATE · CLIENT.EDIT · CLIENT.STATUS · CREDIT.CHANGE', 'NB-02', 'Form, Field, Select, Dialog'),
    'PROPERTY-001': sp(L('Menu Klien & Property › Property', 'Clients & Properties menu › Properties'), L('Property, grup, PIC operasional, lokasi, layanan, SLA, status', 'Property, group, operational PIC, location, services, SLA, status'), L('Buka detail', 'Open detail'), L('Tambah property', 'Add property'), L('Grup, PIC, lokasi, layanan, SLA, status (§58)', 'Group, PIC, location, service, SLA, status (§58)'), NONE, '—', 'NB-02', 'Table/CardList, Filter, Chip'),
    'PROPERTY-002': sp(L('Daftar property, Client 360', 'Property list, Client 360'), L('PIC, jadwal pickup/antar, layanan, tarif, SLA, instruksi, kontrak', 'PICs, pickup/delivery schedule, services, rates, SLA, instructions, contracts'), L('Atur layanan', 'Configure services'), L('Edit, hubungi PIC', 'Edit, contact PIC'), '—', NONE, '—', 'NB-02', 'Header, Card, KV, Contact row'),
    'PROPERTY-003': sp(L('Client 360 › Tambah property', 'Client 360 › Add property'), L('20 field property §4; alamat & PIC dari data klien', '20 property fields §4; address & PICs from client data'), L('Simpan', 'Save'), '—', '—', L('Klien, nama, tipe, alamat wajib; PIC harus kontak klien ini', 'Client, name, type, address required; PICs must be this client\'s contacts'), 'PROPERTY.ADD · PROPERTY.EDIT · PROPERTY.STATUS', 'NB-02', 'Form, Field, Select'),
    'CONTACT-001': sp(L('Menu Klien & Property › Kontak', 'Clients & Properties menu › Contacts'), L('Kontak grup dan property, peran, cakupan; tampilan org', 'Group and property contacts, roles, scope; org view'), L('Rekomendasi kontak per topik', 'Contact recommendation per topic'), L('Tambah kontak, telepon, WhatsApp, email', 'Add contact, phone, WhatsApp, email'), L('Klien, property, peran, level', 'Client, property, role, level'), NONE, '—', 'NB-03', 'Tabs, CardList, Chip, Avatar'),
    'CONTACT-002': sp(L('Direktori kontak, Client 360', 'Contact directory, Client 360'), L('Peran, cakupan property, metode kontak, riwayat', 'Roles, property scope, contact method, history'), L('Hubungi', 'Contact'), L('Ubah peran, nonaktifkan', 'Change roles, deactivate'), '—', L('Nama, klien, satu cara kontak wajib; cakupan terpilih minimal 1 property', 'Name, client, one contact method required; selected scope needs at least 1 property'), 'CONTACT.ADD · CONTACT.EDIT · CONTACT.ROLE · CONTACT.STATUS', 'NB-03', 'Header, Chip, Button, Timeline'),
    'SERVICE-001': sp(L('Menu Layanan › Katalog', 'Services menu › Catalog'), L('Kode, nama, unit, harga master, SLA standar, proses, item', 'Code, name, unit, master price, standard SLA, process, items'), L('Lihat klien pemakai', 'See clients using it'), L('Ubah master (owner)', 'Edit master (owner)'), L('Status, unit', 'Status, unit'), L('Ubah harga master tidak menyentuh tarif klien', 'A master price change never touches client rates'), 'SERVICE.MASTER', 'NB-04', 'Table/CardList, Chip'),
    'SERVICE-002': sp(L('Katalog, detail property', 'Catalog, property detail'), L('Layanan aktif per property dengan label Standar/Khusus', 'Active services per property with Standard/Custom label'), L('Atur layanan', 'Configure service'), '—', L('Klien, property', 'Client, property'), L('Tarif khusus hanya lewat Rate Card', 'Custom rate only via the Rate Card'), 'SERVICE.CONFIG', 'NB-04', 'Table, Switch, Chip, Dialog'),
    'CONTRACT-001': sp(L('Menu Kontrak & Harga › Kontrak', 'Contracts & Pricing menu › Contracts'), L('Nomor, klien, property, periode, status, sisa hari', 'Number, client, properties, period, status, days left'), L('Buka detail', 'Open detail'), L('Buat kontrak', 'Create contract'), L('Status, klien, AM, berakhir dalam', 'Status, client, AM, expiring within'), NONE, '—', 'NB-05', 'Tile, Table/CardList, Filter'),
    'CONTRACT-002': sp(L('Daftar kontrak, Client 360, renewal', 'Contract list, Client 360, renewal'), L('Isi kontrak §16, property, versi, dokumen, riwayat', '§16 terms, properties, versions, documents, history'), L('Aksi sesuai status (review, setujui, aktifkan)', 'Status actions (review, approve, activate)'), L('Versi baru, syarat khusus, renewal, terminasi', 'New version, special term, renewal, terminate'), '—', L('Terminasi wajib alasan; syarat khusus lewat persetujuan', 'Termination needs a reason; special terms via approval'), 'CONTRACT.STATUS · SPECIAL.TERM · RENEWAL.START', 'NB-05', 'Stepper, Card, KV, Chip, Timeline'),
    'CONTRACT-003': sp(L('Detail kontrak › Versi baru, daftar › Buat', 'Contract detail › New version, list › Create'), L('Field kontrak §16 dari data klien', '§16 contract fields from client data'), L('Kirim ke review', 'Send to review'), L('Simpan draft', 'Save draft'), '—', L('Property milik klien, tanggal valid, alasan & tanggal berlaku untuk versi baru; tidak ada dua versi dalam review', 'Properties belong to the client, valid dates, reason & effective date for a new version; no two versions in review'), 'CONTRACT.DRAFT · CONTRACT.VERSION · APPROVAL.REQUEST', 'NB-05', 'Form, Checkbox, Select, Note'),
    'CONTRACT-004': sp(L('Detail kontrak › Bandingkan', 'Contract detail › Compare'), L('Nilai lama vs baru per field §20', 'Old vs new value per field §20'), L('Pilih versi', 'Pick versions'), L('Hanya perubahan', 'Changes only'), L('Versi A, versi B', 'Version A, version B'), NONE, '—', 'NB-05', 'Compare grid, Chip, Switch'),
    'RATE-001': sp(L('Menu Kontrak & Harga › Rate Card', 'Contracts & Pricing menu › Rate Cards'), L('Rate Card, klien, property, kontrak, periode, status, versi', 'Rate Card, client, property, contract, period, status, version'), L('Buka detail', 'Open detail'), L('Ajukan tarif', 'Request rate'), L('Status, klien', 'Status, client'), L('Tumpang tindih diperingatkan', 'Overlaps are warned'), 'RATE.OVERLAP', 'NB-06', 'Tile, Table/CardList, Note'),
    'RATE-002': sp(L('Daftar Rate Card, kontrak, Client 360', 'Rate Card list, contract, Client 360'), L('Header §22, baris tarif §23, riwayat, invoice, versi', '§22 header, §23 rate lines, history, invoices, versions'), L('Ajukan perubahan', 'Request change'), L('Lihat invoice dengan tarif historis', 'See invoices with historical rates'), L('Tab', 'Tab'), NONE, '—', 'NB-06', 'Header, Tabs, Table, Chip'),
    'RATE-003': sp(L('Detail Rate Card › Ajukan', 'Rate Card detail › Request'), L('Tarif lama, baru, selisih %, dampak, tanggal berlaku', 'Old rate, new rate, difference %, impact, effective date'), L('Kirim ke persetujuan', 'Send for approval'), L('Simpan draft, diskon', 'Save draft, discount'), '—', L('Alasan wajib; tanggal berlaku tidak di masa lalu; satu permintaan aktif per layanan; diskon 0–50%', 'Reason required; effective date not in the past; one open request per service; discount 0–50%'), 'RATE.REQUEST · APPROVAL.REQUEST · RATE.UPDATE', 'NB-06', 'Form, Live preview, Note'),
    'SLA-001': sp(L('Menu Layanan › SLA', 'Services menu › SLA'), L('Clock berjalan, on-time %, aturan, hirarki', 'Running clocks, on-time %, rules, hierarchy'), L('Pause / resume / complete', 'Pause / resume / complete'), L('Tambah aturan, uji hirarki', 'Add rule, test hierarchy'), L('Tab, status, klien', 'Tab, status, client'), L('Pause wajib alasan; aturan bentrok ditolak', 'Pause needs a reason; conflicting rules refused'), 'SLA.CLOCK · SLA.RULE', 'NB-07', 'Tabs, Progress bar, Table, Dialog'),
    'SLA-002': sp(L('Dashboard SLA, Client 360', 'SLA dashboard, Client 360'), L('Satu clock (riwayat, rantai aturan) atau satu aturan', 'One clock (history, rule chain) or one rule'), L('Aksi clock', 'Clock action'), L('Ajukan pengecualian', 'Request exception'), '—', L('Pengecualian wajib alasan, lewat persetujuan', 'Exception needs a reason, via approval'), 'SLA.CLOCK · APPROVAL.REQUEST', 'NB-07', 'Header, Bar, Timeline'),
    'DOC-001': sp(L('Menu Dokumen & Riwayat › Dokumen', 'Documents & History menu › Documents'), L('Dokumen §34 dengan versi', '§34 documents with versions'), L('Unggah', 'Upload'), L('Versi baru, arsipkan', 'New version, archive'), L('Jenis, klien, status', 'Type, client, status'), L('Nama, jenis, klien wajib; versi baru tidak menimpa', 'Name, type, client required; new version never overwrites'), 'DOC.ADD · DOC.VERSION · DOC.STATUS', 'NB-08', 'Table/CardList, Dialog, File input'),
    'HISTORY-001': sp(L('Menu Dokumen & Riwayat › Timeline, Client 360', 'Documents & History menu › Timeline, Client 360'), L('Event §35 dengan nilai lama/baru, alasan, dokumen', '§35 events with old/new value, reason, document'), L('Buka record terkait', 'Open related record'), L('Audit log (owner)', 'Audit log (owner)'), L('Klien, grup event', 'Client, event group'), NONE, '—', 'NB-08', 'Timeline, Filter, Table'),
    'RENEW-001': sp(L('Menu Renewal, alert, dashboard sales', 'Renewal menu, alerts, sales dashboard'), L('Bucket §37 dan pipeline §38', '§37 buckets and §38 pipeline'), L('Buka kartu renewal', 'Open renewal card'), '—', L('Bucket, AM, risiko', 'Bucket, AM, risk'), NONE, '—', 'NB-09', 'Tile, Kanban (PC/iPad), CardList (HP)'),
    'RENEW-002': sp(L('Dashboard renewal, detail kontrak', 'Renewal dashboard, contract detail'), L('Kartu §39, kondisi akun, risiko, kontak, riwayat', '§39 card, account condition, risks, contact, history'), L('Pindah tahap', 'Move stage'), L('Follow-up, meeting, buat kontrak baru', 'Follow-up, meeting, create new contract'), '—', L('Renewed hanya setelah kontrak baru disetujui', 'Renewed only after the new contract is approved'), 'RENEWAL.STAGE · CONTRACT.DRAFT · TASK.CREATE', 'NB-09', 'Stepper, Tile, Card, Contact row'),
    'APPROVAL-001': sp(L('Menu Persetujuan, notifikasi', 'Approvals menu, notifications'), L('7 jenis permintaan dengan field §41', '7 request types with §41 fields'), L('Setujui', 'Approve'), L('Tolak, kembalikan, ajukan ulang, credit note, limit kredit', 'Reject, return, resubmit, credit note, credit limit'), L('Menunggu, selesai, milik saya, semua; jenis', 'Pending, done, mine, all; type'), L('Tolak & kembalikan wajib alasan; tidak bisa setujui permintaan sendiri', 'Reject & return need a reason; no approving own request'), 'APPROVAL.APPROVE · APPROVAL.REJECT · APPROVAL.RETURN', 'NB-09', 'Table, Detail panel, Dialog'),
    'COM-ALERT-001': sp(L('Lonceng, menu Alert', 'Bell, Alerts menu'), L('Alert §40 sesuai peran, urut §67', '§40 alerts per role, §67 order'), L('Buka record', 'Open record'), L('Tandai sudah dilihat', 'Acknowledge'), L('Severity, jenis', 'Severity, kind'), NONE, '—', 'NB-09', 'Tile, Alert list, Chip'),
    'HEALTH-001': sp(L('Menu Health, Client 360, Business Health Phase 5', 'Health menu, Client 360, Phase 5 Business Health'), L('Health portofolio, profit, growth, risiko; per klien 10 dimensi', 'Portfolio health, profit, growth, risk; per client 10 dimensions'), L('Drill-down', 'Drill-down'), L('Koreksi manual, atur bobot', 'Manual adjustment, set weights'), L('Tab, status', 'Tab, status'), L('Koreksi: izin, batas ±10, alasan; bobot total 100%', 'Adjustment: permission, ±10 limit, reason; weights total 100%'), 'HEALTH.ADJUST · HEALTH.WEIGHTS', 'NB-10', 'Tabs, Ring, Dimension table, Drill, Freshness'),
    'OPP-001': sp(L('Menu Opportunity, Client 360', 'Opportunities menu, Client 360'), L('Opportunity §48 per tahap', '§48 opportunities by stage'), L('Buka detail', 'Open detail'), L('Buat opportunity', 'Create opportunity'), L('Tampilan board/daftar, tahap, AM', 'Board/list view, stage, AM'), NONE, '—', 'NB-10', 'Kanban, CardList, Filter'),
    'OPP-002': sp(L('Daftar opportunity, Client 360, renewal', 'Opportunity list, Client 360, renewal'), L('Field §48, tahap, kontak, riwayat', '§48 fields, stage, contact, history'), L('Pindah tahap', 'Move stage'), L('Edit, follow-up', 'Edit, follow-up'), '—', L('Nama, klien, potensi, probabilitas 0–100; kalah wajib alasan', 'Name, client, potential, probability 0–100; lost needs a reason'), 'OPP.CREATE · OPP.STAGE', 'NB-10', 'Stepper, Card, Dialog'),
    'CLT-COM-001': sp(L('Portal klien › Layanan & Kontrak', 'Client portal › Services & Contract'), L('Layanan, kontrak, SLA, dokumen milik klien sendiri', 'Own services, contract, SLA, documents'), L('Lihat dokumen', 'View documents'), '—', L('Tab', 'Tab'), NONE, 'ACCESS.DENIED', 'NB-02', 'Tabs, Card, Table')
  };

  var DEVICE = { t: ['RENEW-002', 'CONTRACT-004', 'OPP-002'], m: ['CONTACT-001', 'CONTACT-002', 'COM-ALERT-001', 'SLA-002'] };
  var DEV_TXT = {
    d: L('Utama di desktop: Client 360, tabel, kontrak, harga, analitik health. iPad 2 kolom untuk review. HP: ringkasan dan aksi cepat; editor harga/kontrak tidak dibuka di HP.', 'Desktop first: Client 360, tables, contracts, pricing, health analytics. iPad two columns for review. Mobile: summary and quick actions; pricing/contract editors do not open on mobile.'),
    t: L('Utama di iPad: meeting klien dan renewal, kartu besar, kontrol sentuh. Desktop lebih lebar; HP satu kolom.', 'iPad first: client and renewal meetings, large cards, touch controls. Desktop wider; mobile single column.'),
    m: L('Utama di HP: cari cepat, telepon, WhatsApp, SLA, alert, follow-up. Desktop dan iPad menampilkan lebih banyak konteks.', 'Mobile first: quick lookup, call, WhatsApp, SLA, alerts, follow-up. Desktop and iPad show more context.')
  };
  function device(id) { return DEVICE.t.indexOf(id) >= 0 ? 't' : DEVICE.m.indexOf(id) >= 0 ? 'm' : 'd'; }

  // §76: [item, done|backend, evidence link]
  function d(t, ev) { return [t, 'done', ev]; }
  var DOD = [
    d(L('Client Group dan Property dipisah', 'Client Group and Property separated'), 'tests.html#np01'),
    d(L('Klien multi-property didukung', 'Multi-property client supported'), go('owner', 'CLIENT-002/CL-07')),
    d(L('Client 360 lengkap', 'Client 360 complete'), go('owner', 'CLIENT-002/CL-07')),
    d(L('Kontak tingkat grup didukung', 'Group-level contacts supported'), go('sales', 'CONTACT-001')),
    d(L('Kontak tingkat property didukung', 'Property-level contacts supported'), go('sales', 'CONTACT-001')),
    d(L('Cakupan kontak berfungsi', 'Contact scope works'), 'tests.html#np02'),
    d(L('Rekomendasi kontak cerdas berfungsi', 'Smart contact recommendation works'), go('sales', 'CONTACT-001')),
    d(L('Katalog layanan lengkap', 'Service Catalog complete'), go('owner', 'SERVICE-001')),
    d(L('Pemilihan layanan klien lengkap', 'Client Service Selection complete'), go('owner', 'SERVICE-002')),
    d(L('Layanan standar vs khusus jelas', 'Standard vs custom service clear'), 'tests.html#np03'),
    d(L('Kontrak berversi', 'Contracts versioned'), 'tests.html#np04'),
    d(L('Kontrak multi-property didukung', 'Multi-property contract supported'), go('owner', 'CONTRACT-002/CTR-2025-022')),
    d(L('Perbandingan kontrak berfungsi', 'Contract comparison works'), go('owner', 'CONTRACT-004/CTR-2025-022')),
    d(L('Rate Card lengkap', 'Rate Card complete'), go('owner', 'RATE-002/RC-07')),
    d(L('Effective dating berfungsi', 'Effective dating works'), 'tests.html#np05'),
    d(L('Tarif historis terjaga', 'Historical rates preserved'), 'tests.html#np05'),
    d(L('Persetujuan harga berfungsi', 'Pricing approvals work'), go('owner', 'APPROVAL-001')),
    d(L('Konfigurasi SLA lengkap', 'SLA configuration complete'), go('owner', 'SLA-001')),
    d(L('SLA clock berfungsi', 'SLA clock works'), 'tests.html#np06'),
    d(L('Eskalasi SLA berfungsi', 'SLA escalation works'), 'tests.html#np06'),
    d(L('Pusat dokumen klien berfungsi', 'Client document center works'), go('owner', 'DOC-001')),
    d(L('Timeline komersial berfungsi', 'Commercial timeline works'), go('owner', 'HISTORY-001')),
    d(L('Dashboard renewal berfungsi', 'Renewal dashboard works'), go('sales', 'RENEW-001')),
    d(L('Pipeline renewal berfungsi', 'Renewal pipeline works'), 'tests.html#np08'),
    d(L('Alert komersial berfungsi', 'Commercial alerts work'), go('owner', 'COM-ALERT-001')),
    d(L('Inbox persetujuan berfungsi', 'Approval inbox works'), go('owner', 'APPROVAL-001')),
    d(L('Client Health berfungsi', 'Client Health works'), go('owner', 'HEALTH-001')),
    d(L('Profitabilitas berfungsi', 'Profitability works'), go('owner', 'HEALTH-001?tab=profit')),
    d(L('Analitik growth berfungsi', 'Growth analytics works'), go('owner', 'HEALTH-001?tab=growth')),
    d(L('Risiko klien berfungsi', 'Client risk works'), go('owner', 'HEALTH-001?tab=risk')),
    d(L('Manajemen opportunity berfungsi', 'Opportunity management works'), go('sales', 'OPP-001')),
    d(L('Integrasi keuangan (AR dari ledger Phase 5)', 'Finance integration (AR from the Phase 5 ledger)'), 'tests.html#gov'),
    d(L('Integrasi SLA operasional', 'SLA integration'), 'tests.html#np06'),
    d(L('Integrasi komplain / quality ke health', 'Complaint/quality integration into health'), 'tests.html#gov'),
    d(L('Audit trail lengkap', 'Audit trail complete'), 'tests.html#gov'),
    d(L('Isolasi data klien ditegakkan', 'Client data isolation enforced'), 'tests.html#gov'),
    d(L('Desktop responsif lengkap', 'Responsive desktop complete'), 'tests.html#responsive'),
    d(L('Mode review iPad lengkap', 'iPad review mode complete'), 'tests.html#responsive'),
    d(L('Akses cepat mobile lengkap', 'Mobile quick access complete'), 'tests.html#responsive'),
    d(L('Brand guideline terjaga', 'Brand guideline preserved'), 'index.html#rules'),
    [L('Data, izin dan audit diulang di server', 'Data, permissions and audit repeated on the server'), 'backend', 'index.html#backend']
  ];

  // §77
  var RULES = [
    L('Bedakan tanggung jawab tingkat grup dan property', 'Distinguish group-level and property-level responsibility'), L('Simpan riwayat versi', 'Preserve version history'), L('Pakai tanggal berlaku', 'Use effective dates'),
    L('Audit perubahan harga dan kontrak', 'Audit pricing and contract changes'), L('Hubungkan SLA ke operasional nyata', 'Connect SLA to actual operation'), L('Hubungkan keuangan ke Client 360', 'Connect finance to Client 360'),
    L('Hubungkan komplain ke health score', 'Connect complaint to health score'), L('Munculkan risiko sebelum kontrak berakhir', 'Surface risk before expiry'), L('Munculkan peluang growth', 'Surface growth opportunities'),
    L('Bahasa Indonesia sebagai default', 'Bahasa Indonesia as default'), L('Ikuti brand guideline J\'Fresh', 'Follow the J\'Fresh brand guideline')
  ];
  var DONT = [
    L('Menggabungkan klien dan property dalam satu record', 'Merge client company and property into one record'), L('Menganggap satu kontak untuk seluruh organisasi', 'Assume one contact for the whole organisation'), L('Menganggap Director/GM menangani operasional harian', 'Assume the Director/GM handles daily operations'),
    L('Menimpa kontrak historis', 'Overwrite historic contracts'), L('Menimpa Rate Card historis', 'Overwrite historic Rate Cards'), L('Mengubah harga invoice lama setelah tarif berubah', 'Change past invoice pricing after a rate change'),
    L('Menampilkan harga ke yang tidak berhak', 'Expose pricing to unauthorised users'), L('Menampilkan profitabilitas ke frontline', 'Expose profitability to frontline users'), L('Menampilkan data satu klien ke klien lain', 'Expose one client\'s data to another client'),
    L('Menyalin data keuangan secara manual', 'Manually duplicate finance data'), L('Menunggu kontrak berakhir baru mulai renewal', 'Wait for expiry before starting renewal'), L('Menghapus riwayat komersial diam-diam', 'Silently delete commercial history'),
    L('Membuat ulang logo J\'Fresh', 'Recreate the J\'Fresh logo'), L('Mengubah identitas visual', 'Change the approved visual identity')
  ];

  var RESPONSIVE = [
    ['1440', L('Desktop: sidebar bergrup, Client 360 dengan tile dan tab, tabel penuh, inbox dengan panel detail, kanban renewal.', 'Desktop: grouped sidebar, Client 360 with tiles and tabs, full tables, inbox with detail panel, renewal kanban.')],
    ['900', L('iPad (review/meeting): rail ikon, kartu 2 kolom, kontak menumpuk tombolnya bila kartu sempit, inbox satu kolom.', 'iPad (review/meeting): icon rail, two-column cards, contact buttons stack in narrow cards, single-column inbox.')],
    ['390', L('Mobile: bottom nav, cari cepat, telepon/WhatsApp, SLA, alert, follow-up; editor kontrak dan tarif menampilkan pesan buka di desktop/iPad.', 'Mobile: bottom nav, quick lookup, call/WhatsApp, SLA, alerts, follow-up; contract and rate editors show an open-on-desktop/iPad message.')],
    ['A11Y', L('Target sentuh ≥ 44 px, fokus terlihat, dialog bisa ditutup dengan Escape, status punya label teks, bukan hanya warna.', 'Touch targets ≥ 44 px, visible focus, dialogs close with Escape, statuses carry text labels, not only colour.')],
    ['QA', L('Semua layar dibuka sebagai owner, sales, finance, supervisor dan dua klien di 1440, 900 dan 390 px: 0 error, 0 overflow. Alur ujung ke ujung (ajukan tarif → setujui → versi terjadwal; versi kontrak → setujui → aktif; pause SLA; renewal; koreksi health; versi dokumen) lulus.', 'Every screen opened as owner, sales, finance, supervisor and two clients at 1440, 900 and 390 px: 0 errors, 0 overflow. End-to-end flows (rate request → approve → scheduled version; contract version → approve → active; SLA pause; renewal; health adjustment; document version) pass.')]
  ];

  var API = { VISUALS: VISUALS, NP: NP, MODEL: MODEL, SPEC: SPEC, DEV_TXT: DEV_TXT, device: device, DOD: DOD, RULES: RULES, DONT: DONT, RESPONSIVE: RESPONSIVE, go: go };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.JFCOMM_DOCS = API;
})(typeof window !== 'undefined' ? window : this);

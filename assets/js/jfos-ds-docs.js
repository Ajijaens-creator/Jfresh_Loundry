/* ==========================================================================
   JFRESH OS — Design System documentation data (Phase 3)
   Component documentation (§61), page list, design QA checklist (§62),
   traceability Phase 1 → Phase 2 → Phase 3 (§63) and Definition of Done (§72).
   Read by phase3/*.html and tools/build-phase3-docs.js.
   ========================================================================== */
(function (root) {
  var DS = root.JFDS || (typeof require !== 'undefined' ? require('./jfos-ds.js') : {});
  function L(a, b) { return [a, b === undefined ? a : b]; }

  /* ---------- Phase 3 pages ---------- */
  DS.PAGES = [
    { k: 'NP-01', f: 'np01-brand.html', t: L('Brand Digital Foundation', 'Brand Digital Foundation'), d: L('Logo, warna, elemen brand, gaya ikon dan token warna', 'Logo, colour, brand elements, icon style and colour tokens'), ic: 'palette', img: 'np01-brand-digital-foundation.jpg' },
    { k: 'NP-02', f: 'np02-typography.html', t: L('Typography & Readability', 'Typography & Readability'), d: L('Inter, skala ukuran per perangkat, bobot, copywriting, angka', 'Inter, size scale per device, weights, copywriting, numbers'), ic: 'type', img: 'np02-typography.jpg' },
    { k: 'NP-03', f: 'np03-grid.html', t: L('Grid, Spacing & Layout', 'Grid, Spacing & Layout'), d: L('Grid 12/8/4, spacing, radius, anatomi layout, hierarki konten', '12/8/4 grid, spacing, radius, layout anatomy, content hierarchy'), ic: 'columns', img: 'np03-grid-spacing-layout.jpg' },
    { k: 'NP-04', f: 'np04-components.html', t: L('Core Component Library', 'Core Component Library'), d: L('Tombol, form, status, kartu, navigasi, data, feedback, media, stepper', 'Buttons, forms, status, cards, navigation, data, feedback, media, stepper'), ic: 'component', img: 'np04-core-components.jpg' },
    { k: 'NP-05', f: 'np05-operational.html', t: L('Operational UI Patterns', 'Operational UI Patterns'), d: L('Work Queue, Task Detail, Quick Action, Stepper, QC, Issue Flow', 'Work Queue, Task Detail, Quick Action, Stepper, QC, Issue Flow'), ic: 'clipboard', img: 'np05-operational-patterns.jpg' },
    { k: 'NP-06', f: 'np06-management.html', t: L('Management UI Patterns', 'Management UI Patterns'), d: L('KPI, insight, alert center, drill-down, tabel, approval', 'KPI, insight, alert center, drill-down, table, approval'), ic: 'chart', img: 'np06-management-patterns.jpg' },
    { k: 'NP-07', f: 'np07-states.html', t: L('State, Feedback & Accessibility', 'State, Feedback & Accessibility'), d: L('8 state layar, validasi, notifikasi, aksesibilitas, responsif', '8 screen states, validation, notifications, accessibility, responsive'), ic: 'accessibility', img: 'np07-states-accessibility.jpg' }
  ];

  /* ---------- Component documentation (§61) ----------
     n name · cls CSS class · fn render function · g group · pur purpose ·
     v variants · s states · ok allowed usage · no not recommended ·
     resp responsive · a11y · role role context · ex example (function name) */
  var R = { all: L('Semua peran', 'All roles'), ops: L('Frontline operasional', 'Frontline operations'), mgmt: L('Manajemen, finance, admin', 'Management, finance, admin'), client: L('Portal klien', 'Client portal') };
  var C = [];
  function add(o) { C.push(o); }

  add({ n: 'Button.Primary', g: 'Button', cls: '.ds-btn.ds-btn--primary', fn: 'DS.Button.Primary', pur: L('Satu aksi utama per layar.', 'The one main action on a screen.'),
    v: L('Normal, besar (lg), lebar penuh (block), CTA frontline (cta)', 'Normal, large (lg), full width (block), frontline CTA (cta)'), s: 'default · hover · focus · active · disabled · loading',
    ok: L('Terima Cucian, Simpan & Lanjut, Mulai Proses, Siap Dikirim', 'Receive Laundry, Save & Continue, Start Process, Ready to Ship'),
    no: L('Lebih dari satu tombol oranye di layar yang sama; aksi berbahaya', 'More than one orange button on a screen; destructive actions'),
    resp: L('iPad & mobile: lebar penuh, tinggi 56 px, di bawah tugas', 'iPad & mobile: full width, 56 px tall, below the task'),
    a11y: L('Target ≥ 44 px, teks kontras gelap di atas oranye, fokus terlihat, aria-busy saat loading', 'Target ≥ 44 px, dark text on orange, visible focus, aria-busy while loading'), role: R.all });
  add({ n: 'Button.Secondary', g: 'Button', cls: '.ds-btn--secondary', fn: 'DS.Button.Secondary', pur: L('Aksi alternatif di samping/bawah aksi utama.', 'Alternative action beside/below the main action.'),
    v: L('Outline biru; versi solid biru = Button.Action untuk aksi di kartu', 'Blue outline; solid blue = Button.Action for in-card actions'), s: 'default · hover · focus · active · disabled · loading',
    ok: L('Ada Masalah, Lihat Detail, Tambah Foto', 'Report Issue, View Detail, Add Photo'), no: L('Menggantikan aksi utama', 'Replacing the main action'),
    resp: L('Di bawah CTA utama pada mobile', 'Below the main CTA on mobile'), a11y: L('Label teks selalu ada', 'Always has a text label'), role: R.all });
  add({ n: 'Button.Danger', g: 'Button', cls: '.ds-btn--danger / --danger-soft', fn: 'DS.Button.Danger', pur: L('Aksi yang membatalkan atau menghapus.', 'Actions that cancel or remove.'),
    v: L('Solid merah (konfirmasi), soft merah (pemicu)', 'Solid red (confirm), soft red (trigger)'), s: 'default · hover · focus · disabled · loading',
    ok: L('Batalkan, Void, Simpan Masalah, Tolak', 'Cancel, Void, Save Issue, Reject'), no: L('Ditempel langsung di samping CTA utama; hapus transaksi diam-diam', 'Right next to the main CTA; silently deleting transactions'),
    resp: L('Dipisah garis dari aksi utama', 'Separated from the main action by a divider'), a11y: L('Selalu diikuti Confirmation Dialog untuk aksi yang tidak bisa dibatalkan', 'Always followed by a Confirmation Dialog when irreversible'), role: R.all });
  add({ n: 'Button.Ghost', g: 'Button', cls: '.ds-btn--ghost / --text', fn: 'DS.Button.Ghost', pur: L('Aksi ringan: kembali, batal, filter, ekspor.', 'Light actions: back, cancel, filter, export.'),
    v: L('Ghost (garis), Text (tanpa garis)', 'Ghost (outlined), Text (no border)'), s: 'default · hover · focus · disabled',
    ok: L('Kembali, Batal, Filter Lainnya, Ekspor', 'Back, Cancel, More Filters, Export'), no: L('Aksi penting', 'Important actions'), resp: '—', a11y: L('Target ≥ 44 px walau tampak ringan', 'Target ≥ 44 px even when visually light'), role: R.all });
  add({ n: 'Button.Icon', g: 'Button', cls: '.ds-iconbtn', fn: 'DS.Button.Icon', pur: L('Aksi alat: Scan, Kamera, Cetak, Lainnya.', 'Tool actions: Scan, Camera, Print, More.'),
    v: L('Kotak 48 px + label di bawah', '48 px box + label below'), s: 'default · hover · focus · active',
    ok: L('Toolbar tugas, header kartu', 'Task toolbars, card headers'), no: L('Ikon tanpa label untuk aksi kritis', 'Unlabelled icons for critical actions'),
    resp: L('Tetap 48 px di semua perangkat', 'Stays 48 px on every device'), a11y: L('Label terlihat; bila tanpa label wajib aria-label', 'Visible label; aria-label when unlabelled'), role: R.all });

  add({ n: 'Input.Text', g: 'Input', cls: '.ds-field > .ds-control', fn: 'DS.Input.Text', pur: L('Isian teks satu baris.', 'Single-line text entry.'),
    v: L('Dengan ikon, dengan status (✓ / !), Email, Phone', 'With icon, with state (✓ / !), Email, Phone'), s: 'default · focus · filled · error · success · disabled',
    ok: L('Nama hotel, email, telepon', 'Hotel name, email, phone'), no: L('Label hanya sebagai placeholder', 'Placeholder used as the only label'),
    resp: L('Tinggi 48 px, lebar penuh di mobile', '48 px tall, full width on mobile'), a11y: L('Label terlihat, aria-invalid + aria-describedby ke pesan', 'Visible label, aria-invalid + aria-describedby to message'), role: R.all });
  add({ n: 'Input.Number', g: 'Input', cls: '.ds-control--lg + .ds-control__unit', fn: 'DS.Input.Number', pur: L('Angka operasional dengan satuan.', 'Operational numbers with a unit.'),
    v: L('Normal, besar (angka dominan), satuan kg / Bag / Rp', 'Normal, large (dominant number), unit kg / Bag / Rp'), s: 'default · focus · filled · error · disabled',
    ok: L('Berat Total 82.4 kg', 'Total Weight 82.4 kg'), no: L('Angka kecil di tengah paragraf', 'Small numbers buried in text'),
    resp: L('Versi besar 64 px untuk iPad/mobile', '64 px large variant for iPad/mobile'), a11y: L('inputmode decimal; validasi dekat field', 'inputmode decimal; validation next to field'), role: R.ops });
  add({ n: 'Input.Counter', g: 'Input', cls: '.ds-counter', fn: 'DS.Input.Counter', pur: L('Menambah/mengurangi jumlah kecil dengan tap.', 'Add/remove small counts by tapping.'),
    v: L('− angka +', '− value +'), s: 'default · focus · disabled', ok: L('Jumlah Bag', 'Bag Count'), no: L('Angka besar (pakai Input.Number)', 'Large numbers (use Input.Number)'),
    resp: L('Tombol 48 px', '48 px buttons'), a11y: L('Tombol berlabel Kurangi/Tambah', 'Buttons labelled Decrease/Increase'), role: R.ops });
  add({ n: 'Input.Select', g: 'Input', cls: '.ds-control select', fn: 'DS.Input.Select', pur: L('Memilih satu dari daftar.', 'Pick one from a list.'), v: '—', s: 'default · focus · disabled · error',
    ok: L('Filter klien, status', 'Client, status filter'), no: L('2–3 pilihan di frontline (pakai Options)', '2–3 choices on frontline (use Options)'), resp: L('Native picker di mobile', 'Native picker on mobile'), a11y: L('Native select', 'Native select'), role: R.mgmt });
  add({ n: 'Input.Search', g: 'Input', cls: '.ds-control + search icon', fn: 'DS.Input.Search', pur: L('Mencari order, klien, item.', 'Search orders, clients, items.'), v: '—', s: 'default · focus · filled',
    ok: L('Work queue, tabel', 'Work queue, tables'), no: '—', resp: L('Lebar penuh di mobile', 'Full width on mobile'), a11y: 'type=search', role: R.all });
  add({ n: 'Input.Date / Input.Time', g: 'Input', cls: '.ds-control input[type=date|time]', fn: 'DS.Input.Date', pur: L('Tanggal dan jam.', 'Date and time.'), v: '—', s: 'default · focus · error · disabled',
    ok: L('Periode laporan, jadwal pickup', 'Report period, pickup schedule'), no: '—', resp: L('Native picker', 'Native picker'), a11y: L('Label terlihat', 'Visible label'), role: R.all });
  add({ n: 'Input.Textarea', g: 'Input', cls: '.ds-control textarea', fn: 'DS.Input.Textarea', pur: L('Catatan bebas.', 'Free notes.'), v: '—', s: 'default · focus · filled · error · disabled',
    ok: L('Catatan (opsional)', 'Note (optional)'), no: L('Wajib diisi tanpa alasan', 'Required without reason'), resp: '—', a11y: L('Label terlihat', 'Visible label'), role: R.all });
  add({ n: 'Input.Checkbox / Radio / Toggle / Options', g: 'Input', cls: '.ds-check · .ds-radio · .ds-toggle · .ds-option', fn: 'DS.Input.Checkbox', pur: L('Pilihan biner dan pilihan tunggal.', 'Binary and single choices.'),
    v: L('Checkbox, Radio, Toggle (switch), Options (baris radio besar)', 'Checkbox, Radio, Toggle (switch), Options (large radio rows)'), s: 'default · checked · focus · disabled',
    ok: L('Checklist QC, alasan masalah, pengaturan aktif', 'QC checklist, issue reasons, active settings'), no: L('Toggle untuk aksi yang langsung mengubah transaksi', 'Toggle for actions that change a transaction immediately'),
    resp: L('Baris 44–48 px', '44–48 px rows'), a11y: L('Seluruh baris bisa di-tap; role=switch untuk toggle', 'Whole row is tappable; role=switch for toggle'), role: R.all });

  add({ n: 'Status.Waiting · Processing · Completed · Risk · Late · Issue', g: 'Status', cls: '.ds-chip--waiting|processing|completed|risk|critical|issue', fn: 'DS.Status.Waiting', pur: L('Status workflow dengan ikon + teks + warna.', 'Workflow status as icon + text + colour.'),
    v: L('Normal, besar (lg), dengan jumlah, dengan waktu', 'Normal, large (lg), with count, with time'), s: '—',
    ok: L('Menunggu, Diproses, Selesai, SLA Risk, Terlambat, Ada Masalah', 'Waiting, In Process, Completed, SLA Risk, Late, Issue'), no: L('Warna saja tanpa teks; status sebagai dekorasi', 'Colour alone without text; status as decoration'),
    resp: L('Versi lg di frontline', 'lg variant on frontline'), a11y: L('Ikon berbeda per status sehingga terbaca tanpa warna', 'A different icon per status so it reads without colour'), role: R.all });

  add({ n: 'Card.Task', g: 'Card', cls: '.ds-taskcard', fn: 'DS.Card.Task', pur: L('Satu kartu tugas untuk penerimaan, QC, packing, pengiriman.', 'One task card for receiving, QC, packing, delivery.'),
    v: L('Isi, ikon, status dan aksi berbeda; komponen sama', 'Content, icon, status and action vary; same component'), s: 'default · hover · focus',
    ok: L('Hotel ABC · 82.4 kg · 8 Bag · Menunggu · Terima', 'Hotel ABC · 82.4 kg · 8 Bags · Waiting · Receive'), no: L('Membuat ReceivingCard, QCCard, PackingCard terpisah', 'Separate ReceivingCard, QCCard, PackingCard'),
    resp: L('Mobile: tombol pindah ke baris bawah, lebar penuh', 'Mobile: button moves to its own full-width row'), a11y: L('Judul h3, angka dominan', 'h3 title, dominant numbers'), role: R.ops });
  add({ n: 'Card.KPI', g: 'Card', cls: '.ds-kpi', fn: 'DS.Card.KPI', pur: L('Label + angka besar + tren.', 'Label + large value + trend.'), v: L('Netral, tint oranye/biru/hijau/merah', 'Neutral, orange/blue/green/red tint'), s: '—',
    ok: L('Revenue Rp125.4 jt ↑12%', 'Revenue Rp125.4 jt ↑12%'), no: L('Detail sekunder berlebihan di dalam kartu', 'Too much secondary detail inside the card'),
    resp: L('6 → 3 → 2 kolom', '6 → 3 → 2 columns'), a11y: L('Tren memakai panah + teks, bukan warna saja', 'Trend uses arrow + text, not colour alone'), role: R.mgmt });
  add({ n: 'Card.Alert', g: 'Card', cls: '.ds-alertcard (--warning, --info)', fn: 'DS.Card.Alert', pur: L('Hal yang perlu perhatian, menurut prioritas.', 'Things that need attention, by priority.'),
    v: L('Kritis (merah), Peringatan (amber), Info (biru)', 'Critical (red), Warning (amber), Info (blue)'), s: '—', ok: L('5 order berisiko terlambat', '5 orders at risk of being late'), no: L('Informasi biasa sebagai merah', 'Normal info shown red'),
    resp: L('Satu kolom di mobile', 'Single column on mobile'), a11y: L('role=alert untuk kritis, role=status lainnya', 'role=alert for critical, role=status otherwise'), role: R.all });
  add({ n: 'Card.Action', g: 'Card', cls: '.ds-actioncard (--cta)', fn: 'DS.Card.Action', pur: L('Pintu masuk tugas dari beranda.', 'Entry point to a task from home.'), v: L('Netral, CTA (oranye)', 'Neutral, CTA (orange)'), s: 'default · hover · focus',
    ok: L('Pickup · 12 tugas hari ini', 'Pickup · 12 tasks today'), no: L('Lebih dari satu versi CTA per layar', 'More than one CTA version per screen'), resp: L('Penuh lebar di mobile', 'Full width on mobile'), a11y: L('Seluruh kartu adalah satu link', 'The whole card is one link'), role: R.ops });
  add({ n: 'Card.Summary · Card.Client', g: 'Card', cls: '.ds-summary · .ds-clientcard', fn: 'DS.Card.Summary', pur: L('Ringkasan angka; identitas klien.', 'Number summary; client identity.'), v: '—', s: '—',
    ok: L('Total Cucian 12.5 ton; Hotel Indigo · 3 Properti · Aktif', 'Total Laundry 12.5 ton; Hotel Indigo · 3 Properties · Active'), no: '—', resp: '—', a11y: '—', role: R.mgmt });

  add({ n: 'Nav.Sidebar', g: 'Navigation', cls: '.ds-sidebar (--rail)', fn: 'DS.Nav.Sidebar', pur: L('Navigasi utama desktop.', 'Main desktop navigation.'), v: L('Penuh (248 px), rail ikon (84 px) untuk iPad', 'Full (248 px), icon rail (84 px) for iPad'), s: 'default · hover · current · focus',
    ok: L('Manajemen & admin', 'Management & admin'), no: L('Dipaksa masuk ke mobile', 'Squeezed into mobile'), resp: L('Desktop: penuh · iPad: rail · Mobile: diganti bottom nav', 'Desktop: full · iPad: rail · Mobile: replaced by bottom nav'),
    a11y: L('aria-current="page"; menu tanpa izin tidak dirender', 'aria-current="page"; menus without permission are not rendered'), role: R.mgmt });
  add({ n: 'Nav.Topbar', g: 'Navigation', cls: '.ds-topbar', fn: 'DS.Nav.Topbar', pur: L('Konteks halaman, cari, notifikasi, bahasa, profil.', 'Page context, search, notifications, language, profile.'), v: '—', s: '—',
    ok: L('Semua layout desktop & iPad', 'All desktop & iPad layouts'), no: '—', resp: L('Mobile: header ringkas', 'Mobile: compact header'), a11y: L('Tombol bel berlabel jumlah notifikasi', 'Bell button labelled with notification count'), role: R.all });
  add({ n: 'Nav.BottomNav', g: 'Navigation', cls: '.ds-bottomnav', fn: 'DS.Nav.BottomNav', pur: L('Navigasi mobile, maksimal 5 item.', 'Mobile navigation, at most 5 items.'), v: L('Dengan tombol tengah (Scan)', 'With a centre button (Scan)'), s: 'default · current',
    ok: L('Beranda, Tugas, Scan, Notifikasi, Lainnya', 'Home, Tasks, Scan, Alerts, More'), no: L('Lebih dari 5 item', 'More than 5 items'), resp: L('Hanya < 700 px', 'Only < 700 px'), a11y: L('Ikon + label', 'Icon + label'), role: R.ops });
  add({ n: 'Nav.Tabs · Nav.Segment · Nav.Breadcrumb', g: 'Navigation', cls: '.ds-tabs · .ds-segment · .ds-breadcrumb', fn: 'DS.Nav.Tabs', pur: L('Berpindah tampilan dalam satu halaman; jejak lokasi.', 'Switch views within a page; location trail.'), v: '—', s: 'default · selected · focus',
    ok: L('Informasi / Item / Catatan; Semua / Pickup / On Site', 'Information / Items / Notes; All / Pickup / On Site'), no: L('Tab hanya untuk menyembunyikan field wajib', 'Tabs hiding required fields'),
    resp: L('Tab bisa digeser horizontal; breadcrumb terlipat di mobile', 'Tabs scroll horizontally; breadcrumb wraps on mobile'), a11y: L('role=tablist, panah kiri/kanan', 'role=tablist, left/right arrows'), role: R.all });

  add({ n: 'Stepper.Process', g: 'Stepper', cls: '.ds-steps (--vertical, --auto)', fn: 'DS.Stepper.Process', pur: L('Tahap proses cucian.', 'Laundry process stages.'),
    v: L('Horizontal, vertikal (dengan chip & operator/jam), otomatis vertikal di mobile', 'Horizontal, vertical (with chips & operator/time), auto-vertical on mobile'), s: 'completed · current · upcoming · problem',
    ok: L('Terima → Sortir → Cuci → Kering → Finishing → QC → Packing → Kirim', 'Receive → Sort → Wash → Dry → Finishing → QC → Packing → Deliver'), no: L('Lebih dari 8 langkah', 'More than 8 steps'),
    resp: L('Mobile: vertikal', 'Mobile: vertical'), a11y: L('aria-current="step" + teks status tersembunyi', 'aria-current="step" + hidden status text'), role: R.all });
  add({ n: 'Stepper.Progress · State.Loading', g: 'Stepper', cls: '.ds-progress · .ds-spinner · .ds-skeleton', fn: 'DS.Stepper.Progress', pur: L('Menunjukkan sistem sedang bekerja.', 'Shows the system is working.'), v: L('Bar persen, spinner, kerangka', 'Percent bar, spinner, skeleton'), s: '—',
    ok: L('Upload foto, memuat daftar', 'Photo upload, loading a list'), no: L('Animasi dekoratif', 'Decorative animation'), resp: '—', a11y: L('role=progressbar, aria-busy; gerak berkurang bila prefers-reduced-motion', 'role=progressbar, aria-busy; slower with prefers-reduced-motion'), role: R.all });

  add({ n: 'Data.Table', g: 'Data', cls: '.ds-table (--stack)', fn: 'DS.Data.Table', pur: L('Data banyak baris untuk manajemen, finance, admin.', 'Many-row data for management, finance, admin.'), v: L('Dengan sort, chip status, aksi baris', 'With sort, status chip, row action'), s: 'default · hover · sorted',
    ok: L('Daftar order, klien, stok', 'Order, client, stock lists'), no: L('Workflow frontline', 'Frontline workflows'), resp: L('< 700 px berubah menjadi daftar kartu', '< 700 px turns into a card list'), a11y: L('th scope, aria-sort, caption', 'th scope, aria-sort, caption'), role: R.mgmt });
  add({ n: 'Data.List · Data.Pagination · Data.FilterBar', g: 'Data', cls: '.ds-list · .ds-pagination · .ds-filterbar', fn: 'DS.Data.List', pur: L('Daftar ringkas; halaman; filter utama + Filter Lainnya + Ekspor.', 'Compact list; pages; primary filters + More Filters + Export.'), v: '—', s: '—',
    ok: L('Maks. 3–4 filter terlihat', 'Max 3–4 visible filters'), no: L('20 filter sekaligus', '20 filters at once'), resp: L('Filter lanjutan di Drawer', 'Advanced filters in a Drawer'), a11y: L('Halaman aktif aria-current', 'Current page aria-current'), role: R.mgmt });

  add({ n: 'Feedback.Toast', g: 'Feedback', cls: '.ds-toast (--success|info|warning|error)', fn: 'DS.Feedback.Toast', pur: L('Pesan singkat setelah aksi.', 'Short message after an action.'), v: L('Sukses, Info, Peringatan, Gagal', 'Success, Info, Warning, Error'), s: '—',
    ok: L('Data berhasil disimpan.', 'Data saved.'), no: L('Kode error teknis', 'Technical error codes'), resp: L('Mobile: di atas bottom nav', 'Mobile: above the bottom nav'), a11y: L('aria-live; error role=alert; tombol tutup 44 px', 'aria-live; error role=alert; 44 px close button'), role: R.all });
  add({ n: 'Feedback.Inline', g: 'Feedback', cls: '.ds-inline', fn: 'DS.Feedback.Inline', pur: L('Pesan yang tetap di halaman.', 'A message that stays on the page.'), v: L('Sukses, Info, Peringatan, Gagal', 'Success, Info, Warning, Error'), s: '—',
    ok: L('Insight grafik, peringatan form', 'Chart insight, form warning'), no: '—', resp: '—', a11y: L('Ikon + teks', 'Icon + text'), role: R.all });
  add({ n: 'Feedback.Dialog', g: 'Feedback', cls: '.ds-backdrop > .ds-dialog', fn: 'DS.Feedback.Dialog', pur: L('Konfirmasi aksi penting atau berbahaya.', 'Confirm important or destructive actions.'), v: L('Konfirmasi (biru), Bahaya (merah)', 'Confirm (blue), Danger (red)'), s: 'open · closed',
    ok: L('Batalkan proses ini? · Batal / Ya, Batalkan', 'Cancel this process? · Cancel / Yes, Cancel'), no: L('Konfirmasi untuk aksi biasa', 'Confirming routine actions'), resp: L('Mobile: bottom sheet', 'Mobile: bottom sheet'),
    a11y: L('role=alertdialog, fokus terkunci, Esc menutup, fokus kembali', 'role=alertdialog, focus trapped, Esc closes, focus returns'), role: R.all });
  add({ n: 'Feedback.Drawer', g: 'Feedback', cls: '.ds-drawer', fn: 'DS.Feedback.Drawer', pur: L('Panel samping untuk filter lanjutan / detail.', 'Side panel for advanced filters / detail.'), v: '—', s: 'open · closed',
    ok: L('Filter Lainnya', 'More Filters'), no: L('Tugas utama frontline', 'Main frontline task'), resp: L('Mobile: penuh layar', 'Mobile: full screen'), a11y: L('role=dialog, Esc menutup', 'role=dialog, Esc closes'), role: R.mgmt });
  add({ n: 'Tooltip', g: 'Feedback', cls: '.ds-tip', fn: 'DS.Tooltip', pur: L('Bantuan sekunder.', 'Secondary help.'), v: '—', s: 'closed · open',
    ok: L('Berat Total [?]', 'Total Weight [?]'), no: L('Informasi wajib; aksi yang hanya muncul saat hover', 'Required info; actions that only appear on hover'), resp: L('Dibuka dengan tap, bukan hover', 'Opens on tap, not hover'), a11y: L('Tombol 44 px, aria-describedby, Esc menutup', '44 px button, aria-describedby, Esc closes'), role: R.all });
  add({ n: 'Notification', g: 'Feedback', cls: '.ds-notif (.is-unread)', fn: 'DS.Notification', pur: L('Item notifikasi dalam aplikasi.', 'In-app notification item.'), v: L('Dibaca / belum dibaca, nada sukses/peringatan/error', 'Read / unread, success/warning/error tone'), s: 'read · unread',
    ok: L('Order baru masuk · Hotel ABC • 24.6 kg · 5 menit lalu', 'New order · Hotel ABC • 24.6 kg · 5 min ago'), no: '—', resp: '—', a11y: L('Status belum dibaca juga sebagai teks tersembunyi', 'Unread status also as hidden text'), role: R.all });

  add({ n: 'Media.Upload · Media.Photos · Media.Doc', g: 'Media', cls: '.ds-upload · .ds-photos · .ds-doc', fn: 'DS.Media.Upload', pur: L('Bukti foto dan dokumen.', 'Photo and document evidence.'), v: L('Drag & drop, kamera, pratinjau foto, file dokumen', 'Drag & drop, camera, photo preview, document file'), s: 'empty · over · filled · required',
    ok: L('Bukti penerimaan, kerusakan, POD, invoice', 'Receiving proof, damage, POD, invoice'), no: '—', resp: L('Mobile: tombol Ambil Foto membuka kamera', 'Mobile: Take Photo opens the camera'), a11y: L('Tombol hapus berlabel', 'Remove buttons labelled'), role: R.all });

  add({ n: 'State.Empty · Loading · Success · Warning · Error · NoPermission · Offline', g: 'State', cls: '.ds-state', fn: 'DS.State.Empty', pur: L('Kondisi layar selain default.', 'Screen conditions other than default.'), v: L('Lihat NP-07', 'See NP-07'), s: '—',
    ok: L('Belum ada cucian menunggu. / Anda tidak memiliki akses…', 'Nothing waiting. / You do not have access…'), no: L('Halaman kosong; klaim tersimpan offline padahal tidak', 'Blank pages; claiming offline save when unsupported'), resp: '—', a11y: L('role=status / alert', 'role=status / alert'), role: R.all });

  add({ n: 'Pattern.WorkQueue', g: 'Pattern', cls: 'DS.Pattern.WorkQueue', fn: 'DS.Pattern.WorkQueue', pur: L('Daftar cucian yang menunggu.', 'List of laundry waiting.'), v: '—', s: 'default · loading · empty · error',
    ok: L('Search + filter cepat + Card.Task', 'Search + quick filter + Card.Task'), no: L('Filter lanjutan', 'Advanced filters'), resp: L('Desktop: tabel · iPad: 2 kolom kartu · Mobile: 1 kolom', 'Desktop: table · iPad: 2-column cards · Mobile: 1 column'), a11y: '—', role: R.ops });
  add({ n: 'Pattern.TaskDetail', g: 'Pattern', cls: 'DS.Pattern.TaskDetail', fn: 'DS.Pattern.TaskDetail', pur: L('Detail sebelum diproses.', 'Detail before processing.'), v: '—', s: '—', ok: L('Klien, ID, status, jenis, berat, bag, SLA, catatan', 'Client, ID, status, type, weight, bags, SLA, note'), no: '—', resp: L('CTA di bawah', 'CTA at the bottom'), a11y: '—', role: R.ops });
  add({ n: 'Pattern.QuickAction', g: 'Pattern', cls: 'DS.Pattern.QuickAction', fn: 'DS.Pattern.QuickAction', pur: L('Input cepat saat menerima cucian.', 'Fast input when receiving laundry.'), v: '—', s: 'default · error · loading · success', ok: L('Berat, bag, foto opsional, catatan opsional, Simpan & Lanjut', 'Weight, bags, optional photo, optional note, Save & Continue'), no: L('Field yang tidak perlu', 'Unneeded fields'), resp: '—', a11y: '—', role: R.ops });
  add({ n: 'Pattern.ProcessStepper', g: 'Pattern', cls: 'DS.Pattern.ProcessStepper', fn: 'DS.Pattern.ProcessStepper', pur: L('Tahapan proses cucian.', 'Laundry process stages.'), v: '—', s: '—', ok: L('Operator & jam pada tahap berjalan', 'Operator & time on the current step'), no: '—', resp: '—', a11y: '—', role: R.ops });
  add({ n: 'Pattern.QCDecision', g: 'Pattern', cls: 'DS.Pattern.QCDecision', fn: 'DS.Pattern.QCDecision', pur: L('Keputusan QC: LULUS atau ADA MASALAH.', 'QC decision: PASS or HAS ISSUE.'), v: '—', s: '—', ok: L('Checklist lalu dua tombol', 'Checklist then two buttons'), no: L('Form masalah sebelum memilih Ada Masalah', 'Issue form before choosing Has Issue'), resp: '—', a11y: '—', role: R.ops });
  add({ n: 'Pattern.IssueFlow', g: 'Pattern', cls: 'DS.Pattern.IssueFlow', fn: 'DS.Pattern.IssueFlow', pur: L('Melaporkan masalah terstruktur.', 'Report a structured issue.'), v: '—', s: '—', ok: L('Alasan terstruktur + foto wajib + catatan', 'Structured reason + required photo + note'), no: L('Teks bebas saja', 'Free text only'), resp: '—', a11y: '—', role: R.ops });
  add({ n: 'Pattern.ExecutiveKPI · Insight · AlertCenter', g: 'Pattern', cls: 'DS.Pattern.ExecutiveKPI', fn: 'DS.Pattern.ExecutiveKPI', pur: L('Ringkasan eksekutif, tren yang menjawab pertanyaan bisnis, pusat alert.', 'Executive summary, trends that answer a business question, alert center.'), v: '—', s: '—', ok: L('Judul, periode, nilai utama, tren, insight', 'Title, period, main value, trend, insight'), no: L('Grafik dekoratif', 'Decorative charts'), resp: L('Mobile: ringkasan + alert saja', 'Mobile: summary + alerts only'), a11y: L('Grafik punya aria-label berisi kesimpulan', 'Charts have an aria-label with the takeaway'), role: R.mgmt });
  add({ n: 'Pattern.DrillDown · ManagementTable · Approval', g: 'Pattern', cls: 'DS.Pattern.DrillDown', fn: 'DS.Pattern.DrillDown', pur: L('Dari ringkasan ke transaksi; tabel manajemen; persetujuan lama vs baru.', 'Summary to transaction; management table; old vs new approval.'), v: '—', s: '—', ok: L('Revenue → Klien → Order → Invoice; TOLAK / SETUJUI tercatat audit', 'Revenue → Client → Order → Invoice; REJECT / APPROVE audited'), no: L('Laporan terpisah tanpa konteks', 'Disconnected reports'), resp: '—', a11y: '—', role: R.mgmt });
  DS.COMPONENTS = C;

  /* ---------- Design QA (§62) ---------- */
  DS.QA = [
    [L('Tipografi', 'Typography'), L('Hanya token --jf-fs-*; body ≥ 16 px di mobile; label frontline ≥ 16 px', 'Only --jf-fs-* tokens; body ≥ 16 px on mobile; frontline labels ≥ 16 px')],
    [L('Spacing', 'Spacing'), L('Hanya 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48', 'Only 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48')],
    [L('Grid', 'Grid'), L('12 / 8 / 4 kolom; mobile menumpuk, tidak diperkecil', '12 / 8 / 4 columns; mobile stacks, never shrinks')],
    [L('Warna', 'Color'), L('Token brand; warna status hanya untuk makna status', 'Brand tokens; status colours only for status meaning')],
    [L('Radius', 'Radius'), L('4 · 8 · 12 · 16 · 20 · 24; pill hanya untuk avatar/counter', '4 · 8 · 12 · 16 · 20 · 24; pill only for avatars/counters')],
    [L('Komponen', 'Components'), L('Dibangun dari DS.*; komponen baru perlu alasan', 'Built from DS.*; new components need justification')],
    [L('Status', 'Status'), L('Ikon + teks + warna', 'Icon + text + colour')],
    [L('Hierarki CTA', 'CTA hierarchy'), L('Satu CTA utama; bahaya dipisah', 'One main CTA; danger separated')],
    [L('Responsif', 'Responsive'), L('Desktop, iPad, mobile diuji; tidak ada scroll horizontal untuk tugas inti', 'Desktop, iPad, mobile tested; no horizontal scroll for core tasks')],
    [L('Aksesibilitas', 'Accessibility'), L('Target ≥ 44 px, fokus terlihat, label terlihat, kontras AA', 'Target ≥ 44 px, visible focus, visible labels, AA contrast')],
    [L('Bahasa', 'Language'), L('Bahasa Indonesia sederhana default; EN tersedia', 'Simple Indonesian by default; EN available')],
    [L('Peran', 'Role'), L('Menu & aksi tanpa izin tidak dirender', 'Menus & actions without permission are not rendered')],
    [L('Pola layar', 'Screen pattern'), L('Memakai pola NP-05 / NP-06 sesuai archetype Phase 2', 'Uses the NP-05 / NP-06 pattern for its Phase 2 archetype')]
  ];

  /* ---------- Traceability (§63): Phase 2 archetype → Phase 3 patterns/components ---------- */
  DS.ARCH_MAP = {
    T01: { p: ['Pattern.ExecutiveKPI', 'Pattern.AlertCenter'], c: ['Card.KPI', 'Card.Action', 'Card.Alert', 'Button.Primary', 'Nav.BottomNav', 'Nav.Sidebar', 'State.Empty'] },
    T02: { p: ['Pattern.WorkQueue'], c: ['Input.Search', 'Nav.Segment', 'Card.Task', 'Status.Waiting', 'Button.Action', 'State.Skeleton', 'State.Empty'] },
    T03: { p: ['Pattern.TaskDetail', 'Pattern.ProcessStepper'], c: ['Status.*', 'Nav.Tabs', 'Stepper.Process', 'Button.Primary', 'Button.Secondary', 'Media.Photos'] },
    T04: { p: ['Pattern.QuickAction', 'Pattern.QCDecision', 'Pattern.IssueFlow'], c: ['Card.Task', 'Input.Number', 'Input.Counter', 'Media.Photos', 'Input.Textarea', 'Button.Primary', 'Button.Secondary', 'Stepper.Process', 'State.Success'] },
    T05: { p: ['Pattern.ManagementTable'], c: ['Data.FilterBar', 'Data.Table', 'Data.Pagination', 'Status.*', 'Feedback.Drawer', 'Button.Ghost'] },
    T06: { p: ['Pattern.QuickAction'], c: ['Input.Text', 'Input.Select', 'Input.Date', 'Input.Textarea', 'Input.Toggle', 'Button.Primary', 'Feedback.Inline', 'Feedback.Toast'] },
    T07: { p: ['Pattern.Approval'], c: ['Status.Waiting', 'Button.DangerSoft', 'Button.Success', 'Feedback.Dialog', 'Feedback.Toast'] },
    T08: { p: ['Pattern.ExecutiveKPI', 'Pattern.Insight', 'Pattern.DrillDown'], c: ['Card.KPI', 'Nav.Segment', 'Input.Date', 'Data.Table', 'Feedback.Inline', 'Button.Ghost'] },
    T09: { p: ['Pattern.ManagementTable'], c: ['Data.Table', 'Input.Toggle', 'Input.Text', 'Button.Primary', 'Feedback.Dialog', 'State.NoPermission'] }
  };
  // Worked example from the brief (§63)
  DS.TRACE_EXAMPLE = { id: 'OPS-RCV-001', n: L('Terima Cucian', 'Receive Laundry'),
    p2: ['Work Queue', 'Task Detail', 'Quick Action'],
    p3: ['Card.Task', 'Status.Waiting', 'Input.Number', 'Button.Primary', 'Button.Secondary', 'Stepper.Process', 'State.Success'] };
  // Build rows for every Phase 2 screen: Phase 1 BF → Phase 2 screen/archetype → Phase 3 pattern + components
  DS.traceRows = function (JFOS) {
    return (JFOS.SCREENS || []).map(function (s) {
      var m = DS.ARCH_MAP[s.a] || { p: [], c: [] };
      return { id: s.id, n: s.n, bf: s.bf || [], nb: s.nb || [], arch: s.a, archName: (JFOS.ARCH[s.a] || {}).n, p: m.p, c: m.c, front: /^(HOM-OPR|HOM-DRV|OPS|DRV|PCK|RCV)/.test(s.id) || ['T02', 'T04'].indexOf(s.a) > -1 };
    });
  };

  /* ---------- Definition of Done (§72) ---------- */
  var P = function (f, anchor) { return 'phase3/' + f + (anchor ? '#' + anchor : ''); };
  DS.DOD = [
    [L('Fondasi brand digital diterapkan', 'Brand digital foundation implemented'), P('np01-brand.html')],
    [L('Logo resmi dipakai dengan benar', 'Official uploaded logo used correctly'), P('np01-brand.html', 'logo')],
    [L('Token warna brand tersedia', 'Brand colour tokens exist'), P('np01-brand.html', 'colors')],
    [L('Token warna status tersedia', 'Status colour tokens exist'), P('np01-brand.html', 'status')],
    [L('Hierarki tipografi tersedia', 'Typography hierarchy exists'), P('np02-typography.html', 'scale')],
    [L('Ukuran font desktop', 'Desktop font sizing'), P('np02-typography.html', 'scale')],
    [L('Ukuran font iPad', 'iPad font sizing'), P('np02-typography.html', 'scale')],
    [L('Ukuran font mobile', 'Mobile font sizing'), P('np02-typography.html', 'scale')],
    [L('Grid desktop 12 kolom', '12-column desktop grid'), P('np03-grid.html', 'grid')],
    [L('Grid iPad 8 kolom', '8-column iPad grid'), P('np03-grid.html', 'grid')],
    [L('Grid mobile 4 kolom', '4-column mobile grid'), P('np03-grid.html', 'grid')],
    [L('Token spacing diterapkan', 'Spacing tokens implemented'), P('np03-grid.html', 'spacing')],
    [L('Token radius diterapkan', 'Radius tokens implemented'), P('np03-grid.html', 'radius')],
    [L('Komponen tombol lengkap', 'Button components complete'), P('np04-components.html', 'buttons')],
    [L('Komponen form lengkap', 'Form components complete'), P('np04-components.html', 'forms')],
    [L('Komponen status lengkap', 'Status components complete'), P('np04-components.html', 'status')],
    [L('Komponen kartu lengkap', 'Card components complete'), P('np04-components.html', 'cards')],
    [L('Komponen navigasi lengkap', 'Navigation components complete'), P('np04-components.html', 'nav')],
    [L('Komponen tabel/list lengkap', 'Table/list components complete'), P('np04-components.html', 'data')],
    [L('Komponen feedback lengkap', 'Feedback components complete'), P('np04-components.html', 'feedback')],
    [L('Komponen upload/media lengkap', 'Upload/media components complete'), P('np04-components.html', 'media')],
    [L('Komponen stepper lengkap', 'Stepper component complete'), P('np04-components.html', 'stepper')],
    [L('Pola operasional lengkap', 'Operational patterns complete'), P('np05-operational.html')],
    [L('Pola manajemen lengkap', 'Management patterns complete'), P('np06-management.html')],
    [L('State default', 'Default state'), P('np07-states.html', 'states')],
    [L('State loading', 'Loading state'), P('np07-states.html', 'states')],
    [L('State kosong', 'Empty state'), P('np07-states.html', 'states')],
    [L('State sukses', 'Success state'), P('np07-states.html', 'states')],
    [L('State peringatan', 'Warning state'), P('np07-states.html', 'states')],
    [L('State error', 'Error state'), P('np07-states.html', 'states')],
    [L('State tanpa izin', 'No Permission state'), P('np07-states.html', 'states')],
    [L('State offline didefinisikan', 'Offline state defined'), P('np07-states.html', 'states')],
    [L('Standar aksesibilitas diterapkan', 'Accessibility standard implemented'), P('np07-states.html', 'a11y')],
    [L('Target sentuh divalidasi', 'Touch targets validated'), P('np07-states.html', 'a11y')],
    [L('Bahasa Indonesia default', 'Bahasa Indonesia default'), P('np02-typography.html', 'copy')],
    [L('Bahasa Inggris tersedia', 'English supported'), P('np02-typography.html', 'copy')],
    [L('Perilaku responsif diuji', 'Responsive behaviour tested'), P('np07-states.html', 'responsive')],
    [L('Komponen dipakai ulang lintas modul', 'Components reusable across modules'), P('docs.html')],
    [L('Tidak ada duplikasi komponen', 'No unnecessary component duplication'), P('docs.html', 'reuse')]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = DS;
})(typeof window !== 'undefined' ? window : this);

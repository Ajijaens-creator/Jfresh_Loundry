/* ==========================================================================
   JFRESH OS — Phase 12 sample data (NP-09 Smart Help & Guided Learning).
   Only what Phase 12 owns lives here: help content (HLP), button help,
   the "APA INI?" glossary, product tours, PANDU SAYA walkthroughs, training
   paths (TRN), seeded learning progress per demo user (by username), and the
   seeded search / open / feedback history behind Help Analytics (§64, §105).
   Users, roles, permissions, screens, batches, invoices and orders are read
   live from the Phase 4–11 engines — never copied here.
   Every screen id below is a real id of the screen registry (C.screen / the
   V renderers in app/screens-*.js); HELP-001..007 are this engine's screens.
   Day shown: Tuesday 6 Oct 2026, clock starts at 10:30 (WITA).
   ========================================================================== */
(function (root) {
  function L(a, b) { return [a, b === undefined ? a : b]; }
  var D = { today: '2026-10-06', simNow: '2026-10-06 10:30' };

  /* ---------- Modules (help taxonomy) ---------- */
  D.MODULES = {
    general: L('Umum', 'General'), production: L('Produksi', 'Production'), logistics: L('Logistik', 'Logistics'), delivery: L('Delivery & Billing Ready', 'Delivery & Billing Ready'),
    finance: L('Finance', 'Finance'), purchasing: L('Purchasing & Persediaan', 'Purchasing & Inventory'), commercial: L('Komersial', 'Commercial'), client: L('Portal Klien', 'Client Portal'),
    system: L('Sistem & Akses', 'System & Access'), performance: L('Kinerja & KPI', 'Performance & KPI'), help: L('Smart Help', 'Smart Help')
  };

  /* ---------- Help content (§63) ----------
     id, mod, s (screen), roles (audience), perm (permission needed to DO it — role-aware help §59),
     feat, btn, kind (howto | why | whatif | whatis), t, d, st (steps), vid (seconds 30–90, §60), img (icon),
     faq [[q, a]], kw (keywords), walk (PANDU SAYA id), status (default published), v (version) */
  function H(o) { return o; }
  var F = function (q, a) { return [q, a]; };
  D.CONTENT = [
    /* ---- General: everyone ---- */
    H({ id: 'HLP-001', mod: 'general', s: 'USER-002', roles: ['*'], perm: null, feat: 'password', kind: 'howto', img: 'key', vid: 35,
      t: L('Cara Mengganti Password', 'How to Change Your Password'), d: L('Ganti password Anda sendiri kapan saja dari menu profil.', 'Change your own password at any time from the profile menu.'),
      st: [L('Klik nama Anda di kanan atas, pilih Ganti Password.', 'Click your name at the top right, choose Change Password.'), L('Isi password lama dan password baru (minimal 8 karakter).', 'Enter the old password and a new one (at least 8 characters).'), L('Ulangi password baru lalu tekan Simpan.', 'Repeat the new password and press Save.')],
      faq: [F(L('Lupa password lama?', 'Forgot the old password?'), L('Keluar, lalu pakai "Lupa Password" di halaman masuk. Link reset berlaku 30 menit.', 'Sign out and use "Forgot Password" on the sign-in page. The reset link is valid for 30 minutes.'))],
      kw: 'password sandi kata sandi lupa ganti ubah login masuk akun' }),
    H({ id: 'HLP-002', mod: 'general', s: 'NOTIF-001', roles: ['*'], perm: null, feat: 'notification', kind: 'howto', img: 'bell', vid: 40,
      t: L('Cara Membaca & Mengatur Notifikasi', 'How to Read & Set Notifications'), d: L('Lonceng di header menampilkan notifikasi sesuai peran Anda; merah = kritis.', 'The bell in the header shows notifications for your role; red = critical.'),
      st: [L('Tekan ikon lonceng di header.', 'Tap the bell icon in the header.'), L('Tekan notifikasi untuk membuka layar terkait.', 'Tap a notification to open the related screen.'), L('Buka Pengaturan Notifikasi untuk memilih kategori dan saluran.', 'Open Notification Settings to choose categories and channels.')],
      faq: [F(L('Bisakah notifikasi kritis dimatikan?', 'Can critical notifications be turned off?'), L('Tidak. Notifikasi kritis dan pesan keamanan selalu tampil di aplikasi.', 'No. Critical notifications and security messages always show in the app.'))],
      kw: 'notifikasi lonceng bell pemberitahuan alert pesan' }),
    H({ id: 'HLP-003', mod: 'general', s: 'USER-004', roles: ['supervisor', 'opsmgr', 'owner', 'finance'], perm: null, feat: 'plant', kind: 'howto', img: 'building', vid: 30,
      t: L('Cara Ganti Plant', 'How to Switch Plant'), d: L('User dengan akses beberapa plant bisa berpindah plant; semua data ikut plant aktif.', 'Users with access to several plants can switch; all data follows the active plant.'),
      st: [L('Klik nama plant di header.', 'Click the plant name in the header.'), L('Pilih plant tujuan.', 'Choose the target plant.'), L('Data di semua layar langsung mengikuti plant baru.', 'Data on every screen follows the new plant at once.')],
      kw: 'plant pabrik ganti pindah lokasi cabang' }),
    H({ id: 'HLP-004', mod: 'general', s: 'USER-003', roles: ['*'], perm: null, feat: 'role', kind: 'howto', img: 'swap', vid: 30,
      t: L('Cara Ganti Peran', 'How to Switch Role'), d: L('Jika Anda punya lebih dari satu peran, pilih peran aktif; menu dan izin ikut berubah.', 'If you hold more than one role, pick the active one; menus and permissions follow.'),
      st: [L('Buka menu profil, pilih Ganti Peran.', 'Open the profile menu, choose Switch Role.'), L('Pilih peran yang ingin dipakai.', 'Choose the role you want to use.'), L('Aplikasi membuka beranda peran tersebut.', 'The app opens that role\'s home.')],
      kw: 'peran role ganti akses menu' }),
    H({ id: 'HLP-005', mod: 'help', s: 'HELP-001', roles: ['*'], perm: null, feat: 'smarthelp', kind: 'howto', img: 'help', vid: 45,
      t: L('Cara Memakai Smart Help', 'How to Use Smart Help'), d: L('Cari bantuan, pakai mode APA INI?, tanya JFRESH, atau tekan PANDU SAYA di layar mana pun.', 'Search help, use WHAT IS THIS? mode, ask JFRESH, or press GUIDE ME on any screen.'),
      st: [L('Tekan ? Bantuan di layar yang sedang dibuka.', 'Press ? Help on the screen you are on.'), L('Ketik pertanyaan di Cari bantuan…, contoh "cara buat batch".', 'Type in Search help…, e.g. "how to create a batch".'), L('Tekan APA INI? lalu ketuk elemen yang ingin dijelaskan.', 'Press WHAT IS THIS? then tap the element to explain.'), L('Tekan PANDU SAYA agar sistem menyorot langkah berikutnya.', 'Press GUIDE ME so the system highlights the next step.')],
      kw: 'bantuan help cari panduan tutorial apa ini tanya jfresh pandu saya video' }),
    H({ id: 'HLP-006', mod: 'help', s: 'HELP-007', roles: ['*'], perm: null, feat: 'training', kind: 'howto', img: 'target', vid: 30,
      t: L('Cara Melihat Progres Belajar', 'How to See Your Learning Progress'), d: L('Jalur training sesuai peran Anda: ditugaskan, mulai, selesai, praktik, lulus.', 'Your role\'s training path: assigned, started, completed, practiced, passed.'),
      st: [L('Buka Bantuan, pilih Progres Belajar.', 'Open Help, choose Learning Progress.'), L('Lihat jalur training dan materi yang belum selesai.', 'See your training path and the items not finished.'), L('Buka materi, tonton video, lalu tandai selesai.', 'Open an item, watch the video, then mark it done.')],
      kw: 'training pelatihan belajar progres kursus lulus materi' }),

    /* ---- Production · Team 1 ---- */
    H({ id: 'HLP-010', mod: 'production', s: 'PROD-RCV-001', roles: ['prod1', 'supervisor', 'opsmgr'], perm: 'prod.t1', feat: 'receiving', kind: 'whatis', img: 'inbox', vid: 30,
      t: L('Apa itu Receiving?', 'What is Receiving?'), d: L('Receiving = menerima cucian dari Logistics di plant: cek bag, kondisi, dan cocokkan dengan manifest pickup sebelum diproses.', 'Receiving = taking laundry over from Logistics at the plant: check bags and condition and match the pickup manifest before processing.'),
      st: [L('Antrian Receiving berisi kedatangan yang menunggu dicek.', 'The Receiving queue holds arrivals waiting to be checked.'), L('Prioritas paling tinggi dan paling lama tiba ada di atas.', 'Highest priority and longest waiting are on top.')],
      kw: 'receiving terima cucian kedatangan manifest bag plant' }),
    H({ id: 'HLP-011', mod: 'production', s: 'PROD-RCV-002', roles: ['prod1', 'supervisor', 'opsmgr'], perm: 'prod.t1', feat: 'receiving', btn: 'MULAI RECEIVING', kind: 'howto', img: 'inbox', vid: 60, walk: 'WLK-02',
      t: L('Cara Terima Cucian (Receiving)', 'How to Receive Laundry (Receiving)'), d: L('Cek jumlah bag dan kondisi, lalu terima. Berat aktual dicatat sekali dan dipakai produksi, HPP, billing dan KPI.', 'Check bag count and condition, then accept. The actual weight is recorded once and reused by production, HPP, billing and KPI.'),
      st: [L('Buka Antrian Receiving, pilih kedatangan.', 'Open the Receiving queue, pick the arrival.'), L('Tekan MULAI RECEIVING.', 'Press START RECEIVING.'), L('Hitung bag dan pilih kondisi (baik, basah, noda berat…).', 'Count the bags and choose the condition (good, wet, heavy stains…).'), L('Tekan SESUAI bila cocok dengan manifest, atau ADA SELISIH bila berbeda.', 'Press MATCHES if it fits the manifest, or DIFFERENCE if not.'), L('Tekan TERIMA CUCIAN. Lanjut ke timbang.', 'Press ACCEPT LAUNDRY. Continue to weighing.')],
      faq: [F(L('Bag lebih atau kurang dari manifest?', 'More or fewer bags than the manifest?'), L('Tekan ADA SELISIH dan pilih alasannya. Supervisor akan meninjau.', 'Press DIFFERENCE and pick the reason. The supervisor reviews it.')), F(L('Kemasan rusak atau basah?', 'Damaged or wet packaging?'), L('Pilih kondisi yang sesuai dan ambil foto; ini melindungi Anda dan klien.', 'Choose the matching condition and take a photo; it protects you and the client.'))],
      kw: 'receiving terima cucian bag kondisi manifest selisih team 1 kedatangan' }),
    H({ id: 'HLP-012', mod: 'production', s: 'PROD-DIS-001', roles: ['prod1', 'supervisor', 'opsmgr'], perm: 'prod.t1', feat: 'receiving', btn: 'ADA SELISIH', kind: 'whatif', img: 'alert', vid: 45,
      t: L('Bagaimana Jika Jumlah Bag Berbeda?', 'What If the Bag Count Differs?'), d: L('Jangan paksa angka. Catat selisih dengan alasan; supervisor memutuskan dan klien dikabari bila perlu.', 'Never force the number. Record the difference with a reason; the supervisor decides and the client is informed if needed.'),
      st: [L('Di detail receiving tekan ADA SELISIH.', 'On the receiving detail press DIFFERENCE.'), L('Pilih alasan: bag lebih, bag kurang, berat, kategori salah, kemasan rusak.', 'Pick the reason: extra bag, missing bag, weight, wrong category, damaged package.'), L('Isi jumlah aktual dan foto, lalu SIMPAN SELISIH.', 'Enter the actual count and a photo, then SAVE DIFFERENCE.'), L('Pantau keputusan supervisor di layar Selisih.', 'Follow the supervisor decision on the Difference screen.')],
      kw: 'selisih bag beda kurang lebih manifest berat salah receiving' }),
    H({ id: 'HLP-013', mod: 'production', s: 'PROD-WGT-001', roles: ['prod1', 'supervisor', 'opsmgr'], perm: 'prod.t1', feat: 'weighing', btn: 'SIMPAN TIMBANGAN', kind: 'howto', img: 'scale', vid: 45, walk: 'WLK-03',
      t: L('Cara Menimbang & Menghitung', 'How to Weigh & Count'), d: L('Baca timbangan langsung dari alat; berat bersih dihitung otomatis (kotor − tara).', 'Read the scale straight from the device; net weight is computed automatically (gross − tare).'),
      st: [L('Letakkan bag di timbangan.', 'Put the bags on the scale.'), L('Tekan BACA TIMBANGAN.', 'Press READ SCALE.'), L('Periksa berat bersih dan selisih dengan estimasi.', 'Check the net weight and the difference to the estimate.'), L('Tekan SIMPAN TIMBANGAN.', 'Press SAVE WEIGHT.')],
      faq: [F(L('Selisih berat lebih dari batas?', 'Weight difference above the limit?'), L('Sistem meminta review supervisor. Koreksi manual hanya oleh pemegang izin override berat.', 'The system asks for supervisor review. Manual correction only by holders of the weight override permission.'))],
      kw: 'timbang menimbang berat timbangan scale tara hitung weighing kg' }),
    H({ id: 'HLP-014', mod: 'production', s: 'PROD-SORT-002', roles: ['prod1', 'supervisor', 'opsmgr'], perm: 'prod.t1', feat: 'sorting', btn: 'SELESAI SORTIR', kind: 'howto', img: 'sort', vid: 50,
      t: L('Cara Sorting', 'How to Sort'), d: L('Pisahkan cucian per kategori dan tandai noda atau barang khusus agar batch tepat.', 'Separate laundry by category and flag stains or special items so the batch is right.'),
      st: [L('Buka Antrian Sorting, pilih receiving.', 'Open the Sorting queue, pick the receiving.'), L('Ikuti saran kategori dari sistem.', 'Follow the system\'s category suggestion.'), L('Tandai flag: noda, rusak, prioritas.', 'Mark flags: stain, damage, priority.'), L('Tekan SELESAI SORTIR. Lot siap dijadikan batch.', 'Press SORTING DONE. The lots are ready to batch.')],
      kw: 'sorting sortir pilah kategori noda flag lot pisah' }),
    H({ id: 'HLP-015', mod: 'production', s: 'PROD-BATCH-001', roles: ['prod1', 'supervisor', 'opsmgr'], perm: 'prod.t1', feat: 'batch', btn: 'BUAT BATCH', kind: 'howto', img: 'layers', vid: 60,
      t: L('Cara Membuat Batch', 'How to Create a Batch'), d: L('Sistem merekomendasikan batch dari lot yang sudah disortir: kategori cocok, mesin pas, SLA paling dekat dulu.', 'The system recommends batches from sorted lots: compatible categories, the right machine, nearest SLA first.'),
      st: [L('Buka Batch Builder.', 'Open the Batch Builder.'), L('Pilih rekomendasi teratas (atau Atur Manual).', 'Pick the top recommendation (or Set Up Manually).'), L('Periksa mesin, program cuci dan berat (tidak boleh melebihi kapasitas).', 'Check machine, wash program and weight (never above capacity).'), L('Tekan BUAT BATCH.', 'Press CREATE BATCH.')],
      faq: [F(L('Kenapa mesin penuh/overload ditolak?', 'Why is an overloaded machine refused?'), L('Berat batch melebihi kapasitas mesin. Pecah batch atau pilih mesin lain.', 'The batch weight exceeds machine capacity. Split the batch or pick another machine.'))],
      kw: 'batch buat bikin membuat batch builder lot mesin kapasitas program cuci rekomendasi' }),
    H({ id: 'HLP-016', mod: 'production', s: 'PROD-BATCH-001', roles: ['prod1', 'prod2', 'supervisor', 'opsmgr'], perm: 'prod.ho12', feat: 'handover', btn: 'KIRIM', kind: 'howto', img: 'swap', vid: 40,
      t: L('Cara Kirim Handover ke Team 2', 'How to Send a Handover to Team 2'), d: L('Batch siap produksi diserahkan ke Team 2 dengan jumlah bag dan berat yang tercatat; Team 2 menerima atau mencatat selisih.', 'A ready batch is handed to Team 2 with the recorded bag count and weight; Team 2 accepts or records a difference.'),
      st: [L('Di Batch Builder, lihat batch berstatus Siap Produksi.', 'In the Batch Builder find batches in Ready for Production.'), L('Tekan KIRIM pada batch.', 'Press SEND on the batch.'), L('Periksa jumlah bag dan berat, lalu konfirmasi KIRIM.', 'Check bag count and weight, then confirm SEND.'), L('Status berubah menjadi Handover ke Team 2 sampai diterima.', 'The status becomes Handover to Team 2 until accepted.')],
      kw: 'handover serah terima kirim team 2 batch serahkan' }),

    /* ---- Production · Team 2 ---- */
    H({ id: 'HLP-020', mod: 'production', s: 'PROD-WASH-002', roles: ['prod2', 'supervisor', 'opsmgr'], perm: 'prod.t2', feat: 'washing', btn: 'MULAI CUCI', kind: 'howto', img: 'washer', vid: 55,
      t: L('Cara Terima Handover & Mulai Cuci', 'How to Accept a Handover & Start Washing'), d: L('Terima batch dari Team 1, lalu jalankan mesin dengan program yang direkomendasikan.', 'Accept the batch from Team 1, then run the machine with the recommended program.'),
      st: [L('Tekan TERIMA HANDOVER dan cocokkan bag.', 'Press ACCEPT HANDOVER and match the bags.'), L('Buka Antrian Washing, pilih batch.', 'Open the Washing queue, pick the batch.'), L('Periksa mesin dan program.', 'Check the machine and program.'), L('Tekan MULAI CUCI; tekan SELESAI CUCI setelah mesin berhenti.', 'Press START WASH; press WASH DONE when the machine stops.')],
      kw: 'cuci washing mesin cuci program handover terima team 2 mulai' }),
    H({ id: 'HLP-021', mod: 'production', s: 'PROD-DRY-002', roles: ['prod2', 'supervisor', 'opsmgr'], perm: 'prod.t2', feat: 'drying', btn: 'MULAI KERING', kind: 'howto', img: 'wind', vid: 45,
      t: L('Cara Proses Drying', 'How to Run Drying'), d: L('Pindahkan batch yang selesai dicuci ke dryer sesuai metode pengeringan.', 'Move washed batches into a dryer with the right drying method.'),
      st: [L('Buka Antrian Drying.', 'Open the Drying queue.'), L('Pilih dryer yang tersedia dan metode.', 'Choose an available dryer and method.'), L('Tekan MULAI KERING; tekan SELESAI KERING setelah selesai.', 'Press START DRYING; press DRYING DONE when finished.'), L('Kirim handover ke Team 3.', 'Send the handover to Team 3.')],
      kw: 'drying kering pengeringan dryer team 2' }),
    H({ id: 'HLP-022', mod: 'production', s: 'PROD-WASH-002', roles: ['prod2', 'supervisor', 'opsmgr', 'maint'], perm: 'prod.t2', feat: 'washing', kind: 'why', img: 'washer', vid: 35,
      t: L('Kenapa Mesin Tidak Bisa Dipilih?', 'Why Can\'t I Pick the Machine?'), d: L('Mesin hanya bisa dipakai bila Tersedia/Idle dan tidak sedang menjalankan batch lain. Maintenance, perbaikan, error atau offline memblokir mesin.', 'A machine can only be used when Available/Idle and not running another batch. Maintenance, repair, error or offline block it.'),
      st: [L('Lihat status mesin di Status Mesin Live.', 'Check the machine status on Machine Live Status.'), L('Pilih mesin lain yang Tersedia, atau tunggu batch selesai.', 'Pick another Available machine, or wait for the batch to finish.'), L('Mesin error? Laporkan lewat ADA MASALAH agar maintenance membuat work order.', 'Machine error? Report it via ADA MASALAH so maintenance opens a work order.')],
      kw: 'mesin tidak bisa dipilih penuh maintenance error offline washer dryer kapasitas' }),

    /* ---- Production · Team 3 ---- */
    H({ id: 'HLP-030', mod: 'production', s: 'PROD-FIN-002', roles: ['prod3', 'supervisor', 'opsmgr'], perm: 'prod.t3', feat: 'finishing', btn: 'MULAI FINISHING', kind: 'howto', img: 'iron', vid: 50,
      t: L('Cara Finishing', 'How to Do Finishing'), d: L('Setrika, lipat atau press sesuai metode; catat jumlah pcs selesai.', 'Iron, fold or press per method; record the pieces finished.'),
      st: [L('Terima handover dari Team 2.', 'Accept the handover from Team 2.'), L('Buka Antrian Finishing, pilih batch, tekan MULAI FINISHING.', 'Open the Finishing queue, pick the batch, press START FINISHING.'), L('Isi progres pcs selama bekerja.', 'Update the pieces done while working.'), L('Tekan SELESAI FINISHING. Batch masuk antrian QC.', 'Press FINISHING DONE. The batch moves to the QC queue.')],
      kw: 'finishing setrika lipat press team 3 pcs' }),
    H({ id: 'HLP-031', mod: 'production', s: 'PROD-QC-002', roles: ['prod3', 'supervisor', 'opsmgr'], perm: 'prod.t3', feat: 'qc', btn: 'LULUS', kind: 'howto', img: 'filecheck', vid: 60, walk: 'WLK-05',
      t: L('Cara Melakukan QC', 'How to Do QC'), d: L('Periksa kebersihan, noda, kerusakan dan jumlah. Hanya barang lulus QC yang boleh dipacking.', 'Check cleanliness, stains, damage and count. Only QC-passed items may be packed.'),
      st: [L('Buka Antrian QC, pilih batch.', 'Open the QC queue, pick the batch.'), L('Centang pemeriksaan: bersih, kering, tanpa noda, lipatan, jumlah.', 'Tick the checks: clean, dry, no stains, folding, count.'), L('Semua baik? Tekan LULUS. Ada masalah? Tekan ADA MASALAH, pilih alasan dan tindakan.', 'All good? Press PASS. A problem? Press ADA MASALAH, pick the reason and action.'), L('Batch lulus pindah ke Antrian Packing.', 'A passed batch moves to the Packing queue.')],
      faq: [F(L('Sebagian barang bernoda?', 'Only some items are stained?'), L('Pilih ADA MASALAH dengan jumlah pcs bermasalah: sisanya tetap lanjut ke packing, yang bermasalah jadi rewash.', 'Choose ADA MASALAH with the problem quantity: the rest goes to packing, the problem pieces become a rewash.'))],
      kw: 'qc quality control cek kualitas lulus pass noda periksa team 3' }),
    H({ id: 'HLP-032', mod: 'production', s: 'PROD-REWASH-001', roles: ['prod3', 'prod2', 'supervisor', 'opsmgr'], perm: 'prod.t3', feat: 'rewash', kind: 'howto', img: 'refresh', vid: 45,
      t: L('Cara Rewash / Proses Ulang', 'How to Rewash / Reprocess'), d: L('Barang gagal QC dibuat rewash, refinish, review supervisor atau klaim — akar masalah tercatat.', 'Failed QC items become a rewash, refinish, supervisor review or claim — the root cause is recorded.'),
      st: [L('Di QC tekan ADA MASALAH.', 'At QC press ADA MASALAH.'), L('Pilih alasan (noda, bau, rusak, hitung) dan tindakan (rewash, refinish, review, klaim).', 'Pick the reason (stain, smell, damage, count) and action (rewash, refinish, review, claim).'), L('Isi jumlah pcs dan foto.', 'Enter the pieces and a photo.'), L('Pantau batch anak di layar Rewash sampai digabung kembali.', 'Follow the child batch on the Rewash screen until it merges back.')],
      kw: 'rewash cuci ulang proses ulang refinish gagal qc noda klaim' }),
    H({ id: 'HLP-033', mod: 'production', s: 'PROD-PACK-002', roles: ['prod3', 'supervisor', 'opsmgr'], perm: 'prod.t3', feat: 'packing', btn: 'PACKING SELESAI', kind: 'howto', img: 'package', vid: 50, walk: 'WLK-04',
      t: L('Cara Packing', 'How to Pack'), d: L('Kemas barang lulus QC ke paket berlabel QR; jumlah dibagi otomatis per paket.', 'Pack QC-passed items into QR-labelled packages; quantities are split per package automatically.'),
      st: [L('Buka Antrian Packing, pilih batch.', 'Open the Packing queue, pick the batch.'), L('Isi jumlah paket dan jenis label.', 'Enter the number of packages and the label type.'), L('Tekan PACKING SELESAI.', 'Press PACKING DONE.'), L('Cetak label dan tempel di setiap paket.', 'Print the labels and stick one on each package.')],
      kw: 'packing kemas paket label qr bungkus team 3' }),
    H({ id: 'HLP-034', mod: 'production', s: 'PROD-PACK-002', roles: ['prod3', 'supervisor', 'opsmgr'], perm: 'prod.t3', feat: 'packing', btn: 'PACKING SELESAI', kind: 'why', img: 'package', vid: 35,
      t: L('Kenapa Tombol Packing Belum Aktif?', 'Why Is the Packing Button Not Active?'), d: L('Packing hanya untuk batch di Antrian Packing yang sudah lulus QC. Batch yang masih menunggu QC, ditahan, atau sudah dipacking tidak bisa dipacking.', 'Packing is only for batches in the Packing queue that passed QC. Batches still waiting for QC, on hold, or already packed cannot be packed.'),
      st: [L('Cek status batch di detail: harus "Menunggu Packing".', 'Check the batch status on the detail: it must be "Waiting for Packing".'), L('Masih "Menunggu QC"? Selesaikan QC dulu di Keputusan QC.', 'Still "Waiting for QC"? Finish QC first on QC Decision.'), L('"Ditahan"? Minta supervisor melepas hold.', '"On Hold"? Ask the supervisor to release the hold.')],
      kw: 'packing tidak bisa belum aktif tombol qc belum lulus kenapa kemas' }),
    H({ id: 'HLP-035', mod: 'production', s: 'PROD-READY-001', roles: ['prod3', 'supervisor', 'opsmgr', 'driver'], perm: 'prod.ho3l', feat: 'handover', btn: 'SERAHKAN KE LOGISTICS', kind: 'howto', img: 'truck', vid: 45,
      t: L('Cara Serahkan ke Logistics', 'How to Hand Over to Logistics'), d: L('Batch Siap Kirim yang rekonsiliasinya sesuai diserahkan ke Logistics dengan jumlah paket tercatat.', 'Ready-to-deliver batches with a matching reconciliation are handed to Logistics with the package count recorded.'),
      st: [L('Pastikan batch berstatus Siap Kirim (SIAP DIKIRIM sudah ditekan).', 'Make sure the batch is Ready to Deliver (READY TO DELIVER was pressed).'), L('Buka Siap Kirim, pilih batch.', 'Open Ready to Deliver, pick the batch.'), L('Tekan SERAHKAN KE LOGISTICS dan hitung paket bersama driver.', 'Press HAND OVER TO LOGISTICS and count the packages with the driver.'), L('Driver menerima di aplikasinya; status menjadi Diterima Logistics.', 'The driver accepts in their app; the status becomes With Logistics.')],
      kw: 'serahkan logistics siap kirim handover paket driver ready deliver' }),
    H({ id: 'HLP-036', mod: 'production', s: 'PROD-ISSUE-002', roles: ['prod1', 'prod2', 'prod3', 'maint', 'supervisor', 'opsmgr'], perm: 'prod.issue', feat: 'issue', btn: 'ADA MASALAH', kind: 'howto', img: 'alert', vid: 40,
      t: L('Cara Laporkan Masalah Produksi (ADA MASALAH)', 'How to Report a Production Problem (ADA MASALAH)'), d: L('Laporkan masalah saat itu juga: mesin, bahan, noda, kehilangan. Supervisor langsung melihatnya.', 'Report a problem right away: machine, supplies, stains, missing items. The supervisor sees it at once.'),
      st: [L('Tekan ADA MASALAH di layar tugas.', 'Press ADA MASALAH on the task screen.'), L('Pilih jenis masalah dan tingkat keparahan.', 'Choose the problem type and severity.'), L('Tambah foto dan catatan singkat.', 'Add a photo and a short note.'), L('Tekan KIRIM LAPORAN.', 'Press SEND REPORT.')],
      kw: 'masalah lapor laporan ada masalah issue mesin rusak hilang produksi' }),
    H({ id: 'HLP-007', mod: 'production', s: 'OPS-QC-001', roles: ['operator'], perm: 'ops.qc', feat: 'qc', btn: 'LULUS', kind: 'howto', img: 'filecheck', vid: 40,
      t: L('Cara Cek QC (Operator)', 'How to Do a QC Check (Operator)'), d: L('Operator memeriksa cucian dan memutuskan lulus atau ada masalah.', 'The operator checks the laundry and decides pass or problem.'),
      st: [L('Buka Cek QC dari Beranda.', 'Open QC Check from Home.'), L('Periksa kebersihan dan jumlah.', 'Check cleanliness and count.'), L('Tekan LULUS atau ADA MASALAH.', 'Press PASS or ADA MASALAH.')],
      kw: 'qc cek kualitas lulus operator' }),
    H({ id: 'HLP-008', mod: 'production', s: 'OPS-PAC-001', roles: ['operator'], perm: 'ops.pack', feat: 'packing', kind: 'howto', img: 'package', vid: 35,
      t: L('Cara Packing (Operator)', 'How to Pack (Operator)'), d: L('Kemas cucian yang lulus QC dan tandai siap dikirim.', 'Pack laundry that passed QC and mark it ready to deliver.'),
      st: [L('Buka Packing / Siap Dikirim.', 'Open Packing / Ready to Deliver.'), L('Hitung paket dan tempel label.', 'Count the packages and stick the labels.'), L('Tekan Siap Dikirim.', 'Press Ready to Deliver.')],
      kw: 'packing kemas operator siap kirim label' }),
    H({ id: 'HLP-009', mod: 'production', s: 'OPS-RCV-001', roles: ['operator'], perm: 'ops.receive', feat: 'receiving', kind: 'howto', img: 'inbox', vid: 40,
      t: L('Cara Terima Cucian (Operator)', 'How to Receive Laundry (Operator)'), d: L('Operator menerima cucian, menimbang, dan mengisi jumlah bag.', 'The operator receives laundry, weighs it and enters the bag count.'),
      st: [L('Buka Beranda, tekan Terima Cucian.', 'Open Home, tap Receive Laundry.'), L('Pilih order dari daftar.', 'Pick the order from the list.'), L('Timbang, isi berat dan jumlah bag.', 'Weigh, enter weight and bag count.'), L('Tekan Simpan.', 'Tap Save.')],
      kw: 'terima cucian receiving operator timbang bag' }),

    /* ---- Supervisor / operations ---- */
    H({ id: 'HLP-040', mod: 'production', s: 'PROD-CMD-001', roles: ['supervisor', 'opsmgr', 'owner'], perm: 'prod.cmd', feat: 'command', kind: 'howto', img: 'grid', vid: 60,
      t: L('Cara Membaca Production Command Center', 'How to Read the Production Command Center'), d: L('Satu layar untuk batch per tahap, SLA berisiko, mesin, kapasitas dan masalah terbuka.', 'One screen for batches per stage, SLA at risk, machines, capacity and open issues.'),
      st: [L('Lihat kartu atas: batch aktif, SLA berisiko, masalah.', 'Read the top cards: active batches, SLA at risk, issues.'), L('Merah = kritis; klik untuk detail.', 'Red = critical; click for detail.'), L('Gunakan tindakan supervisor (prioritas, hold, reassign) dengan alasan.', 'Use supervisor actions (priority, hold, reassign) with a reason.')],
      kw: 'command center produksi dashboard sla kapasitas supervisor' }),
    H({ id: 'HLP-041', mod: 'delivery', s: 'REL-002', roles: ['supervisor', 'opsmgr'], perm: 'dlv.release', feat: 'release', btn: 'RELEASE KE LOGISTICS', kind: 'howto', img: 'truck', vid: 50, walk: 'WLK-08',
      t: L('Cara Release ke Logistics', 'How to Release to Logistics'), d: L('Release mengubah batch siap kirim menjadi delivery: semua cek harus hijau (QC, jumlah, paket, label, order, jadwal).', 'Release turns a ready batch into a delivery: every check must be green (QC, quantity, packages, label, order, schedule).'),
      st: [L('Buka Antrian Siap Kirim, pilih release.', 'Open the Ready-to-Deliver queue, pick the release.'), L('Periksa daftar cek.', 'Review the check list.'), L('Tekan RELEASE KE LOGISTICS.', 'Press RELEASE TO LOGISTICS.'), L('Delivery muncul di Dispatch Board.', 'The delivery appears on the Dispatch Board.')],
      kw: 'release rilis logistics siap kirim delivery cek' }),
    H({ id: 'HLP-042', mod: 'delivery', s: 'REL-002', roles: ['supervisor', 'opsmgr'], perm: 'dlv.release.view', feat: 'release', btn: 'RELEASE KE LOGISTICS', kind: 'why', img: 'alert', vid: 35,
      t: L('Kenapa Release ke Logistics Ditolak?', 'Why Was Release to Logistics Refused?'), d: L('Release ditolak bila ada cek yang merah: QC belum lulus, jumlah paket tidak sama dengan QC, label belum dikonfirmasi, order delivery tidak ada, jendela waktu lewat, atau masalah kritis terbuka.', 'Release is refused while a check is red: QC not passed, packed quantity differs from QC, label not confirmed, no delivery order, window passed, or an open critical issue.'),
      st: [L('Buka detail release dan lihat cek yang merah.', 'Open the release detail and find the red checks.'), L('Perbaiki di sumbernya (QC, packing, order).', 'Fix it at the source (QC, packing, order).'), L('Empat cek boleh di-override supervisor dengan alasan.', 'Four checks can be overridden by a supervisor with a reason.')],
      kw: 'release ditolak gagal tidak bisa kenapa cek merah override' }),
    H({ id: 'HLP-043', mod: 'production', s: 'CHK-001', roles: ['prod1', 'prod2', 'prod3', 'maint', 'supervisor', 'opsmgr'], perm: 'chk.do', feat: 'checklist', btn: 'KIRIM CHECKLIST', kind: 'howto', img: 'clipboard', vid: 40,
      t: L('Cara Mengerjakan Checklist Harian', 'How to Do the Daily Checklist'), d: L('Opening, per tim dan closing; setiap item dicentang atau dilaporkan masalah.', 'Opening, per team and closing; each item is ticked or reported as an issue.'),
      st: [L('Buka Checklist Hari Ini.', 'Open Today\'s Checklist.'), L('Kerjakan item satu per satu.', 'Do the items one by one.'), L('Item bermasalah? Tekan ADA MASALAH di item tersebut.', 'Item has a problem? Press ADA MASALAH on that item.'), L('Tekan KIRIM CHECKLIST untuk review leader.', 'Press SEND CHECKLIST for the leader review.')],
      kw: 'checklist opening closing harian centang' }),
    H({ id: 'HLP-044', mod: 'production', s: 'MNT-006', roles: ['maint', 'supervisor', 'opsmgr'], perm: 'mnt.do', feat: 'maintenance', btn: 'MULAI PERBAIKAN', kind: 'howto', img: 'wrench', vid: 50,
      t: L('Cara Mengerjakan Work Order Mesin', 'How to Work a Machine Work Order'), d: L('Masalah mesin menjadi work order: teknisi memulai, menyelesaikan, lalu supervisor memverifikasi siap pakai.', 'Machine problems become work orders: the technician starts, finishes, and the supervisor verifies ready for service.'),
      st: [L('Buka Masalah Mesin / Work Order.', 'Open Machine Issues / Work Orders.'), L('Pilih work order, tekan MULAI PERBAIKAN.', 'Pick the work order, press START REPAIR.'), L('Catat tindakan dan suku cadang.', 'Record the action and parts.'), L('Tekan SELESAI PERBAIKAN; supervisor memverifikasi.', 'Press REPAIR DONE; the supervisor verifies.')],
      kw: 'maintenance perbaikan mesin work order teknisi rusak' }),

    /* ---- Logistics / driver ---- */
    H({ id: 'HLP-050', mod: 'logistics', s: 'DRIVER-MOB-003', roles: ['driver'], perm: 'lg.drv.task', feat: 'pickup', btn: 'SELESAIKAN PICKUP', kind: 'howto', img: 'truck', vid: 60,
      t: L('Cara Pickup di Lokasi Klien', 'How to Do a Pickup at the Client'), d: L('Mulai perjalanan, tiba di lokasi, hitung bag dan kondisi, minta konfirmasi klien.', 'Start the trip, arrive, count the bags and condition, get the client confirmation.'),
      st: [L('Di Hari Ini tekan MULAI PERJALANAN.', 'On Today press START TRIP.'), L('Sampai lokasi tekan SAYA SUDAH TIBA.', 'At the site press I HAVE ARRIVED.'), L('Isi jumlah bag, kategori dan kondisi; ambil foto.', 'Enter bag count, category and condition; take a photo.'), L('Tekan SELESAIKAN PICKUP.', 'Press COMPLETE PICKUP.')],
      kw: 'pickup jemput ambil cucian driver bag lokasi klien perjalanan' }),
    H({ id: 'HLP-051', mod: 'logistics', s: 'DRIVER-MOB-002', roles: ['driver'], perm: 'lg.drv.task', feat: 'handover', btn: 'SERAHKAN MANIFEST', kind: 'howto', img: 'swap', vid: 40,
      t: L('Cara Serahkan Cucian di Plant', 'How to Hand Over Laundry at the Plant'), d: L('Setelah pickup, serahkan manifest dan bag ke Team 1 di plant.', 'After pickup, hand the manifest and bags to Team 1 at the plant.'),
      st: [L('Tekan SAYA SUDAH TIBA DI PLANT.', 'Press I HAVE ARRIVED AT THE PLANT.'), L('Tekan SERAHKAN MANIFEST.', 'Press HAND OVER MANIFEST.'), L('Hitung bag bersama Team 1 lalu SERAHKAN & KONFIRMASI.', 'Count the bags with Team 1 then HAND OVER & CONFIRM.')],
      kw: 'serahkan manifest plant handover driver bag' }),
    H({ id: 'HLP-052', mod: 'delivery', s: 'DLV-POD-001', roles: ['driver'], perm: 'dlv.drv', feat: 'pod', btn: 'KONFIRMASI PENERIMAAN', kind: 'howto', img: 'sign', vid: 60, walk: 'WLK-07',
      t: L('Cara Ambil POD (Bukti Pengiriman)', 'How to Capture a POD (Proof of Delivery)'), d: L('POD = bukti klien menerima: nama penerima, tanda tangan, foto, jumlah paket dan kondisi.', 'POD = proof the client received it: receiver name, signature, photo, package count and condition.'),
      st: [L('Di lokasi tekan SAYA SUDAH TIBA.', 'At the site press I HAVE ARRIVED.'), L('Hitung paket bersama penerima.', 'Count the packages with the receiver.'), L('Isi nama penerima, minta tanda tangan, ambil foto.', 'Enter the receiver name, get a signature, take a photo.'), L('Tekan KONFIRMASI PENERIMAAN.', 'Press CONFIRM RECEIPT.')],
      faq: [F(L('Penerima menolak sebagian?', 'The receiver refuses part of it?'), L('Pilih ADA MASALAH: paket yang ditolak menjadi return dan dicatat di POD.', 'Choose ADA MASALAH: refused packages become a return and are recorded on the POD.'))],
      kw: 'pod bukti pengiriman tanda tangan penerima foto delivery konfirmasi' }),
    H({ id: 'HLP-053', mod: 'delivery', s: 'DRV-HO-001', roles: ['driver'], perm: 'dlv.drv', feat: 'handover', kind: 'howto', img: 'swap', vid: 40,
      t: L('Cara Serah Terima Delivery dari Plant', 'How to Take Over a Delivery from the Plant'), d: L('Driver menerima paket dari Team 3 dan mengecek jumlah sebelum berangkat.', 'The driver takes the packages from Team 3 and checks the count before leaving.'),
      st: [L('Buka Serah Terima Delivery.', 'Open Delivery Handover.'), L('Scan atau hitung paket.', 'Scan or count the packages.'), L('Tekan TERIMA & KONFIRMASI, lalu MULAI PENGIRIMAN.', 'Press ACCEPT & CONFIRM, then START DELIVERY.')],
      kw: 'serah terima delivery paket driver plant berangkat' }),
    H({ id: 'HLP-054', mod: 'logistics', s: 'ISSUE-001', roles: ['driver', 'prod1', 'supervisor', 'opsmgr', 'operator'], perm: 'lg.issue.report', feat: 'issue', btn: 'ADA MASALAH', kind: 'howto', img: 'alert', vid: 35,
      t: L('Cara Laporkan Masalah di Jalan', 'How to Report a Problem on the Road'), d: L('Macet, klien tidak ada, kendaraan rusak: laporkan agar dispatcher bisa bertindak.', 'Traffic, client absent, vehicle broken: report it so the dispatcher can act.'),
      st: [L('Tekan ADA MASALAH.', 'Press ADA MASALAH.'), L('Pilih jenis masalah.', 'Choose the problem type.'), L('Tambah foto atau catatan, lalu kirim.', 'Add a photo or note, then send.')],
      kw: 'masalah jalan macet klien tidak ada kendaraan rusak lapor driver' }),
    H({ id: 'HLP-055', mod: 'logistics', s: 'ORDER-002', roles: ['supervisor', 'opsmgr'], perm: 'lg.order.create', feat: 'order', kind: 'howto', img: 'plus', vid: 45,
      t: L('Cara Membuat Order Pickup', 'How to Create a Pickup Order'), d: L('Buat order pickup untuk property klien; sistem memperingatkan bila ada duplikat.', 'Create a pickup order for a client property; the system warns about duplicates.'),
      st: [L('Buka Buat Order.', 'Open Create Order.'), L('Pilih property, layanan, tanggal dan jendela waktu.', 'Choose property, service, date and time window.'), L('Isi jumlah bag dan instruksi.', 'Enter the bag count and instructions.'), L('Tekan Simpan. Order masuk ke dispatch.', 'Press Save. The order goes to dispatch.')],
      kw: 'order pickup buat baru jadwal property layanan' }),
    H({ id: 'HLP-056', mod: 'logistics', s: 'DISPATCH-001', roles: ['supervisor', 'opsmgr'], perm: 'lg.dispatch', feat: 'dispatch', kind: 'howto', img: 'route', vid: 55,
      t: L('Cara Dispatch Driver', 'How to Dispatch a Driver'), d: L('Tugaskan driver, kendaraan dan rute ke order yang terjadwal.', 'Assign driver, vehicle and route to scheduled orders.'),
      st: [L('Buka Dispatch Board.', 'Open the Dispatch Board.'), L('Pilih order terjadwal.', 'Pick a scheduled order.'), L('Pilih driver dan kendaraan yang tersedia.', 'Choose an available driver and vehicle.'), L('Simpan; driver menerima tugas di aplikasinya.', 'Save; the driver gets the task in their app.')],
      kw: 'dispatch tugaskan driver kendaraan rute order' }),

    /* ---- Delivery completion & billing ready ---- */
    H({ id: 'HLP-060', mod: 'delivery', s: 'COMP-001', roles: ['supervisor', 'opsmgr'], perm: 'dlv.complete', feat: 'completion', btn: 'SERVICE COMPLETED', kind: 'howto', img: 'checkc', vid: 45,
      t: L('Cara Menetapkan Service Completed', 'How to Set Service Completed'), d: L('Setelah POD dan rekonsiliasi delivery sesuai, layanan ditetapkan selesai dan dibekukan.', 'After the POD and delivery reconciliation match, the service is set completed and frozen.'),
      st: [L('Buka Service Completion.', 'Open Service Completion.'), L('Pilih delivery yang sudah ada POD.', 'Pick a delivery that has a POD.'), L('Periksa ringkasan, tekan SERVICE COMPLETED.', 'Review the summary, press SERVICE COMPLETED.')],
      kw: 'service completed selesai layanan pod delivery' }),
    H({ id: 'HLP-061', mod: 'delivery', s: 'BILL-002', roles: ['finance', 'supervisor', 'opsmgr'], perm: 'dlv.bill', feat: 'billing', btn: 'KIRIM KE FINANCE', kind: 'howto', img: 'invoice', vid: 50,
      t: L('Cara Validasi Billing Ready & Kirim ke Finance', 'How to Validate Billing Ready & Send to Finance'), d: L('Layanan selesai menjadi transaksi Billing Ready dengan kuantitas POD dan tarif kontrak — dasar invoice, tanpa ketik ulang.', 'Completed services become Billing Ready transactions with POD quantity and contract rate — the invoice basis, never re-typed.'),
      st: [L('Buka Antrian Billing Ready.', 'Open the Billing Ready queue.'), L('Pilih transaksi, periksa kuantitas dan tarif.', 'Pick the transaction, check quantity and rate.'), L('Tekan KIRIM KE FINANCE.', 'Press SEND TO FINANCE.')],
      kw: 'billing ready validasi kirim finance tagihan tarif pod invoice' }),

    /* ---- Finance ---- */
    H({ id: 'HLP-070', mod: 'finance', s: 'AR-001', roles: ['finance'], perm: 'ar.build', feat: 'invoice', btn: 'BUAT DRAFT INVOICE', kind: 'howto', img: 'invoice', vid: 60, walk: 'WLK-06',
      t: L('Cara Membuat Invoice', 'How to Create an Invoice'), d: L('Invoice dibuat dari transaksi Billing Ready satu klien; baris, tarif dan kuantitas terisi otomatis dari POD dan kontrak.', 'Invoices are built from one client\'s Billing Ready transactions; lines, rates and quantities come from the POD and contract.'),
      st: [L('Buka Antrian Billing Ready (AR).', 'Open the Billing Ready queue (AR).'), L('Centang transaksi satu klien.', 'Tick one client\'s transactions.'), L('Tekan Buat Draft Invoice.', 'Press Build Draft Invoice.'), L('Di Invoice Builder periksa, isi No. PO bila perlu, lalu Ajukan Review.', 'In the Invoice Builder check it, add the PO no. if needed, then Submit for Review.')],
      faq: [F(L('Bisakah saya mengetik baris invoice sendiri?', 'Can I type invoice lines myself?'), L('Tidak. Baris berasal dari Billing Ready agar satu data, tanpa entri ganda.', 'No. Lines come from Billing Ready so there is one data source and no double entry.'))],
      kw: 'invoice tagihan buat bikin membuat faktur draft billing ready ar' }),
    H({ id: 'HLP-071', mod: 'finance', s: 'AR-001', roles: ['finance', 'owner'], perm: 'ar.view', feat: 'invoice', btn: 'BUAT DRAFT INVOICE', kind: 'why', img: 'alert', vid: 40,
      t: L('Kenapa Invoice Belum Bisa Dibuat?', 'Why Can\'t the Invoice Be Created Yet?'), d: L('Invoice hanya dibuat dari Billing Ready. Bila delivery belum ada POD, belum Service Completed, atau Billing Ready belum dikirim ke Finance, barisnya belum muncul.', 'Invoices come only from Billing Ready. If the delivery has no POD, is not Service Completed, or Billing Ready was not sent to Finance, the lines do not show yet.'),
      st: [L('Cek delivery: sudah ada POD?', 'Check the delivery: does it have a POD?'), L('Cek Service Completion: sudah ditetapkan?', 'Check Service Completion: is it set?'), L('Cek Billing Ready: sudah dikirim ke Finance dan belum ditagih?', 'Check Billing Ready: sent to Finance and not invoiced yet?'), L('Satu invoice hanya untuk satu klien; pisahkan bila berbeda klien.', 'One invoice is for one client only; split different clients.')],
      kw: 'invoice belum bisa dibuat kenapa tidak muncul billing ready pod ditolak gagal tagihan' }),
    H({ id: 'HLP-072', mod: 'finance', s: 'AR-003', roles: ['finance'], perm: 'ar.build', feat: 'invoice', kind: 'howto', img: 'edit', vid: 50,
      t: L('Cara Koreksi Invoice', 'How to Correct an Invoice'), d: L('Draft/review dikoreksi di Invoice Builder. Invoice terbit tanpa pembayaran dibatalkan (jurnal balik) lalu dibuat ulang; yang sudah dibayar memakai nota kredit.', 'Drafts/reviews are corrected in the Invoice Builder. An issued invoice without payment is cancelled (reversal) and built again; a paid one uses a credit note.'),
      st: [L('Buka Detail Invoice.', 'Open the Invoice Detail.'), L('Draft/Review: Kembalikan ke draft, perbaiki di Invoice Builder.', 'Draft/Review: return it to draft, fix it in the Invoice Builder.'), L('Sudah terbit tanpa pembayaran: Batalkan dengan alasan; baris kembali ke Billing Ready, lalu buat ulang invoice.', 'Issued without payment: Cancel with a reason; lines return to Billing Ready, then build the invoice again.'), L('Sudah dibayar sebagian: buat nota kredit, jangan hapus.', 'Partly paid: create a credit note, never delete.')],
      kw: 'koreksi invoice revisi perbaiki salah batal buat ulang nota kredit edit' }),
    H({ id: 'HLP-073', mod: 'finance', s: 'AR-003', roles: ['finance', 'owner'], perm: 'ar.approve', feat: 'invoice', btn: 'SETUJUI', kind: 'howto', img: 'checkc', vid: 45,
      t: L('Cara Menyetujui & Menerbitkan Invoice', 'How to Approve & Issue an Invoice'), d: L('Invoice di atas batas atau dengan diskon manual butuh orang kedua (maker-checker); terbit = jurnal piutang & PPN.', 'Invoices above the limit or with a manual discount need a second person (maker-checker); issuing posts AR & VAT.'),
      st: [L('Buka invoice berstatus Review.', 'Open an invoice in Review.'), L('Periksa baris, diskon dan dokumen pendukung.', 'Check lines, discount and support documents.'), L('Tekan Setujui (atau Kembalikan dengan alasan).', 'Press Approve (or Return with a reason).'), L('Pemegang izin terbit menekan Terbitkan Invoice.', 'The holder of the issue permission presses Issue Invoice.')],
      kw: 'setujui approve invoice terbitkan terbit issue review maker checker' }),
    H({ id: 'HLP-074', mod: 'finance', s: 'AR-003', roles: ['finance'], perm: 'ar.pay', feat: 'payment', btn: 'CATAT PEMBAYARAN', kind: 'howto', img: 'coins', vid: 45,
      t: L('Cara Mencatat Pembayaran Klien', 'How to Record a Client Payment'), d: L('Pembayaran sebagian boleh, tidak boleh melebihi sisa tagihan; jurnal otomatis.', 'Partial payments are allowed, never above the open balance; the journal is automatic.'),
      st: [L('Buka invoice Terbit / Jatuh Tempo.', 'Open an Issued / Overdue invoice.'), L('Tekan Catat Pembayaran.', 'Press Record Payment.'), L('Isi tanggal, jumlah, rekening dan referensi bank.', 'Enter date, amount, account and bank reference.'), L('Simpan; status invoice ikut berubah.', 'Save; the invoice status follows.')],
      kw: 'pembayaran bayar payment catat transfer invoice lunas sebagian' }),
    H({ id: 'HLP-075', mod: 'finance', s: 'AR-005', roles: ['finance'], perm: 'ar.collect', feat: 'collection', kind: 'howto', img: 'headset', vid: 45,
      t: L('Cara Follow-up Piutang (Collection)', 'How to Follow Up Receivables (Collection)'), d: L('Catat setiap kontak penagihan, janji bayar dan eskalasi per invoice.', 'Record every collection contact, payment promise and escalation per invoice.'),
      st: [L('Buka Collection Workspace.', 'Open the Collection Workspace.'), L('Mulai dari invoice paling lama jatuh tempo.', 'Start with the most overdue invoice.'), L('Catat aksi (telepon, email, WA) dan hasilnya.', 'Record the action (call, email, WA) and the outcome.'), L('Atur tindak lanjut berikutnya.', 'Set the next follow-up.')],
      kw: 'collection piutang tagih penagihan jatuh tempo overdue aging' }),
    H({ id: 'HLP-076', mod: 'finance', s: 'CASH-003', roles: ['finance', 'owner'], perm: 'cash.approve', feat: 'cash', btn: 'SETUJUI', kind: 'howto', img: 'checkc', vid: 40,
      t: L('Cara Menyetujui Transaksi Kas', 'How to Approve a Cash Transaction'), d: L('Transaksi kas besar butuh persetujuan orang lain; pembuat tidak boleh menyetujui sendiri.', 'Large cash transactions need another person\'s approval; the maker cannot approve their own.'),
      st: [L('Buka Transaksi Kas, filter Menunggu Persetujuan.', 'Open Cash Transactions, filter Pending Approval.'), L('Periksa jumlah, akun dan bukti.', 'Check amount, account and evidence.'), L('Tekan Setujui atau Tolak dengan alasan.', 'Press Approve or Reject with a reason.')],
      kw: 'kas cash setujui approve transaksi persetujuan petty cash' }),
    H({ id: 'HLP-077', mod: 'finance', s: 'CASH-003', roles: ['finance'], perm: 'cash.tx', feat: 'cash', kind: 'howto', img: 'coins', vid: 40,
      t: L('Cara Mencatat Transaksi Kas', 'How to Record a Cash Transaction'), d: L('Kas masuk, keluar, transfer dan setoran dicatat sekali dan langsung terjurnal.', 'Cash in, out, transfers and deposits are recorded once and journalised at once.'),
      st: [L('Buka Transaksi Kas, tekan Tambah.', 'Open Cash Transactions, press Add.'), L('Pilih jenis, rekening, jumlah dan akun lawan.', 'Choose type, account, amount and counter account.'), L('Lampirkan bukti lalu simpan.', 'Attach the evidence and save.')],
      kw: 'kas cash catat transaksi masuk keluar transfer setoran' }),
    H({ id: 'HLP-078', mod: 'finance', s: 'BUD-004', roles: ['finance'], perm: 'fin.close', feat: 'close', kind: 'howto', img: 'lock', vid: 60,
      t: L('Cara Monthly Close', 'How to Do the Monthly Close'), d: L('Checklist tutup bulan: rekonsiliasi, penyusutan, accrual, soft close lalu close period. Periode tertutup tidak bisa diubah.', 'Month-end checklist: reconciliations, depreciation, accruals, soft close then close period. A closed period cannot be changed.'),
      st: [L('Buka Monthly Close.', 'Open Monthly Close.'), L('Selesaikan setiap item checklist.', 'Finish every checklist item.'), L('Soft close untuk review.', 'Soft close for review.'), L('Tekan CLOSE PERIOD.', 'Press CLOSE PERIOD.')],
      kw: 'tutup buku close period monthly close bulan periode' }),
    H({ id: 'HLP-079', mod: 'finance', s: 'HPP-001', roles: ['finance', 'owner', 'opsmgr'], perm: 'hpp.view', feat: 'hpp', kind: 'whatis', img: 'chart', vid: 50,
      t: L('Cara Membaca HPP', 'How to Read HPP (Cost of Service)'), d: L('HPP per kg = bahan + tenaga + mesin/energi + overhead, dihitung dari berat aktual receiving — tanpa input ulang.', 'HPP per kg = supplies + labour + machine/energy + overhead, computed from actual receiving weight — never re-entered.'),
      st: [L('Lihat HPP per kg dan tren.', 'See HPP per kg and the trend.'), L('Buka Rincian HPP untuk komposisi.', 'Open HPP Breakdown for the composition.'), L('Bandingkan dengan harga untuk margin.', 'Compare with the price for the margin.')],
      kw: 'hpp harga pokok biaya cost per kg margin' }),

    /* ---- Purchasing & inventory ---- */
    H({ id: 'HLP-080', mod: 'purchasing', s: 'PUR-002', roles: ['supply', 'opsmgr'], perm: 'pur.pr', feat: 'pr', kind: 'howto', img: 'clipboard', vid: 50,
      t: L('Cara Membuat Purchase Request', 'How to Create a Purchase Request'), d: L('Ajukan kebutuhan barang dengan alasan; disetujui sesuai batas nilai sebelum RFQ/PO.', 'Request the goods you need with a reason; approved per value limit before RFQ/PO.'),
      st: [L('Buka Purchase Request, tekan Buat.', 'Open Purchase Requests, press Create.'), L('Pilih item, jumlah dan tanggal butuh.', 'Choose item, quantity and needed-by date.'), L('Isi alasan lalu ajukan.', 'Enter the reason and submit.'), L('Pantau status persetujuan.', 'Follow the approval status.')],
      kw: 'purchase request pr beli pembelian permintaan barang ajukan' }),
    H({ id: 'HLP-081', mod: 'purchasing', s: 'PUR-003', roles: ['finance', 'owner'], perm: 'pur.approve', feat: 'pr', btn: 'SETUJUI', kind: 'howto', img: 'checkc', vid: 35,
      t: L('Cara Menyetujui Purchase Request', 'How to Approve a Purchase Request'), d: L('Setujui atau tolak PR dengan catatan; pengaju tidak boleh menyetujui sendiri.', 'Approve or reject a PR with a note; the requester cannot approve their own.'),
      st: [L('Buka Persetujuan PR.', 'Open PR Approval.'), L('Periksa item, nilai dan alasan.', 'Check items, value and reason.'), L('Tekan Setujui atau Tolak.', 'Press Approve or Reject.')],
      kw: 'setujui approve purchase request pr pembelian' }),
    H({ id: 'HLP-082', mod: 'purchasing', s: 'INV-005', roles: ['supply', 'opsmgr'], perm: 'inv.adjust', feat: 'opname', kind: 'howto', img: 'list', vid: 55,
      t: L('Cara Stock Opname', 'How to Do a Stock Count'), d: L('Hitung fisik dibandingkan stok sistem; selisih menjadi penyesuaian yang perlu disetujui.', 'Physical count versus system stock; differences become adjustments that need approval.'),
      st: [L('Buka Stock Opname, mulai sesi.', 'Open Stock Count, start a session.'), L('Isi jumlah fisik per item.', 'Enter the physical quantity per item.'), L('Periksa selisih, isi alasan.', 'Review differences, add reasons.'), L('Ajukan penyesuaian untuk disetujui.', 'Submit the adjustment for approval.')],
      kw: 'stock opname stok hitung fisik penyesuaian persediaan' }),
    H({ id: 'HLP-083', mod: 'purchasing', s: 'INV-004', roles: ['supply'], perm: 'inv.move', feat: 'stock', kind: 'howto', img: 'swap', vid: 40,
      t: L('Cara Mencatat Mutasi Stok', 'How to Record a Stock Movement'), d: L('Pemakaian, transfer dan penerimaan barang tercatat sebagai mutasi dan terjurnal.', 'Usage, transfers and goods receipts are recorded as movements and journalised.'),
      st: [L('Buka Mutasi Stok, tekan Tambah.', 'Open Stock Movements, press Add.'), L('Pilih item, jenis mutasi dan jumlah.', 'Choose item, movement type and quantity.'), L('Simpan.', 'Save.')],
      kw: 'mutasi stok pemakaian transfer barang persediaan' }),

    /* ---- Commercial ---- */
    H({ id: 'HLP-090', mod: 'commercial', s: 'RATE-003', roles: ['sales', 'owner'], perm: 'com.rate.edit', feat: 'rate', kind: 'howto', img: 'tag', vid: 50,
      t: L('Cara Mengajukan Perubahan Rate Card', 'How to Propose a Rate Card Change'), d: L('Harga baru = versi baru dengan tanggal efektif; diskon di atas batas butuh persetujuan.', 'A new price = a new version with an effective date; discounts above the limit need approval.'),
      st: [L('Buka Rate Card klien, tekan Ubah.', 'Open the client Rate Card, press Edit.'), L('Isi tarif baru dan tanggal efektif.', 'Enter the new rates and effective date.'), L('Isi alasan lalu ajukan.', 'Enter the reason and submit.')],
      kw: 'rate card harga tarif ubah diskon versi' }),
    H({ id: 'HLP-091', mod: 'commercial', s: 'CONTRACT-003', roles: ['sales', 'owner'], perm: 'com.contract.edit', feat: 'contract', kind: 'howto', img: 'contract', vid: 55,
      t: L('Cara Membuat / Memperbarui Kontrak', 'How to Create / Renew a Contract'), d: L('Kontrak berversi: layanan, SLA, rate card, volume minimum, jadwal pickup.', 'Contracts are versioned: services, SLA, rate card, minimum volume, pickup schedule.'),
      st: [L('Buka Editor Kontrak.', 'Open the Contract Editor.'), L('Pilih klien dan property.', 'Choose client and properties.'), L('Isi layanan, SLA, rate card, periode.', 'Fill services, SLA, rate card, period.'), L('Simpan sebagai versi baru dan ajukan persetujuan.', 'Save as a new version and submit for approval.')],
      kw: 'kontrak contract perpanjang renewal versi sla' }),
    H({ id: 'HLP-092', mod: 'general', s: 'APR-INB-001', roles: ['supervisor', 'opsmgr', 'finance', 'owner'], perm: 'apr.view', feat: 'approval', btn: 'SETUJUI', kind: 'howto', img: 'filecheck', vid: 40,
      t: L('Cara Menyetujui Permintaan', 'How to Approve a Request'), d: L('Inbox Persetujuan mengumpulkan permintaan yang menunggu Anda; baca alasan dan nilai sebelum/sesudah.', 'The Approvals inbox collects requests waiting for you; read the reason and the before/after values.'),
      st: [L('Buka Persetujuan dari header.', 'Open Approvals from the header.'), L('Baca alasan dan nilai sebelum / sesudah.', 'Read the reason and the before / after values.'), L('Setujui atau tolak dengan catatan.', 'Approve or reject with a note.')],
      kw: 'setujui persetujuan approve approval inbox permintaan tolak' }),

    /* ---- Client portal ---- */
    H({ id: 'HLP-100', mod: 'client', s: 'CLP-003', roles: ['client'], perm: 'clp.pickup.create', feat: 'pickup', btn: 'KIRIM PERMINTAAN', kind: 'howto', img: 'truck', vid: 45, walk: 'WLK-01',
      t: L('Cara Minta Pickup', 'How to Request a Pickup'), d: L('Minta pickup untuk property Anda; permintaan langsung masuk jadwal J\'Fresh.', 'Request a pickup for your property; the request goes straight into the J\'Fresh schedule.'),
      st: [L('Pilih property.', 'Choose the property.'), L('Pilih layanan.', 'Choose the service.'), L('Pilih tanggal dan jendela waktu, isi jumlah bag.', 'Choose date and time window, enter the bag count.'), L('Periksa ringkasan lalu tekan KIRIM PERMINTAAN.', 'Check the summary then press SEND REQUEST.')],
      faq: [F(L('Muncul peringatan duplikat?', 'A duplicate warning shows?'), L('Sudah ada pickup di hari dan property yang sama. Kirim tetap dengan alasan bila memang perlu pickup tambahan.', 'A pickup already exists for the same day and property. Send anyway with a reason if you really need an extra pickup.'))],
      kw: 'pickup jemput minta permintaan ambil cucian property klien jadwal' }),
    H({ id: 'HLP-101', mod: 'client', s: 'CLP-005', roles: ['client'], perm: 'clp.track.view', feat: 'tracking', kind: 'howto', img: 'pin', vid: 35,
      t: L('Cara Lacak Driver & Pesanan', 'How to Track the Driver & Orders'), d: L('Lihat posisi driver, perkiraan tiba dan status pesanan secara live.', 'See the driver position, ETA and order status live.'),
      st: [L('Buka Tracking.', 'Open Tracking.'), L('Pilih pesanan aktif.', 'Pick an active order.'), L('Lihat ETA dan posisi; chat driver bila perlu.', 'See the ETA and position; chat the driver if needed.')],
      kw: 'lacak tracking driver posisi eta pesanan status' }),
    H({ id: 'HLP-102', mod: 'client', s: 'CLP-008', roles: ['client'], perm: 'clp.invoice.view', feat: 'invoice', kind: 'howto', img: 'invoice', vid: 35,
      t: L('Cara Melihat Invoice & Tagihan', 'How to View Invoices & Bills'), d: L('Lihat invoice terbit, jatuh tempo, pembayaran dan statement akun Anda.', 'See issued invoices, due dates, payments and your account statement.'),
      st: [L('Buka Billing & Invoice.', 'Open Billing & Invoices.'), L('Pilih invoice untuk detail dan dokumen pendukung.', 'Pick an invoice for detail and support documents.'), L('Unduh statement bila perlu.', 'Download the statement if needed.')],
      kw: 'invoice tagihan lihat klien statement jatuh tempo bayar' }),
    H({ id: 'HLP-103', mod: 'client', s: 'CLP-011', roles: ['client'], perm: 'clp.complaint.create', feat: 'complaint', kind: 'howto', img: 'message', vid: 40,
      t: L('Cara Laporkan Masalah / Komplain', 'How to Report a Problem / Complaint'), d: L('Laporkan noda, kerusakan, kehilangan atau keterlambatan; tim J\'Fresh menindaklanjuti dan Anda bisa memantau.', 'Report stains, damage, missing items or delays; the J\'Fresh team follows up and you can track it.'),
      st: [L('Buka Bantuan & Masalah, tekan Laporkan Masalah.', 'Open Help & Issues, press Report a Problem.'), L('Pilih property, kategori dan pesanan terkait.', 'Choose property, category and the related order.'), L('Jelaskan masalah dan tambah foto.', 'Describe the problem and add a photo.'), L('Kirim; pantau status di Detail Laporan.', 'Send; follow the status on the Report Detail.')],
      kw: 'komplain keluhan masalah lapor noda rusak hilang terlambat klien' }),
    H({ id: 'HLP-104', mod: 'client', s: 'CLP-007', roles: ['client'], perm: 'clp.pod.view', feat: 'documents', kind: 'howto', img: 'download', vid: 30,
      t: L('Cara Unduh POD & Dokumen', 'How to Download PODs & Documents'), d: L('POD, delivery note, invoice dan kontrak tersedia di Pusat Dokumen.', 'PODs, delivery notes, invoices and contracts are in the Document Center.'),
      st: [L('Buka Pusat Dokumen.', 'Open the Document Center.'), L('Filter jenis dokumen atau cari nomor.', 'Filter the document type or search a number.'), L('Tekan Unduh.', 'Press Download.')],
      kw: 'pod dokumen unduh download bukti delivery note kontrak' }),
    H({ id: 'HLP-105', mod: 'client', s: 'CLP-013', roles: ['client'], perm: 'clp.users.manage', feat: 'users', kind: 'howto', img: 'users', vid: 45,
      t: L('Cara Mengelola User Klien', 'How to Manage Client Users'), d: L('Undang rekan kerja dengan peran dan akses property yang tepat.', 'Invite colleagues with the right role and property access.'),
      st: [L('Buka Pengguna & Akses, tekan Tambah.', 'Open Users & Access, press Add.'), L('Isi nama, email, peran dan cakupan property.', 'Enter name, email, role and property scope.'), L('Kirim undangan.', 'Send the invitation.')],
      kw: 'user pengguna klien undang akses property peran' }),

    /* ---- System ---- */
    H({ id: 'HLP-110', mod: 'system', s: 'ADM-001', roles: ['sysadmin', 'superadmin'], perm: 'sys11.users.manage', feat: 'users', kind: 'howto', img: 'users', vid: 55,
      t: L('Cara Menambah User Internal', 'How to Add an Internal User'), d: L('User baru berstatus Invited sampai login pertama; role privileged butuh persetujuan orang kedua.', 'New users stay Invited until their first login; privileged roles need a second approver.'),
      st: [L('Buka Daftar User Internal, tekan Tambah.', 'Open the Internal User List, press Add.'), L('Isi nama, username, email, departemen, role dan plant.', 'Enter name, username, email, department, role and plant.'), L('Isi alasan lalu simpan.', 'Enter a reason and save.')],
      kw: 'user tambah pengguna baru akun undang role admin' }),
    H({ id: 'HLP-111', mod: 'system', s: 'SEC-002', roles: ['sysadmin', 'superadmin', 'owner'], perm: 'sys11.audit.view', feat: 'audit', kind: 'howto', img: 'history', vid: 40,
      t: L('Cara Membaca Audit Log', 'How to Read the Audit Log'), d: L('Satu jejak audit dari semua modul: siapa, apa, sebelum, sesudah, alasan. Tidak bisa diubah atau dihapus.', 'One audit trail from every module: who, what, before, after, reason. It cannot be edited or deleted.'),
      st: [L('Buka Audit Log.', 'Open the Audit Log.'), L('Filter modul, user, aksi atau tanggal.', 'Filter module, user, action or date.'), L('Buka baris untuk detail.', 'Open a row for the detail.')],
      kw: 'audit log jejak riwayat siapa mengubah' }),
    H({ id: 'HLP-112', mod: 'system', s: 'INT-004', roles: ['sysadmin', 'superadmin'], perm: 'sys11.import', feat: 'import', kind: 'howto', img: 'upload', vid: 50,
      t: L('Cara Import Data', 'How to Import Data'), d: L('Upload → validasi → preview → konfirmasi; hanya baris tanpa error yang diimport.', 'Upload → validate → preview → confirm; only rows without errors are imported.'),
      st: [L('Buka Import Center, pilih jenis data.', 'Open the Import Center, choose the data type.'), L('Upload file CSV.', 'Upload the CSV file.'), L('Periksa hasil validasi.', 'Review the validation result.'), L('Konfirmasi dengan alasan.', 'Confirm with a reason.')],
      kw: 'import upload csv data validasi' }),

    /* ---- Performance ---- */
    H({ id: 'HLP-120', mod: 'performance', s: 'PERF-001', roles: ['*'], perm: 'perf.self', feat: 'performance', kind: 'howto', img: 'star', vid: 35,
      t: L('Cara Melihat Kinerja Saya', 'How to See My Performance'), d: L('Skor, target dan tren kinerja pribadi Anda.', 'Your personal score, targets and trend.'),
      st: [L('Buka Kinerja Saya.', 'Open My Performance.'), L('Lihat skor per KPI dan target.', 'See the score per KPI and target.'), L('Klik KPI untuk detail.', 'Click a KPI for detail.')],
      kw: 'kinerja performance skor saya target' }),
    H({ id: 'HLP-121', mod: 'performance', s: 'KPI-001', roles: ['owner', 'opsmgr', 'supervisor', 'finance', 'hr', 'raceleader', 'sales'], perm: 'kpi.view', feat: 'kpi', kind: 'howto', img: 'gauge', vid: 45,
      t: L('Cara Membaca KPI & Scorecard', 'How to Read KPIs & the Scorecard'), d: L('Setiap KPI punya target, aktual, tren dan pemilik; merah = di bawah ambang.', 'Each KPI has a target, actual, trend and owner; red = below threshold.'),
      st: [L('Buka KPI Master & Scorecard.', 'Open the KPI Master & Scorecard.'), L('Filter per pilar atau pemilik.', 'Filter by pillar or owner.'), L('Klik KPI untuk detail dan riwayat versi.', 'Click a KPI for detail and version history.')],
      kw: 'kpi scorecard indikator target kinerja' }),

    /* ---- Smart Help itself ---- */
    H({ id: 'HLP-130', mod: 'help', s: 'HELP-006', roles: ['trainer'], perm: 'help.edit', feat: 'content', kind: 'howto', img: 'edit', vid: 50,
      t: L('Cara Membuat & Menerbitkan Konten Bantuan', 'How to Create & Publish Help Content'), d: L('Konten bantuan berversi: draft → terbit; arsip dengan alasan. Video 30–90 detik.', 'Help content is versioned: draft → published; archive with a reason. Videos 30–90 seconds.'),
      st: [L('Buka Tutorial Manager, tekan Buat.', 'Open the Tutorial Manager, press Create.'), L('Isi modul, layar, judul, langkah, kata kunci dan video.', 'Fill module, screen, title, steps, keywords and video.'), L('Simpan sebagai draft.', 'Save as draft.'), L('Tekan Terbitkan dengan alasan.', 'Press Publish with a reason.')],
      kw: 'konten bantuan tutorial buat terbitkan publish arsip manager' }),
    H({ id: 'HLP-131', mod: 'help', s: 'HELP-005', roles: ['*'], perm: null, feat: 'ask', kind: 'whatis', img: 'message', vid: 30,
      t: L('Apa itu Tanya JFRESH?', 'What is Ask JFRESH?'), d: L('Asisten berbasis aturan: membaca layar, status data, peran dan izin Anda, lalu menjelaskan apa yang terjadi dan apa langkah berikutnya.', 'A rule-based assistant: it reads your screen, the record status, your role and permissions, then explains what is going on and the next step.'),
      st: [L('Buka Tanya JFRESH dari Bantuan.', 'Open Ask JFRESH from Help.'), L('Tulis pertanyaan, contoh "Kenapa tombol Packing belum aktif?".', 'Write a question, e.g. "Why is the Packing button not active?".'), L('Ikuti jawaban dan tautan ke layar terkait.', 'Follow the answer and the links to the related screen.')],
      kw: 'tanya jfresh asisten pertanyaan bantuan ask' }),

    /* ---- Not published (manager only): a draft and an archived item ---- */
    H({ id: 'HLP-140', mod: 'logistics', s: 'DRIVER-MOB-001', roles: ['driver'], perm: 'lg.drv.task', feat: 'offline', kind: 'howto', img: 'wifioff', vid: 40, status: 'draft',
      t: L('Cara Bekerja Saat Sinyal Hilang', 'How to Work When the Signal Drops'), d: L('Draft: perilaku aplikasi driver saat offline.', 'Draft: driver app behaviour while offline.'),
      st: [L('Lanjutkan tugas; data disimpan di perangkat.', 'Continue the task; data is kept on the device.'), L('Saat sinyal kembali, data terkirim otomatis.', 'When the signal returns, data is sent automatically.')],
      kw: 'offline sinyal internet hilang driver' }),
    H({ id: 'HLP-141', mod: 'production', s: 'OPS-RCV-001', roles: ['operator'], perm: 'ops.receive', feat: 'receiving', kind: 'howto', img: 'inbox', vid: 60, status: 'archived', archiveReason: L('Diganti alur Team 1 Fase 8 (HLP-011).', 'Replaced by the Phase 8 Team 1 flow (HLP-011).'),
      t: L('Cara Terima Cucian (Fase 2, lama)', 'How to Receive Laundry (Phase 2, old)'), d: L('Versi lama sebelum workspace Team 1.', 'Old version before the Team 1 workspace.'),
      st: [L('Buka Terima Cucian.', 'Open Receive Laundry.'), L('Isi berat.', 'Enter the weight.')],
      kw: 'terima cucian lama' })
  ];

  /* ---------- Button help (§53): purpose, required conditions, what happens after ---------- */
  D.BUTTONS = {
    'rcv.start': { l: L('MULAI RECEIVING', 'START RECEIVING'), s: 'PROD-RCV-002', perm: 'prod.t1', hlp: 'HLP-011',
      p: L('Mulai memeriksa kedatangan cucian dari Logistics.', 'Start checking a laundry arrival from Logistics.'), c: [L('Kedatangan berstatus Menunggu.', 'The arrival is Waiting.'), L('Anda anggota Team 1 (izin prod.t1).', 'You are on Team 1 (prod.t1 permission).')], a: L('Status menjadi Sedang Receiving; isi jumlah bag dan kondisi.', 'The status becomes Receiving; enter bag count and condition.') },
    'weigh.save': { l: L('SIMPAN TIMBANGAN', 'SAVE WEIGHT'), s: 'PROD-WGT-001', perm: 'prod.t1', hlp: 'HLP-013',
      p: L('Menyimpan berat aktual dari timbangan.', 'Stores the actual weight from the scale.'), c: [L('Receiving sudah diterima.', 'Receiving is accepted.'), L('Timbangan sudah dibaca.', 'The scale has been read.')], a: L('Berat aktual dipakai produksi, HPP, billing dan KPI tanpa input ulang; selisih besar butuh review supervisor.', 'The actual weight feeds production, HPP, billing and KPI without re-entry; a large difference needs supervisor review.') },
    'batch.create': { l: L('BUAT BATCH', 'CREATE BATCH'), s: 'PROD-BATCH-001', perm: 'prod.t1', hlp: 'HLP-015',
      p: L('Membuat batch produksi dari lot yang sudah disortir.', 'Creates a production batch from sorted lots.'), c: [L('Lot sudah selesai sortir.', 'Lots are sorted.'), L('Kategori cocok dan berat tidak melebihi kapasitas mesin.', 'Categories are compatible and the weight is within machine capacity.')], a: L('Batch berstatus Siap Produksi dan bisa dikirim ke Team 2.', 'The batch is Ready for Production and can be sent to Team 2.') },
    'ho.send': { l: L('KIRIM', 'SEND'), s: 'PROD-BATCH-001', perm: 'prod.ho12', hlp: 'HLP-016',
      p: L('Mengirim handover batch ke tim berikutnya.', 'Sends the batch handover to the next team.'), c: [L('Batch di tahap akhir tim Anda (Siap Produksi / Siap Finalisasi).', 'The batch is at your team\'s last stage (Ready for Production / Ready for Finalization).'), L('Izin handover tim Anda.', 'Your team\'s handover permission.')], a: L('Batch menunggu diterima tim berikutnya; selisih dicatat bila tidak cocok.', 'The batch waits for the next team to accept; a difference is recorded if it does not match.') },
    'qc.pass': { l: L('LULUS', 'PASS'), s: 'PROD-QC-002', perm: 'prod.t3', hlp: 'HLP-031',
      p: L('Menyatakan batch lulus QC.', 'Declares the batch passed QC.'), c: [L('Batch berstatus Menunggu QC.', 'The batch is Waiting for QC.'), L('Pemeriksaan sudah dicentang.', 'The checks are ticked.')], a: L('Batch pindah ke Antrian Packing.', 'The batch moves to the Packing queue.') },
    'pack': { l: L('PACKING SELESAI', 'PACKING DONE'), s: 'PROD-PACK-002', perm: 'prod.t3', hlp: 'HLP-033', why: 'HLP-034',
      p: L('Mengemas barang lulus QC ke paket berlabel.', 'Packs QC-passed items into labelled packages.'), c: [L('Batch berstatus Menunggu Packing (QC sudah lulus).', 'The batch is Waiting for Packing (QC passed).'), L('Batch tidak ditahan.', 'The batch is not on hold.'), L('Anda Team 3 (izin prod.t3).', 'You are Team 3 (prod.t3 permission).')], a: L('Status menjadi Packing Selesai; lanjut SIAP DIKIRIM setelah rekonsiliasi.', 'The status becomes Packed; continue with READY TO DELIVER after reconciliation.') },
    'ready': { l: L('SIAP DIKIRIM', 'READY TO DELIVER'), s: 'PROD-PACK-002', perm: 'prod.t3', hlp: 'HLP-035',
      p: L('Menandai batch siap dikirim setelah rekonsiliasi.', 'Marks the batch ready to deliver after reconciliation.'), c: [L('Packing selesai.', 'Packing is done.'), L('Diterima = diproses = lulus QC = dipacking (atau persetujuan supervisor).', 'Received = processed = QC passed = packed (or supervisor approval).')], a: L('Batch masuk Siap Kirim dan antrian release.', 'The batch enters Ready to Deliver and the release queue.') },
    'ho3l': { l: L('SERAHKAN KE LOGISTICS', 'HAND OVER TO LOGISTICS'), s: 'PROD-READY-001', perm: 'prod.ho3l', hlp: 'HLP-035',
      p: L('Menyerahkan paket ke driver.', 'Hands the packages to the driver.'), c: [L('Batch Siap Kirim.', 'The batch is Ready to Deliver.'), L('Jumlah paket dihitung bersama.', 'Packages are counted together.')], a: L('Status Handover ke Logistics sampai driver menerima.', 'Status Handover to Logistics until the driver accepts.') },
    'release': { l: L('RELEASE KE LOGISTICS', 'RELEASE TO LOGISTICS'), s: 'REL-002', perm: 'dlv.release', hlp: 'HLP-041', why: 'HLP-042',
      p: L('Melepas batch siap kirim menjadi delivery yang bisa di-dispatch.', 'Releases a ready batch as a delivery that can be dispatched.'), c: [L('QC lulus dan jumlah dipacking sama dengan QC.', 'QC passed and the packed quantity equals QC.'), L('Label + QR terpasang, order delivery ada, tanggal & jendela valid.', 'Label + QR attached, delivery order exists, date & window valid.'), L('Tidak ada masalah kritis terbuka.', 'No open critical issue.')], a: L('Delivery dibuat/diaktifkan dan muncul di Dispatch Board; klien bisa melacak.', 'The delivery is created/activated and appears on the Dispatch Board; the client can track it.') },
    'pod.confirm': { l: L('KONFIRMASI PENERIMAAN', 'CONFIRM RECEIPT'), s: 'DLV-POD-001', perm: 'dlv.drv', hlp: 'HLP-052',
      p: L('Menyimpan bukti pengiriman (POD).', 'Saves the proof of delivery (POD).'), c: [L('Anda sudah tiba di lokasi.', 'You have arrived at the site.'), L('Nama penerima, tanda tangan dan jumlah paket terisi.', 'Receiver name, signature and package count are filled.')], a: L('POD tersimpan, klien melihatnya di portal, delivery siap Service Completed.', 'The POD is saved, the client sees it in the portal, the delivery is ready for Service Completed.') },
    'dlv.complete': { l: L('SERVICE COMPLETED', 'SERVICE COMPLETED'), s: 'COMP-001', perm: 'dlv.complete', hlp: 'HLP-060',
      p: L('Menetapkan layanan selesai dan membekukan datanya.', 'Sets the service completed and freezes its data.'), c: [L('POD ada dan rekonsiliasi delivery sesuai.', 'A POD exists and the delivery reconciliation matches.')], a: L('Transaksi Billing Ready dibuat untuk Finance.', 'A Billing Ready transaction is created for Finance.') },
    'bill.send': { l: L('KIRIM KE FINANCE', 'SEND TO FINANCE'), s: 'BILL-002', perm: 'dlv.bill', hlp: 'HLP-061',
      p: L('Mengirim Billing Ready tervalidasi ke Finance.', 'Sends validated Billing Ready to Finance.'), c: [L('Service Completed.', 'Service Completed.'), L('Kuantitas dan tarif sudah dicek.', 'Quantity and rate are checked.')], a: L('Transaksi muncul di Antrian Billing Ready Finance (AR-001), siap jadi invoice.', 'The transaction appears in Finance\'s Billing Ready queue (AR-001), ready to invoice.') },
    'invoice.build': { l: L('BUAT INVOICE', 'CREATE INVOICE'), s: 'AR-001', perm: 'ar.build', hlp: 'HLP-070', why: 'HLP-071',
      p: L('Membuat draft invoice dari transaksi Billing Ready yang dipilih.', 'Builds a draft invoice from the selected Billing Ready transactions.'), c: [L('Transaksi berstatus belum ditagih (unbilled).', 'Transactions are unbilled.'), L('Semua baris satu klien.', 'All lines belong to one client.'), L('Izin ar.build.', 'ar.build permission.')], a: L('Draft invoice dibuat; baris Billing Ready terkunci ke invoice ini. Lanjut Ajukan Review.', 'A draft invoice is created; the Billing Ready lines lock to it. Continue with Submit for Review.') },
    'invoice.approve': { l: L('SETUJUI', 'APPROVE'), s: 'AR-003', perm: 'ar.approve', hlp: 'HLP-073',
      p: L('Menyetujui invoice yang sedang review.', 'Approves an invoice under review.'), c: [L('Invoice berstatus Review.', 'The invoice is in Review.'), L('Di atas batas atau ada diskon manual: penyetuju ≠ pembuat.', 'Above the limit or with a manual discount: approver ≠ maker.')], a: L('Invoice Disetujui dan siap diterbitkan.', 'The invoice is Approved and ready to issue.') },
    'invoice.issue': { l: L('TERBITKAN INVOICE', 'ISSUE INVOICE'), s: 'AR-003', perm: 'ar.issue', hlp: 'HLP-073',
      p: L('Menerbitkan invoice ke klien.', 'Issues the invoice to the client.'), c: [L('Invoice Disetujui.', 'The invoice is Approved.'), L('Periode akuntansi terbuka.', 'The accounting period is open.')], a: L('Jurnal piutang & PPN diposting, jatuh tempo dihitung, klien melihat invoice di portal.', 'AR & VAT journal posted, due date set, the client sees the invoice in the portal.') },
    'payment.record': { l: L('CATAT PEMBAYARAN', 'RECORD PAYMENT'), s: 'AR-003', perm: 'ar.pay', hlp: 'HLP-074',
      p: L('Mencatat pembayaran klien.', 'Records a client payment.'), c: [L('Invoice Terbit, Sebagian atau Jatuh Tempo.', 'The invoice is Issued, Partial or Overdue.'), L('Jumlah tidak melebihi sisa tagihan.', 'The amount does not exceed the open balance.')], a: L('Jurnal kas/bank otomatis; status invoice menjadi Sebagian atau Lunas.', 'Automatic cash/bank journal; the invoice becomes Partial or Paid.') },
    'cash.approve': { l: L('SETUJUI', 'APPROVE'), s: 'CASH-003', perm: 'cash.approve', hlp: 'HLP-076',
      p: L('Menyetujui transaksi kas besar.', 'Approves a large cash transaction.'), c: [L('Transaksi Menunggu Persetujuan.', 'The transaction is Pending Approval.'), L('Penyetuju bukan pembuat.', 'The approver is not the maker.')], a: L('Transaksi diposting ke jurnal.', 'The transaction is posted to the journal.') },
    'pickup.send': { l: L('KIRIM PERMINTAAN', 'SEND REQUEST'), s: 'CLP-003', perm: 'clp.pickup.create', hlp: 'HLP-100',
      p: L('Mengirim permintaan pickup ke J\'Fresh.', 'Sends the pickup request to J\'Fresh.'), c: [L('Property dalam akses Anda dan akun klien tidak ditahan.', 'The property is in your access and the client account is not on hold.'), L('Tanggal tidak lewat, jendela waktu valid, 1–99 bag.', 'Date not in the past, valid window, 1–99 bags.')], a: L('Order pickup dibuat dan terjadwal; Anda bisa melacak di Tracking.', 'A pickup order is created and scheduled; you can track it in Tracking.') },
    'ada.masalah': { l: L('ADA MASALAH', 'ADA MASALAH (REPORT ISSUE)'), s: 'PROD-ISSUE-002', perm: 'prod.issue', hlp: 'HLP-036',
      p: L('Melaporkan masalah saat itu juga.', 'Reports a problem right away.'), c: [L('Pilih jenis masalah; foto bila diminta.', 'Pick the problem type; a photo when asked.')], a: L('Supervisor menerima notifikasi dan memutuskan tindakan.', 'The supervisor is notified and decides the action.') },
    'start.production': { l: L('START PRODUCTION', 'START PRODUCTION'), s: 'CUT-007', roles: ['owner'], p12: true,
      p: L('Memulai produksi nyata di JFRESH OS.', 'Starts real production on JFRESH OS.'), c: [L('Hanya Owner, hanya di desktop.', 'Owner only, desktop only.'), L('Semua syarat wajib go-live terpenuhi dan keputusan Go/No-Go = GO atau CONDITIONAL GO.', 'Every hard go-live requirement is met and the Go/No-Go decision = GO or CONDITIONAL GO.'), L('Snapshot dibuat dan data dummy dibersihkan.', 'A snapshot exists and dummy data is cleaned.')], a: L('Tanggal mulai produksi dikunci permanen (tidak bisa diubah); data test/dummy dikeluarkan dari laporan.', 'The production start date is locked permanently (cannot change); test/dummy data is excluded from reporting.') },
    'golive.decide': { l: L('KEPUTUSAN GO / NO-GO', 'GO / NO-GO DECISION'), s: 'LIVE-004', roles: ['owner'], p12: true,
      p: L('Keputusan manusia untuk go-live.', 'The human go-live decision.'), c: [L('Hanya Owner.', 'Owner only.'), L('GO ditolak selama ada hard gate yang gagal.', 'GO is refused while a hard gate fails.')], a: L('Keputusan dan alasannya tercatat di audit (GOLIVE_APPROVED).', 'The decision and reason are audited (GOLIVE_APPROVED).') }
  };

  /* ---------- APA INI? glossary (§57) ---------- */
  D.GLOSSARY = {
    hpp: { t: L('HPP', 'HPP (Cost of Service)'), d: L('Harga Pokok Produksi per kg: bahan, tenaga, mesin/energi dan overhead. Dasar margin dan harga.', 'Cost of service per kg: supplies, labour, machine/energy and overhead. The basis of margin and price.'), s: 'HPP-001', al: ['harga pokok', 'cost'] },
    pod: { t: L('POD', 'POD'), d: L('Proof of Delivery: bukti klien menerima — penerima, tanda tangan, foto, jumlah paket, kondisi.', 'Proof of Delivery: receiver, signature, photo, package count, condition.'), s: 'DLV-POD-002', al: ['bukti pengiriman', 'proof of delivery'] },
    sla: { t: L('SLA', 'SLA'), d: L('Service Level Agreement: janji waktu layanan di kontrak; merah = berisiko terlambat.', 'Service Level Agreement: the contract\'s service time promise; red = at risk of being late.'), s: 'SLA-001', al: ['service level'] },
    billingready: { t: L('Billing Ready', 'Billing Ready'), d: L('Layanan selesai (POD + Service Completed) yang siap ditagih dengan kuantitas POD dan tarif kontrak.', 'A completed service (POD + Service Completed) ready to invoice with the POD quantity and contract rate.'), s: 'AR-001', al: ['billing ready', 'siap tagih'] },
    rewash: { t: L('Rewash', 'Rewash'), d: L('Proses ulang barang yang gagal QC (cuci, kering atau finishing ulang); akar masalah dicatat.', 'Reprocessing of items that failed QC (wash, dry or finishing again); the root cause is recorded.'), s: 'PROD-REWASH-001', al: ['cuci ulang', 'proses ulang'] },
    batch: { t: L('Batch', 'Batch'), d: L('Kelompok cucian satu kategori yang diproses bersama di satu mesin, dari receiving sampai serah ke logistics.', 'A group of laundry of one category processed together on one machine, from receiving to handover to logistics.'), s: 'PROD-TRACE-001', al: [] },
    handover: { t: L('Handover', 'Handover'), d: L('Serah terima antar tim (Team 1 → 2 → 3 → Logistics) dengan jumlah tercatat; selisih ditinjau.', 'A handover between teams (Team 1 → 2 → 3 → Logistics) with recorded counts; differences are reviewed.'), s: 'PROD-BATCH-001', al: ['serah terima'] },
    qc: { t: L('QC', 'QC'), d: L('Quality Control: pemeriksaan kebersihan, noda, kerusakan dan jumlah sebelum packing.', 'Quality Control: checking cleanliness, stains, damage and count before packing.'), s: 'PROD-QC-001', al: ['quality control', 'cek kualitas'] },
    manifest: { t: L('Manifest', 'Manifest'), d: L('Daftar bag yang diambil driver dari klien; dicocokkan saat receiving.', 'The list of bags the driver picked up; matched at receiving.'), s: 'MANIFEST-001', al: [] },
    receiving: { t: L('Receiving', 'Receiving'), d: L('Penerimaan cucian di plant: cek bag, kondisi, berat aktual.', 'Taking laundry over at the plant: bags, condition, actual weight.'), s: 'PROD-RCV-001', al: ['terima cucian'] },
    selisih: { t: L('Selisih', 'Difference'), d: L('Perbedaan antara yang tercatat dan yang aktual (bag, berat, kategori); harus diputuskan supervisor.', 'A gap between recorded and actual (bags, weight, category); the supervisor decides.'), s: 'PROD-DIS-001', al: ['difference', 'beda'] },
    servicecompleted: { t: L('Service Completed', 'Service Completed'), d: L('Status akhir layanan setelah POD dan rekonsiliasi: data dibekukan dan menjadi Billing Ready.', 'The final service status after POD and reconciliation: data is frozen and becomes Billing Ready.'), s: 'COMP-001', al: ['layanan selesai'] },
    ratecard: { t: L('Rate Card', 'Rate Card'), d: L('Daftar tarif per layanan per klien/property, berversi dengan tanggal efektif.', 'The price list per service per client/property, versioned with effective dates.'), s: 'RATE-001', al: ['tarif', 'harga'] },
    ar: { t: L('AR', 'AR (Accounts Receivable)'), d: L('Piutang usaha: invoice terbit yang belum dibayar klien.', 'Receivables: issued invoices not yet paid by the client.'), s: 'AR-004', al: ['piutang', 'accounts receivable'] },
    ap: { t: L('AP', 'AP (Accounts Payable)'), d: L('Utang usaha ke supplier.', 'Amounts owed to suppliers.'), s: 'AP-003', al: ['utang', 'hutang', 'accounts payable'] },
    aging: { t: L('Aging', 'Aging'), d: L('Umur piutang/utang per kelompok hari (0–30, 31–60, 61–90, >90).', 'Age of receivables/payables per day bucket (0–30, 31–60, 61–90, >90).'), s: 'AR-004', al: ['umur piutang'] },
    dso: { t: L('DSO', 'DSO'), d: L('Days Sales Outstanding: rata-rata hari sampai invoice dibayar.', 'Days Sales Outstanding: average days until invoices are paid.'), s: 'AR-004', al: [] },
    opname: { t: L('Stock Opname', 'Stock Count'), d: L('Penghitungan fisik stok dibandingkan stok sistem.', 'Physical stock count compared with system stock.'), s: 'INV-005', al: ['stock opname', 'hitung stok'] },
    pr: { t: L('Purchase Request (PR)', 'Purchase Request (PR)'), d: L('Permintaan pembelian internal sebelum RFQ dan PO.', 'An internal request to buy, before RFQ and PO.'), s: 'PUR-002', al: ['purchase request'] },
    po: { t: L('Purchase Order (PO)', 'Purchase Order (PO)'), d: L('Pesanan resmi ke supplier setelah PR disetujui.', 'The official order to a supplier after the PR is approved.'), s: 'PUR-006', al: ['purchase order'] },
    makerchecker: { t: L('Maker-checker', 'Maker-checker'), d: L('Pembuat permintaan tidak boleh menyetujui permintaannya sendiri; butuh orang kedua.', 'The maker of a request cannot approve it; a second person is needed.'), s: 'APR-INB-001', al: ['dual approval', 'persetujuan ganda'] },
    hold: { t: L('Ditahan (Hold)', 'On Hold'), d: L('Batch/delivery dihentikan sementara oleh supervisor dengan alasan; harus dilepas sebelum lanjut.', 'A batch/delivery paused by a supervisor with a reason; it must be released before continuing.'), s: 'PROD-CMD-001', al: ['hold', 'tahan'] },
    overdue: { t: L('Jatuh Tempo Lewat', 'Overdue'), d: L('Invoice terbit yang melewati tanggal jatuh tempo dan belum lunas.', 'An issued invoice past its due date and not fully paid.'), s: 'AR-004', al: ['overdue', 'telat bayar'] },
    xscore: { t: L('XScore', 'XScore'), d: L('Skor kinerja gabungan beberapa dimensi (kualitas, kecepatan, disiplin, kolaborasi).', 'A combined performance score across dimensions (quality, speed, discipline, collaboration).'), s: 'XSCORE-001', al: [] },
    express: { t: L('Express / Super Express', 'Express / Super Express'), d: L('Prioritas layanan dengan SLA lebih pendek; diproses lebih dulu.', 'Service priority with a shorter SLA; processed first.'), s: 'SERVICE-001', al: ['urgent', 'prioritas'] },
    hypercare: { t: L('Hypercare', 'Hypercare'), d: L('Masa pendampingan intensif setelah go-live (hari 1, 3, 7, 14, 30).', 'The intensive support period after go-live (day 1, 3, 7, 14, 30).'), s: 'HELP-001', al: [] },
    golive: { t: L('Go-Live', 'Go-Live'), d: L('Mulai memakai JFRESH OS untuk operasi nyata setelah keputusan Go/No-Go.', 'Starting to use JFRESH OS for real operations after the Go/No-Go decision.'), s: 'HELP-001', al: ['go live', 'produksi nyata'] },
    smarthelp: { t: L('Smart Help', 'Smart Help'), d: L('Bantuan di dalam aplikasi: kontekstual, pencarian, APA INI?, Tanya JFRESH, PANDU SAYA, training.', 'In-app help: contextual, search, WHAT IS THIS?, Ask JFRESH, GUIDE ME, training.'), s: 'HELP-001', al: ['bantuan'] },
    pandusaya: { t: L('PANDU SAYA', 'GUIDE ME'), d: L('Walkthrough interaktif yang menyorot elemen berikutnya di layar asli.', 'An interactive walkthrough that highlights the next element on the real screen.'), s: 'HELP-003', al: ['walkthrough', 'guide me'] }
  };

  /* ---------- Product tour (§54): app shell selectors (app/app.js) ---------- */
  D.TOUR = [
    { k: 'nav', sel: '.sb-nav', m: '.bn', t: L('Menu utama', 'Main menu'), b: L('Semua layar untuk peran Anda ada di sini. Menu hanya menampilkan yang boleh Anda buka.', 'Every screen for your role is here. The menu only shows what you may open.') },
    { k: 'home', sel: '#view', t: L('Beranda Anda', 'Your home'), b: null },
    { k: 'top', sel: '#hd', t: L('Header', 'Header'), b: L('Judul layar, tombol kembali dan aksi cepat.', 'Screen title, back button and quick actions.') },
    { k: 'bell', sel: '.hd-bell', t: L('Notifikasi', 'Notifications'), b: L('Lonceng menampilkan notifikasi untuk peran Anda; merah = kritis.', 'The bell shows notifications for your role; red = critical.') },
    { k: 'plant', sel: '#hd-plant', opt: true, t: L('Ganti plant', 'Switch plant'), b: L('Pilih plant aktif; semua data ikut plant ini.', 'Choose the active plant; all data follows it.') },
    { k: 'help', sel: '.sb-foot a[href*="HELP-001"]', m: '.bn', t: L('? Bantuan', '? Help'), b: L('Cari bantuan, Tanya JFRESH, APA INI? dan PANDU SAYA kapan saja.', 'Search help, Ask JFRESH, WHAT IS THIS? and GUIDE ME at any time.') },
    { k: 'me', sel: '#hd-me', t: L('Profil', 'Profile'), b: L('Ganti password, peran, bahasa, atau keluar.', 'Change password, role, language, or sign out.') }
  ];
  D.TOUR_HOME = {
    operator: L('Tugas Anda hari ini: terima, cek QC, packing. Tombol besar = langkah berikutnya.', 'Your tasks today: receive, QC, pack. Big button = next step.'),
    driver: L('Rute hari ini, stop berikutnya, dan tombol MULAI PERJALANAN.', 'Today\'s route, the next stop, and the START TRIP button.'),
    prod1: L('Antrian receiving, timbang, sorting dan batch Team 1.', 'Team 1 receiving, weighing, sorting and batch queues.'),
    prod2: L('Antrian washing dan drying Team 2 serta status mesin.', 'Team 2 washing and drying queues and machine status.'),
    prod3: L('Antrian finishing, QC, packing dan siap kirim Team 3.', 'Team 3 finishing, QC, packing and ready-to-deliver queues.'),
    supervisor: L('Papan operasional: batch, SLA berisiko, masalah dan persetujuan.', 'The operations board: batches, SLA at risk, issues and approvals.'),
    opsmgr: L('Dashboard operasional, kapasitas, KPI dan persetujuan.', 'Operations dashboard, capacity, KPIs and approvals.'),
    finance: L('Dashboard finance: Billing Ready, piutang, kas dan persetujuan.', 'The finance dashboard: Billing Ready, receivables, cash and approvals.'),
    owner: L('Kesehatan bisnis, keputusan dan persetujuan yang menunggu Anda.', 'Business health, decisions and approvals waiting for you.'),
    client: L('Pickup hari ini, pengiriman di jalan, tagihan dan masalah terbuka.', 'Today\'s pickups, deliveries on the way, invoices and open issues.'),
    trainer: L('Tutorial Manager: konten bantuan, jalur training dan analitik bantuan.', 'Tutorial Manager: help content, training paths and help analytics.'),
    '*': L('Ringkasan pekerjaan untuk peran Anda.', 'A summary of the work for your role.')
  };

  /* ---------- PANDU SAYA walkthroughs (§55): selectors on the real screens ---------- */
  D.WALKS = [
    { id: 'WLK-01', s: 'CLP-003', perm: 'clp.pickup.create', hlp: 'HLP-100', t: L('Minta Pickup', 'Request a Pickup'), steps: [
      ['#cp11-pk [name="prop"]', L('Pilih property', 'Select property'), L('Pilih lokasi yang akan dijemput.', 'Choose the location to collect from.')],
      ['#cp11-pk [name="svc"]', L('Pilih layanan', 'Select service'), L('Pilih layanan sesuai kontrak.', 'Choose a service from your contract.')],
      ['#cp11-pk [name="bags"]', L('Isi jumlah', 'Enter quantity'), L('Isi perkiraan jumlah bag (1–99).', 'Enter the estimated bag count (1–99).')],
      ['#cp11-pk [data-act="pkNext"]', L('Lanjut ke jadwal', 'Continue to schedule'), L('Tekan untuk memilih tanggal.', 'Press to choose the date.')],
      ['#cp11-pk [data-act="pkSend"]', L('Kirim', 'Submit'), L('Pilih tanggal & jendela waktu, Lanjut ke Konfirmasi, periksa ringkasan lalu KIRIM PERMINTAAN.', 'Pick the date & time window, Continue to Confirmation, check the summary then SEND REQUEST.')]] },
    { id: 'WLK-02', s: 'PROD-RCV-002', perm: 'prod.t1', hlp: 'HLP-011', t: L('Receiving Team 1', 'Team 1 Receiving'), steps: [
      ['[data-act="start"]', L('Mulai receiving', 'Start receiving'), L('Tekan MULAI RECEIVING.', 'Press START RECEIVING.')],
      ['[name="bags"]', L('Hitung bag', 'Count bags'), L('Isi jumlah bag aktual.', 'Enter the actual bag count.')],
      ['[name="cond"]', L('Kondisi', 'Condition'), L('Pilih kondisi cucian.', 'Choose the laundry condition.')],
      ['[data-act="verify"]', L('Cocokkan', 'Verify'), L('SESUAI bila cocok dengan manifest.', 'MATCHES if it fits the manifest.')],
      ['[data-act="accept"]', L('Terima', 'Accept'), L('Tekan TERIMA CUCIAN.', 'Press ACCEPT LAUNDRY.')]] },
    { id: 'WLK-03', s: 'PROD-WGT-001', perm: 'prod.t1', hlp: 'HLP-013', t: L('Timbang', 'Weigh'), steps: [
      ['[data-act="read"]', L('Baca timbangan', 'Read the scale'), L('Tekan BACA TIMBANGAN.', 'Press READ SCALE.')],
      ['[data-act="save"]', L('Simpan', 'Save'), L('Periksa berat bersih lalu SIMPAN TIMBANGAN.', 'Check the net weight then SAVE WEIGHT.')]] },
    { id: 'WLK-04', s: 'PROD-PACK-002', perm: 'prod.t3', hlp: 'HLP-033', t: L('Packing', 'Packing'), steps: [
      ['[name="pkgs"]', L('Jumlah paket', 'Package count'), L('Isi jumlah paket.', 'Enter the package count.')],
      ['[name="label"]', L('Label', 'Label'), L('Pilih jenis label.', 'Choose the label type.')],
      ['[data-act="pack"]', L('Packing selesai', 'Packing done'), L('Tekan PACKING SELESAI.', 'Press PACKING DONE.')],
      ['[data-act="ready"]', L('Siap dikirim', 'Ready to deliver'), L('Setelah rekonsiliasi sesuai, tekan SIAP DIKIRIM.', 'When the reconciliation matches, press READY TO DELIVER.')]] },
    { id: 'WLK-05', s: 'PROD-QC-002', perm: 'prod.t3', hlp: 'HLP-031', t: L('Keputusan QC', 'QC Decision'), steps: [
      ['[name="checks"]', L('Pemeriksaan', 'Checks'), L('Centang pemeriksaan yang sudah dilakukan.', 'Tick the checks you did.')],
      ['[data-act="pass"]', L('Lulus', 'Pass'), L('Semua baik? Tekan LULUS.', 'All good? Press PASS.')]] },
    { id: 'WLK-06', s: 'AR-001', perm: 'ar.build', hlp: 'HLP-070', t: L('Buat Invoice', 'Create an Invoice'), steps: [
      ['.ac10-sel', L('Pilih transaksi', 'Select transactions'), L('Centang Billing Ready satu klien.', 'Tick one client\'s Billing Ready lines.')],
      ['[data-act="build"]', L('Buat draft', 'Build draft'), L('Tekan Buat Draft Invoice.', 'Press Build Draft Invoice.')],
      ['[data-act="submit"]', L('Ajukan review', 'Submit for review'), L('Di Invoice Builder tekan Ajukan Review.', 'In the Invoice Builder press Submit for Review.'), 'AR-002']] },
    { id: 'WLK-07', s: 'DLV-POD-001', perm: 'dlv.drv', hlp: 'HLP-052', t: L('Ambil POD', 'Capture POD'), steps: [
      ['[name="acc"]', L('Jumlah diterima', 'Accepted quantity'), L('Pilih apakah semua paket diterima.', 'Choose whether all packages are accepted.')],
      ['[data-act="confirm"]', L('Konfirmasi', 'Confirm'), L('Tekan KONFIRMASI PENERIMAAN.', 'Press CONFIRM RECEIPT.')]] },
    { id: 'WLK-08', s: 'REL-002', perm: 'dlv.release', hlp: 'HLP-041', t: L('Release ke Logistics', 'Release to Logistics'), steps: [
      ['[data-act="label"]', L('Label', 'Label'), L('Konfirmasi label + QR terpasang.', 'Confirm the label + QR is attached.')],
      ['[data-act="release"]', L('Release', 'Release'), L('Tekan RELEASE KE LOGISTICS.', 'Press RELEASE TO LOGISTICS.')]] }
  ];

  /* ---------- Training paths (§61) ---------- */
  D.PATHS = [
    { id: 'TRN-ALL', n: L('Dasar JFRESH OS', 'JFRESH OS Basics'), roles: ['*'], items: ['HLP-005', 'HLP-002', 'HLP-001'], pass: 70 },
    { id: 'TRN-T1', n: L('Team 1: Receiving sampai Handover', 'Team 1: Receiving to Handover'), roles: ['prod1'], items: ['HLP-011', 'HLP-013', 'HLP-014', 'HLP-015', 'HLP-016', 'HLP-036'], pass: 80 },
    { id: 'TRN-T2', n: L('Team 2: Washing & Drying', 'Team 2: Washing & Drying'), roles: ['prod2'], items: ['HLP-020', 'HLP-021', 'HLP-022', 'HLP-016', 'HLP-036'], pass: 80 },
    { id: 'TRN-T3', n: L('Team 3: Finishing, QC & Packing', 'Team 3: Finishing, QC & Packing'), roles: ['prod3'], items: ['HLP-030', 'HLP-031', 'HLP-032', 'HLP-033', 'HLP-035', 'HLP-036'], pass: 80 },
    { id: 'TRN-OPR', n: L('Operator: Terima, QC & Packing', 'Operator: Receive, QC & Pack'), roles: ['operator'], items: ['HLP-009', 'HLP-007', 'HLP-008', 'HLP-054'], pass: 80 },
    { id: 'TRN-DRV', n: L('Driver: Pickup, Delivery & POD', 'Driver: Pickup, Delivery & POD'), roles: ['driver'], items: ['HLP-050', 'HLP-051', 'HLP-053', 'HLP-052', 'HLP-054'], pass: 80 },
    { id: 'TRN-SPV', n: L('Supervisor Operasional', 'Operations Supervisor'), roles: ['supervisor', 'opsmgr'], items: ['HLP-040', 'HLP-041', 'HLP-042', 'HLP-043', 'HLP-056', 'HLP-060', 'HLP-092'], pass: 80 },
    { id: 'TRN-MNT', n: L('Maintenance Mesin', 'Machine Maintenance'), roles: ['maint'], items: ['HLP-044', 'HLP-043', 'HLP-022'], pass: 80 },
    { id: 'TRN-FIN', n: L('Finance: Invoice sampai Close', 'Finance: Invoice to Close'), roles: ['finance'], items: ['HLP-061', 'HLP-070', 'HLP-071', 'HLP-072', 'HLP-073', 'HLP-074', 'HLP-076', 'HLP-078'], pass: 80 },
    { id: 'TRN-SAL', n: L('Sales & Account', 'Sales & Account'), roles: ['sales'], items: ['HLP-090', 'HLP-091', 'HLP-055'], pass: 80 },
    { id: 'TRN-SUP', n: L('Supply & Persediaan', 'Supply & Inventory'), roles: ['supply'], items: ['HLP-080', 'HLP-082', 'HLP-083'], pass: 80 },
    { id: 'TRN-OWN', n: L('Owner: Persetujuan & Kesehatan Bisnis', 'Owner: Approvals & Business Health'), roles: ['owner'], items: ['HLP-092', 'HLP-121', 'HLP-079', 'HLP-073'], pass: 70 },
    { id: 'TRN-SYS', n: L('Admin Sistem', 'System Admin'), roles: ['sysadmin', 'superadmin'], items: ['HLP-110', 'HLP-111', 'HLP-112'], pass: 80 },
    { id: 'TRN-HR', n: L('HR & Kinerja', 'HR & Performance'), roles: ['hr', 'raceleader'], items: ['HLP-120', 'HLP-121'], pass: 70 },
    { id: 'TRN-CLT', n: L('Portal Klien', 'Client Portal'), roles: ['client'], items: ['HLP-100', 'HLP-101', 'HLP-102', 'HLP-103', 'HLP-104'], pass: 70, optional: true },
    { id: 'TRN-P12', n: L('Tim Go-Live: Smart Help', 'Go-Live Team: Smart Help'), roles: ['trainer', 'implead', 'qalead', 'datalead'], items: ['HLP-005', 'HLP-131', 'HLP-130', 'HLP-006'], pass: 80 }
  ];
  // Key users per role (§95 gate "required key users untrained"): by username.
  D.KEY_USERS = { prod1: ['putu'], prod2: ['arta'], prod3: ['luh'], driver: ['ketut'], supervisor: ['saras'], opsmgr: ['dewi'], finance: ['budi'], supply: ['rai'], owner: ['aji'], operator: ['made'], sysadmin: ['adit'] };

  /* ---------- Seeded learning progress (§62), by username: path → [state, items done, score, last date] ---------- */
  D.PROGRESS = {
    putu: { 'TRN-ALL': ['passed', 3, 90, '2026-09-20'], 'TRN-T1': ['passed', 6, 88, '2026-10-01'] },
    arta: { 'TRN-ALL': ['passed', 3, 85, '2026-09-21'], 'TRN-T2': ['passed', 5, 84, '2026-10-02'] },
    luh: { 'TRN-ALL': ['passed', 3, 80, '2026-09-21'], 'TRN-T3': ['practiced', 6, null, '2026-10-05'] },
    ketut: { 'TRN-ALL': ['completed', 3, null, '2026-09-25'], 'TRN-DRV': ['started', 2, null, '2026-10-03'] },
    made: { 'TRN-ALL': ['passed', 3, 82, '2026-09-18'], 'TRN-OPR': ['passed', 4, 86, '2026-09-29'] },
    saras: { 'TRN-ALL': ['passed', 3, 95, '2026-09-15'], 'TRN-SPV': ['passed', 7, 91, '2026-09-30'] },
    dewi: { 'TRN-ALL': ['passed', 3, 92, '2026-09-15'], 'TRN-SPV': ['passed', 7, 89, '2026-09-30'] },
    budi: { 'TRN-ALL': ['passed', 3, 93, '2026-09-16'], 'TRN-FIN': ['passed', 8, 90, '2026-10-02'] },
    gita: { 'TRN-ALL': ['completed', 3, null, '2026-09-28'], 'TRN-FIN': ['started', 3, null, '2026-10-04'] },
    ayu: { 'TRN-ALL': ['passed', 3, 88, '2026-09-17'], 'TRN-SAL': ['completed', 3, null, '2026-10-01'] },
    aji: { 'TRN-ALL': ['passed', 3, 96, '2026-09-12'], 'TRN-OWN': ['passed', 4, 94, '2026-09-26'] },
    oka: { 'TRN-ALL': ['passed', 3, 81, '2026-09-22'], 'TRN-MNT': ['practiced', 3, null, '2026-10-04'] },
    rai: { 'TRN-ALL': ['passed', 3, 87, '2026-09-19'], 'TRN-SUP': ['passed', 3, 85, '2026-09-30'] },
    komang: { 'TRN-ALL': ['started', 1, null, '2026-10-02'] },
    wulan: { 'TRN-ALL': ['passed', 3, 90, '2026-09-18'], 'TRN-HR': ['completed', 2, null, '2026-10-01'] },
    nengah: { 'TRN-ALL': ['completed', 3, null, '2026-09-24'] },
    adit: { 'TRN-ALL': ['passed', 3, 97, '2026-09-10'], 'TRN-SYS': ['passed', 3, 95, '2026-09-25'] },
    rama: { 'TRN-ALL': ['passed', 3, 98, '2026-09-10'], 'TRN-SYS': ['passed', 3, 96, '2026-09-25'] },
    ratih: { 'TRN-ALL': ['passed', 3, 100, '2026-09-05'], 'TRN-P12': ['passed', 4, 98, '2026-09-12'] },
    bayu: { 'TRN-ALL': ['passed', 3, 92, '2026-09-08'], 'TRN-P12': ['completed', 4, null, '2026-09-30'] },
    intan: { 'TRN-ALL': ['passed', 3, 94, '2026-09-08'], 'TRN-P12': ['practiced', 4, null, '2026-10-01'] },
    dodi: { 'TRN-ALL': ['passed', 3, 89, '2026-09-09'], 'TRN-P12': ['started', 2, null, '2026-10-02'] },
    'sari.grandvista': { 'TRN-CLT': ['completed', 5, null, '2026-09-27'] },
    'arya.jaens': { 'TRN-CLT': ['passed', 5, 90, '2026-09-29'] },
    'mila.jaens': { 'TRN-CLT': ['started', 1, null, '2026-10-05'] }
  };

  /* ---------- Seeded analytics history (last 30 days) ---------- */
  // [term, searches, distinct users, last date]
  D.SEARCHES = [
    ['cara buat batch', 128, 9, '2026-10-06'], ['cara buat invoice', 74, 4, '2026-10-06'], ['timbang', 61, 7, '2026-10-05'], ['kenapa packing tidak bisa', 47, 5, '2026-10-06'],
    ['release ke logistics', 39, 3, '2026-10-05'], ['lupa password', 35, 14, '2026-10-06'], ['cara minta pickup', 33, 6, '2026-10-04'], ['pod', 29, 5, '2026-10-05'],
    ['koreksi invoice', 22, 3, '2026-10-03'], ['selisih bag', 21, 4, '2026-10-05'], ['rewash', 18, 4, '2026-10-04'], ['stock opname', 12, 2, '2026-10-01'],
    ['approve kas', 11, 2, '2026-10-02'], ['hpp', 10, 3, '2026-09-30'], ['slip gaji', 9, 6, '2026-10-05'], ['cuti karyawan', 7, 5, '2026-10-04'], ['reimburse bensin', 5, 2, '2026-10-02']
  ];
  // [help id, opens]
  D.OPENS = [['HLP-015', 142], ['HLP-070', 96], ['HLP-013', 88], ['HLP-034', 71], ['HLP-011', 66], ['HLP-100', 54], ['HLP-052', 49], ['HLP-031', 47], ['HLP-001', 40], ['HLP-041', 38], ['HLP-071', 33], ['HLP-072', 21], ['HLP-012', 19]];
  // [walkthrough, started, completed]
  D.WALK_USE = [['WLK-02', 64, 51], ['WLK-01', 41, 37], ['WLK-04', 38, 26], ['WLK-03', 30, 27], ['WLK-06', 22, 15], ['WLK-05', 19, 17], ['WLK-07', 17, 12], ['WLK-08', 9, 8]];
  // [help id, helpful yes, helpful no]
  D.FEEDBACK = [['HLP-015', 61, 34], ['HLP-070', 48, 9], ['HLP-013', 52, 6], ['HLP-034', 30, 14], ['HLP-011', 44, 4], ['HLP-100', 40, 3], ['HLP-052', 29, 8], ['HLP-031', 33, 2]];
  // Frequently failed tasks (walkthrough abandon / repeated errors), used when JFGO usability results are not available.
  D.FAILED = [
    ['WLK-04', L('Packing batch dengan QC sebagian', 'Packing a partially passed QC batch'), 'PROD-PACK-002', 38, 12],
    ['WLK-06', L('Buat invoice multi-property', 'Build a multi-property invoice'), 'AR-001', 22, 7],
    ['WLK-07', L('POD dengan penolakan sebagian', 'POD with a partial refusal'), 'DLV-POD-001', 17, 5],
    ['WLK-02', L('Receiving dengan selisih bag', 'Receiving with a bag difference'), 'PROD-RCV-002', 64, 13]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.JFHELP_DATA = D;
})(typeof window !== 'undefined' ? window : this);

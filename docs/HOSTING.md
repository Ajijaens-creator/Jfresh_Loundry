# Hosting JFRESH OS: beta dan live

| Alamat | Untuk | Hosting | Sumber kode | Data |
|---|---|---|---|---|
| https://jfreshlaundry.app | Live (dipakai sungguhan) | GitHub Pages | branch `main` | Sementara masih demo untuk pengunjung biasa. Mode asli (akun Supabase) bisa diuji dengan `?mode=asli`. Mode asli jadi default hanya setelah owner setuju (`LIVE_CLOUD` di `assets/js/jfos-site.js`). |
| https://beta.jfreshlaundry.app | Beta testing | Vercel, project `jfresh-os-beta` (team Jaens Enterprises Pro) | branch `main` sekarang, `beta` nanti | Selalu data demo + ganti user. Pita "BETA" di pojok kiri bawah. Tidak diindeks Google (`vercel.json`). |
| `*.vercel.app` | Preview otomatis tiap branch / PR | Vercel | branch kerja | Data demo, pita "PREVIEW". |

## Alur branch

Sekarang (sebelum live dipakai sungguhan):

    branch kerja (claude/...)  ->  PR  ->  main  ->  jfreshlaundry.app + beta.jfreshlaundry.app

Branch `dev` terpisah tidak diperlukan: setiap branch kerja otomatis dapat link preview Vercel.

Setelah live dipakai sungguhan (data asli di Supabase), tambahkan branch `beta`:

    branch kerja  ->  PR ke beta  ->  diuji di beta.jfreshlaundry.app  ->  PR beta ke main  ->  live

Lalu ganti domain beta di Vercel agar mengikuti branch `beta`.

## Mode demo dan mode asli

| Mode | Akun | Data |
|---|---|---|
| demo | akun demo, password `jfresh123` | data contoh di browser |
| asli | akun asli Supabase (email + password) | akun, karyawan, peran dan plant di Supabase; data operasional menyusul (tahap 3) |

- Buka mode asli: `https://jfreshlaundry.app/app/login.html?mode=asli`. Kembali ke demo: `?mode=demo`. Pilihan disimpan di browser itu.
- beta.jfreshlaundry.app selalu demo, `?mode=asli` diabaikan.
- Pita biru "UJI MODE ASLI" muncul selama mode asli belum jadi default di live.
- Menu baru di mode asli: **Tim & Akses › Data Karyawan** (HR daftarkan karyawan baru) dan **Tim & Akses › Akun & Akses** (admin buat akun, centang peran per orang, atur plant, reset password, nonaktifkan).

## Data tiap alamat terpisah

Data demo disimpan di browser (localStorage) per alamat, jadi data di beta tidak tercampur dengan data di live.

## DNS di Hostinger

| Type | Name | Points to | TTL |
|---|---|---|---|
| CNAME | beta | cname.vercel-dns.com | 3600 |

Record A untuk `@` (GitHub Pages) dan CNAME `www` jangan diubah.

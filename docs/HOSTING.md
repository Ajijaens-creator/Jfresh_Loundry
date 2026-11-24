# Hosting JFRESH OS: beta dan live

| Alamat | Untuk | Hosting | Sumber kode | Data |
|---|---|---|---|---|
| https://jfreshlaundry.app | Live (nanti dipakai sungguhan) | GitHub Pages | branch `main` | Sementara masih demo. Demo dimatikan hanya setelah owner setuju (`LIVE_DEMO` di `assets/js/jfos-site.js`). |
| https://beta.jfreshlaundry.app | Beta testing | Vercel, project `jfresh-os-beta` (team Jaens Enterprises Pro) | branch `main` sekarang, `beta` nanti | Selalu data demo + ganti user. Pita "BETA" di pojok kiri bawah. Tidak diindeks Google (`vercel.json`). |
| `*.vercel.app` | Preview otomatis tiap branch / PR | Vercel | branch kerja | Data demo, pita "PREVIEW". |

## Alur branch

Sekarang (sebelum live dipakai sungguhan):

    branch kerja (claude/...)  ->  PR  ->  main  ->  jfreshlaundry.app + beta.jfreshlaundry.app

Branch `dev` terpisah tidak diperlukan: setiap branch kerja otomatis dapat link preview Vercel.

Setelah live dipakai sungguhan (data asli di Supabase), tambahkan branch `beta`:

    branch kerja  ->  PR ke beta  ->  diuji di beta.jfreshlaundry.app  ->  PR beta ke main  ->  live

Lalu ganti domain beta di Vercel agar mengikuti branch `beta`.

## Data tiap alamat terpisah

Data demo disimpan di browser (localStorage) per alamat, jadi data di beta tidak tercampur dengan data di live.

## DNS di Hostinger

| Type | Name | Points to | TTL |
|---|---|---|---|
| CNAME | beta | cname.vercel-dns.com | 3600 |

Record A untuk `@` (GitHub Pages) dan CNAME `www` jangan diubah.

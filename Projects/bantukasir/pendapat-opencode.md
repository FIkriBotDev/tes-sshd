# Pendapat OpenCode — Review Project **BantuKasir**

> **Lokasi:** `/home/runner/work/tes-sshd/tes-sshd/Projects/bantukasir`
> **Tanggal review:** 14 November 2026
> **Ukuran:** ±16.500 baris (server 1.639, frontend ±10.000, offline/PWA ±1.800, data JSON ±5.400)
> **Stack:** Node.js + Express 5, `bcrypt`+`dotenv`, frontend HTML/CSS/JS murni (tanpa framework), PWA (Service Worker + IndexedDB), "database" berupa file JSON.

---

## 0. Ringkasan Eksekutif

BantuKasir adalah aplikasi kasir + pembukuan sederhana untuk pedagang UMKM Indonesia. **Idenya kuat dan sangat relevan**: fokus pada "untung hari ini", bukan istilah akuntansi. Fitur yang sudah ada juga ambisius untuk proyek tanpa framework — POS, varian produk, kasbon, laporan, struk/WhatsApp, AI insight, voice-to-order, dan order mandiri pelanggan via QR.

Namun saat ini project berada di tahap **prototipe yang sudah kaya fitur, tetapi belum siap produksi**. Tiga hal paling serius:

1. **Tidak ada autentikasi/otorisasi di API.** Siapa pun yang tahu `user_id` bisa membaca & menulis seluruh data toko orang lain (termasuk data pelanggan dan kasbon).
2. **Rahasia dan data pribadi ikut ter-commit** — `.env` berisi API key asli, `database_user.json` berisi nama/email/hash password/QRIS, dan semuanya ada juga di dalam `bantukasir.zip`.
3. **Logika bisnis bisa dimanipulasi** — harga pesanan online dihitung dari data yang dikirim pelanggan, dan endpoint menu publik membocorkan **harga modal** produk.

Selain itu ada bug fungsional nyata (stok tidak kembali saat void di server, service worker gagal install, perhitungan "hari ini" beda zona waktu) dan tumpukan technical debt (duplikasi file, file `.bak`, tidak ada test/README/`start` script).

**Skor kasar:**

| Aspek | Nilai | Catatan |
|---|---|---|
| Ide & relevansi produk | 9/10 | Masalah nyata, positioning jelas |
| Kelengkapan fitur | 8/10 | Banyak fitur "wow" untuk kelas UMKM |
| UI/UX | 7/10 | Rapi & mobile-first, tapi padat dan ada celah aksesibilitas |
| Kualitas kode | 4/10 | Monolitik, duplikasi besar, tanpa test/lint |
| Keamanan | 2/10 | Tanpa auth token, secret ter-commit, XSS/price tampering |
| Arsitektur & skalabilitas | 3/10 | File JSON + `readFileSync/writeFileSync` per request |
| Kesiapan produksi | 3/10 | Perlu perbaikan besar sebelum dipakai publik |

---

## 1. Yang Sudah Bagus (jangan dihilangkan)

- **Positioning produk tajam**: "Tahu untung hari ini, sebelum warung tutup" — bahasa yang benar-benar dipakai pedagang, bukan bahasa akuntan.
- **Alur kasir singkat**: ketuk produk → keranjang → bayar → kembalian otomatis. Ada varian, stok, diskon, PPN.
- **Struk & berbagi**: preview struk, cetak/PDF, kirim WhatsApp, salin teks. Sangat berguna di lapangan.
- **Kasbon**: pencatatan utang pelanggan + cicilan + status lunas, plus badge notifikasi di nav.
- **AI Insight** dengan **fallback berbasis aturan** saat API AI gagal (server.js:934–998). Ini pola yang bagus — jangan dihapus saat refactor.
- **Idempotency transaksi** (server.js:273–285) untuk mencegah duplikasi saat sync offline.
- **Offline-first**: antrean IndexedDB + optimistic stock + auto-sync + health check. Arahnya sudah benar.
- **Aksesibilitas dasar** sudah dipikirkan: `aria-label`, `aria-modal`, `role="status"`, `prefers-reduced-motion`, safe-area inset, target sentuh besar.
- **PWA**: manifest lengkap, ikon maskable, install prompt.
- **Desain visual konsisten** (palet hijau/krem, tipografi, spacing token) dan responsif hingga desktop.

---

## 2. Masalah Kritis (P0 — perbaiki sebelum online)

### 2.1 API tanpa autentikasi & otorisasi
Seluruh endpoint hanya menerima `user_id` dari query/body, tanpa token/sesi:

```js
// server.js:237
app.get("/api/produk", (req, res) => {
  const { user_id } = req.query;      // ← siapa pun bisa kirim user_id apa saja
  ...
});
```

Dampak:
- Ganti `user_id` → baca/tulis produk, transaksi, kasbon, pengaturan toko orang lain.
- `PUT /api/user/pengaturan` bisa mengganti nama usaha, QRIS, PPN, diskon toko lain.
- `user_id` dibuat dari `user_${Date.now()}` (server.js:144) sehingga **mudah ditebak** (berurutan berdasarkan waktu).
- `getUserEntry()` (server.js:54–69) membuat entri baru untuk `user_id` sembarang → siapa pun bisa **membengkakkan database** dengan ribuan entri kosong.

**Rekomendasi:** terbitkan token sesi (JWT atau session cookie `HttpOnly; Secure; SameSite=Lax`) saat login, simpan `userId` **di server**, dan jangan pernah menerimanya dari client. Tambahkan middleware `requireAuth` + rate limit.

### 2.2 Secret & data pribadi ikut ter-commit
- `.env` berisi `UNSPLASH_ACCESS_KEY` dan `POLLINATIONS_API_KEY` asli.
- `database_user.json` (±105 KB) berisi nama, email, **hash password bcrypt**, dan **gambar QRIS** pengguna.
- `bantukasir.zip` membungkus `.env`, seluruh database, bahkan file `.bak`.
- Tidak ada `.gitignore`.

**Rekomendasi (lakukan segera):** rotasi/revoke kedua API key, hapus `.env` & `database/` dari repo dan zip, tambahkan `.gitignore`, jalankan `git filter-repo`/BFG jika sudah pernah di-push, dan sediakan `.env.example`.

### 2.3 Harga pesanan online ditentukan client
```js
// server.js:1313
const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
```
Pelanggan mengirim `price` sendiri lewat `POST /api/orders`. Cukup buka DevTools → set harga jadi `0` → pesanan tercatat murah. Stok/keberadaan produk juga tidak divalidasi.

**Rekomendasi:** server harus mengambil harga dari `database_produk.json` berdasarkan `item.id`/varian, validasi stok, dan abaikan `price` dari client. Simpan `price` hasil hitungan server.

### 2.4 `/api/menu` membocorkan harga modal
```js
// server.js:1262–1278
const produkAktif = (entry.produk || []).filter(...);
res.json({ success: true, toko: {...}, produk: produkAktif });
```
Objek produk berisi field `c` (modal). Endpoint ini **publik** (dipakai `order.html`). Artinya margin keuntungan toko bisa dibaca siapa pun.

**Rekomendasi:** buat DTO publik yang hanya berisi `id, n, k, f, p, s, v[{n,p,s}]` — jangan pernah kirim `c`.

### 2.5 Stored XSS di dashboard
- `openSheet()` menulis HTML mentah ke `innerHTML` (dashboard.html:1225).
- Sebagian nilai tidak di-escape, mis. `<img src="${tempFoto}">` (dashboard.html:2021, 2023) dan `${S.qris}`.
- `esc()` hanya meng-escape `& < > "`, **tidak** `'` (dashboard.html:664) — berisiko bila nanti ada atribut berkutip tunggal.

Karena `POST /api/produk` tanpa auth menerima array produk arbitrer, penyerang bisa menyisipkan `f: "x\" onerror=alert(1)"` lalu menunggu kasir membuka halaman. Kombinasi 2.1 + 2.5 = XSS tersimpan lintas pengguna.

**Rekomendasi:** escape semua interpolasi (termasuk `'`), hindari `innerHTML` untuk data dinamis (pakai `textContent`/DOM API), atau pakai sanitizer + CSP ketat.

### 2.6 Service Worker gagal install
`sw.js:15` mencache `/laporan.html`, tetapi file itu **tidak ada** di `public_html/`. `cache.addAll()` bersifat all-or-nothing dan **reject** jika ada respons non-2xx → event `install` gagal → **seluruh fitur offline/PWA tidak aktif**.

**Rekomendasi:** hapus entri yang tidak ada, atau ganti dengan `Promise.allSettled` per-URL agar satu 404 tidak mematikan seluruh cache.

### 2.7 "Database" file JSON ditulis sinkron per request
`bacaDatabase`/`simpanDatabase` memakai `fs.readFileSync`/`fs.writeFileSync` (server.js:30–51) pada setiap request. Dampak:
- **Blocking event loop** → server melambat saat data membesar.
- **Lost update / race condition**: dua transaksi bersamaan membaca data lama lalu saling menimpa.
- Tidak ada transaksi/atomic write → file bisa korup jika proses mati saat menulis.
- `database_riwayat_transaksi.json` tumbuh tanpa batas dan selalu dibaca penuh.

**Rekomendasi:** migrasi ke SQLite (paling pas untuk skala UMKM) atau PostgreSQL + ORM. Sementara itu, minimal gunakan write atomic (`tulis ke .tmp` lalu `rename`) dan antrean per-file.

---

## 3. Bug Fungsional yang Ditemukan

| # | Bug | Bukti | Dampak |
|---|---|---|---|
| 1 | **Void tidak mengembalikan stok di server** — UI menjanjikan "Stok barang akan dikembalikan otomatis", tetapi `PUT /api/transaksi/:id/void` hanya set `trx.void = true`. Pengembalian stok hanya dilakukan client (dashboard.html:2444) lewat `saveProduk()` yang menimpa **seluruh** daftar produk. | server.js:340–350; dashboard.html:2441–2447 | Stok tidak konsisten antar perangkat; rawan kehilangan perubahan produk lain. |
| 2 | **Beda zona waktu "hari ini"** — transaksi manual memakai `dayOf()` lokal, sedangkan transaksi dari order & insight memakai `Math.floor(ts/864e5)` (UTC). | dashboard.html:670 vs server.js:689, 1483 | Di WIB (UTC+7), transaksi 00:00–07:00 dihitung ke hari sebelumnya → laporan & insight salah. |
| 3 | **Visitor counter tidak pernah jalan** — `express.static` (server.js:82) sudah melayani `/` dengan `index.html` dan mengakhiri respons, sehingga `app.get("/")` di server.js:85 tidak pernah tercapai. `visitor-count.txt` tetap `0`. | server.js:82–95 | Fitur statistik mati (dead code). |
| 4 | **`/api/laporan` tidak dipakai frontend** — laporan dihitung ulang di client; endpoint dan `database_laporan.json` jadi dead code yang membingungkan. | server.js:354–375; dashboard.html | Data ganda, sumber kebenaran tidak jelas. |
| 5 | **Nomor pesanan acak 1–999** tanpa pengecekan unik. | server.js:1318 | Tabrakan nomor pesanan. |
| 6 | **Pengeluaran di-hardcode** `EXP = 15000` per periode. | dashboard.html:668, 1585, 1882 | "Untung" tidak mencerminkan pengeluaran nyata (listrik, sewa, gaji, bensin). |
| 7 | **`POST /api/orders` tidak validasi stok/varian/produk**; `quantity` negatif/nol juga lolos. | server.js:1286–1349 | Pesanan mustahil & stok minus. |
| 8 | **Registrasi bisa error 500** jika ada user lama tanpa field `email` (`u.email.toLowerCase()`). | server.js:136 | Crash pada data lama. |
| 9 | **Tidak ada handler 404/error & security header** (CSP, HSTS, X-Content-Type-Options, dll). | server.js | Ekspos stack/HTML default, XSS lebih mudah. |
| 10 | **URL produksi di-hardcode** `https://bantukasir.biz.id/order?...`. | server.js:1176, 1206 | QR/menu salah domain saat deploy di host lain. |
| 11 | **`package.json` tidak punya `start` script**, PORT di-hardcode `9123`. | package.json; server.js:10 | `npm start` gagal; deploy tidak fleksibel. |
| 12 | **Proxy Unsplash tanpa rate limit/cache.** | server.js:604–632 | Kuota API bisa dihabiskan pihak lain. |

---

## 4. Fitur yang Masih Kurang

### 4.1 Keamanan & akun (paling mendesak)
- **Sesi/token login**, middleware auth, dan isolasi data per user di server.
- **Lupa password / reset password** (via email/WA) — saat ini tidak ada sama sekali.
- **Verifikasi email/OTP** dan **rate limit login** (anti brute force), lockout sementara.
- **Manajemen sesi & logout semua perangkat** (logout saat ini hanya menghapus `localStorage`).
- **Role & multi-user**: pemilik vs kasir; saat ini satu akun = satu perangkat.
- **Audit log** (siapa mengubah harga/stok/menghapus transaksi).
- **Backup & restore** data (export/import JSON/CSV), serta retensi data (UU PDP).
- **2FA** (opsional, untuk akun toko besar).

### 4.2 Operasional toko
- **Pencatatan pengeluaran nyata** (bukan konstanta `EXP`): listrik, sewa, gaji, transport, kulakan.
- **Pembelian/kulakan & supplier**: stok masuk, harga modal berubah, hutang ke supplier.
- **Stok opname / penyesuaian stok** dan riwayat pergerakan stok.
- **Shift kas / buka-tutup kasir** + rekonsiliasi uang laci.
- **Refund/retur** (sekarang hanya void penuh).
- **Diskon per item** dan **voucher/kode promo** (saat ini hanya diskon global).
- **Pajak per produk** (PPN saat ini global).
- **Multi-outlet / cabang** dan transfer stok.
- **Cetak ke printer thermal** (Bluetooth/USB), bukan hanya PDF/WA.
- **Barcode/QR scanner** untuk produk.
- **Satuan & konversi** (pcs/dus/kg) — penting untuk sembako.
- **Harga bertingkat / grosir** dan **member/loyalty point**.
- **Reservasi/meja** untuk kafe/resto.
- **Notifikasi real-time** pesanan masuk (saat ini polling; lebih baik SSE/WebSocket/Web Push).
- **Mode "tutup toko"/jam operasional** untuk order online.

### 4.3 Laporan & analitik
- **Filter periode bebas** (bulan/custom) dan **export Excel/CSV/PDF**.
- **Laba rugi sederhana** yang memisahkan modal, operasional, dan prive.
- **Perbandingan periode** (minggu/bulan), proyeksi, dan **break-even**.
- **Laporan per kasir, per metode bayar, per kategori**.
- **Piutang (kasbon) jatuh tempo** + pengingat WhatsApp otomatis.
- **Rekonsiliasi QRIS/transfer** dengan mutasi bank.

### 4.4 UX pendukung
- **Onboarding** langkah pertama (tambah produk pertama, buka toko).
- **Panduan offline & status sinkronisasi** yang terlihat jelas (bukan hanya console log).
- **PWA push notification** untuk pesanan/kasbon jatuh tempo.

---

## 5. UI/UX: Catatan & Perbaikan

**Yang sudah baik:** mobile-first, kontras warna oklab/OKLCH? (tidak, tapi palet konsisten), target sentuh besar, animasi halus, empty state, toast, bottom sheet.

**Yang perlu diperbaiki:**

1. **Navigasi bawah terlalu padat.** Ada **7 tab** dalam satu baris (dashboard.html:587–596). Di layar 360 px tiap tombol hanya ±51 px dengan label 10 px — sulit dibaca & disentuh. **Saran:** maksimal 5 item; pindahkan "Orders" ke ikon lonceng di header, dan "Kasbon" ke dalam "Beranda"/"Lainnya".
2. **Tidak ada onboarding.** Pengguna baru langsung melihat dashboard kosong tanpa panduan "mulai dari mana".
3. **Duplikasi halaman membingungkan.** `index.html` adalah landing page **sekaligus** aplikasi penuh (±2.076 baris), sementara `dashboard.html` adalah aplikasi lengkap (±2.897 baris). Dua sumber kebenaran → perbaikan harus dilakukan dua kali dan mudah tidak sinkron. Sama untuk `index2.html`, `index3.html`, `index4.html`, `*.bak`, `*.htmlbak`.
4. **Feedback sinkronisasi kurang.** Saat offline, transaksi hanya masuk antrean dan muncul toast singkat; tidak ada indikator "3 transaksi menunggu dikirim" yang persisten.
5. **Error handling ke pengguna kurang.** Banyak `catch(e){console.error(...)}` tanpa memberi tahu pengguna (mis. gagal simpan produk, gagal load insight).
6. **Angka & format.** Tampilan untung memakai `jt()` (juta) yang membulatkan 1 desimal — untuk nominal kecil bisa terasa tidak presisi. Pertimbangkan tampilkan angka penuh di halaman detail.
7. **Aksesibilitas:**
   - `nav.bnav` hanya punya label teks kecil; tambahkan `aria-label`.
   - Bottom sheet tidak mengunci fokus (focus trap) dan tidak mengembalikan fokus setelah ditutup.
   - Chart laporan kemungkinan hanya visual; sediakan ringkasan teks/tabel untuk screen reader.
8. **Konsistensi istilah.** Campur "Order"/"Pesanan", "Non-Tunai"/"QRIS", "Modal"/"HPP". Pilih satu istilah per konsep.
9. **Empty & loading state** bagus di beberapa tempat, tapi belum merata (mis. halaman produk/riwayat saat memuat).
10. **Mode gelap** sudah ada; pastikan kontras teks muted di dark mode memenuhi WCAG AA.

---

## 6. Kualitas Kode & Maintainability

- **Tidak ada test sama sekali**; `npm test` hanya `echo "Error: no test specified"`.
- **Tidak ada README**, `.gitignore`, `.env.example`, linter/formatter, atau CI.
- **Monolit**: `dashboard.html` 2.897 baris, `server.js` 1.639 baris berisi routing + logika + AI + template. Sulit dites & dirawat.
- **Duplikasi besar** antara `index.html` dan `dashboard.html`; banyak string HTML di dalam template literal satu baris yang sangat panjang (beberapa > 1.000 karakter).
- **Magic numbers & hardcode**: `PORT=9123`, `EXP=15000`, `MAX_REFRESH_PER_DAY=5`, domain produksi, path file.
- **Penamaan tidak konsisten**: field produk `{n,k,f,p,c,s,v}` (super singkat) bercampur field transaksi `{metode_bayar, subtotal, ppn_persen}`. Tanpa tipe/skema, rawan salah pakai (`metode` vs `metode_bayar` ditangani manual di dashboard.html:766).
- **Log debug berlebihan** (`console.log` payload penuh, termasuk seluruh order settings) — bocor informasi & berisik di produksi.
- **Tidak ada validasi skema** (mis. Zod/Joi) di API; validasi tersebar ad-hoc.
- **`bantukasir.zip`** dan file `.bak` sebaiknya tidak ada di repo/deploy.
- **Komentar / kode mati**: endpoint `/api/laporan` tak terpakai, `saveUserEntry` hanya wrapper, `https` diimpor untuk 1 kasus.

**Saran struktur jangka menengah:**

```
src/
  app.js            # setup express
  routes/           # auth, produk, transaksi, orders, insight
  services/         # business logic
  db/               # sqlite + migrations + repository
  middleware/       # auth, rateLimit, validate, error
public/             # frontend, 1 app + 1 landing
tests/
```

---

## 7. Performa & Skalabilitas

- **Blocking I/O** pada setiap request (lihat 2.7).
- **Tidak ada pagination**: `GET /api/transaksi` mengembalikan seluruh riwayat (file demo 3.866 baris). Akan membengkak seiring waktu.
- **Gambar base64 di dalam JSON** (foto produk & QRIS) → file DB besar, parsing lambat, tidak bisa di-cache browser. Simpan ke object storage/disk dan simpan URL/path saja.
- **Tidak ada kompresi** (`compression`) atau cache header untuk aset statis versi.
- **Polling** untuk status pesanan (order.html) dan badge order (dashboard) — boros request; pertimbangkan SSE.
- **Tidak ada connection pooling DB** karena file JSON; SQLite akan memperbaiki ini.
- **`express.json({limit:"10mb"})`** membuka payload besar per request → risiko memori/disk.
- **Health check tiap 30 detik** per tab juga menambah beban; gunakan `navigator.onLine` + backoff.

---

## 8. PWA & Offline

- **Service worker gagal install** karena `/laporan.html` (lihat 2.6) → fitur offline inti tidak berjalan.
- **Strategi cache API** memakai network-first + fallback cache. Risiko: data lama ditampilkan tanpa indikator "data offline" sehingga kasir bisa menjual berdasarkan stok basi.
- **Konflik sinkronisasi** belum ditangani secara eksplisit: `saveProduk()` mengirim **seluruh** array produk (replace). Jika dua perangkat offline mengubah stok, hasil akhir = "last writer wins" dan perubahan lain hilang. Sebaiknya kirim **delta/operasi** (mis. `POST /api/produk/:id/stok` dengan `delta`), bukan replace-all.
- **Optimistic stock** disimpan terpisah dari server; perlu rekonsiliasi saat sync selesai.
- **Tidak ada Background Sync API** meski kode menyebut dukungannya (hanya log).
- **iOS Safari**: install PWA & storage eviction perlu ditangani (mis. peringatan backup).
- **Cache invalidation**: `CACHE_VERSION` harus di-bump setiap deploy, jika tidak pengguna tertahan di versi lama.

---

## 9. Rekomendasi Prioritas (Roadmap)

### P0 — Wajib sebelum dipakai publik (1–2 minggu)
1. Rotasi API key, hapus `.env`/database/zip dari repo, tambah `.gitignore` + `.env.example`.
2. Implementasi **auth token/session** + middleware `requireAuth`; hapus `user_id` dari client.
3. Perbaiki **price tampering** di `POST /api/orders` (hitung harga dari server).
4. Hapus field `c` (modal) dari `/api/menu`.
5. Perbaiki **service worker** (hapus `/laporan.html`, pakai `Promise.allSettled`).
6. Perbaiki **stored XSS**: escape `'`, hindari `innerHTML`, tambah CSP.
7. Perbaiki **void**: kembalikan stok di server secara atomik (bukan dari client).
8. Samakan perhitungan `day` (pilih satu: lokal atau UTC+offset toko).
9. Tambah `start` script, `PORT` dari env, handler 404 & error, security header, rate limit.

### P1 — Kualitas & kepercayaan (2–4 minggu)
10. Migrasi ke **SQLite** + repository layer; hentikan `readFileSync/writeFileSync`.
11. Tambah `README`, `.env.example`, linter, dan **test** untuk auth, transaksi, stok, kasbon.
12. Hapus file duplikat (`index2/3/4`, `*.bak`, `*.htmlbak`) dan satukan aplikasi jadi satu sumber.
13. Tambah fitur **pengeluaran nyata** dan **laporan laba rugi** yang benar.
14. Tambah **reset password**, verifikasi akun, dan rate limit login.
15. Pagination + arsip transaksi lama; pindahkan gambar ke storage.

### P2 — Fitur bernilai tambah (1–2 bulan)
16. Role kasir/admin, multi-outlet, shift kas.
17. Export CSV/Excel/PDF, backup/restore.
18. Printer thermal, scanner barcode.
19. Notifikasi real-time (SSE/Web Push) untuk pesanan & kasbon jatuh tempo.
20. Onboarding + indikator sinkronisasi yang jelas.

### P3 — Penyempurnaan
21. A11y audit penuh (focus trap, kontras, screen reader), refactor navigasi 5 tab.
22. Member/loyalty, voucher, harga grosir, satuan.
23. Observability (structured logging, error tracking) dan CI/CD.

---

## 10. Penutup

BantuKasir punya **fondasi produk yang bagus** dan fitur yang jauh di atas rata-rata aplikasi kasir UMKM sederhana. Masalahnya bukan pada ide, melainkan pada **lapisan keamanan, arsitektur data, dan disiplin engineering** yang belum mengimbangi kecepatan penambahan fitur.

Jika lima hal P0 diperbaiki — **auth, secret, price tampering, kebocoran modal, dan service worker** — project ini langsung naik dari "demo keren" menjadi "produk yang layak dipercaya". Setelah itu, migrasi ke SQLite dan penambahan test akan membuat pengembangan fitur berikutnya jauh lebih aman dan cepat.

> Catatan: semua temuan di atas berdasarkan pembacaan kode statis. Saya belum menjalankan server atau melakukan pengujian penetrasi aktif. Beberapa temuan (mis. service worker gagal install) sebaiknya diverifikasi di browser setelah perbaikan.

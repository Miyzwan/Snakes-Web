# Product Requirements Document (PRD)
## Snake Game — Web-Based

**Versi:** 1.0
**Tanggal:** 23 Juli 2026
**Status:** Draft

---

## 1. Ringkasan Produk

Sebuah game Snake sederhana yang dapat dimainkan langsung melalui browser (web). Pemain mengendalikan seekor ular yang bergerak di dalam arena, memakan objek (makanan) agar tubuhnya semakin panjang, dan harus menghindari tabrakan dengan dinding atau tubuhnya sendiri.

Game ini dirancang sebagai **static site** murni (HTML/CSS/JavaScript tanpa backend/server), sehingga **dapat langsung di-hosting dan diakses melalui GitHub Pages** tanpa proses build atau konfigurasi tambahan.

## 2. Latar Belakang & Tujuan

- Menyediakan game kasual yang ringan, cepat dimuat, dan tidak memerlukan instalasi.
- Menjadi produk sederhana (MVP) yang bisa diakses lintas perangkat (desktop & mobile) hanya melalui URL.
- Fokus pada gameplay klasik yang sudah familiar agar mudah dipahami tanpa tutorial panjang.

## 3. Target Pengguna

- Pengguna kasual yang ingin mengisi waktu luang.
- Tidak memerlukan akun/login — siapa saja bisa langsung main.
- Perangkat: desktop (kontrol arrow key) dan mobile (kontrol swipe).

## 4. Ruang Lingkup (Scope)

### In Scope (MVP)
- Papan permainan (grid) dengan ular yang bergerak otomatis ke satu arah.
- Kontrol arah: atas, bawah, kiri, kanan.
- Makanan muncul acak di papan; ular bertambah panjang saat memakannya.
- Skor bertambah setiap kali makan.
- Game over saat ular menabrak dinding atau tubuhnya sendiri.
- Tampilan skor saat ini & skor tertinggi (high score, disimpan sementara di sesi/browser).
- Tombol "Main Lagi" (restart) setelah game over.
- Responsif — bisa dimainkan di layar desktop maupun mobile.

### Out of Scope (untuk versi awal)
- Multiplayer / leaderboard online.
- Login/akun pengguna.
- Level/tema berbeda-beda, power-up, atau musuh tambahan.
- Monetisasi (iklan, in-app purchase).
- Sound effect/musik (opsional, bisa jadi nice-to-have di v2).

## 5. User Stories

| # | Sebagai... | Saya ingin... | Agar... |
|---|-----------|----------------|---------|
| 1 | Pemain | Membuka game langsung dari link web | Bisa main tanpa install apapun |
| 2 | Pemain | Mengontrol arah ular dengan arrow key (desktop) atau swipe (mobile) | Bisa menghindari tabrakan |
| 3 | Pemain | Melihat skor saat bermain | Tahu progres saya |
| 4 | Pemain | Melihat pesan game over & skor akhir | Tahu kapan permainan berakhir |
| 5 | Pemain | Menekan tombol restart | Bisa langsung main ulang |
| 6 | Pemain | Melihat high score | Termotivasi memecahkan rekor sendiri |

## 6. Functional Requirements

1. **Papan Permainan**
   - Grid berukuran tetap (contoh: 20x20 sel).
   - Ular direpresentasikan sebagai rangkaian sel yang saling terhubung.

2. **Pergerakan Ular**
   - Ular bergerak otomatis secara terus-menerus ke arah terakhir yang ditentukan.
   - Kecepatan gerak tetap di awal (opsional: makin cepat seiring skor naik).
   - Pemain tidak bisa langsung berbalik 180° (misal dari kanan langsung ke kiri).

3. **Kontrol**
   - **Desktop:** tombol panah (arrow keys) — Atas/Bawah/Kiri/Kanan.
   - **Mobile:** swipe gesture (geser jari ke atas/bawah/kiri/kanan pada area permainan).
   - Sistem mendeteksi jenis perangkat/input dan menampilkan instruksi kontrol yang sesuai (arrow key untuk desktop, swipe untuk mobile).

4. **Makanan**
   - Muncul di posisi acak yang tidak bertabrakan dengan tubuh ular.
   - Saat dimakan, muncul makanan baru di posisi acak lainnya.

5. **Skor**
   - Bertambah setiap kali ular makan (misal +10 poin).
   - Skor tertinggi disimpan di local storage browser.

6. **Kondisi Game Over**
   - Ular menabrak tepi/dinding arena.
   - Ular menabrak bagian tubuhnya sendiri.
   - Menampilkan layar "Game Over" dengan skor akhir & tombol restart.

7. **Restart**
   - Mengembalikan ular ke posisi & panjang awal, skor ke 0, dan melanjutkan permainan baru.

## 7. Non-Functional Requirements

- **Platform:** Web browser (Chrome, Safari, Firefox, Edge — versi terbaru).
- **Performa:** Waktu muat halaman < 2 detik pada koneksi standar.
- **Responsif:** Tampilan menyesuaikan ukuran layar (desktop & mobile).
- **Tanpa backend wajib:** Bisa berjalan sepenuhnya di sisi client (HTML/CSS/JavaScript), tanpa server khusus untuk MVP.
- **Aksesibilitas dasar:** Kontras warna cukup jelas, teks skor mudah dibaca.

## 8. Game Mechanics (Detail)

- **Ukuran grid:** 20 x 20 sel (dapat disesuaikan).
- **Kecepatan awal:** 1 langkah per ~150ms.
- **Panjang awal ular:** 3 sel.
- **Poin per makanan:** 10 poin.
- **Peningkatan kecepatan (opsional v1.1):** setiap kelipatan 50 poin, kecepatan naik sedikit.

## 9. UI/UX Requirements

- Halaman utama langsung menampilkan area permainan (tanpa menu rumit).
- Skor ditampilkan jelas di bagian atas layar.
- Warna kontras antara ular, makanan, dan latar arena.
- Layar game over menampilkan: skor akhir, high score, dan tombol "Main Lagi".
- Instruksi kontrol singkat ditampilkan sebelum permainan dimulai, menyesuaikan perangkat:
  - Desktop: "Gunakan tombol panah (↑ ↓ ← →) untuk bergerak."
  - Mobile: "Geser (swipe) layar ke arah yang diinginkan untuk bergerak."

## 10. Saran Teknis (Technical Stack)

- **Frontend:** HTML5 Canvas + JavaScript (vanilla) — direkomendasikan agar 100% kompatibel dengan GitHub Pages tanpa proses build.
- **Styling:** CSS sederhana, desain minimalis, satu file (`style.css` atau inline).
- **Penyimpanan skor tertinggi:** `localStorage` browser (tanpa database).
- **Hosting:** **GitHub Pages** (wajib bisa berjalan di sini) — juga tetap kompatibel jika di-deploy ke Netlify/Vercel sebagai alternatif.

### Persyaratan Khusus agar Kompatibel dengan GitHub Pages
- Struktur project berupa file statis murni: `index.html`, `style.css`, `script.js` (tanpa server-side code, tanpa database eksternal wajib).
- Tidak ada proses build/compile yang wajib dijalankan — file bisa langsung di-push dan diakses (jika pakai vanilla JS/HTML/CSS).
- Semua path/link antar file (CSS, JS, gambar) menggunakan **relative path**, bukan absolute path, agar tetap berfungsi saat diakses lewat subpath GitHub Pages (`https://<username>.github.io/<repo>/`).
- File utama bernama `index.html` diletakkan di root repo (atau folder `/docs`) sesuai konfigurasi GitHub Pages.

## 11. Metrik Keberhasilan (Success Metrics)

- Game dapat dimainkan tanpa bug/crash pada perangkat desktop & mobile umum.
- Waktu rata-rata sesi bermain (session duration) sebagai indikator engagement.
- Tidak ada blocking bug pada alur inti: mulai → makan → panjang bertambah → game over → restart.

## 12. Milestone / Timeline (Contoh)

| Tahap | Deliverable | Estimasi |
|-------|-------------|----------|
| 1 | Setup project & arena dasar (grid, ular statis) | 1 hari |
| 2 | Pergerakan ular + kontrol arrow key (desktop) | 1 hari |
| 3 | Logika makanan & pertambahan panjang | 1 hari |
| 4 | Deteksi tabrakan & game over | 1 hari |
| 5 | Skor & high score (localStorage) | 0.5 hari |
| 6 | Kontrol mobile (swipe gesture) & responsif | 1 hari |
| 7 | Polish UI/UX & testing | 1 hari |

## 13. Risiko & Asumsi

- **Asumsi:** Pengguna mengakses via browser modern yang mendukung JavaScript & localStorage.
- **Risiko:** Kontrol swipe di mobile mungkin kurang presisi dibanding keyboard — perlu testing tambahan.
- **Risiko:** Tanpa backend, high score hanya tersimpan per-browser/per-perangkat (tidak sinkron antar device).

## 14. Pertanyaan Terbuka (Open Questions)

- Apakah dibutuhkan efek suara sederhana (makan, game over)?
- Apakah tema visual perlu disesuaikan (misal warna kustom, tema gelap/terang)?
- Apakah perlu fitur pause/resume?

---

*Dokumen ini adalah versi awal (MVP) dan dapat berkembang seiring kebutuhan produk.*

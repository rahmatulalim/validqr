# Product Requirements Document (PRD) — ValidQR

**Versi:** 1.0  
**Tanggal:** September 2026  
**Tim:** NusaPay (Alim & Ryan)  
**Event:** HackNusa 2026 — Telkom University × Kaspersky · Top 30 Finalist

---

## 1. Ringkasan Eksekutif

ValidQR adalah SDK anti-fraud adaptif yang diintegrasikan ke dalam aplikasi e-wallet NusaPay. SDK ini mendeteksi stiker QRIS palsu atau yang telah dimodifikasi secara real-time sebelum saldo pengguna terpotong, menggunakan tiga lapisan keamanan sekuensial yang dapat beradaptasi dengan kondisi jaringan dan GPS.

---

## 2. Latar Belakang Masalah

### 2.1 Konteks QRIS di Indonesia

QRIS (Quick Response Code Indonesian Standard) telah menjadi standar pembayaran nasional yang diadopsi oleh 30+ juta merchant di Indonesia. Volume transaksi QRIS mencapai Rp 225,7 triliun pada 2025 (data BI).

### 2.2 Modus Penipuan Stiker QRIS

Pelaku kejahatan mengeksploitasi kepercayaan pengguna terhadap stiker QRIS dengan dua modus utama:

1. **Substitusi NMID (Hard Fraud):** Mengganti stiker QRIS asli dengan stiker baru yang mengandung NMID berbeda. Dana langsung masuk ke rekening penipu.

2. **Rebrand/Rebranding Fraud:** Menggunakan NMID merchant asli tetapi mengubah nama tampilan pada stiker. Bertujuan untuk mengelabui merchant sehingga tidak menyadari bahwa ada pembayaran yang masuk ke rekening mereka dari transaksi yang seharusnya ditolak.

### 2.3 Gap Solusi Saat Ini

- Tidak ada validasi real-time di level aplikasi konsumen
- Bank Indonesia dan PJSP tidak menyediakan API publik untuk cross-validasi merchant
- Pengguna awam tidak dapat membedakan QRIS asli dari palsu secara visual

---

## 3. Pengguna Target

| Segmen | Deskripsi | Pain Point |
|--------|-----------|-----------|
| **Buyer (Pembeli)** | Pengguna NusaPay, 18-45 tahun, aktif bertransaksi di pasar/warung | Tidak tahu apakah QRIS yang dipindai aman |
| **Merchant (Penjual)** | Pemilik UMKM yang sudah terdaftar QRIS | Tidak tahu jika stiker QR-nya diganti penipu |
| **Tim Anti-Fraud PJSP** | Analis di NusaPay | Butuh data incident real-time untuk investigasi |

---

## 4. Fitur Utama (MVP — Demo HackNusa)

### F1: Scan QRIS dengan Kamera
- Pengguna membuka app NusaPay, menekan tombol "Scan"
- Kamera terbuka dan mendeteksi QRIS secara real-time menggunakan `mobile_scanner`
- Payload QRIS di-decode dan di-parse menggunakan EMVCo TLV parser internal

### F2: Validasi 3 Layer Sekuensial

**F2.1 — Layer 1: NMID Cross-Validation**
- NMID dari payload dicocokkan ke database PostgreSQL
- Jika tidak ditemukan → HARD_BLOCK, WhatsApp alert dikirim otomatis

**F2.2 — Layer 2: Hybrid Fuzzy Name Matching**
- Nama merchant di QR dibandingkan dengan nama di database menggunakan algoritma hybrid (Levenshtein 40% + Token Overlap 60%)
- Skor dihitung real-time, threshold dapat dikonfigurasi (default: 50%)
- Jika skor di bawah threshold → SOFT_WARNING

**F2.3 — Layer 3: Geofencing GPS**
- Lokasi pengguna dibandingkan dengan koordinat merchant terdaftar (radius 500m, Haversine)
- Jika GPS tidak tersedia → Graceful Degradation, gunakan hasil Layer 1 & 2

### F3: Tampilan Status Real-Time
- Layar hasil menampilkan status dengan warna: HIJAU / KUNING / MERAH
- Pesan dalam Bahasa Indonesia yang jelas dan mudah dipahami
- Tampilkan skor fuzzy (untuk edukasi pengguna di mode YELLOW)

### F4: Notifikasi Fraud Alert via WhatsApp
- Saat HARD_BLOCK, sistem otomatis mengirim pesan WhatsApp ke nomor merchant terdaftar
- Pesan mencakup: nama merchant yang tercantum di QR palsu, waktu kejadian, lokasi approx

### F5: History Scan
- Pengguna dapat melihat riwayat scan sebelumnya
- Setiap scan dicatat di `incident_logs`

---

## 5. Non-Fitur (Out of Scope — HackNusa MVP)

- ❌ Sistem autentikasi pengguna (login/register)
- ❌ Admin panel manajemen merchant
- ❌ Integrasi dengan sistem core banking
- ❌ Machine learning adaptif (di luar scope prototype)
- ❌ Multi-bahasa (hanya Bahasa Indonesia)

---

## 6. Persyaratan Non-Fungsional

| Kategori | Target |
|----------|--------|
| **Latency** | ≤ 200ms end-to-end (scan → response) |
| **Fraud Recall** | ≥ 99.5% (minimal 99 dari 100 kasus fraud terdeteksi) |
| **False Positive Rate** | < 0.1% (tidak memblok transaksi sah) |
| **Fallback Reliability** | 100% (sistem tidak crash saat GPS/network tidak tersedia) |
| **Availability** | 99.9% (untuk scope demo) |

---

## 7. Skenario Pengujian Demo

### Skenario 1: Stiker A — Merchant Asli (VERIFIED)
- NMID: `ID10293847561`
- Nama: Warung Bakso Pak Budi
- Hasil Expected: **GREEN** — "Transaksi aman. Merchant terverifikasi."

### Skenario 2: Stiker B — Penipu (HARD_BLOCK)
- NMID: `ID99999999980` (tidak ada di database)
- Nama: Toko Aksesoris Penipu
- Hasil Expected: **RED** — "NMID tidak terdaftar! Transaksi diblokir." + WhatsApp alert terkirim ke HP Ryan

### Skenario 3: Stiker C — Rebrand Fraud (SOFT_WARNING)
- NMID: `ID10293847561` (sama dengan merchant asli)
- Nama: Bakso Budi Dipatiukur (berbeda dari nama terdaftar)
- Hasil Expected: **YELLOW** — "Nama merchant tidak sepenuhnya cocok. Konfirmasi diperlukan." + tampilkan skor fuzzy

---

## 8. Metrik Keberhasilan

| KPI | Target | Cara Ukur |
|-----|--------|----------|
| 3 skenario demo berjalan tanpa error | 100% | Manual testing |
| WA alert terkirim < 3 detik | 100% | Timestamp log |
| Latency API < 200ms | 95th percentile | Backend logs |
| Skor fuzzy berbeda untuk setiap stiker | ✅ | Unit test |
| Audience dapat memahami demo | Positive feedback | Presentasi |

---

## 9. Risiko & Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|---------|
| Koneksi internet demo tidak stabil | Medium | Tinggi | Gunakan hotspot dedicated, siapkan backup ngrok URL |
| GPS tidak akurat di dalam ruangan | Tinggi | Medium | Graceful Degradation aktif, skip Layer 3 |
| WhatsApp API rate limit | Low | Medium | Test WA integration sebelum demo, siapkan log sebagai fallback |
| Flutter crash di perangkat demo | Low | Tinggi | Test di HP Alim 2 hari sebelumnya |

---

*Dokumen ini merupakan bagian dari submission HackNusa 2026 — ValidQR by NusaPay*

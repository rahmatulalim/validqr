# Runbook Demo HackNusa 2026 — ValidQR

Panduan eksekusi demo stage untuk Tim NusaPay (Alim & Ryan).

## 1. Persiapan (H-1 Jam)

### 1.1 Setup Jaringan
1. Jalankan `demo/scripts/setup_hotspot.sh` di laptop Alim.
2. Sambungkan HP Alim (Buyer) dan HP Ryan (Merchant) ke hotspot `HackNusa-Demo`.
3. Jalankan `ngrok http 3000` di laptop Alim. Catat URL forwarding (misal: `https://abcd.ngrok.io`).

### 1.2 Update Konfigurasi
1. Update `mobile/lib/core/constants.dart` → set `apiBaseUrl` ke URL ngrok.
2. Update `backend/.env` → set `WA_API_TOKEN` ke token sementara dari dashboard WhatsApp.
3. Pastikan `backend/.env` → `WA_API_URL` mengarah ke nomor HP Ryan.

### 1.3 Siapkan Props
1. Jalankan `python demo/scripts/generate_stickers.py`
2. Print 3 stiker dari folder `demo/qr_props/` (Kertas A4, potong rapi).
3. Tandai bagian belakang stiker (A=Asli, B=Penipu, C=Rebrand) agar tidak tertukar saat demo.

## 2. Eksekusi Demo (Di Panggung)

**Posisi:**
- Alim: Pegang HP (Buyer), presentasi layar via proyektor.
- Ryan: Pegang HP (Merchant), pamerkan layar saat notifikasi masuk.
- Layar Proyektor: Menampilkan mirroring HP Alim (via `run_scrcpy.sh`) dan terminal backend (untuk show log fuzzy).

### Skenario 1: Transaksi Normal (Stiker A)
1. Alim scan Stiker A (Warung Bakso Pak Budi).
2. Layar HP Alim menunjukkan **GREEN (Transaksi Aman)**.
3. *Pesan ke Juri:* "Ini adalah flow normal. ValidQR memvalidasi NMID, nama, dan lokasi secara real-time."

### Skenario 2: Hard Fraud / Substitusi Stiker (Stiker B)
1. Alim scan Stiker B (Toko Aksesoris Penipu).
2. Layar HP Alim menunjukkan **RED (Transaksi Diblokir)**.
3. *Pesan ke Juri:* "Sistem langsung memblokir karena NMID pada stiker tidak terdaftar untuk merchant ini."
4. HP Ryan (Merchant) berbunyi/bergetar. Ryan menunjukkan layar WhatsApp.
5. *Pesan ke Juri:* "Dalam hitungan milidetik, merchant asli menerima notifikasi fraud di WhatsApp beserta lokasi percobaan penipuan, sehingga mereka bisa langsung mencopot stiker palsu."

### Skenario 3: Rebrand Fraud (Stiker C)
1. Alim scan Stiker C (Bakso Budi Dipatiukur).
2. Layar HP Alim menunjukkan **YELLOW (Konfirmasi Diperlukan)**.
3. Alim tap icon `[?]` untuk expand skor kecocokan (45%).
4. *Pesan ke Juri:* "Penipu kadang menggunakan NMID valid milik merchant asli, tapi mengubah nama stiker agar dana nyasar. Algoritma Hybrid Fuzzy Matching kami mendeteksi anomali ini dan memberikan peringatan sebelum uang ditransfer."
5. Tunjukkan log terminal backend ke juri: "Di sini terlihat sistem kami memadukan Levenshtein distance dan Token Overlap untuk menghitung skor 45% secara real-time."

---

## 3. Fallback Plan (Jika Terjadi Masalah)

- **Jika ngrok mati/terblokir WiFi venue:** Fallback ke IP lokal. Update `constants.dart` dengan IP laptop Alim di jaringan hotspot (`http://192.168.x.x:3000`).
- **Jika API WhatsApp rate-limited:** Buka tabel `incident_logs` di DBeaver/PgAdmin dan tunjukkan bahwa sistem tetap mencatat fraud event meskipun notifikasi gagal terkirim.
- **Jika GPS HP error di dalam gedung:** Tunjukkan layar HP Alim yang masih **GREEN**, tapi tunjukkan teks kecil "GPS tidak tersedia, degradasi aktif". Jelaskan fitur Graceful Degradation ke juri.

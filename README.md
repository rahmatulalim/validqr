# ValidQR — Adaptive Real-Time Anti-Fraud SDK untuk Ekosistem QRIS

> **HackNusa 2026** · Telkom University × Kaspersky · Top 30 Finalist  
> Tim NusaPay — Alim & Ryan

ValidQR adalah SDK anti-fraud berbasis kecerdasan adaptif yang mendeteksi stiker QRIS palsu/dimodifikasi secara real-time **sebelum** saldo pengguna terpotong. Dibangun di atas 3 lapisan keamanan sekuensial yang dapat merespons kondisi jaringan dan GPS yang tidak tersedia.

---

## 📐 Arsitektur Singkat

```
[Flutter NusaPay App]
       │ scan QRIS
       ▼
[API Gateway — Node.js/Express]
       │
       ├─ Layer 1: NMID Cross-Validation (PostgreSQL)
       ├─ Layer 2: Hybrid Fuzzy Name Matching (Levenshtein + Token Overlap)
       └─ Layer 3: Geofencing GPS (Haversine 500m) + Graceful Degradation
       │
       ▼
[WhatsApp Business API → HP Ryan (Merchant Alert)]
```

---

## 🗂️ Struktur Monorepo

```
validqr/
├── backend/         # Node.js + Express + TypeScript (API Gateway)
├── mobile/          # Flutter SDK (NusaPay Buyer App)
├── database/        # PostgreSQL schema + Redis config
├── demo/            # Script generator stiker + props demo
│   ├── scripts/     # generate_stickers.py, shell scripts
│   └── qr_props/    # Output PNG stiker (di-generate via script)
└── docs/            # API collection, user manual
```

---

## ⚙️ Prerequisites

| Tool | Versi Minimum | Kegunaan |
|------|--------------|----------|
| Node.js | 20.x LTS | Backend runtime |
| npm | 10.x | Package manager backend |
| Flutter SDK | 3.22.x | Mobile development |
| Dart SDK | 3.4.x | (bundled dengan Flutter) |
| Python | 3.10+ | Generate stiker QRIS |
| PostgreSQL | 15.x | Database merchant |
| Redis | 7.x | Spatial caching |

---

## 🚀 Quick Start

### 1. Clone & Masuk ke Direktori

```bash
git clone https://github.com/your-org/validqr.git
cd validqr
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi lokal Anda

npm install
npm run dev
```

Backend berjalan di `http://localhost:3000`.

### 3. Setup Database

```bash
# Buat database PostgreSQL
createdb validqr

# Jalankan schema
psql -d validqr -f database/postgres/init.sql

# Seed data demo (1 merchant asli)
psql -d validqr -f database/postgres/seed.sql
```

### 4. Setup Redis

```bash
redis-server database/redis/redis.conf
```

### 5. Generate Stiker QRIS (Demo Props)

```bash
cd demo/scripts
pip install -r requirements.txt
python generate_stickers.py
# Output: demo/qr_props/stiker_a_asli.png
#         demo/qr_props/stiker_b_penipu.png
#         demo/qr_props/stiker_c_rebrand.png
```

Lihat `demo/qr_props/README.md` untuk instruksi cetak.

### 6. Setup Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

Pastikan device/emulator sudah terhubung.

---

## 🧪 Testing

### Backend Unit Tests

```bash
cd backend
npm test
```

Test mencakup:
- `fuzzyMatcher.test.ts` — 3 skenario stiker (GREEN/RED/YELLOW)
- `nmidValidator.test.ts` — validasi NMID ke database
- `qrParser.test.ts` — parsing payload EMVCo TLV

### Integration Tests

```bash
cd backend
npm run test:integration
```

---

## 🎭 Skenario Demo HackNusa

| Stiker | NMID | Nama Merchant | Hasil |
|--------|------|--------------|-------|
| **A — Asli** | `ID10293847561` | Warung Bakso Pak Budi | ✅ GREEN — VERIFIED |
| **B — Penipu** | `ID99999999980` | Toko Aksesoris Penipu | 🔴 RED — HARD_BLOCK + WA Alert |
| **C — Rebrand** | `ID10293847561` | Bakso Budi Dipatiukur | 🟡 YELLOW — SOFT_WARNING |

**Setup demo:**
- **HP Alim (Buyer):** Jalankan app Flutter, scan stiker, mirroring via Scrcpy
- **HP Ryan (Merchant):** Terima notifikasi WhatsApp fraud alert

---

## 📡 API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/v1/verify/scan` | Scan & validasi QRIS |
| `POST` | `/api/v1/notify/fraud-alert` | Kirim WA alert ke merchant |
| `GET` | `/health` | Health check |

Detail lengkap di [API_SPECIFICATION.md](./API_SPECIFICATION.md).

---

## 📊 SLA Target

| Metrik | Target |
|--------|--------|
| Latency | ≤ 200 ms |
| Fraud Recall | ≥ 99.5% |
| False Positive | < 0.1% |
| Fallback Reliability | 100% |

---

## 📄 Dokumentasi

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arsitektur detail 4 layer
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) — Spesifikasi API lengkap
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Schema PostgreSQL
- [PRD.md](./PRD.md) — Product Requirements Document
- [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) — Design system Flutter
- [AGENT_RULES.md](./AGENT_RULES.md) — Konvensi kode
- [docs/user_manual.md](./docs/user_manual.md) — Runbook demo HackNusa

---

## 👥 Tim

| Nama | Peran |
|------|-------|
| Alim | Lead Developer, Demo Operator (Buyer) |
| Ryan | Backend Integration, Demo Operator (Merchant) |

---

*ValidQR © 2026 — HackNusa 2026 Submission*

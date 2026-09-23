# Database Schema — ValidQR

## PostgreSQL

### Tabel: `merchants`

Menyimpan data merchant QRIS yang telah terverifikasi. Hanya merchant asli yang terdaftar — NMID penipu **sengaja tidak ada** agar Layer 1 dapat memblok transaksi.

```sql
CREATE TABLE merchants (
  id            SERIAL PRIMARY KEY,
  nmid          VARCHAR(20)    NOT NULL UNIQUE,
  name          VARCHAR(255)   NOT NULL,
  latitude      DECIMAL(10, 7) NOT NULL,
  longitude     DECIMAL(10, 7) NOT NULL,
  wa_number     VARCHAR(20),
  is_active     BOOLEAN        DEFAULT TRUE,
  created_at    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    DEFAULT NOW()
);
```

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | SERIAL | Primary key auto-increment |
| `nmid` | VARCHAR(20) | National Merchant ID — unik, dari Bank Indonesia |
| `name` | VARCHAR(255) | Nama resmi merchant sesuai pendaftaran |
| `latitude` | DECIMAL(10,7) | Koordinat GPS merchant (geofencing) |
| `longitude` | DECIMAL(10,7) | Koordinat GPS merchant (geofencing) |
| `wa_number` | VARCHAR(20) | Nomor WhatsApp merchant untuk fraud alert (format: 62xxx) |
| `is_active` | BOOLEAN | Flag aktif/nonaktif merchant |
| `created_at` | TIMESTAMPTZ | Waktu pendaftaran |
| `updated_at` | TIMESTAMPTZ | Waktu update terakhir |

**Index:**
```sql
CREATE INDEX idx_merchants_nmid ON merchants(nmid);
```

---

### Tabel: `incident_logs`

Mencatat setiap kejadian scan, termasuk yang fraud maupun yang aman. Digunakan untuk analitik dan audit trail.

```sql
CREATE TABLE incident_logs (
  id              SERIAL PRIMARY KEY,
  nmid_scanned    VARCHAR(20)    NOT NULL,
  merchant_name   VARCHAR(255),
  status          VARCHAR(20)    NOT NULL,
  color           VARCHAR(10)    NOT NULL,
  reason          VARCHAR(50),
  fuzzy_score     INTEGER,
  latitude        DECIMAL(10, 7),
  longitude       DECIMAL(10, 7),
  distance_meters DECIMAL(10, 2),
  gps_available   BOOLEAN,
  raw_payload     TEXT,
  created_at      TIMESTAMPTZ    DEFAULT NOW()
);
```

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | SERIAL | Primary key |
| `nmid_scanned` | VARCHAR(20) | NMID yang dipindai dari QR |
| `merchant_name` | VARCHAR(255) | Nama merchant dari payload QR |
| `status` | VARCHAR(20) | `VERIFIED`, `SOFT_WARNING`, `HARD_BLOCK` |
| `color` | VARCHAR(10) | `GREEN`, `YELLOW`, `RED` |
| `reason` | VARCHAR(50) | Alasan jika bukan VERIFIED (e.g. `NMID_MISMATCH`, `LOW_FUZZY_SCORE`) |
| `fuzzy_score` | INTEGER | Skor fuzzy matching (0-100) |
| `latitude` | DECIMAL(10,7) | Lokasi buyer saat scan |
| `longitude` | DECIMAL(10,7) | Lokasi buyer saat scan |
| `distance_meters` | DECIMAL(10,2) | Jarak buyer ke merchant (dari geofencing) |
| `gps_available` | BOOLEAN | Apakah GPS tersedia saat scan |
| `raw_payload` | TEXT | Payload QRIS mentah (opsional, untuk debug) |
| `created_at` | TIMESTAMPTZ | Waktu scan |

**Index:**
```sql
CREATE INDEX idx_incident_logs_status ON incident_logs(status);
CREATE INDEX idx_incident_logs_created_at ON incident_logs(created_at);
CREATE INDEX idx_incident_logs_nmid ON incident_logs(nmid_scanned);
```

---

## Redis

### Key Schema

| Key Pattern | Tipe | TTL | Keterangan |
|-------------|------|-----|-----------|
| `merchant:<nmid>` | Hash | 300s | Cache data merchant setelah query pertama |
| `geo:merchants` | Sorted Set (Geo) | - | Koordinat semua merchant (via GEOADD) |
| `ratelimit:<ip>` | String | 60s | Rate limiting per IP (maks 30 req/menit) |

### Contoh Redis Commands

```bash
# Simpan merchant ke cache
HSET merchant:ID10293847561 name "Warung Bakso Pak Budi" latitude -6.8915 longitude 107.6107
EXPIRE merchant:ID10293847561 300

# Tambahkan merchant ke geo index
GEOADD geo:merchants 107.6107 -6.8915 "ID10293847561"

# Query merchant dalam radius 500m dari koordinat buyer
GEOSEARCH geo:merchants FROMLONLAT 107.6110 -6.8920 BYRADIUS 500 m ASC
```

---

## Entity Relationship

```
merchants (1) ────────── (N) incident_logs
   │                              │
   │ nmid                         │ nmid_scanned
   │                              │ (FK tidak digunakan — incident bisa
   └──────────────────────────────┘  merekam NMID yang tidak ada di DB)
```

> **Catatan Desain:** `incident_logs.nmid_scanned` **tidak menggunakan foreign key** ke `merchants.nmid` secara sengaja. Ini memungkinkan pencatatan kejadian fraud di mana NMID tidak terdaftar (Stiker B — `ID99999999980`).

---

*Dokumen ini merupakan bagian dari submission HackNusa 2026 — ValidQR by NusaPay*

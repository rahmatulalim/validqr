# Arsitektur ValidQR — Adaptive Real-Time Anti-Fraud SDK

## Gambaran Umum

ValidQR dirancang dengan arsitektur berlapis (_layered architecture_) yang memisahkan tanggung jawab antara mobile client, API gateway, data layer, dan integration layer. Setiap lapisan berkomunikasi secara asinkron dan memiliki mekanisme _fallback_ mandiri.

---

## Diagram 4-Layer Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: CLIENT LAYER (Flutter SDK — NusaPay)                  │
│                                                                   │
│  ┌──────────────┐  scan()  ┌──────────────────────────────────┐ │
│  │ mobile_scanner│ ──────► │ QR Payload Parser (EMVCo TLV)    │ │
│  │ (camera)     │          │ Extract: NMID, name, city         │ │
│  └──────────────┘          └────────────────┬─────────────────┘ │
│                                              │ POST /verify/scan  │
└──────────────────────────────────────────────┼────────────────────┘
                                               │
┌──────────────────────────────────────────────▼────────────────────┐
│  LAYER 2: SECURITY ENGINE & API GATEWAY (Node.js + Express)       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ scanController.ts                                            │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │ LAYER 1 SECURITY: NMID Cross-Validation             │    │ │
│  │  │ nmidValidator.ts ──► SELECT FROM merchants          │    │ │
│  │  │ Mismatch → HARD_BLOCK (RED) + WA Alert              │    │ │
│  │  └────────────────────────┬────────────────────────────┘    │ │
│  │                           │ valid                            │ │
│  │  ┌────────────────────────▼────────────────────────────┐    │ │
│  │  │ LAYER 2 SECURITY: Hybrid Fuzzy Name Matching        │    │ │
│  │  │ fuzzyMatcher.ts                                      │    │ │
│  │  │  ├─ Levenshtein Score (weight: 40%)                 │    │ │
│  │  │  ├─ Token Overlap Score (weight: 60%)               │    │ │
│  │  │  └─ Threshold: FUZZY_WARNING_THRESHOLD (default 50%)│    │ │
│  │  │ score < threshold → SOFT_WARNING (YELLOW)           │    │ │
│  │  └────────────────────────┬────────────────────────────┘    │ │
│  │                           │ score ≥ threshold                │ │
│  │  ┌────────────────────────▼────────────────────────────┐    │ │
│  │  │ LAYER 3 SECURITY: Geofencing GPS (Haversine 500m)   │    │ │
│  │  │ geofencing.ts                                        │    │ │
│  │  │  ├─ GPS tersedia → check radius 500m                │    │ │
│  │  │  │  Out of range → SOFT_WARNING (YELLOW)            │    │ │
│  │  │  └─ GPS tidak tersedia → gracefulDegradation.ts     │    │ │
│  │  │     Fallback ke hasil Layer 1 & 2 → VERIFIED        │    │ │
│  │  └────────────────────────┬────────────────────────────┘    │ │
│  │                           │ in range / degraded              │ │
│  │                    VERIFIED (GREEN)                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬────────────────────────────────────┘
                               │
         ┌─────────────────────┼──────────────────────┐
         ▼                     ▼                       ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│  LAYER 3:     │   │  LAYER 3:        │   │  LAYER 4:            │
│  PostgreSQL   │   │  Redis           │   │  WhatsApp Business   │
│               │   │  Spatial Cache   │   │  API                 │
│  merchants    │   │                  │   │                      │
│  incident_logs│   │  Geolocation     │   │  Fraud Alert →       │
│               │   │  Cache (TTL 5m)  │   │  HP Ryan (Merchant)  │
└───────────────┘   └──────────────────┘   └──────────────────────┘
```

---

## Alur 3 Lapisan Keamanan Sekuensial

### Layer 1: NMID Cross-Validation (Hard Check)

```
Input: nmid (string dari payload QRIS)
  │
  ▼
SELECT * FROM merchants WHERE nmid = $1
  │
  ├─ rows.length === 0
  │   └─► HARD_BLOCK (RED) ─────────────────────────┐
  │       reason: "NMID_MISMATCH"                    │
  │       → Trigger WhatsApp fraud alert             │
  │                                                  ▼
  └─ rows.length > 0                        [END — Block transaksi]
      └─► Lanjut ke Layer 2
```

**Kenapa Layer 1 paling penting?**
NMID (National Merchant ID) adalah identifikasi unik yang dikeluarkan oleh Bank Indonesia. Pemalsuan NMID merupakan bukti konkret penipuan.

---

### Layer 2: Hybrid Fuzzy Name Matching (Soft Check)

Algoritma hybrid digunakan karena single Levenshtein tidak cukup robust untuk variasi nama merchant:

```
Input: merchantName (dari payload QR), targetName (dari DB)
  │
  ▼
┌────────────────────────────────────────┐
│ Strategy A: Levenshtein (weight 40%)   │
│   distance = levenshtein(a, b)         │
│   score_lev = (maxLen - dist) / maxLen │
└───────────────────┬────────────────────┘
                    │
┌───────────────────▼────────────────────┐
│ Strategy B: Token Overlap (weight 60%) │
│   tokensA = name_a.split(' ')          │
│   tokensB = name_b.split(' ')          │
│   matched = tokensA ∩ tokensB          │
│   score_tok = |matched| / max(|A|,|B|) │
└───────────────────┬────────────────────┘
                    │
┌───────────────────▼────────────────────┐
│ Hybrid Score                           │
│   final = 0.4 * lev + 0.6 * tok       │
└───────────────────┬────────────────────┘
                    │
  final < FUZZY_WARNING_THRESHOLD (50%)
      └─► SOFT_WARNING (YELLOW)
  final ≥ threshold
      └─► Lanjut ke Layer 3
```

**Contoh perhitungan Stiker C (Rebrand):**
- Input: "Bakso Budi Dipatiukur"
- Target: "Warung Bakso Pak Budi"
- Levenshtein score: ~38%
- Token overlap: bakso ✓, budi ✓ → 2/max(3,4) = 50%
- Final: 0.4×38 + 0.6×50 = **45%** → SOFT_WARNING

---

### Layer 3: Geofencing GPS + Graceful Degradation

```
Input: latitude, longitude (dari device Flutter)
  │
  ├─ GPS tidak tersedia / null
  │   └─► gracefulDegradation()
  │       Gunakan hasil Layer 1 & 2
  │       Jika valid → VERIFIED (dengan flag: gps_unavailable)
  │
  └─ GPS tersedia
      └─► Haversine(deviceLoc, merchantLoc)
          │
          ├─ distance > 500m → SOFT_WARNING (YELLOW)
          │   reason: "MERCHANT_TOO_FAR"
          │
          └─ distance ≤ 500m → VERIFIED (GREEN) ✅
```

**Formula Haversine:**
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c  (R = 6371 km)
```

---

## Stack Teknologi

| Komponen | Teknologi | Alasan Pemilihan |
|----------|-----------|-----------------|
| Mobile Client | Flutter 3.22 | Cross-platform, performa native |
| API Gateway | Node.js + Express + TypeScript | Ecosystem mature, TypeScript untuk type-safety |
| Fuzzy Matching | `fast-levenshtein` + custom token | Library battle-tested + custom logic |
| Database | PostgreSQL 15 | ACID compliance, query fleksibel |
| Caching | Redis 7 | In-memory, low latency untuk geo query |
| Notification | WhatsApp Business API | Saluran komunikasi merchant di Indonesia |
| QR Parser | Custom EMVCo TLV parser | Tidak bergantung provider eksternal |
| Stiker Generator | Python + `qrcode` + `Pillow` | Rapid prototyping, library matang |

---

## Deployment Topology (Demo HackNusa)

```
[Laptop Alim]
  ├─ Backend Node.js (localhost:3000)
  ├─ PostgreSQL (localhost:5432)
  ├─ Redis (localhost:6379)
  └─ ngrok/localtunnel → public URL

[HP Alim]
  └─ Flutter NusaPay App (connect ke ngrok URL)
       ├─ Scan stiker A → GREEN
       ├─ Scan stiker B → RED + WA Alert
       └─ Scan stiker C → YELLOW

[HP Ryan]
  └─ WhatsApp → terima fraud alert real-time

[Layar Proyektor]
  └─ Scrcpy mirroring dari HP Alim
```

---

## Keputusan Desain Penting

1. **Tidak ada auth JWT** di prototype ini — sesuai scope HackNusa demo
2. **NMID penipu tidak dimasukkan ke DB** — ini yang membuat Layer 1 memblok Stiker B
3. **Stiker C pakai NMID sama dengan A** — membuktikan fuzzy matching mendeteksi rebrand fraud
4. **Threshold 50% dikonfigurasi via `.env`** — bisa di-tune tanpa rebuild
5. **Graceful Degradation** memastikan SLA 100% fallback reliability

---

*Dokumen ini merupakan bagian dari submission HackNusa 2026 — ValidQR by NusaPay*

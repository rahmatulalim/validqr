# API Specification — ValidQR Backend

**Base URL (Development):** `http://localhost:3000`  
**Base URL (Demo via ngrok):** `https://<ngrok-id>.ngrok.io`  
**API Version:** `v1`  
**Content-Type:** `application/json`

---

## Endpoints

### 1. Health Check

**`GET /health`**

Digunakan untuk memverifikasi bahwa server berjalan.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-24T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. Scan & Verifikasi QRIS

**`POST /api/v1/verify/scan`**

Endpoint utama. Menerima data hasil parsing payload QRIS dari app Flutter dan menjalankan 3 layer validasi secara sekuensial.

**Request Body:**
```json
{
  "nmid": "ID10293847561",
  "merchantName": "Warung Bakso Pak Budi",
  "latitude": -6.8915,
  "longitude": 107.6107
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|-----------|
| `nmid` | string | ✅ | National Merchant ID dari payload QRIS (tag 62, sub-tag 07) |
| `merchantName` | string | ✅ | Nama merchant dari payload QRIS (tag 59) |
| `latitude` | number | ❌ | Latitude GPS device. Null jika GPS tidak tersedia → graceful degradation |
| `longitude` | number | ❌ | Longitude GPS device. Null jika GPS tidak tersedia → graceful degradation |

---

#### Response: VERIFIED (GREEN) — Stiker A

**HTTP 200:**
```json
{
  "status": "VERIFIED",
  "color": "GREEN",
  "message": "Transaksi aman. Merchant terverifikasi.",
  "score": 100,
  "merchant": {
    "nmid": "ID10293847561",
    "name": "Warung Bakso Pak Budi",
    "city": "Bandung"
  },
  "gpsChecked": true,
  "distanceMeters": 142.5
}
```

---

#### Response: HARD_BLOCK (RED) — Stiker B

**HTTP 200:**
```json
{
  "status": "HARD_BLOCK",
  "color": "RED",
  "message": "NMID tidak terdaftar! Transaksi diblokir.",
  "reason": "NMID_MISMATCH",
  "nmid": "ID99999999980",
  "whatsappAlertSent": true
}
```

> ⚠️ `HARD_BLOCK` dikembalikan dengan HTTP 200 (bukan 4xx) agar Flutter app tetap dapat membaca body response dan menampilkan UI yang sesuai.

---

#### Response: SOFT_WARNING (YELLOW) — Stiker C

**HTTP 200:**
```json
{
  "status": "SOFT_WARNING",
  "color": "YELLOW",
  "message": "Nama merchant tidak sepenuhnya cocok. Konfirmasi diperlukan.",
  "score": 45,
  "debug": {
    "input": "bakso budi dipatiukur",
    "target": "warung bakso pak budi",
    "levenshteinDistance": 13,
    "levenshteinScore": 38.10,
    "tokensA": ["bakso", "budi", "dipatiukur"],
    "tokensB": ["warung", "bakso", "pak", "budi"],
    "matchedTokens": ["bakso", "budi"],
    "tokenScore": 50.00,
    "finalScore": 45
  },
  "threshold": 50
}
```

> ℹ️ Field `debug` hanya muncul di `NODE_ENV=development`. Di production, field ini dihapus dari response.

---

#### Response: SOFT_WARNING (GPS Out of Range)

**HTTP 200:**
```json
{
  "status": "SOFT_WARNING",
  "color": "YELLOW",
  "message": "Merchant berada di luar radius yang diharapkan (> 500m). Verifikasi manual diperlukan.",
  "reason": "MERCHANT_TOO_FAR",
  "score": 95,
  "distanceMeters": 1250.3
}
```

---

#### Response: VERIFIED (Graceful Degradation — GPS Tidak Tersedia)

**HTTP 200:**
```json
{
  "status": "VERIFIED",
  "color": "GREEN",
  "message": "Transaksi aman. GPS tidak tersedia, validasi berdasarkan NMID dan nama merchant.",
  "score": 95,
  "gpsChecked": false,
  "degraded": true
}
```

---

#### Response: Error Validasi Input

**HTTP 400:**
```json
{
  "error": "BAD_REQUEST",
  "message": "Field 'nmid' dan 'merchantName' wajib diisi.",
  "fields": ["nmid", "merchantName"]
}
```

---

### 3. Kirim Fraud Alert WhatsApp

**`POST /api/v1/notify/fraud-alert`**

Mengirimkan notifikasi fraud ke nomor WhatsApp merchant yang terdaftar.

> ⚠️ Endpoint ini dipanggil secara internal oleh `scanController` saat `HARD_BLOCK`. Dapat juga dipanggil manual untuk testing.

**Request Body:**
```json
{
  "nmid": "ID99999999980",
  "suspectedMerchantName": "Toko Aksesoris Penipu",
  "buyerLocation": {
    "latitude": -6.8915,
    "longitude": 107.6107
  },
  "timestamp": "2026-09-24T00:00:00.000Z"
}
```

**Response 200:**
```json
{
  "success": true,
  "whatsappMessageId": "wamid.xxx",
  "sentTo": "6281234567890",
  "message": "Fraud alert berhasil dikirim ke merchant."
}
```

**Response 503 (WA API tidak tersedia):**
```json
{
  "success": false,
  "error": "WHATSAPP_UNAVAILABLE",
  "message": "WhatsApp API tidak dapat dihubungi. Alert dicatat di database."
}
```

---

## Status Codes Ringkasan

| HTTP Code | Kondisi |
|-----------|---------|
| `200` | Semua hasil validasi (GREEN/RED/YELLOW) — response body menentukan status |
| `400` | Request body tidak valid / field wajib hilang |
| `500` | Internal server error |
| `503` | Service downstream tidak tersedia (WhatsApp API, DB) |

---

## Kode Status ValidQR

| `status` | `color` | Layer | Tindakan App |
|----------|---------|-------|-------------|
| `VERIFIED` | `GREEN` | L1+L2+L3 ✅ | Lanjutkan pembayaran |
| `SOFT_WARNING` | `YELLOW` | L2 atau L3 ⚠️ | Tampilkan peringatan, minta konfirmasi |
| `HARD_BLOCK` | `RED` | L1 ❌ | Blokir pembayaran, tampilkan alert |

---

## Contoh cURL

```bash
# Scan Stiker A (VERIFIED)
curl -X POST http://localhost:3000/api/v1/verify/scan \
  -H "Content-Type: application/json" \
  -d '{"nmid":"ID10293847561","merchantName":"Warung Bakso Pak Budi","latitude":-6.8915,"longitude":107.6107}'

# Scan Stiker B (HARD_BLOCK)
curl -X POST http://localhost:3000/api/v1/verify/scan \
  -H "Content-Type: application/json" \
  -d '{"nmid":"ID99999999980","merchantName":"Toko Aksesoris Penipu","latitude":-6.8915,"longitude":107.6107}'

# Scan Stiker C (SOFT_WARNING)
curl -X POST http://localhost:3000/api/v1/verify/scan \
  -H "Content-Type: application/json" \
  -d '{"nmid":"ID10293847561","merchantName":"Bakso Budi Dipatiukur","latitude":-6.8915,"longitude":107.6107}'

# Scan tanpa GPS (Graceful Degradation)
curl -X POST http://localhost:3000/api/v1/verify/scan \
  -H "Content-Type: application/json" \
  -d '{"nmid":"ID10293847561","merchantName":"Warung Bakso Pak Budi"}'
```

---

*Dokumen ini merupakan bagian dari submission HackNusa 2026 — ValidQR by NusaPay*

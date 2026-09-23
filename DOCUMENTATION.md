# Dokumentasi Teknis ValidQR

## Gambaran Umum Sistem

ValidQR adalah SDK anti-fraud berbasis kecerdasan adaptif yang mendeteksi stiker QRIS palsu secara real-time. Dokumen ini menjelaskan arsitektur teknis, alur data, dan keputusan implementasi yang diambil selama pengembangan untuk HackNusa 2026.

---

## Alur Data End-to-End

```
1. Pengguna buka NusaPay → tap "Scan QRIS"
2. Flutter membuka kamera via mobile_scanner
3. QR terdeteksi → payload string didapat
4. qrParser.dart parse payload EMVCo TLV → {nmid, merchantName, city}
5. Flutter ambil koordinat GPS via geolocator
6. POST /api/v1/verify/scan {nmid, merchantName, lat, lon}
7. Backend:
   a. Layer 1: query PostgreSQL, check nmid
   b. Layer 2: fuzzyMatch(merchantName, db.name)
   c. Layer 3: haversine(userLoc, merchantLoc)
8. Response {status, color, score?, debug?}
9. Flutter tampilkan StatusCard dengan warna sesuai
10. Jika RED → kirim WA alert ke merchant
11. Catat ke incident_logs
```

---

## Implementasi EMVCo TLV

Format QRIS mengikuti standar EMVCo QR Code Specification for Payment Systems v1.1.

### Struktur TLV

Setiap field dalam payload QRIS mengikuti format:
```
[Tag: 2 digit][Length: 2 digit][Value: N char]
```

Contoh: `5913Warung Bakso` → Tag `59`, Length `13`, Value `Warung Bakso`

### Fields yang Digunakan ValidQR

| Tag | Nama Field | Cara Parse |
|-----|-----------|-----------|
| `59` | Merchant Name | Langsung dari TLV root |
| `60` | Merchant City | Langsung dari TLV root |
| `61` | Postal Code | Langsung dari TLV root |
| `62` | Additional Data | Nested TLV → sub-tag `07` = NMID |
| `63` | CRC-16 | Verifikasi checksum (CRC-16/CCITT-FALSE) |

### Nested TLV (Tag 62 — Additional Data)

Tag 62 berisi nested TLV. Sub-tag `07` menyimpan Reference Label yang berisi NMID:
```
62 [len] [07 [nmid_len] [NMID_VALUE] ...]
```

---

## Algoritma CRC-16/CCITT-FALSE

Checksum dihitung atas seluruh payload hingga sebelum nilai tag `63`, termasuk "6304":

```
Polynomial: 0x1021
Initial value: 0xFFFF
Input reflection: False
Output reflection: False
Final XOR: 0x0000
```

Implementasi ada di `backend/src/utils/crc16.ts` dan `demo/scripts/generate_stickers.py`.

---

## Hybrid Fuzzy Matching — Justifikasi Teknis

### Kenapa Tidak Pure Levenshtein?

Pure Levenshtein distance memiliki kelemahan:
1. Sensitif terhadap panjang string — "Budi" vs "Warung Bakso Pak Budi" akan selalu skor rendah
2. Tidak menangkap kesamaan berbasis kata — "Bakso Budi" vs "Budi Bakso" dianggap berbeda

### Kenapa Tidak Pure Token Overlap?

Token overlap terlalu permisif:
1. "Toko Mie Pak Budi" vs "Warung Bakso Pak Budi" → 2/4 = 50% (terlalu tinggi)
2. Tidak memperhitungkan edit distance pada level karakter

### Solusi: Hybrid Weighted Average

```
final_score = 0.4 × levenshtein_score + 0.6 × token_overlap_score
```

Bobot token overlap lebih tinggi karena nama merchant Indonesia sering mengandung kata kunci umum ("warung", "toko", "pak") yang tidak relevan untuk pencocokan, tetapi nama unik ("bakso", "budi") lebih signifikan.

### Kalibrasi Threshold

Hasil pengujian dengan 3 stiker demo:

| Stiker | Levenshtein | Token Overlap | Final | Status |
|--------|------------|--------------|-------|--------|
| A (Asli) | 100% | 100% | **100%** | ✅ VERIFIED |
| B (Penipu) | ~22% | 0% | **~9%** | 🔴 HARD_BLOCK (gagal di Layer 1) |
| C (Rebrand) | ~38% | 50% | **~45%** | 🟡 SOFT_WARNING |

Threshold 50% memastikan Stiker C selalu masuk SOFT_WARNING range.

---

## Geofencing — Haversine Formula

Radius geofence: **500 meter**.

```typescript
const R = 6371000; // Earth radius in meters
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
```

### Graceful Degradation

Jika `latitude` atau `longitude` adalah `null/undefined`:
- Skip Layer 3 sepenuhnya
- Kembalikan hasil berdasarkan Layer 1 & 2
- Tambahkan flag `degraded: true` dan `gpsChecked: false` pada response

---

## WhatsApp Business API Integration

### Format Pesan Fraud Alert

```
🚨 *PERINGATAN FRAUD — ValidQR*

Terdeteksi percobaan penipuan menggunakan QRIS Anda.

📍 *Detail Insiden:*
• Nama pada stiker: Toko Aksesoris Penipu
• NMID yang terdeteksi: ID99999999980
• Waktu: 24 Sep 2026, 00:15 WIB
• Lokasi approx: Bandung, Jawa Barat

✅ Transaksi telah *diblokir* oleh sistem ValidQR.

Jika ini bukan Anda, segera laporkan ke:
📞 NusaPay Support: 1500-XXX
```

### Endpoint WhatsApp API

```
POST https://graph.facebook.com/v18.0/{PHONE_ID}/messages
Authorization: Bearer {WA_API_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "6281234567890",
  "type": "text",
  "text": { "body": "..." }
}
```

---

## Konfigurasi Environment Variables

| Variable | Default | Keterangan |
|----------|---------|-----------|
| `NODE_ENV` | `development` | Mode runtime |
| `PORT` | `3000` | Port HTTP server |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `REDIS_URL` | - | Redis connection string |
| `WA_API_URL` | - | WhatsApp API endpoint |
| `WA_API_TOKEN` | - | WhatsApp API Bearer token |
| `FUZZY_WARNING_THRESHOLD` | `50` | Threshold skor fuzzy (0-100) |

---

## Troubleshooting Umum

| Problem | Kemungkinan Penyebab | Solusi |
|---------|---------------------|--------|
| API timeout > 200ms | PostgreSQL cold start | Pastikan DB sudah warm up |
| WA alert tidak terkirim | Token expired | Refresh WA_API_TOKEN |
| Flutter cannot connect | ngrok URL expired | Restart ngrok, update `constants.dart` |
| GPS always null | Emulator tanpa GPS | Gunakan device fisik atau mock GPS |
| QR tidak terbaca | Stiker kualitas cetak rendah | Cetak ulang dengan DPI ≥ 300 |
| Fuzzy score berbeda dari harapan | Typo pada seed data | Verifikasi `seed.sql` merchant name |

---

*Dokumen ini merupakan bagian dari submission HackNusa 2026 — ValidQR by NusaPay*

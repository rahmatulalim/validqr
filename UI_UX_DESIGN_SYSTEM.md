# UI/UX Design System — ValidQR (NusaPay)

## 1. Prinsip Desain

ValidQR mengikuti prinsip **"Kejelasan di Atas Segalanya"** — setiap tampilan harus dapat dipahami dalam **kurang dari 3 detik** oleh pengguna awam yang baru saja melakukan scan QR.

| Prinsip | Implementasi |
|---------|-------------|
| **Clarity** | Warna status mencolok, teks singkat dalam Bahasa Indonesia |
| **Trust** | Animasi smooth, tidak ada delay UI, feedback instan |
| **Safety First** | Warna merah/kuning/hijau mengikuti konvensi internasional |
| **Progressive Disclosure** | Detail teknis (skor fuzzy) tersembunyi di balik expand |

---

## 2. Palet Warna

### Primary Colors

| Token | Hex | RGB | Penggunaan |
|-------|-----|-----|-----------|
| `colorPrimary` | `#1A73E8` | `26, 115, 232` | Button utama, header |
| `colorPrimaryDark` | `#0D47A1` | `13, 71, 161` | AppBar background |
| `colorAccent` | `#00BCD4` | `0, 188, 212` | Highlight, icon aktif |

### Status Colors (Kritis — Harus Konsisten)

| Token | Hex | Status | Penggunaan |
|-------|-----|--------|-----------|
| `colorVerified` | `#00C853` | VERIFIED/GREEN | Background card hasil aman |
| `colorVerifiedDark` | `#1B5E20` | - | Teks pada background hijau |
| `colorWarning` | `#FFD600` | SOFT_WARNING/YELLOW | Background card peringatan |
| `colorWarningDark` | `#F57F17` | - | Teks pada background kuning |
| `colorDanger` | `#D50000` | HARD_BLOCK/RED | Background card blokir |
| `colorDangerDark` | `#B71C1C` | - | Teks pada background merah |

### Neutral Colors

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `colorBackground` | `#F5F5F5` | Background layar utama |
| `colorSurface` | `#FFFFFF` | Card, dialog |
| `colorOnSurface` | `#212121` | Teks utama |
| `colorSecondaryText` | `#757575` | Teks sekunder, label |
| `colorDivider` | `#E0E0E0` | Garis pembatas |

---

## 3. Tipografi

Gunakan **Google Fonts: Inter** sebagai font utama.

```dart
// Di pubspec.yaml
fonts:
  - family: Inter
    fonts:
      - asset: assets/fonts/Inter-Regular.ttf
      - asset: assets/fonts/Inter-Medium.ttf
        weight: 500
      - asset: assets/fonts/Inter-SemiBold.ttf
        weight: 600
      - asset: assets/fonts/Inter-Bold.ttf
        weight: 700
```

### Typescale

| Token | Size | Weight | Penggunaan |
|-------|------|--------|-----------|
| `headlineLarge` | 28sp | Bold (700) | Judul layar splash |
| `headlineMedium` | 22sp | SemiBold (600) | Status utama hasil scan |
| `titleLarge` | 18sp | SemiBold (600) | Nama merchant |
| `bodyLarge` | 16sp | Regular (400) | Teks deskripsi |
| `bodyMedium` | 14sp | Regular (400) | Label, meta info |
| `labelSmall` | 11sp | Medium (500) | Badge, tag |

---

## 4. Komponen UI

### 4.1 Scanner Screen

```
┌──────────────────────────────────┐
│  [AppBar] Scan QRIS              │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      [CAMERA FEED]         │  │
│  │                            │  │
│  │   ┌──────────────────┐    │  │
│  │   │                  │    │  │
│  │   │  [SCAN OVERLAY]  │    │  │  ← Border animasi pulse biru
│  │   │                  │    │  │
│  │   └──────────────────┘    │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  "Arahkan kamera ke QRIS"        │  ← Hint text
│                                  │
└──────────────────────────────────┘
```

**Animasi Scanner:**
- Border overlay scanner: pulse animation (opacity 0.3 → 1.0 → 0.3, durasi 1.5s, repeat)
- Saat QR terdeteksi: border berubah menjadi kuning, freeze frame 500ms

### 4.2 Result Screen — VERIFIED (GREEN)

```
┌──────────────────────────────────┐
│  ╔══════════════════════════════╗ │
│  ║  ✅  TRANSAKSI AMAN          ║ │  ← Background #00C853
│  ║                              ║ │
│  ║  Warung Bakso Pak Budi       ║ │
│  ║  Skor Kecocokan: 100%        ║ │
│  ║  GPS: Dalam radius 142m      ║ │
│  ╚══════════════════════════════╝ │
│                                  │
│  [Lanjutkan Pembayaran]          │  ← Button primary
│  [Scan Ulang]                    │  ← Button outline
└──────────────────────────────────┘
```

### 4.3 Result Screen — HARD_BLOCK (RED)

```
┌──────────────────────────────────┐
│  ╔══════════════════════════════╗ │
│  ║  🚫  TRANSAKSI DIBLOKIR      ║ │  ← Background #D50000
│  ║                              ║ │
│  ║  NMID tidak terdaftar!       ║ │
│  ║  Stiker ini kemungkinan      ║ │
│  ║  palsu. JANGAN BAYAR!        ║ │
│  ╚══════════════════════════════╝ │
│                                  │
│  Alert telah dikirim ke merchant ✓│
│                                  │
│  [Kembali]                       │
└──────────────────────────────────┘
```

**Animasi:** Card RED muncul dengan shake animation (3× lateral, 200ms) untuk menarik perhatian.

### 4.4 Result Screen — SOFT_WARNING (YELLOW)

```
┌──────────────────────────────────┐
│  ╔══════════════════════════════╗ │
│  ║  ⚠️  KONFIRMASI DIPERLUKAN   ║ │  ← Background #FFD600
│  ║                              ║ │
│  ║  Nama merchant tidak cocok   ║ │
│  ║                              ║ │
│  ║  QR menunjukkan:             ║ │
│  ║  "Bakso Budi Dipatiukur"     ║ │
│  ║                              ║ │
│  ║  Terdaftar sebagai:          ║ │
│  ║  "Warung Bakso Pak Budi"     ║ │
│  ║                              ║ │
│  ║  Skor Kecocokan: 45%  [?]   ║ │  ← Tap [?] expand detail
│  ╚══════════════════════════════╝ │
│                                  │
│  [Lanjutkan] [Batalkan]          │
└──────────────────────────────────┘
```

### 4.5 Status Card Widget

```dart
// Properti StatusCard
class StatusCard extends StatelessWidget {
  final ScanStatus status; // VERIFIED, SOFT_WARNING, HARD_BLOCK
  final String merchantName;
  final int? fuzzyScore;
  final FuzzyDebug? debugInfo; // nullable, tampil hanya jika ada
  final bool gpsChecked;
  final double? distanceMeters;
}
```

### 4.6 Alert Dialog (Konfirmasi SOFT_WARNING)

```dart
// Dialog muncul setelah user tap [Lanjutkan] pada YELLOW status
AlertDialog(
  title: Text('Konfirmasi Pembayaran'),
  content: Text(
    'Nama merchant pada QR tidak sepenuhnya cocok dengan data terdaftar. '
    'Pastikan Anda sudah mengonfirmasi dengan merchant sebelum melanjutkan.'
  ),
  actions: [
    TextButton(child: Text('Batal'), onPressed: ...),
    ElevatedButton(
      style: ElevatedButton.styleFrom(backgroundColor: colorWarning),
      child: Text('Saya Mengerti, Lanjutkan'),
      onPressed: ...
    ),
  ],
)
```

---

## 5. Ikonografi

| Situasi | Icon | Warna |
|---------|------|-------|
| VERIFIED | `Icons.check_circle` | `colorVerified` |
| SOFT_WARNING | `Icons.warning_amber` | `colorWarning` |
| HARD_BLOCK | `Icons.block` | `colorDanger` |
| GPS aktif | `Icons.location_on` | `colorPrimary` |
| GPS tidak aktif | `Icons.location_off` | `colorSecondaryText` |
| WA Alert terkirim | `Icons.send` | `Colors.green` |

---

## 6. Animasi & Transisi

| Elemen | Animasi | Durasi |
|--------|---------|--------|
| Navigasi antar screen | Slide Up | 300ms |
| Status card muncul | Fade + Scale (0.8 → 1.0) | 400ms |
| RED card | Shake lateral | 600ms (3 kali) |
| Loading indicator | CircularProgressIndicator | Continous |
| Scanner overlay border | Pulse opacity | 1500ms loop |

---

## 7. Spacing & Layout

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `spacing4` | 4dp | Gap micro |
| `spacing8` | 8dp | Gap kecil |
| `spacing16` | 16dp | Padding card, margin standar |
| `spacing24` | 24dp | Section spacing |
| `spacing32` | 32dp | Vertical section |

**Border Radius:**
- Card: 16dp
- Button: 12dp
- Chip/Badge: 8dp

---

*Dokumen ini merupakan bagian dari submission HackNusa 2026 — ValidQR by NusaPay*

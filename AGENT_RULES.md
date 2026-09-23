# AGENT_RULES.md — Konvensi Kode ValidQR

Dokumen ini mendefinisikan aturan dan konvensi yang harus diikuti oleh semua kontributor (manusia maupun AI agent) saat bekerja di repositori ValidQR.

---

## 1. Prinsip Umum

1. **Tidak ada hardcode** — Semua nilai konfigurasi (threshold, URL, token) harus dari environment variable atau `config/env.ts`
2. **Tidak ada fitur di luar scope** — Prototype HackNusa. Jangan tambah fitur yang tidak ada di PRD.
3. **Bahasa Indonesia untuk user-facing strings** — Semua teks yang ditampilkan ke pengguna dalam Bahasa Indonesia
4. **English untuk kode, komentar teknis, dan log** — Konsistensi dengan ekosistem library yang digunakan
5. **Audit trail wajib** — Setiap scan HARUS dicatat di `incident_logs`

---

## 2. TypeScript (Backend)

### 2.1 Type Safety

```typescript
// ✅ BENAR — selalu beri tipe eksplisit
const validateNMID = async (nmid: string): Promise<{ valid: boolean; merchant?: Merchant }> => { ... }

// ❌ SALAH — hindari any
const doSomething = async (data: any): Promise<any> => { ... }
```

### 2.2 Error Handling

```typescript
// ✅ BENAR — selalu wrap async dalam try/catch di controller
try {
  const result = await someService(data);
  return res.json(result);
} catch (error) {
  return next(error); // delegate ke errorHandler middleware
}

// ❌ SALAH — jangan biarkan unhandled promise
someService(data).then(result => res.json(result));
```

### 2.3 Environment Variables

```typescript
// ✅ BENAR — akses via config object
import { config } from '../config/env';
const threshold = config.fuzzyWarningThreshold;

// ❌ SALAH — akses langsung tanpa validasi
const threshold = parseInt(process.env.FUZZY_WARNING_THRESHOLD!);
```

### 2.4 Naming Conventions

| Elemen | Convention | Contoh |
|--------|-----------|--------|
| File | camelCase | `fuzzyMatcher.ts` |
| Function | camelCase | `validateNMID()` |
| Interface | PascalCase | `ParsedQRIS` |
| Type | PascalCase | `ScanStatus` |
| Constant | SCREAMING_SNAKE | `HARD_BLOCK` |
| Environment var | SCREAMING_SNAKE | `FUZZY_WARNING_THRESHOLD` |

---

## 3. Flutter / Dart (Mobile)

### 3.1 Widget Structure

```dart
// ✅ BENAR — pisahkan logika dari UI
class ScannerScreen extends StatefulWidget { ... }

class _ScannerScreenState extends State<ScannerScreen> {
  // Hanya state dan lifecycle methods di sini
  // Panggil service dari api_service.dart, bukan langsung http.post
}

// ❌ SALAH — jangan letakkan business logic di dalam widget
Widget build(BuildContext context) {
  final response = await http.post(...); // ← Jangan ini
}
```

### 3.2 State Management

- Gunakan `Provider` untuk state global (status scan, history)
- Gunakan `setState` hanya untuk state lokal UI (loading indicator, form)

### 3.3 Naming Conventions

| Elemen | Convention | Contoh |
|--------|-----------|--------|
| File | snake_case | `scanner_screen.dart` |
| Class | PascalCase | `ScannerScreen` |
| Method | camelCase | `handleScanResult()` |
| Variable | camelCase | `scanResponse` |
| Constant | lowerCamelCase | `apiBaseUrl` |

---

## 4. Python (Scripts)

### 4.1 Script Standards

```python
#!/usr/bin/env python3
"""
Docstring wajib di setiap file, menjelaskan:
- Tujuan script
- Input/Output
- Cara menjalankan
"""

# Gunakan type hints
def build_tlv(tag: str, value: str) -> str: ...
```

### 4.2 Path Handling

```python
# ✅ BENAR — gunakan pathlib
from pathlib import Path
out = Path(__file__).parent.parent / "qr_props" / filename

# ❌ SALAH — jangan string concatenation untuk path
out = "../qr_props/" + filename
```

---

## 5. SQL

### 5.1 Idempotency

```sql
-- ✅ BENAR — selalu idempotent
CREATE TABLE IF NOT EXISTS merchants ( ... );
CREATE INDEX IF NOT EXISTS idx_merchants_nmid ON merchants(nmid);

-- ❌ SALAH — akan error jika dijalankan dua kali
CREATE TABLE merchants ( ... );
```

### 5.2 Seed Data

```sql
-- ✅ BENAR — gunakan ON CONFLICT untuk seed
INSERT INTO merchants (nmid, name, ...)
VALUES ('ID10293847561', 'Warung Bakso Pak Budi', ...)
ON CONFLICT (nmid) DO NOTHING;
```

---

## 6. Fuzzy Matching — Aturan Khusus

> **CRITICAL:** Jangan pernah hardcode skor fuzzy. Skor HARUS dihitung oleh `fuzzyMatch()` di `fuzzyMatcher.ts`.

```typescript
// ✅ BENAR
const { score, debug } = fuzzyMatch(merchantName, nmidCheck.merchant.name);

// ❌ SALAH — DILARANG KERAS
const score = 78; // Hardcoded!
```

Jika perlu menyesuaikan sensitivitas, ubah `FUZZY_WARNING_THRESHOLD` di `.env`, bukan di kode.

---

## 7. Git Conventions

### Branch Naming

```
feature/nama-fitur
fix/nama-bug
docs/nama-dokumen
chore/nama-tugas
```

### Commit Message (Bahasa Inggris)

```
feat: add hybrid fuzzy matching algorithm
fix: handle null GPS coordinates in geofencing
docs: update API_SPECIFICATION with debug field
chore: add jest config for backend tests
```

---

## 8. Testing

### Coverage Requirement (Backend)

| Modul | Coverage Target |
|-------|----------------|
| `fuzzyMatcher.ts` | 100% |
| `nmidValidator.ts` | 90% |
| `qrParser.ts` | 90% |
| `geofencing.ts` | 80% |
| `scanController.ts` | 80% |

### Test Naming

```typescript
describe('fuzzyMatcher (hybrid)', () => {
  it('Sticker A: exact match → score 100', () => { ... });
  it('Sticker C: rebrand → mid score (SOFT_WARNING range)', () => { ... });
  it('Sticker B: different merchant → low score', () => { ... });
});
```

---

*Dokumen ini berlaku untuk seluruh kontributor ValidQR — HackNusa 2026*

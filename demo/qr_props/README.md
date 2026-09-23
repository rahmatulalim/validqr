# Props QRIS Demo HackNusa

Folder ini adalah tempat output script pembuat stiker QRIS.

## Cara Membuat Stiker

Jalankan perintah berikut dari root repositori:

```bash
cd demo/scripts
pip install -r requirements.txt
python generate_stickers.py
```

Script akan membuat 3 file PNG di folder ini:
1. `stiker_a_asli.png` (NMID asli, Nama asli)
2. `stiker_b_penipu.png` (NMID penipu, Nama penipu)
3. `stiker_c_rebrand.png` (NMID asli, Nama diubah sedikit)

## Cara Menggunakan untuk Demo Panggung

1. Buka ketiga file PNG tersebut.
2. Print pada kertas sticker ukuran A4 (layout 4 per halaman sudah cukup besar agar kamera HP Alim bisa scan dari jarak 30cm).
3. Potong sesuai garis pinggir hitam.
4. (Opsional) Laminasi stiker agar tidak silau/mengkilap saat disorot lampu panggung. Kamera mobile_scanner sensitif terhadap glare.
5. Tempel stiker pada papan/acrylic kecil yang mudah diangkat dan ditunjukkan ke juri.

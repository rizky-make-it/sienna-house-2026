# SIENNA — A home, considered.

Website 3D terpisah untuk SIENNA Catalogue 2026. Tidak mengganti proyek Ruang.

Repository baru (privat): https://github.com/rizky-make-it/sienna-house-2026

## Menjalankan lokal

1. Install Node.js 20+.
2. Buka folder website ini, jalankan `npm run dev`.
3. Buka http://127.0.0.1:4174. Jangan membuka index.html dengan file:// karena
   pemuatan model GLB membutuhkan server HTTP.
4. Tidak perlu npm install / build. Three.js 0.186.1, Draco, dan font disimpan lokal.

## GitHub → Vercel

1. Push seluruh folder website ke repository baru (termasuk dist).
2. Di Vercel, Add New → Project → Import repository tersebut.
3. Framework Preset: Other. Root Directory: repository root.
4. Build Command: kosong. Output Directory: dist. Install Command: kosong.
5. Deploy. vercel.json sudah mendeklarasikan outputDirectory.
6. Perubahan yang dipush ke main dapat dideploy otomatis setelah integrasi Git
   diaktifkan di Vercel. Tidak ada API key atau backend yang diperlukan website.

Manifest .openai/hosting.json hanya dipakai deployment Sites, bukan Vercel.
Jangan mempublikasikan token / credential / folder .local atau .vercel.

## Penggunaan

- Room tour: geser untuk menoleh, WASD / panah setelah klik canvas, atau tombol
  layar untuk berjalan. Rute antarruang melalui Gallery Hall dan bukaan living–dining.
- Klik furnitur untuk SKU, dimensi dan interaksi laci/pintu.
- Inspeksi produk: orbit / pan / zoom, buka/tutup bagian, unduh GLB per SKU.
- Orbit rumah: pandangan keseluruhan tanpa atap. Esc / Rumah untuk kembali.
- Foto kecil pada daftar produk berasal dari katalog asli; model 3D merupakan
  rekonstruksi. Renders galeri berasal dari Blender Cycles, bukan gambar AI.

## File

- dist/: website siap deploy, seluruh asset dan unduhan.
- dist/downloads/sienna-house.blend: master scene metrik, tekstur terkemas.
- dist/downloads/sienna-project.zip: script Blender + tekstur + metadata.
- dist/assets/sienna-house.glb: rumah lengkap tanpa atap untuk browser.
- dist/assets/models/: 14 model produk, satu file per SKU, dengan pivot gerak.
- dist/downloads/*-4k.png: render lossless asli 3840 × 2160.
- dist/downloads/render-proof.json: ukuran, resolusi dan SHA-256 setiap render.

Di Blender: file membuka tampilan kamera master / Material Preview. Produk
dikelompokkan per ruang dan SKU. Marker kamera pada frame 1 / 31 / 61 / 91
berpindah ke master / dining / living / guest. Numpad 0 keluar/masuk kamera.

## Batas interpretasi

14 SKU mengikuti ukuran yang tercetak di katalog. Axes model: X lebar, Y kedalaman,
Z tinggi, front -Y. Dimensi UI: lebar × kedalaman × tinggi. Untuk bed, lebar adalah
1630 / 1930 dan kedalaman / panjang 2125 mm. Handle dapat menonjol dari dimensi body.
Tallboy B51: katalog menulis “2 Over 4 Drawers” tetapi menampilkan empat muka
laci lebar; model mengikuti foto. Lamp table L11: 550 × 550 × 550 mm pada halaman 5.

Ini studi visual, bukan CAD atau gambar kerja pabrikan. Denah, joinery tersembunyi,
kursi, sofa, ornamen dan aksesori adalah interpretasi desain. Ruangan kamar King
dan Queen berbeda agar kedua varian ditampilkan secara fisik dalam satu rumah.

Browser menggunakan pencahayaan real-time dan environment reflections, bukan
ray-tracing Cycles. Kualitas bayangan / frame rate tergantung perangkat. WebGL2
dibutuhkan; gambar dan unduhan masih tersedia tanpa WebGL.

## Kredit

Referensi produk: SIENNA CATALOGUE 2026.pdf yang diberikan pemilik proyek,
Living Ikon, 6 halaman. Tidak mengklaim afiliasi / persetujuan pabrikan.
Ash Veneer: Jenelle van Heerden / Poly Haven (CC0),
https://polyhaven.com/a/ash_veneer . Warm Brown adalah interpretasi stain.
Three.js 0.186.1 (MIT); Draco decoder (Apache 2.0); DM Sans dan Instrument Serif
(SIL Open Font License). Lihat dist/credits.html dan lisensi vendored.

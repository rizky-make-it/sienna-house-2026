# SIENNA — The Open Gallery

Website 3D terpisah untuk SIENNA Catalogue 2026. Tidak mengganti proyek Ruang.

Repository publik: https://github.com/rizky-make-it/sienna-house-2026
Website GitHub Pages: https://rizky-make-it.github.io/sienna-house-2026/

Website dan visualisasi 3D dibuat oleh Muhammad Rizky.

## Pameran terbuka

Versi terbaru adalah pameran furnitur tanpa tembok, sekat, kusen, tirai, atau atap.
Empat zona display dibedakan melalui lantai inset dan penanda informasi, dengan
jalur tengah serta sirkulasi di sisi luar. Ukuran dan 14 SKU katalog tetap sama;
17 penempatan produk dan 32 pivot laci/pintu dipertahankan.

Browser mulai dalam mode Orbit pameran. Pilih zona atau Jelajah untuk berjalan.
Collider tembok lama dihapus; collision furnitur dan kaki display tetap aktif.
Versi rumah lama disimpan terpisah dalam workspace, tidak dihapus.

## Permintaan file via WhatsApp

Semua tombol permintaan file membuka pop-up kontak, lalu menyiapkan pesan
WhatsApp yang menyebut file atau SKU yang dipilih. Tidak ada pesan yang dikirim
otomatis. Nomor tujuan publik diatur pada dist/contact-config.js dalam format
internasional (kode negara, tanpa awalan 0). Saat ini placeholder=true dengan nomor
contoh 6200000000000: pop-up tetap berfungsi, tetapi tidak membuka chat ke nomor
contoh. Untuk mengaktifkan chat, ganti whatsappNumber dengan nomor asli lalu ubah
placeholder menjadi false. Deployment akan ditolak bila format nomor tidak valid.
Kredit kreator ditampilkan pada footer dan halaman lisensi.

Ini pengalihan alur UI, bukan kontrol akses. Repositori publik dan aset statis
tetap dapat diakses langsung; model GLB juga diperlukan oleh room tour browser.
Jangan menyimpan data rahasia pada repository atau folder dist.

## Menjalankan lokal

1. Install Node.js 20+.
2. Buka folder website ini, jalankan `npm run dev`.
3. Buka http://127.0.0.1:4174. Jangan membuka index.html dengan file:// karena
   pemuatan model GLB membutuhkan server HTTP.
4. Tidak perlu npm install / build. Three.js 0.186.1, Draco, dan font disimpan lokal.

## Hosting GitHub Pages

1. GitHub repository → Settings → Pages → Source: GitHub Actions.
2. Push perubahan ke branch main. Workflow .github/workflows/pages.yml
   memvalidasi model dan render, lalu menerbitkan folder dist saja.
3. Pantau hasil di tab Actions → Deploy SIENNA to GitHub Pages.
4. Deploy manual: pilih workflow tersebut → Run workflow → main.
5. Alamat website: https://rizky-make-it.github.io/sienna-house-2026/
6. Aset memakai path relatif agar tetap bekerja di subfolder nama repository.
   Tidak perlu npm install, build, API key, backend, atau Vercel.

Manifest .openai/hosting.json hanya dipakai deployment Sites, bukan GitHub Pages.
Jangan mempublikasikan token / credential / folder .local atau .vercel.
Repository dan website ini publik; file Blender, model, serta katalog dapat diunduh.

## Penggunaan

- Exhibition tour: mulai dari Orbit pameran. Pilih zona, lalu geser untuk menoleh,
  WASD / panah setelah klik canvas, atau tombol layar untuk berjalan tanpa sekat.
- Klik furnitur untuk SKU, dimensi dan interaksi laci/pintu.
- Inspeksi produk: orbit / pan / zoom, buka/tutup bagian, minta GLB per SKU via WhatsApp.
- Orbit pameran: pandangan seluruh display. Esc / Pameran untuk keluar dari inspeksi.
- Foto kecil pada daftar produk berasal dari katalog asli; model 3D merupakan
  rekonstruksi. Render galeri terbaru berasal dari Blender EEVEE, bukan gambar AI.

## File

- dist/: website siap deploy, seluruh asset dan unduhan.
- dist/downloads/sienna-house.blend: master pameran terbuka, metrik, tekstur terkemas.
- dist/downloads/sienna-project.zip: script Blender + tekstur + metadata.
- dist/assets/sienna-house.glb: pameran lengkap tanpa tembok atau atap untuk browser.
- dist/assets/models/: 14 model produk, satu file per SKU, dengan pivot gerak.
- dist/downloads/*-4k.png: render lossless asli 3840 × 2160.
- dist/downloads/render-proof.json: ukuran, resolusi dan SHA-256 setiap render.

Di Blender: file membuka overview pameran / Material Preview. Produk dikelompokkan
per zona dan SKU. Marker kamera pada frame 1 / 31 / 61 / 91 berpindah ke overview /
dining / living / Queen display. Numpad 0 keluar/masuk kamera. File tetap disetel
untuk Cycles; empat PNG website dirender dengan EEVEE, 64 samples, UHD 4K.

Rebuild dari ZIP: jalankan build_house.py di Blender untuk membuat basis produk,
lalu buka hasil sienna-house.blend dan jalankan build_exhibition.py. Hasilnya
sienna-exhibition.blend. Export dengan export_web.py, render dengan
render_exhibition.py -- all, dan kemas dengan prepare_assets.py --exhibition.

## Batas interpretasi

14 SKU mengikuti ukuran yang tercetak di katalog. Axes model: X lebar, Y kedalaman,
Z tinggi, front -Y. Dimensi UI: lebar × kedalaman × tinggi. Untuk bed, lebar adalah
1630 / 1930 dan kedalaman / panjang 2125 mm. Handle dapat menonjol dari dimensi body.
Tallboy B51: katalog menulis “2 Over 4 Drawers” tetapi menampilkan empat muka
laci lebar; model mengikuti foto. Lamp table L11: 550 × 550 × 550 mm pada halaman 5.

Ini studi visual, bukan CAD atau gambar kerja pabrikan. Tata pamer, joinery
tersembunyi, kursi, sofa, ornamen dan aksesori adalah interpretasi desain. King dan
Queen ditampilkan sebagai dua zona berbeda di dalam satu ruang pamer terbuka.

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

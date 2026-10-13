# Penggunaan Notasi Matematika Tipografi Unicode pada Tahap MVP

Untuk rilis awal (MVP P0), notasi matematika seperti pecahan, pangkat, dan operasi aritmetika disajikan menggunakan tipografi teks dan simbol standar Unicode tanpa memuat pustaka parser KaTeX secara penuh. Keputusan ini diambil guna memenuhi target non-fungsional ukuran bundel awal di bawah 200 KB dan menjamin performa render yang instan pada ponsel berdaya rendah (Android 8, layar 360 px), dengan parser KaTeX dijadwalkan untuk rilis penguatan berikutnya (P1) untuk rumus tingkat lanjut.

## Status
Accepted

## Konsekuensi
- Memastikan performa pemuatan halaman tetap di bawah 2,5 detik pada jaringan 4G lambat tanpa pergeseran tata letak (*layout shift*).
- Menghindari ketergantungan pustaka matematika berat di bundel awal PWA.
- Butir soal matematika dibatasi pada ekspresi yang didukung simbol teks Unicode hingga dukungan KaTeX diluncurkan pada fase P1.

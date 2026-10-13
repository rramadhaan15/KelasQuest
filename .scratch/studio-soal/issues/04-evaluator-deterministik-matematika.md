# 04: Evaluator Deterministik Perhitungan Matematika dan Verifikasi Kunci

**What to build:** Sistem mengevaluasi butir soal bernuansa numerik dan aritmatika secara deterministik menggunakan mesin komputasi kode di peladen sebelum disajikan kepada guru, memverifikasi bahwa kunci jawaban benar secara matematis dan menolak/mengganti soal yang keliru. Notasi matematika dirender menggunakan tipografi Unicode standar untuk kompatibilitas ponsel berdaya rendah (ADR 0005 & 0006).

**Blocked by:** 03: Penjanaan Soal AI Inkremental dengan Streaming dan Penyimpanan Atomik

**Status:** ready-for-agent

- [ ] Modul evaluator deterministik memvalidasi kebenaran kalkulasi numerik pada pertanyaan dan pilihan jawaban.
- [ ] Soal dengan kunci jawaban salah otomatis digantikan oleh butir soal baru yang valid.
- [ ] Simbol dan ekspresi matematika dasar dirender menggunakan tipografi Unicode tanpa layout shift di layar 360 px.
- [ ] Pengujian memverifikasi deteksi kesalahan aritmatika dan keberhasilan evaluasi deterministik tanpa ketergantungan model bahasa.

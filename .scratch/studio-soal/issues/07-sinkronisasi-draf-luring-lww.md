# 07: Sinkronisasi Draf Luring dengan Resolusi Konflik Tingkat Butir Soal

**What to build:** Guru dapat membuka, menulis, dan menyunting draf Paket Soal secara luring menggunakan IndexedDB di peramban; saat koneksi pulih, draf disinkronkan ke peladen menggunakan resolusi konflik Last-Write-Wins (LWW) per butir soal berdasarkan stempel waktu, dengan riwayat revisi 10 versi tersimpan di peladen (ADR 0003).

**Blocked by:** 05: Alur Tinjauan Guru, Regenerasi Butir Soal, dan Kesiapan Paket

**Status:** ready-for-agent

- [ ] Draf paket soal dan butir soal tersimpan otomatis di IndexedDB lokal setiap 2 detik.
- [ ] Antrean perubahan lokal otomatis disinkronkan saat status jaringan kembali daring.
- [ ] Resolusi konflik menggabungkan perubahan pada tingkat butir soal individual berdasarkan stempel waktu modifikasi.
- [ ] Deteksi multi-tab/perangkat memunculkan peringatan pengambilalihan sesi secara anggun.
- [ ] Pengujian memverifikasi alur luring-ke-daring dan integritas data tanpa kehilangan butir soal konkuren.

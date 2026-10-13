# Resolusi Konflik Sinkronisasi Offline pada Tingkat Butir Soal

Sinkronisasi antara penyimpanan draf lokal (IndexedDB) dan peladen (*server*) diselesaikan menggunakan mekanisme *Last-Write-Wins* (LWW) per butir soal individual berdasarkan stempel waktu, bukan pada tingkat paket soal utuh. Keputusan ini diambil untuk mencegah risiko terhapusnya butir soal baru atau hasil pembuatan AI di peladen ketika guru menyunting butir soal tertentu secara luring pada jaringan seluler yang tidak stabil.

## Status
Accepted

## Konsekuensi
- Setiap `ButirSoal` memiliki stempel waktu modifikasi mandiri (`diperbarui_pada`).
- Penyuntingan luring pada satu butir soal tidak akan menimpa perubahan atau penambahan pada butir-butir soal lainnya.
- Peladen menyimpan riwayat revisi 10 versi terakhir untuk memulihkan kesalahan yang tidak disengaja.

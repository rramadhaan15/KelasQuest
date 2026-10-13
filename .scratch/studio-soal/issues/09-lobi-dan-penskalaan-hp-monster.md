# 09: Lobi Siswa, Penguncian HP Monster Dinamis, dan Kompensasi Diskoneksi

**What to build:** Siswa bergabung ke Lobi Permainan tanpa login menggunakan nama panggilan dan kode kelas; HP Monster dikunci saat guru menekan "Mulai Pertarungan" berdasarkan jumlah siswa hadir aktual dan total butir soal di paket; sistem menerapkan Kompensasi Kerusakan dinamis jika ada siswa yang terputus di tengah sesi (ADR 0004).

**Blocked by:** 08: Peluncuran Sesi Boss Battle dan Snapshot Immutability

**Status:** resolved

- [x] Siswa dapat bergabung ke lobi menggunakan kode kelas secara anonim dan melihat daftar nama peserta.
- [x] HP monster dihitung dan dikunci secara definitif saat guru menekan tombol "Mulai Pertarungan" di lobi.
- [x] Durasi permainan disesuaikan secara proporsional terhadap total jumlah butir soal dalam paket.
- [x] Detak jantung koneksi memantau kehadiran siswa dan mengaktifkan pengali Kompensasi Kerusakan otomatis jika terjadi diskoneksi.
- [x] Pengujian memverifikasi perhitungan HP monster di lobi dan formula kompensasi kerusakan.

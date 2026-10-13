# Penguncian HP Monster pada Saat Lobi Selesai

Total HP Monster dan durasi permainan dihitung serta dikunci secara definitif saat guru menekan tombol *Mulai Pertarungan* setelah seluruh siswa hadir di lobi kelas, bukan saat kode kelas pertama kali dibuat. Keputusan ini diambil agar target permainan mencerminkan jumlah kehadiran siswa yang sebenarnya di kelas fisik, dengan mekanisme kompensasi kerusakan otomatis (*damage multiplier*) apabila terjadi siswa yang terputus di tengah permainan.

## Status
Accepted

## Konsekuensi
- Menghilangkan skenario di mana monster mustahil dikalahkan karena ada siswa terdaftar yang berhalangan hadir atau tidak membawa gawai.
- Rumus HP monster beradaptasi secara presisi terhadap jumlah siswa yang aktif di lobi dan jumlah aktual butir soal di dalam paket.
- Sistem permainan memantau status detak jantung (*heartbeat*) koneksi siswa untuk menerapkan pengali kerusakan kompensasi bagi siswa yang masih terhubung.

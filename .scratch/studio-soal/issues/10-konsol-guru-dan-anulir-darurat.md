# 10: Konsol Guru Langsung dengan Tindakan Darurat Anulir Soal

**What to build:** Guru mengontrol jalannya pertarungan secara langsung melalui konsol pengendali, memantau kemajuan serangan kelas secara real-time, serta memiliki tombol darurat "Anulir Soal" (*Void / Full Damage*) untuk melompati butir soal yang cacat di depan kelas tanpa menghentikan permainan (ADR 0007).

**Blocked by:** 09: Lobi Siswa, Penguncian HP Monster Dinamis, dan Kompensasi Diskoneksi

**Status:** ready-for-agent

- [ ] Konsol guru menampilkan status pertarungan kelas, sisa HP monster, dan nomor soal aktif siswa secara real-time.
- [ ] Tersedia tombol darurat "Anulir Soal Ini" pada konsol guru untuk butir soal yang dirasa keliru atau membingungkan.
- [ ] Aksi anulir langsung menghadiahkan kerusakan penuh kepada monster seolah seluruh siswa menjawab benar dan memajukan soal.
- [ ] Butir soal yang dianulir ditandai secara khusus untuk keperluan audit mutu pasca-game.
- [ ] Pengujian memverifikasi penanganan event anulir darurat dan pembaruan status permainan.

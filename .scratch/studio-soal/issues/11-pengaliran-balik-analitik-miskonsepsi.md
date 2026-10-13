# 11: Pengaliran Balik Analitik Pasca Permainan ke Statistik Butir Soal

**What to build:** Setelah sesi Boss Battle berakhir, sistem secara asinkron mengakumulasikan tingkat akurasi kelas dan sebaran pilihan salah dari Snapshot Sesi kembali ke entitas `StatistikButirSoal` pada Paket Soal induk, serta memberikan lencana "Akurasi Rendah (<30%)" di Studio Soal untuk evaluasi guru.

**Blocked by:** 10: Konsol Guru Langsung dengan Tindakan Darurat Anulir Soal

**Status:** ready-for-agent

- [ ] Worker latar belakang mengagregasikan log jawaban siswa dari sesi permainan ke Statistik Butir Soal paket asal berdasarkan ID butir soal.
- [ ] Menghitung persentase akurasi kumulatif dan frekuensi pilihan salah berlabel miskonsepsi per subtopik.
- [ ] Menampilkan penanda visual "Akurasi Rendah (<30%)" pada kartu soal di Studio Soal untuk memandu revisi guru.
- [ ] Pengujian memverifikasi alur agregasi asinkron dan akurasi perhitungan statistik pasca-sesi.

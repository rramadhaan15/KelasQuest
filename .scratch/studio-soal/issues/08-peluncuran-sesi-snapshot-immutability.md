# 08: Peluncuran Sesi Boss Battle dan Snapshot Immutability

**What to build:** Guru dapat meluncurkan permainan Boss Battle dari paket soal yang berstatus Siap Main (dengan peringatan konfirmasi lunak jika masih ada soal yang belum ditinjau); sistem membuat Snapshot Sesi tak-berubah yang membekukan seluruh butir soal dan menghasilkan kode kelas 6 digit untuk siswa (ADR 0001).

**Blocked by:** 05: Alur Tinjauan Guru, Regenerasi Butir Soal, dan Kesiapan Paket

**Status:** ready-for-agent

- [ ] Peluncuran game memunculkan dialog konfirmasi lunak jika terdapat butir soal yang belum ditinjau oleh guru.
- [ ] Sistem menyalin seluruh butir soal secara statis ke entitas Snapshot Sesi saat sesi dibuat.
- [ ] Mutasi pada draf Paket Soal setelah sesi diluncurkan tidak mempengaruhi butir soal di sesi aktif.
- [ ] Sistem menghasilkan kode kelas unik 6 karakter dan membuka lobi permainan.
- [ ] Pengujian memverifikasi sifat immutability snapshot sesi dan mekanisme konfirmasi lunak.

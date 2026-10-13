# 03: Penjanaan Soal AI Inkremental dengan Streaming dan Penyimpanan Atomik

**What to build:** Guru menekan "Buat Soal", proses penjanaan memanggil adapter AI secara asinkron, mengalirkan kartu soal satu per satu (soal pertama muncul dalam < 5 detik), menyertakan Label Miskonsepsi pada pilihan salah, dan menyimpan setiap butir soal secara atomik ke basis data di peladen segera setelah divalidasi.

**Blocked by:** 01: Fondasi Beranda Studio Soal dan Editor Manual, 02: Pustaka Capaian Pembelajaran (CP) dan Form Parameter Penjanaan

**Status:** ready-for-agent

- [ ] Adapter AI menghasilkan butir soal terstruktur lengkap dengan pembahasan dan Label Miskonsepsi pada pilihan salah.
- [ ] Pipeline di peladen menyimpan setiap butir soal yang lolos validasi otomatis secara langsung ke basis data per butir soal (ADR 0002).
- [ ] Kartu soal dialirkan ke antarmuka guru melalui koneksi streaming/realtime dengan penanda kemajuan.
- [ ] Jika koneksi jaringan pengguna terputus saat proses berjalan, butir soal yang telah tersimpan di peladen tidak hilang.
- [ ] Pengujian memverifikasi ketahanan persistensi inkremental dan struktur keluaran butir soal.

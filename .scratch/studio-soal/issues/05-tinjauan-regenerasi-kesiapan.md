# 05: Alur Tinjauan Guru, Regenerasi Butir Soal, dan Kesiapan Paket

**What to build:** Guru dapat meninjau kartu soal satu per satu dengan penanda status eksplisit (Belum Ditinjau, Disetujui, Diedit), menyetujui sekaligus via aksi "Setujui Semua", meregenerasi butir soal perorangan menggunakan arahan chip (Lebih Mudah, Lebih Sulit, Ganti Konteks, Persingkat), serta melihat transisi status kesiapan paket menjadi Siap Main setelah seluruh soal valid.

**Blocked by:** 03: Penjanaan Soal AI Inkremental dengan Streaming dan Penyimpanan Atomik

**Status:** resolved

- [x] Guru dapat meninjau, menyetujui, menyunting teks/opsi, atau menghapus butir soal individual.
- [x] Tersedia tombol "Setujui Semua yang Valid" untuk mempercepat peninjauan paket.
- [x] Aksi regenerasi per butir soal memperbarui satu kartu soal dengan arahan prompt terarah tanpa mengulang seluruh paket.
- [x] Status paket berpindah menjadi Siap Main secara otomatis jika seluruh butir soal memenuhi validitas struktural.
- [x] Pengujian memverifikasi mesin status tinjauan butir soal dan transisi kesiapan paket.

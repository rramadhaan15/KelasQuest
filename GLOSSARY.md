# Studio Soal KelasQuest

Ruang kerja guru di KelasQuest untuk menyusun, meninjau, dan mengelola paket soal berbasis Kurikulum Merdeka yang siap dimainkan dalam mode permainan kelas Boss Battle.

## Language

**Studio Soal**:
Ruang kerja digital guru untuk menyusun, menyunting, dan menyiapkan soal baik secara mandiri maupun dibantu kecerdasan buatan.
_Avoid_: Editor Kuis, Pembuat Ujian

**Paket Soal**:
Kumpulan butir soal terpadu yang dirancang untuk satu topik pembelajaran dan menjadi cetak biru permainan kelas.
_Avoid_: Set Soal, Kuis, Bank Soal, Lembar Ujian

**Butir Soal**:
Satu unit pertanyaan pilihan ganda yang dilengkapi pilihan jawaban, pembahasan, estimasi waktu, tingkat kesulitan, serta indikasi miskonsepsi.
_Avoid_: Pertanyaan, Nomor Soal

**Pilihan Jawaban**:
Opsi jawaban yang disediakan pada butir soal, terdiri dari tepat satu jawaban benar dan sejumlah pengecoh.
_Avoid_: Opsi, Distraktor

**Label Miskonsepsi**:
Deskripsi diagnostik singkat pada pilihan jawaban salah yang menjelaskan kekeliruan pemahaman konseptual siswa.
_Avoid_: Alasan Salah, Tipe Kesalahan, Tag Error

**Status Tinjauan**:
Penanda evaluasi guru terhadap kesiapan butir soal individual, bernilai Belum Ditinjau, Disetujui, atau Diedit.
_Avoid_: Approval State, Status Soal

**Status Kesiapan Paket**:
Status kelayakan teknis paket soal untuk diluncurkan ke permainan, bernilai Draf atau Siap Main.
_Avoid_: Status Publish, Status Game

**Sesi Boss Battle**:
Instansi permainan langsung di kelas tempat seluruh siswa bekerja sama menjawab soal untuk mengalahkan monster kelas.
_Avoid_: Game Room, Kelas Aktif, Pertandingan

**Snapshot Sesi**:
Salinan statis tak-berubah (immutable) dari seluruh butir soal dalam paket yang dibekukan pada saat sesi permainan diluncurkan.
_Avoid_: Salinan Kuis, Kloning Paket

**Lobi Permainan**:
Ruang tunggu interaktif tempat siswa bergabung menggunakan kode kelas sebelum pertarungan Boss Battle resmi dimulai oleh guru.
_Avoid_: Ruang Tunggu, Waiting Room

**Statistik Butir Soal**:
Agregat metrik performa butir soal berupa tingkat akurasi dan sebaran opsi salah yang dihimpun secara otomatis dari akumulasi sesi permainan.
_Avoid_: Laporan Soal, Nilai Soal

**Kompensasi Kerusakan**:
Penyesuaian daya serang otomatis bagi siswa aktif untuk menyeimbangkan target HP monster apabila ada siswa yang terputus di tengah permainan.
_Avoid_: Catch-up Damage, Penyeimbang Nilai

**Kuota Butir Soal**:
Satuan jatah pembuatan soal AI berbasis jumlah butir soal riil yang berhasil divalidasi dan disimpan ke basis data.
_Avoid_: Token Soal, Jatah Paket

**Evaluator Deterministik**:
Mesin komputasi berbasis kode untuk memvalidasi kebenaran matematis dan kunci jawaban secara pasti sebelum evaluasi berbasis model bahasa.
_Avoid_: Math LLM, Validator AI

**Kutipan Materi**:
Potongan teks ringkas dari dokumen acuan yang dipertahankan permanen pada butir soal sebagai dasar faktual pertanyaan.
_Avoid_: Sumber Teks, Rujukan Dokumen

**Anulir Butir Soal**:
Tindakan darurat guru saat sesi permainan aktif untuk melompati butir soal yang cacat dan menghadiahkan poin kerusakan penuh ke seluruh siswa.
_Avoid_: Skip Soal, Hapus Soal Game

**Ekspor Lembar Cetak**:
Berkas siap cetak (PDF/DOCX) berisi paket butir soal, lembar jawaban, dan pembahasan untuk keperluan evaluasi tertulis konvensional.
_Avoid_: Download Soal, Print Out

**Capaian Pembelajaran Terkurasi**:
Data referensi kompetensi resmi Kurikulum Merdeka yang distandardisasi secara internal dalam basis data sistem untuk konteks penjanaan AI.
_Avoid_: Silabus Web, Standar Eksternal

**Bank Soal Komunitas**:
Katalog paket soal yang dibagikan secara publik antarguru dengan sistem moderasi pasca-publikasi berbasis laporan komunitas.
_Avoid_: Marketplace Soal, Pustaka Umum

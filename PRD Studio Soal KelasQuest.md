# PRD: Studio Soal KelasQuest

Pembuat soal dengan AI dan input manual untuk guru

Versi 1.0 | 12 Oktober 2026 | Status: Draf untuk ditinjau | Modul: sisi guru untuk Boss Battle

## 1. Ringkasan

Studio Soal adalah ruang kerja guru di KelasQuest untuk menyiapkan soal yang akan dimainkan siswa di Boss Battle. Guru mengetik topik pelajaran, lalu AI menyusun satu paket soal pilihan ganda lengkap dengan pembahasan dan label miskonsepsi pada setiap pilihan jawaban salah. Guru juga bisa menulis soal sendiri, mengimpor dari Excel, atau menggabungkan semuanya dalam satu paket.

> Janji produk: dari topik ke game siap main dalam waktu kurang dari 3 menit, dengan guru tetap memegang kendali penuh atas setiap soal.

| Item | Keterangan |
| --- | --- |
| Pengguna utama | Guru SD, SMP, dan SMA di Indonesia |
| Platform | Web responsif (PWA), nyaman di HP dan laptop |
| Bahasa | Bahasa Indonesia (Inggris sebagai opsi untuk mapel Bahasa Inggris) |
| Terhubung ke | Boss Battle (20 soal per siswa) dan dashboard miskonsepsi |
| Target MVP | 6 minggu setelah desain disetujui, dengan pilot di 3 sekolah |

## 2. Masalah dan Peluang

- Menyusun 20 soal yang baik bisa memakan 1 sampai 2 jam, padahal satu guru sering mengajar banyak kelas.
- Pilihan jawaban salah buatan sendiri sering terlalu mudah ditebak, sehingga tidak mengungkap miskonsepsi siswa.
- Soal tersebar di buku, file Word, dan grup WhatsApp dengan format berbeda-beda. Memindahkannya ke platform game memakan waktu.
- Alat AI umum tidak mengenal Kurikulum Merdeka, hasilnya tidak berformat siap main, dan tidak ada pemeriksaan kunci jawaban.
- Banyak guru bekerja dari HP dengan koneksi yang tidak stabil.

Peluang: AI yang dirancang khusus untuk kelas Indonesia, dengan tinjauan guru di setiap langkah, bisa menjadi alasan utama guru memilih KelasQuest dibanding Kahoot atau Quizizz.

## 3. Tujuan, Non-Tujuan, dan Metrik

Tujuan:

1. Memangkas waktu penyiapan soal dari jam menjadi menit.
2. Menjaga kualitas dan kepercayaan: guru selalu bisa melihat, mengubah, dan menolak soal AI.
3. Menghasilkan soal yang mengungkap miskonsepsi, bukan sekadar benar atau salah.
4. Tetap lancar di HP entry-level dan koneksi lambat.

Non-tujuan untuk versi 1:

- Bukan LMS lengkap dan bukan alat penilaian ujian resmi (high-stakes).
- Tidak ada soal esai yang dinilai otomatis.
- Tidak ada pembuatan gambar oleh AI.
- Siswa tidak punya akses ke Studio Soal.

| Tujuan | Metrik | Target pilot 3 bulan |
| --- | --- | --- |
| Hemat waktu | Median waktu dari buka Studio sampai game dimulai | Di bawah 5 menit (AI), di bawah 15 menit (manual 20 soal) |
| Kualitas AI | Soal AI dipakai tanpa edit atau dengan edit ringan | Minimal 85% |
| Akurasi | Soal AI dengan kesalahan fakta atau kunci pada audit sampel | Di bawah 2% |
| Adopsi | Guru baru yang membuat paket AI dalam 7 hari pertama | Minimal 60% |
| Retensi | Guru yang membuat paket kedua dalam 14 hari | Minimal 50% |
| Kepuasan | Skor kepuasan guru terhadap Studio Soal (1 sampai 5) | Minimal 4,3 |
| Kecepatan | Waktu sampai soal pertama muncul saat generate | Di bawah 5 detik |

Target di atas adalah hipotesis awal dan akan dikalibrasi setelah pilot.

## 4. Persona

| Persona | Konteks | Kebutuhan | Kekhawatiran |
| --- | --- | --- | --- |
| Bu Rina, guru IPA SMP, 8 kelas | Laptop di sekolah, HP di rumah | Soal cepat, sesuai CP, ada pembahasan | Soal AI keliru dan memalukan di depan kelas |
| Pak Dedi, guru kelas 4 SD | Hanya HP, sinyal naik turun | Antarmuka sederhana, bisa lanjut saat sinyal kembali | Teknologi yang rumit |
| Bu Sari, guru Sejarah SMA | Punya bank soal lama di Word | Impor soal lama, menambah soal AI | Format berantakan saat impor |
| Pak Anton, koordinator mapel (fase berikutnya) | Menyiapkan soal untuk beberapa rekan | Membagikan paket yang seragam | Kualitas soal antar guru tidak sama |

## 5. Alur Pengguna Utama

1. Guru membuka Studio Soal dan menekan Paket baru.
2. Guru mengetik topik, misalnya “Penjumlahan pecahan berpenyebut beda”, lalu memilih kelas dan mapel.
3. Guru menyesuaikan jumlah soal (bawaan 20), komposisi kesulitan, dan gaya soal. Semua kolom punya nilai bawaan yang masuk akal.
4. Guru menekan Buat soal. Kartu soal muncul satu per satu dalam 20 sampai 30 detik.
5. Guru meninjau: setujui, edit, buat ulang, atau hapus. Soal manual bisa ditambahkan kapan saja.
6. Guru mencoba satu atau dua soal lewat pratinjau Main sebagai siswa.
7. Guru menekan Mulai Boss Battle. Sistem menyarankan HP monster dan batas waktu, guru menyetujui, lalu kode kelas muncul.

Jalur alternatif: guru memulai dari editor kosong (manual) atau dari impor Excel, lalu menambah soal AI untuk melengkapi.

## 6. Daftar Fitur dan Prioritas

P0 adalah wajib untuk MVP, P1 dirilis segera setelah MVP, P2 menyusul.

| ID | Fitur | Prioritas |
| --- | --- | --- |
| F1 | Beranda Studio Soal (daftar paket, cari, status) | P0 |
| F2 | Form topik dan parameter | P0 |
| F3 | Generate AI dengan streaming | P0 |
| F4 | Editor soal manual (pilihan ganda) | P0 |
| F5 | Review dan status persetujuan per soal | P0 |
| F6 | Buat ulang satu soal dan penyesuaian cepat | P0 |
| F7 | Pratinjau Main sebagai siswa | P0 |
| F8 | Kuota dan riwayat generate | P0 |
| F9 | Impor Excel atau CSV dengan template | P1 |
| F10 | Unggah materi acuan (PDF, DOCX, foto buku) | P1 |
| F11 | Pemilih Capaian Pembelajaran Kurikulum Merdeka | P1 |
| F12 | Rumus matematika (KaTeX) dan gambar | P1 |
| F13 | Pustaka pribadi (folder, tag, duplikat) | P1 |
| F14 | Draf offline dan sinkron otomatis | P1 |
| F15 | Tipe soal tambahan (benar-salah, isian singkat) | P2 |
| F16 | Bagikan tautan dan bank soal komunitas | P2 |

## 7. Spesifikasi Fitur

### 7.1 Beranda Studio Soal (F1)

Halaman pertama setelah guru masuk. Berisi tombol besar Paket baru dan daftar kartu paket soal.

- Setiap kartu menampilkan judul, lencana mapel dan kelas, jumlah soal, status (Draf atau Siap main), terakhir dimainkan, dan rata-rata akurasi kelas.
- Aksi: Buka, Duplikat, Mainkan, Hapus (disimpan 30 hari sebelum benar-benar hilang).
- Pencarian berdasarkan judul dan topik, filter berdasarkan mapel, kelas, dan status.
- Tampilan kosong berisi ajakan Mulai dari topik dan tiga contoh topik yang bisa diketuk.

Kriteria penerimaan: beranda tampil di bawah 2 detik pada 4G lambat; guru dengan 100 paket tetap bisa mencari dengan lancar; paket yang dihapus bisa dipulihkan dalam 30 hari.

### 7.2 Form topik dan parameter (F2)

| Kolom | Aturan | Bawaan |
| --- | --- | --- |
| Topik | Teks bebas 3 sampai 300 karakter, wajib. Ada saran otomatis berdasarkan mapel dan kelas | Kosong |
| Jenjang dan kelas | SD 1 sampai 6, SMP 7 sampai 9, SMA 10 sampai 12, wajib | Kelas terakhir yang dipakai |
| Mata pelajaran | Pilih dari daftar, wajib | Mapel terakhir yang dipakai |
| Capaian Pembelajaran | Opsional, pilih dari daftar atau tempel sendiri (F11) | Kosong |
| Jumlah soal | 5 sampai 40 | 20 |
| Komposisi kesulitan | Slider tiga warna: mudah, sedang, sulit | 30%, 50%, 20% |
| Waktu per soal | 10 sampai 60 detik, saran otomatis dari kesulitan dan panjang soal | 20 detik |
| Gaya soal | Langsung, Konteks sehari-hari, Cerita pendek | Konteks sehari-hari |
| Mode miskonsepsi | Pilihan jawaban salah dibuat dari kesalahan umum siswa | Aktif |
| Materi acuan | Unggah PDF, DOCX, atau foto halaman buku (F10) | Kosong |
| Instruksi tambahan | Opsional, sampai 500 karakter, misalnya “pakai nama dan tempat di Jawa Timur” | Kosong |

Kriteria penerimaan: guru bisa menekan Buat soal hanya dengan mengisi topik, kelas, dan mapel; semua pengaturan lanjutan tersembunyi dalam bagian Pengaturan lanjutan yang bisa dibuka; pilihan terakhir guru diingat untuk paket berikutnya.

### 7.3 Proses generate dan hasil (F3, F6)

Keadaan: mengantre, menyusun (soal muncul bertahap), selesai, sebagian selesai, gagal.

- Soal ditampilkan segera setelah masing-masing selesai dibuat (streaming), tidak menunggu seluruh paket.
- Guru bisa membatalkan. Soal yang sudah jadi tetap tersimpan sebagai draf.
- Tombol Tambah 5 soal lagi untuk melengkapi paket tanpa mengulang dari awal.
- Setiap kartu soal punya aksi cepat Buat ulang dengan arahan berbentuk chip: Lebih mudah, Lebih sulit, Ganti konteks, Persingkat, Perbaiki pilihan jawaban.
- Sistem mencegah soal kembar dalam satu paket dan menyebarkan posisi jawaban benar secara merata.
- Bila generate gagal sebagian, sistem mengganti soal yang gagal otomatis hingga 2 kali sebelum menampilkan pesan yang jelas.

Kriteria penerimaan: soal pertama tampil di bawah 5 detik; 20 soal selesai di bawah 30 detik pada persentil ke-90; tidak ada soal tanpa kunci jawaban yang lolos ke guru.

### 7.4 Editor soal manual (F4, F9, F12)

- Kolom soal, 2 sampai 5 pilihan (bawaan 4), penanda jawaban benar, pembahasan, waktu per soal, tingkat kesulitan, dan subtopik.
- Label miskonsepsi opsional untuk setiap pilihan jawaban salah, supaya dashboard bisa menampilkan kesalahan yang paling sering terjadi.
- Pemformatan: tebal, miring, pangkat, indeks bawah, dan daftar. Rumus matematika dan gambar (otomatis dikompres, maksimal 1 MB) hadir di P1.
- Pintasan: Enter menambah pilihan, Ctrl+Enter menyimpan dan membuka soal berikutnya, tombol Duplikat untuk membuat variasi soal dengan cepat.
- Tempel massal: guru menempelkan teks soal dari Word atau WhatsApp, sistem mengurainya menjadi kartu soal dan menandai bagian yang perlu diperiksa.
- Impor Excel atau CSV memakai template resmi yang bisa diunduh (P1), dengan laporan baris yang gagal beserta alasannya.
- Simpan otomatis setiap 2 detik. Saat offline, perubahan masuk antrean lokal dan disinkronkan saat sinyal kembali (F14).
- Validasi langsung di kartu: soal kosong, pilihan kembar, atau belum ada jawaban benar ditandai merah. Draf tetap bisa disimpan, tetapi paket baru berstatus Siap main setelah semua soal valid.

Kriteria penerimaan: guru dapat membuat 10 soal manual dalam kurang dari 10 menit; tidak ada kehilangan data saat tab ditutup atau sinyal putus; urutan soal bisa diubah dengan seret dan lepas (di HP: tombol naik dan turun).

### 7.5 Review dan persetujuan (F5)

- Tampilan dua panel di laptop (daftar soal dan editor), satu kolom di HP dengan editor berupa bottom sheet.
- Setiap soal punya status: Belum ditinjau, Disetujui, atau Diedit, dan lencana AI selama belum disetujui.
- Aksi massal Setujui semua yang valid, serta filter berdasarkan kesulitan, subtopik, dan status.
- Ringkasan paket di bagian atas: sebaran kesulitan, subtopik yang tercakup, dan perkiraan durasi permainan.
- Jika guru memulai permainan dengan soal yang belum ditinjau, muncul konfirmasi: “3 soal belum Anda tinjau. Tetap mulai?”
- Tombol Laporkan soal pada setiap soal AI untuk umpan balik kualitas.

### 7.6 Pratinjau Main sebagai siswa (F7)

Guru melihat soal persis seperti tampilan siswa di HP (bingkai ponsel di laptop), termasuk pengacakan pilihan dan penghitung waktu. Skor pratinjau tidak masuk data kelas.

### 7.7 Pustaka dan berbagi (F13, F16)

- P1: folder, tag, duplikat paket, dan menggabungkan soal dari beberapa paket.
- P2: bagikan paket lewat tautan (hanya baca, bisa disalin ke akun guru lain) dan bank soal komunitas dengan penilaian, laporan, dan moderasi.

### 7.8 Hubungan dengan Boss Battle

- Setiap paket berisi minimal 20 soal untuk memenuhi aturan Boss Battle. Paket lebih pendek bisa dimainkan dengan peringatan.
- HP monster dihitung otomatis dengan rumus: jumlah siswa x jumlah soal x target akurasi x rata-rata damage per jawaban benar. Contoh: 24 x 20 x 0,65 x 14 sekitar 4.400 HP.
- Guru memilih tingkat tantangan: Santai (target akurasi 50%), Seimbang (65%), atau Menantang (80%).
- Batas waktu bawaan = jumlah soal x rata-rata waktu per soal x 1,25.
- Urutan soal dan urutan pilihan diacak per siswa (bawaan aktif), namun semua siswa mendapat kumpulan soal yang sama.
- Setelah permainan, akurasi per soal dan pilihan salah yang paling banyak dipilih kembali ke paket. Soal yang terlalu sulit atau menjebak ditandai agar guru bisa memperbaikinya.

## 8. Spesifikasi AI

### 8.1 Masukan dan keluaran

Masukan: topik, kelas, mapel, CP (opsional), jumlah soal, komposisi kesulitan, gaya soal, mode miskonsepsi, instruksi tambahan, dan teks materi acuan (opsional). Tidak ada data siswa yang dikirim ke model.

Keluaran per soal (format terstruktur yang divalidasi sebelum ditampilkan):

| Bidang | Isi |
| --- | --- |
| teks | Pertanyaan |
| opsi | Daftar pilihan; tiap pilihan punya teks, penanda benar, dan label miskonsepsi bila salah |
| kesulitan | Mudah, sedang, atau sulit |
| subtopik | Subtopik yang diuji |
| pembahasan | Penjelasan singkat jawaban benar |
| waktu\_detik | Saran waktu menjawab |
| kutipan\_materi | Bagian materi acuan yang menjadi dasar soal (jika ada materi) |

Contoh soal hasil generate:

- Soal: Berapa hasil 3/4 + 1/8?
- Pilihan benar: 7/8
- Pilihan salah: 4/12 (miskonsepsi: menjumlahkan pembilang dan penyebut masing-masing), 4/8 (miskonsepsi: hanya menjumlahkan pembilang), 6/8 (miskonsepsi: lupa menjumlahkan pecahan kedua setelah menyamakan penyebut)
- Pembahasan: Samakan penyebut, 3/4 menjadi 6/8, lalu 6/8 + 1/8 = 7/8.

### 8.2 Aturan kualitas dan keamanan

- Tepat satu jawaban benar. Tidak memakai pilihan “semua benar” atau “tidak ada yang benar”.
- Pilihan salah masuk akal dan berasal dari kesalahan umum siswa. Panjang pilihan seimbang agar jawaban benar tidak bisa ditebak dari panjangnya.
- Bahasa sesuai tingkat kelas, konteks Indonesia (nama, tempat, rupiah), dan netral dari unsur SARA.
- Satu konsep per soal, tanpa soal kembar, dengan sebaran posisi jawaban benar yang merata.
- Verifikasi berlapis: perhitungan matematika divalidasi dengan alat hitung dan bukan hanya oleh model; lalu satu tahap penilai terpisah memeriksa kunci jawaban. Soal yang gagal diganti otomatis.
- Mode materi acuan: soal hanya boleh bersumber dari materi yang diunggah dan tidak mengarang fakta di luarnya.
- Moderasi topik: topik yang tidak pantas untuk usia sekolah ditolak dengan penjelasan ramah dan saran topik pengganti.
- Transparansi: setiap soal AI berlencana AI sampai disetujui guru.
- Privasi: materi unggahan dihapus setelah 30 hari dan tidak dipakai untuk melatih model.

### 8.3 Performa, kuota, dan ketahanan

- Kuota awal (asumsi yang akan diuji): 10 paket generate dan 40 pembuatan ulang soal per guru per hari. Sisa kuota selalu terlihat di form.
- Pembatasan laju per akun dan per sekolah untuk mencegah penyalahgunaan.
- Jika layanan AI sibuk atau gagal, permintaan masuk antrean dan guru diberi pilihan beralih ke editor manual tanpa kehilangan isi form.
- Biaya per paket dipantau pada dashboard internal dan batas kuota disesuaikan setelah pilot.

### 8.4 Evaluasi kualitas

- Kumpulan uji (golden set) berisi 200 topik lintas mapel dan jenjang.
- Panel 5 guru menilai skala 1 sampai 5 untuk ketepatan fakta, kunci jawaban, kualitas pilihan salah, kesesuaian kelas, dan bahasa.
- Syarat rilis: rata-rata skor minimal 4,0 dan kesalahan kunci di bawah 2%.
- Audit mingguan terhadap 50 soal acak, ditambah laporan soal dari guru.
- Uji regresi otomatis setiap kali instruksi atau model berubah.

## 9. Desain dan Tampilan

Arah visual: ceria dan berani seperti dunia game, tetapi tetap tenang dan rapi karena guru bekerja di sini. Bahasa visualnya sama dengan Boss Battle (monster, perisai, api serangan) supaya Studio Soal terasa menjadi bagian dari permainan yang sama.

### 9.1 Palet dan tipografi

| Nama | Warna | Pemakaian |
| --- | --- | --- |
| Ungu Monster | #5B3DF5 | Tombol utama, tab aktif, tautan |
| Api Serangan | #FF6B35 | Aksen AI, indikator generate, HP monster |
| Hijau Benar | #17A05A | Status Disetujui, jawaban benar |
| Merah Salah | #E0443A | Kesalahan validasi, hapus |
| Langit | #E9F3FF | Latar halaman mode terang |
| Tinta | #16204A | Teks utama |
| Malam | #101A3A | Latar mode gelap |

Tipografi: Baloo 2 untuk judul, angka, dan tombol; Nunito untuk isi soal dan editor agar nyaman dibaca lama. Skala 28, 22, 18, 16, dan 14 px. Panjang baris kurang dari 80 karakter.

### 9.2 Prinsip tampilan

- Satu layar, satu tugas: form topik, proses generate, dan review adalah tiga langkah yang jelas dengan penanda kemajuan.
- Satu momen berkesan: saat generate, monster kecil di sudut layar “mengunyah” topik dan kartu soal terbit satu per satu. Selain itu animasi pendek (150 sampai 200 ms) hanya untuk menjawab aksi guru.
- Tingkat kesulitan memakai warna dan bentuk (perisai 1, 2, atau 3 lapis) sehingga tidak bergantung pada warna saja.
- Tombol aksi memakai kata kerja yang jelas: Buat soal, Setujui, Mulai Boss Battle. Pesan galat menjelaskan apa yang salah dan cara memperbaikinya.
- Responsif: dua panel di laptop, satu kolom di HP dengan bottom sheet untuk editor dan tombol utama menempel di bawah layar.
- Mode terang dan gelap, menghormati pengaturan sistem dan preferensi gerak berkurang.

### 9.3 Sketsa layar

Form paket baru:

```
+----------------------------------------------------+
| Studio Soal > Paket baru            [Simpan draf]  |
+----------------------------------------------------+
| Apa yang ingin diuji?                              |
| [ Penjumlahan pecahan berpenyebut beda          ]  |
| Kelas [5 SD v]  Mapel [Matematika v]  CP [Pilih]   |
| Jumlah soal  (-) 20 (+)     Waktu/soal [20 dtk v]  |
| Kesulitan  Mudah |==o=======o==| Sulit  30/50/20  |
| [x] Konteks sehari-hari   [x] Mode miskonsepsi     |
| [ Unggah materi ]            [ Buat 20 soal ]      |
+----------------------------------------------------+
| Atau  [ + Tulis soal sendiri ]  [ Impor Excel ]    |
+----------------------------------------------------+
```

Review hasil:

```
+-----------------------+----------------------------+
| Daftar soal (20)      | Soal 7          [AI][Sedang]|
| 1  Disetujui          | Berapa hasil 3/4 + 1/8 ?   |
| 2  Disetujui          | (A) 7/8   <- jawaban benar |
| 7  Perlu ditinjau     | (B) 4/12  miskonsepsi:     |
| 8  Belum ditinjau     |     pembilang dan penyebut |
| ...                   |     dijumlah terpisah      |
| [Setujui semua]       | [Edit] [Buat ulang] [Hapus]|
+-----------------------+----------------------------+
```

### 9.4 Keadaan khusus

- Kosong: ajakan Mulai dari topik dengan contoh yang bisa diketuk.
- Memuat: kartu kerangka (skeleton) dan monster pengunyah, bukan spinner kosong.
- Galat: penjelasan penyebab, tombol Coba lagi, dan jalur ke editor manual.
- Kuota habis: tampilkan waktu reset kuota dan sarankan jalur manual atau impor.

## 10. Persyaratan Non-Fungsional

| Area | Persyaratan |
| --- | --- |
| Performa | LCP di bawah 2,5 detik pada 4G lambat; bundel awal di bawah 200 KB (gzip) |
| Offline | Draf tersimpan lokal (IndexedDB) dan sinkron saat online; konflik diselesaikan dengan versi terbaru dan riwayat 10 versi |
| Keamanan | Masuk dengan email atau Google; akses data per pemilik (row level security); HTTPS; pembatasan laju; sanitasi teks kaya untuk mencegah XSS |
| Privasi | Sesuai UU Pelindungan Data Pribadi; siswa masuk tanpa akun; tidak ada data siswa ke model AI; penghapusan akun menghapus seluruh paket |
| Aksesibilitas | Target WCAG 2.2 AA: kontras minimal 4,5:1, target sentuh minimal 44 px, navigasi keyboard penuh, label untuk pembaca layar |
| Kompatibilitas | Android 8 ke atas, dua versi terakhir Chrome dan Safari, layar mulai 360 px |
| Skalabilitas | Mendukung 500 guru melakukan generate bersamaan pada jam sekolah dengan antrean |
| Ketersediaan | 99,5% pada jam sekolah (06.00 sampai 16.00 WIB) |
| Lokalisasi | Bahasa Indonesia, zona waktu WIB, WITA, dan WIT |

## 11. Model Data dan API

| Entitas | Kolom utama |
| --- | --- |
| Guru | id, nama, email, sekolah, kuota harian |
| PaketSoal | id, guru\_id, judul, mapel, kelas, topik, status, versi, dihapus\_pada |
| Soal | id, paket\_id, urutan, teks, kesulitan, subtopik, pembahasan, waktu\_detik, sumber (AI atau manual), status\_tinjau |
| Opsi | id, soal\_id, teks, benar, label\_miskonsepsi |
| TugasGenerate | id, paket\_id, parameter, status, jumlah\_selesai, galat |
| StatistikSoal | soal\_id, jumlah\_dijawab, persen\_benar, sebaran\_pilihan (diisi dari sesi Boss Battle) |
| Sesi | id, paket\_id, kode\_kelas, pengaturan\_boss, waktu\_mulai |

| Endpoint | Fungsi |
| --- | --- |
| POST /api/sets | Membuat paket baru |
| POST /api/sets/:id/generate | Menjalankan generate (respons streaming) |
| PATCH /api/questions/:id | Mengubah soal atau status tinjau |
| POST /api/questions/:id/regenerate | Membuat ulang satu soal dengan arahan |
| POST /api/sets/:id/import | Impor Excel, CSV, atau teks tempel |
| POST /api/uploads | Mengunggah materi acuan |
| GET /api/curriculum | Daftar mapel, fase, dan CP |
| POST /api/sets/:id/launch | Membuat sesi Boss Battle dan kode kelas |

Usulan teknologi: Next.js (PWA), Supabase (Postgres, autentikasi, realtime, row level security), fungsi serverless yang memanggil model bahasa melalui API, dan antrean untuk pekerjaan generate.

## 12. Kasus Tepi dan Penanganan Galat

| Kondisi | Perilaku |
| --- | --- |
| Topik terlalu umum (misalnya “IPA”) | Sistem menyarankan 3 sampai 5 subtopik untuk dipilih sebelum generate |
| Topik di luar kelas yang dipilih | Peringatan ringan dan saran kelas yang lebih cocok, guru tetap bisa lanjut |
| Koneksi putus saat generate | Soal yang sudah jadi tersimpan; tombol Lanjutkan muncul saat online |
| Materi unggahan tidak terbaca (foto buram) | Pesan jelas dan saran mengambil ulang foto atau menempel teks |
| Soal AI diduga salah | Tombol Laporkan soal; soal ditandai untuk audit; guru bisa langsung membuat ulang |
| Paket kurang dari 20 soal | Boleh dimainkan, dengan peringatan bahwa aturan Boss Battle mengikuti jumlah soal yang ada |
| Impor Excel berisi baris cacat | Baris valid tetap masuk, laporan menampilkan baris cacat beserta alasannya |
| Dua perangkat mengedit paket yang sama | Versi terbaru dipertahankan dan riwayat versi bisa dipulihkan |
| Kuota harian habis | Tampilkan waktu reset dan arahkan ke jalur manual atau impor |

## 13. Analitik

Peristiwa yang dicatat (tanpa data pribadi siswa): set\_created, topic\_submitted, generation\_started, generation\_completed, generation\_failed, question\_approved, question\_edited, question\_regenerated, question\_deleted, question\_reported, manual\_question\_added, import\_completed, preview\_started, game\_launched, serta unsent\_review\_warning\_shown.

Corong utama: buka Studio, form topik terisi, generate selesai, review, game dimulai. Metrik tambahan: persentase soal AI yang disetujui, diedit, atau dibuat ulang, dan soal yang kemudian ditandai bermasalah dari data Boss Battle.

## 14. Rencana Rilis

| Fase | Isi | Perkiraan durasi | Kriteria selesai |
| --- | --- | --- | --- |
| 0. Desain dan prototipe | Alur, tampilan, uji dengan 5 guru | 2 minggu | Guru menyelesaikan alur utama tanpa bantuan |
| 1. MVP | F1 sampai F8 | 6 minggu | Memenuhi syarat evaluasi AI; pilot di 3 sekolah berjalan |
| 2. Penguatan | F9 sampai F14 | 5 minggu | Impor Excel stabil; rumus matematika dan materi acuan tersedia |
| 3. Komunitas | F15 dan F16 | 4 minggu | Bank soal komunitas dengan moderasi berjalan |

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Soal AI salah atau menyesatkan | Kepercayaan guru turun | Verifikasi berlapis, lencana AI, wajib tinjau, laporan soal, audit mingguan |
| Biaya AI membengkak | Margin tertekan | Kuota, pembatasan laju, pemantauan biaya per paket |
| Guru merasa AI menggantikan perannya | Adopsi rendah | Posisi AI sebagai asisten; guru memutuskan setiap soal |
| Koneksi buruk di sekolah | Pengalaman terputus | PWA, simpan otomatis lokal, hasil sebagian tersimpan |
| Data anak dan privasi | Risiko hukum dan reputasi | Tanpa akun siswa, tanpa data siswa ke model, retensi singkat |
| Konten tidak pantas pada topik | Risiko reputasi | Moderasi topik dan keluaran, laporan cepat |

## 16. Pertanyaan Terbuka

- Dari mana sumber data resmi Capaian Pembelajaran per mapel dan fase, dan siapa yang memperbaruinya?
- Berapa kuota gratis yang wajar, dan apa rencana berlangganan untuk sekolah?
- Perlukah ekspor paket ke Word atau PDF untuk guru yang ingin mencetak soal?
- Bagaimana menangani soal bergambar atau berdiagram (peta, grafik) pada versi awal?
- Apakah perlu dukungan bahasa daerah atau dwibahasa untuk sekolah tertentu?
- Siapa yang memoderasi bank soal komunitas pada fase 3?

## Lampiran: Pedoman Instruksi AI (ringkas)

- Peran: asisten penyusun soal untuk guru Indonesia, mengikuti Kurikulum Merdeka dan tingkat kelas yang dipilih.
- Tugas: membuat soal pilihan ganda dengan tepat satu jawaban benar, pembahasan singkat, dan label miskonsepsi pada setiap pilihan salah.
- Larangan: tidak mengarang fakta, tidak memakai pilihan “semua benar”, tidak menyertakan data pribadi, tidak membuat konten yang tidak pantas untuk usia sekolah.
- Format keluaran: terstruktur dan divalidasi; soal yang tidak lolos validasi atau pemeriksaan kunci dibuat ulang.

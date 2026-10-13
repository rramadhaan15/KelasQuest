# Persistensi Inkremental pada Streaming Pembuatan Soal AI

Setiap butir soal hasil pembuatan kecerdasan buatan (AI) yang lolos verifikasi struktural otomatis langsung disimpan secara atomik ke basis data di server sebelum dialirkan (*streamed*) ke antarmuka guru. Kami memutuskan pendekatan ini karena sebagian besar pengguna mengakses platform melalui jaringan seluler yang rentan putus, sehingga memastikan butir soal yang sudah berhasil digenerate tidak hilang meskipun koneksi terputus di tengah proses.

## Status
Accepted

## Konsekuensi
- Kegagalan jaringan atau penutupan peramban oleh pengguna di tengah proses tidak menghilangkan butir soal yang telah selesai divalidasi.
- Jika pengguna membatalkan proses di tengah jalan, butir soal yang telah tersimpan tetap menjadi draf valid parsial.
- Kuota harian dihitung secara adil berdasarkan jumlah butir soal yang berhasil disimpan dan disajikan, bukan pemotongan di muka per paket penuh.

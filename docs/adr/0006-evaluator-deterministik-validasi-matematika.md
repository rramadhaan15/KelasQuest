# Evaluator Deterministik untuk Validasi Soal Matematika

Pengecekan kebenaran perhitungan numerik dan kunci jawaban matematika pada soal hasil generate AI diprioritaskan menggunakan mesin komputasi deterministik (parser sandbox aritmatika) sebelum memanggil model bahasa penilai (*LLM-as-a-judge*). Kami memutuskan pendekatan ini untuk menjamin akurasi 100% pada perhitungan angka, menjaga latensi streaming di bawah 5 detik per butir soal, dan menghemat biaya token API.

## Status
Accepted

## Konsekuensi
- Butir soal dengan operasi aritmatika dievaluasi secara instan oleh kode deterministik di backend worker.
- Evaluasi berbasis LLM kedua hanya digunakan untuk validasi konteks kebahasaan, etika, dan kesesuaian materi non-numerik.
- Mengurangi kegagalan verifikasi akibat halusinasi model penilai pada perhitungan angka sederhana.

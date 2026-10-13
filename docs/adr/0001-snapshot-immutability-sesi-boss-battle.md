# Snapshot Immutability pada Sesi Boss Battle

Saat sesi Boss Battle diluncurkan, seluruh butir soal dalam Paket Soal disalin secara statis (*snapshot*) ke dalam entitas sesi tersendiri. Kami memutuskan untuk memisahkan salinan soal pada sesi permainan dari draf Paket Soal guru agar perubahan atau penghapusan soal di masa mendatang tidak merusak permainan yang sedang berlangsung maupun riwayat analitik akurasi kelas.

## Status
Accepted

## Konsekuensi
- Mutasi pada `PaketSoal` setelah peluncuran tidak akan mempengaruhi jalannya sesi yang sedang aktif.
- Agregasi statistik pasca-game harus secara eksplisit memetakan kembali hasil jawaban dari `SesiSoal` ke ID `ButirSoal` asal pada paket induk.
- Terjadi sedikit redundansi penyimpanan data per sesi permainan, namun menjamin auditabilitas dan isolasi data permainan.

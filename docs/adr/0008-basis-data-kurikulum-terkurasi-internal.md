# Pengelolaan Basis Data Capaian Pembelajaran Kurikulum Merdeka Secara Internal

Referensi Capaian Pembelajaran (CP) dan fase Kurikulum Merdeka dikelola sebagai basis data benih (*seeded database*) terstruktur internal yang diperbarui secara musiman oleh tim KelasQuest, bukan melalui integrasi atau pengikisan (*scraping*) situs web kementerian secara langsung. Kami memutuskan hal ini untuk menjamin ketersediaan layanan 99,5%, latensi respons instan (<50 ms), serta struktur data hierarkis yang stabil saat diinjeksikan sebagai batasan prompt pembuatan soal AI.

## Status
Accepted

## Konsekuensi
- Menghilangkan risiko kegagalan layanan atau perubahan format tak terduga dari peladen eksternal pemerintah.
- Pembaruan dokumen regulasi kurikulum baru memerlukan pembaruan berkas migrasi/benih data secara berkala oleh tim internal.
- Penyusunan prompt AI dapat mengandalkan kode referensi CP terstandarisasi untuk konsistensi keluaran.

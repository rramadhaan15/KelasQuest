import { describe, it, expect } from 'vitest';
import { parseRawQuestions, convertParsedToManualInput } from '../src/domain/text-parser';

describe('Raw Question Text Parser (User Story 13)', () => {
  it('berhasil mem-parse format Word/WhatsApp standar dengan kunci di bawah', () => {
    const raw = `
1. Berapakah hasil dari 25 + 75?
A. 80
B. 90
C. 100
D. 110
Kunci: C
Pembahasan: 25 + 75 = 100

2. Ibu kota Indonesia adalah...
A. Surabaya
B. Jakarta
C. Bandung
D. Medan
Jawaban: B
`;

    const result = parseRawQuestions(raw);

    expect(result.totalDitemukan).toBe(2);
    expect(result.totalPerluDiperiksa).toBe(0);

    const q1 = result.butirSoal[0];
    expect(q1.nomor).toBe(1);
    expect(q1.teks).toBe('Berapakah hasil dari 25 + 75?');
    expect(q1.pilihanJawaban).toHaveLength(4);
    expect(q1.pilihanJawaban[2].teks).toBe('100');
    expect(q1.pilihanJawaban[2].benar).toBe(true);
    expect(q1.pembahasan).toBe('25 + 75 = 100');
    expect(q1.perluDiperiksa).toBe(false);

    const q2 = result.butirSoal[1];
    expect(q2.nomor).toBe(2);
    expect(q2.teks).toBe('Ibu kota Indonesia adalah...');
    expect(q2.pilihanJawaban[1].teks).toBe('Jakarta');
    expect(q2.pilihanJawaban[1].benar).toBe(true);
    expect(q2.perluDiperiksa).toBe(false);
  });

  it('berhasil mem-parse tanda bintang (*) sebagai penanda kunci jawaban', () => {
    const raw = `
1. Lambang sila pertama Pancasila adalah...
*A. Bintang
B. Rantai
C. Pohon Beringin
D. Padi dan Kapas

2. Hasil dari 10 x 10 adalah...
A. 10
B. 50
*C. 100
D. 200
`;

    const result = parseRawQuestions(raw);
    expect(result.totalDitemukan).toBe(2);
    expect(result.totalPerluDiperiksa).toBe(0);

    expect(result.butirSoal[0].pilihanJawaban[0].benar).toBe(true);
    expect(result.butirSoal[0].pilihanJawaban[0].teks).toBe('Bintang');
    expect(result.butirSoal[1].pilihanJawaban[2].benar).toBe(true);
    expect(result.butirSoal[1].pilihanJawaban[2].teks).toBe('100');
  });

  it('menandai soal yang belum memiliki kunci jawaban untuk diperiksa guru', () => {
    const raw = `
1. Gunung tertinggi di pulau Jawa adalah...
A. Gunung Merapi
B. Gunung Semeru
C. Gunung Bromo
D. Gunung Slamet
`;

    const result = parseRawQuestions(raw);
    expect(result.totalDitemukan).toBe(1);
    expect(result.totalPerluDiperiksa).toBe(1);

    const q = result.butirSoal[0];
    expect(q.perluDiperiksa).toBe(true);
    expect(q.alasanPemeriksaan).toContain('Kunci jawaban belum ditentukan');
  });

  it('menangani opsi inline horizontal dalam satu baris', () => {
    const raw = `
1. Warna bendera Indonesia adalah...
A. Merah Putih  B. Putih Biru  C. Merah Kuning  D. Hijau Putih
Kunci: A
`;

    const result = parseRawQuestions(raw);
    expect(result.totalDitemukan).toBe(1);
    expect(result.butirSoal[0].pilihanJawaban).toHaveLength(4);
    expect(result.butirSoal[0].pilihanJawaban[0].teks).toBe('Merah Putih');
    expect(result.butirSoal[0].pilihanJawaban[0].benar).toBe(true);
  });

  it('mengonversi hasil parse menjadi AddManualQuestionInput yang valid', () => {
    const parsed = {
      teks: 'Berapakah 2 + 2?',
      pilihanJawaban: [
        { huruf: 'A', teks: '3', benar: false },
        { huruf: 'B', teks: '4', benar: true },
      ],
      pembahasan: '2 + 2 = 4',
      perluDiperiksa: false,
      alasanPemeriksaan: [],
    };

    const manualInput = convertParsedToManualInput(parsed);
    expect(manualInput.teks).toBe('Berapakah 2 + 2?');
    expect(manualInput.pilihanJawaban).toHaveLength(2);
    expect(manualInput.pilihanJawaban[1].benar).toBe(true);
    expect(manualInput.pembahasan).toBe('2 + 2 = 4');
  });

  it('menangani teks kosong dengan anggun', () => {
    const result = parseRawQuestions('');
    expect(result.totalDitemukan).toBe(0);
    expect(result.totalPerluDiperiksa).toBe(0);
  });
});

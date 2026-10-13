import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';

describe('StudioSoalService - Fondasi Beranda & Editor Manual (Tiket 01)', () => {
  let repository: InMemoryStudioSoalRepository;
  let service: StudioSoalService;

  beforeEach(() => {
    repository = new InMemoryStudioSoalRepository();
    service = new StudioSoalService(repository);
  });

  it('guru dapat membuat Paket Soal baru dengan status awal DRAF', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Penjumlahan Pecahan',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Penjumlahan pecahan berpenyebut beda',
    });

    expect(paket.id).toBeDefined();
    expect(paket.guruId).toBe('guru-rina');
    expect(paket.judul).toBe('Penjumlahan Pecahan');
    expect(paket.status).toBe('DRAF');
    expect(paket.butirSoal).toHaveLength(0);
  });

  it('guru dapat melihat daftar paket soal di beranda', async () => {
    await service.createSet('guru-rina', {
      judul: 'Pecahan Bagian 1',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan senilai',
    });
    await service.createSet('guru-rina', {
      judul: 'Pecahan Bagian 2',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Penjumlahan pecahan',
    });

    const daftar = await service.listSets('guru-rina');
    expect(daftar).toHaveLength(2);
    expect(daftar.map((d) => d.judul)).toContain('Pecahan Bagian 1');
    expect(daftar.map((d) => d.judul)).toContain('Pecahan Bagian 2');
  });

  it('guru dapat menambahkan butir soal manual dengan pilihan jawaban valid', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Pecahan Dasar',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan',
    });

    const butirSoal = await service.addManualQuestion(paket.id, {
      teks: 'Berapa hasil dari 1/4 + 2/4?',
      kesulitan: 'MUDAH',
      waktuDetik: 20,
      pembahasan: 'Karena penyebutnya sama, jumlahkan pembilang: 1 + 2 = 3. Hasilnya 3/4.',
      pilihanJawaban: [
        { teks: '3/4', benar: true },
        { teks: '3/8', benar: false, labelMiskonsepsi: 'Menjumlahkan penyebut juga' },
        { teks: '2/4', benar: false },
        { teks: '1/4', benar: false },
      ],
    });

    expect(butirSoal.id).toBeDefined();
    expect(butirSoal.sumber).toBe('MANUAL');
    expect(butirSoal.statusTinjauan).toBe('DISETUJUI');
    expect(butirSoal.isValid).toBe(true);

    const updatedSet = await service.getSet(paket.id);
    expect(updatedSet?.butirSoal).toHaveLength(1);
    expect(updatedSet?.status).toBe('SIAP_MAIN');
  });

  it('sistem menandai butir soal tidak valid jika belum ada kunci jawaban benar', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Latihan IPA',
      mapel: 'IPA',
      jenjang: '7 SMP',
      topik: 'Fotosintesis',
    });

    const butirSoalInvalid = await service.addManualQuestion(paket.id, {
      teks: 'Gas apa yang dihasilkan dari fotosintesis?',
      kesulitan: 'MUDAH',
      waktuDetik: 20,
      pembahasan: '',
      pilihanJawaban: [
        { teks: 'Oksigen', benar: false },
        { teks: 'Karbondioksida', benar: false },
      ],
    });

    expect(butirSoalInvalid.isValid).toBe(false);
    expect(butirSoalInvalid.validasiGalat).toContain('Harus memiliki tepat satu jawaban benar');

    const updatedSet = await service.getSet(paket.id);
    expect(updatedSet?.status).toBe('DRAF');
  });

  it('sistem menandai butir soal tidak valid jika teks pertanyaan kosong', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Soal Bahasa',
      mapel: 'Bahasa Indonesia',
      jenjang: '4 SD',
      topik: 'Ide Pokok',
    });

    const butirSoalInvalid = await service.addManualQuestion(paket.id, {
      teks: '   ',
      kesulitan: 'MUDAH',
      waktuDetik: 20,
      pembahasan: '',
      pilihanJawaban: [
        { teks: 'Pilihan A', benar: true },
        { teks: 'Pilihan B', benar: false },
      ],
    });

    expect(butirSoalInvalid.isValid).toBe(false);
    expect(butirSoalInvalid.validasiGalat).toContain('Teks butir soal tidak boleh kosong');
  });

  it('guru dapat menyunting butir soal manual dan memperbarui status validitasnya', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Matematika Campuran',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan',
    });

    // Menambah soal yang awalnya belum ada jawaban benar
    const soalAwal = await service.addManualQuestion(paket.id, {
      teks: 'Berapa 1/2 + 1/2?',
      kesulitan: 'MUDAH',
      waktuDetik: 20,
      pembahasan: '',
      pilihanJawaban: [
        { teks: '1', benar: false },
        { teks: '2/4', benar: false },
      ],
    });
    expect(soalAwal.isValid).toBe(false);

    // Guru memperbaiki pilihan jawaban sehingga memiliki 1 kunci benar
    const soalDiperbaiki = await service.updateQuestion(soalAwal.id, {
      pilihanJawaban: [
        { teks: '1', benar: true },
        { teks: '2/4', benar: false, labelMiskonsepsi: 'Hanya menjumlahkan penyebut' },
      ],
    });

    expect(soalDiperbaiki.isValid).toBe(true);
    expect(soalDiperbaiki.statusTinjauan).toBe('DIEDIT');

    const updatedSet = await service.getSet(paket.id);
    expect(updatedSet?.status).toBe('SIAP_MAIN');
  });

  it('mengimpor soal massal dari teks mentah Word/WhatsApp (User Story 13)', async () => {
    const paket = await service.createPaket('guru-4', {
      judul: 'Paket Impor Teks',
      mapel: 'IPAS',
      jenjang: 'SD',
      topik: 'Ekosistem',
    });

    const rawText = `
1. Hewan pemakan tumbuhan disebut...
A. Karnivora
B. Herbivora
C. Omnivora
D. Insektivora
Kunci: B
Pembahasan: Herbivora adalah pemakan tumbuhan.

2. Komponen abiotik dalam ekosistem meliputi...
*A. Air, udara, dan cahaya matahari
B. Rumput dan pohon
C. Cacing dan jamur
D. Elang dan ular
`;

    const result = await service.importFromRawText(paket.id, rawText);
    expect(result.totalImported).toBe(2);
    expect(result.totalPerluDiperiksa).toBe(0);

    const questions = await repository.listQuestionsBySet(paket.id);
    expect(questions).toHaveLength(2);
    expect(questions[0].teks).toBe('Hewan pemakan tumbuhan disebut...');
    expect(questions[0].pilihanJawaban[1].benar).toBe(true);
    expect(questions[1].pilihanJawaban[0].benar).toBe(true);
  });
});

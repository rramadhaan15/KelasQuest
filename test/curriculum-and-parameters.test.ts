import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { CurriculumService } from '../src/domain/curriculum-service';

describe('Curriculum & Parameter Penjanaan (Tiket 02)', () => {
  let repository: InMemoryStudioSoalRepository;
  let curriculumService: CurriculumService;
  let service: StudioSoalService;

  beforeEach(() => {
    repository = new InMemoryStudioSoalRepository();
    curriculumService = new CurriculumService();
    service = new StudioSoalService(repository, curriculumService);
  });

  it('menyajikan daftar mata pelajaran dan Capaian Pembelajaran resmi BSKAP (<50ms)', async () => {
    const startTime = Date.now();
    const data = await curriculumService.getCurriculum('Matematika', '5 SD');
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(50);
    expect(data.fase).toBe('Fase C');
    expect(data.capaianList.length).toBeGreaterThan(0);
    expect(data.capaianList[0].kode).toBeDefined();
    expect(data.capaianList[0].deskripsi).toContain('pecahan');
  });

  it('dapat melakukan pencarian Capaian Pembelajaran berdasarkan kata kunci topik', async () => {
    const hasil = await curriculumService.searchCapaian('pecahan', 'Matematika');
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil[0].deskripsi.toLowerCase()).toContain('pecahan');
  });

  it('memvalidasi dan menerapkan nilai bawaan parameter penjanaan (20 soal, 30/50/20)', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Latihan Pecahan Kurikulum Merdeka',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Penjumlahan pecahan',
      capaianPembelajaran: 'CP-MAT-C-01',
      parameterPenjanaan: {
        jumlahSoal: 20,
        komposisiKesulitan: { mudah: 30, sedang: 50, sulit: 20 },
        waktuPerSoalDetik: 20,
        gayaSoal: 'KONTEKS_SEHARI_HARI',
        modeMiskonsepsi: true,
        instruksiTambahan: 'Gunakan nama dan konteks lokal Jawa Barat',
      },
    });

    expect(paket.parameterPenjanaan).toBeDefined();
    expect(paket.parameterPenjanaan?.jumlahSoal).toBe(20);
    expect(paket.parameterPenjanaan?.komposisiKesulitan).toEqual({
      mudah: 30,
      sedang: 50,
      sulit: 20,
    });
    expect(paket.parameterPenjanaan?.gayaSoal).toBe('KONTEKS_SEHARI_HARI');
    expect(paket.parameterPenjanaan?.instruksiTambahan).toContain('Jawa Barat');
  });

  it('menolak komposisi kesulitan jika total persentase tidak sama dengan 100%', async () => {
    await expect(
      service.createSet('guru-rina', {
        judul: 'Test Invalid Difficulty',
        mapel: 'Matematika',
        jenjang: '5 SD',
        topik: 'Pecahan',
        parameterPenjanaan: {
          jumlahSoal: 20,
          komposisiKesulitan: { mudah: 50, sedang: 50, sulit: 50 }, // Total 150%
        },
      })
    ).rejects.toThrow('Total persentase komposisi kesulitan harus tepat 100%');
  });

  it('menolak jumlah soal di luar batas toleransi (5 sampai 40 soal)', async () => {
    await expect(
      service.createSet('guru-rina', {
        judul: 'Test Invalid Count',
        mapel: 'Matematika',
        jenjang: '5 SD',
        topik: 'Pecahan',
        parameterPenjanaan: {
          jumlahSoal: 50, // Lebih dari 40
        },
      })
    ).rejects.toThrow('Jumlah soal harus antara 5 sampai 40 butir');
  });
});

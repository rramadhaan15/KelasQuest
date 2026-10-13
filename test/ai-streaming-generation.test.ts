import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';

describe('Penjanaan AI Streaming & Penyimpanan Atomik (Tiket 03)', () => {
  let repository: InMemoryStudioSoalRepository;
  let aiGenerator: MockAIQuestionGenerator;
  let service: StudioSoalService;

  beforeEach(() => {
    repository = new InMemoryStudioSoalRepository();
    aiGenerator = new MockAIQuestionGenerator();
    service = new StudioSoalService(repository, undefined, aiGenerator);
  });

  it('menghasilkan butir soal AI terstruktur dengan label miskonsepsi pada pilihan salah', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Pecahan Berpenyebut Beda',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Penjumlahan pecahan berpenyebut beda',
      parameterPenjanaan: {
        jumlahSoal: 5,
        modeMiskonsepsi: true,
      },
    });

    const streamedQuestions: any[] = [];
    const result = await service.streamGenerateQuestions(paket.id, (soal) => {
      streamedQuestions.push(soal);
    });

    expect(result.totalGenerated).toBe(5);
    expect(streamedQuestions).toHaveLength(5);

    const first = streamedQuestions[0];
    expect(first.sumber).toBe('AI');
    expect(first.statusTinjauan).toBe('BELUM_DITINJAU');
    expect(first.pilihanJawaban).toHaveLength(4);

    const correctOption = first.pilihanJawaban.find((p: any) => p.benar);
    expect(correctOption).toBeDefined();

    const wrongOptions = first.pilihanJawaban.filter((p: any) => !p.benar);
    expect(wrongOptions.some((p: any) => Boolean(p.labelMiskonsepsi))).toBe(true);
  });

  it('menyimpan setiap butir soal secara atomik di peladen saat streaming berjalan (ADR 0002)', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Fotosintesis Kelas 7',
      mapel: 'IPA',
      jenjang: '7 SMP',
      topik: 'Fotosintesis',
      parameterPenjanaan: {
        jumlahSoal: 5,
      },
    });

    let savedCountInCallback = 0;
    await service.streamGenerateQuestions(paket.id, async (soal) => {
      savedCountInCallback++;
      // Verifikasi bahwa soal ini SUDAH tersimpan di repository saat callback dipanggil
      const inDb = await repository.getQuestion(soal.id);
      expect(inDb).not.toBeNull();
      expect(inDb?.id).toBe(soal.id);
    });

    expect(savedCountInCallback).toBe(5);

    const finalSet = await service.getSet(paket.id);
    expect(finalSet?.butirSoal).toHaveLength(5);
    expect(finalSet?.status).toBe('SIAP_MAIN');
  });

  it('jika koneksi terputus di tengah jalan, butir soal yang sudah selesai tetap tersimpan utuh di database peladen', async () => {
    const paket = await service.createSet('guru-dedi', {
      judul: 'Latihan Pecahan Sinyal Lemah',
      mapel: 'Matematika',
      jenjang: '4 SD',
      topik: 'Pecahan',
      parameterPenjanaan: {
        jumlahSoal: 10,
      },
    });

    const abortController = new AbortController();
    let received = 0;

    // Simulasikan sinyal putus di HP guru setelah menerima 3 soal
    try {
      await service.streamGenerateQuestions(
        paket.id,
        (soal) => {
          received++;
          if (received === 3) {
            abortController.abort(); // Putus koneksi
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      expect(err.name).toBe('AbortError');
    }

    // Butir soal 1, 2, dan 3 yang sudah divalidasi TIDAK HILANG dari peladen
    const storedQuestions = await repository.listQuestionsBySet(paket.id);
    expect(storedQuestions.length).toBe(3);

    const checkSet = await service.getSet(paket.id);
    expect(checkSet?.butirSoal.length).toBe(3);
    // Masih berstatus Siap Main jika 3 soal tersebut valid
    expect(checkSet?.status).toBe('SIAP_MAIN');
  });
});

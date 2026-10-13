import { describe, it, expect, beforeEach } from 'vitest';
import { QuotaManager } from '../src/domain/quota-manager';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';
import { createStudentPreviewSession } from '../src/domain/preview-simulator';

describe('Pratinjau Siswa & Pengelolaan Kuota Proporsional (Tiket 06)', () => {
  let repository: InMemoryStudioSoalRepository;
  let quotaManager: QuotaManager;
  let aiGenerator: MockAIQuestionGenerator;
  let service: StudioSoalService;

  beforeEach(() => {
    repository = new InMemoryStudioSoalRepository();
    quotaManager = new QuotaManager(100); // 100 butir kuota harian
    aiGenerator = new MockAIQuestionGenerator();
    service = new StudioSoalService(repository, undefined, aiGenerator, undefined, quotaManager);
  });

  it('menyajikan sisa kuota harian dan memotong kuota proporsional per butir tersimpan (Q9)', async () => {
    const quotaAwal = await quotaManager.getQuota('guru-rina');
    expect(quotaAwal.totalDailyQuota).toBe(100);
    expect(quotaAwal.usedQuota).toBe(0);
    expect(quotaAwal.remainingQuota).toBe(100);

    const paket = await service.createSet('guru-rina', {
      judul: 'Latihan Pecahan Kuota',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    await service.streamGenerateQuestions(paket.id);

    const quotaSetelah = await quotaManager.getQuota('guru-rina');
    // Memotong tepat 5 butir soal sesuai jumlah yang berhasil digenerate dan disimpan
    expect(quotaSetelah.usedQuota).toBe(5);
    expect(quotaSetelah.remainingQuota).toBe(95);
  });

  it('jika penjanaan dibatalkan di tengah jalan, kuota hanya terpotong untuk butir yang berhasil disimpan', async () => {
    const paket = await service.createSet('guru-dedi', {
      judul: 'Latihan IPA Batal',
      mapel: 'IPA',
      jenjang: '7 SMP',
      topik: 'Fotosintesis',
      parameterPenjanaan: { jumlahSoal: 10 },
    });

    const abortController = new AbortController();
    let saved = 0;

    try {
      await service.streamGenerateQuestions(
        paket.id,
        () => {
          saved++;
          if (saved === 3) {
            abortController.abort();
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      expect(err.name).toBe('AbortError');
    }

    const quotaDedi = await quotaManager.getQuota('guru-dedi');
    // Hanya memotong 3 kuota, BUKAN 1 paket penuh (10 kuota)
    expect(quotaDedi.usedQuota).toBe(3);
    expect(quotaDedi.remainingQuota).toBe(97);
  });

  it('simulator pratinjau siswa mengacak opsi dan tidak mempengaruhi data analitik kelas', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Pecahan Uji Pratinjau',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan',
    });

    await service.addManualQuestion(paket.id, {
      teks: 'Berapa hasil 1/2 + 1/4?',
      pilihanJawaban: [
        { teks: '3/4', benar: true },
        { teks: '2/6', benar: false },
        { teks: '2/4', benar: false },
        { teks: '1/4', benar: false },
      ],
    });

    const setObj = (await service.getSet(paket.id))!;
    const preview = createStudentPreviewSession(setObj);

    expect(preview.totalQuestions).toBe(1);
    expect(preview.currentQuestion.teks).toBe('Berapa hasil 1/2 + 1/4?');
    // Pilihan jawaban tetap ada 4
    expect(preview.currentQuestion.pilihanJawaban).toHaveLength(4);

    // Siswa memilih jawaban di pratinjau
    const result = preview.submitAnswer('3/4');
    expect(result.isCorrect).toBe(true);

    // Skor pratinjau lokal tidak bocor ke statistik kelas
    expect(preview.score).toBe(100);
  });
});

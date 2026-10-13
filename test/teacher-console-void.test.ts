import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { CurriculumService } from '../src/domain/curriculum-service';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';
import { MathEvaluator } from '../src/domain/math-evaluator';
import { QuotaManager } from '../src/domain/quota-manager';

describe('Ticket 10: Konsol Guru Langsung dengan Tindakan Darurat Anulir Soal (ADR 0007)', () => {
  let repository: InMemoryStudioSoalRepository;
  let curriculumService: CurriculumService;
  let aiGenerator: MockAIQuestionGenerator;
  let mathEvaluator: MathEvaluator;
  let quotaManager: QuotaManager;
  let service: StudioSoalService;

  beforeEach(async () => {
    repository = new InMemoryStudioSoalRepository();
    curriculumService = new CurriculumService();
    aiGenerator = new MockAIQuestionGenerator();
    mathEvaluator = new MathEvaluator();
    quotaManager = new QuotaManager(200);
    service = new StudioSoalService(
      repository,
      curriculumService,
      aiGenerator,
      mathEvaluator,
      quotaManager
    );
  });

  it('melakukan anulir darurat pada butir soal yang bermasalah dan menghadiahkan kerusakan penuh ke monster', async () => {
    // 1. Buat paket soal dan sesi Boss Battle dengan 3 siswa
    const set = await service.createSet('guru-1', {
      judul: 'Fisika Kinematika',
      mapel: 'IPA',
      jenjang: 'Fase E - Kelas 10',
      topik: 'GLBB',
    });

    const q1 = await service.addManualQuestion(set.id, {
      teks: 'Soal 1 valid',
      pilihanJawaban: [
        { teks: 'A', benar: true },
        { teks: 'B', benar: false },
      ],
    });

    const q2 = await service.addManualQuestion(set.id, {
      teks: 'Soal 2 terdapat typo parah di kelas!',
      pilihanJawaban: [
        { teks: 'X', benar: true },
        { teks: 'Y', benar: false },
      ],
    });

    const sesi = await service.launchSession(set.id);
    await service.joinLobby(sesi.pinKelas, 'Siswa 1');
    await service.joinLobby(sesi.pinKelas, 'Siswa 2');
    await service.joinLobby(sesi.pinKelas, 'Siswa 3');

    // Mulai pertarungan: 3 siswa * 2 soal * 0.7 * 100 = 420 HP
    const liveSesi = await service.startBattle(sesi.id);
    expect(liveSesi.monsterHp).toBe(420);

    // 2. Guru melihat di konsol bahwa Soal 2 bermasalah dan menekan "Anulir Soal"
    const snapshotQ2 = liveSesi.butirSoal.find((q) => q.originalQuestionId === q2.id);
    expect(snapshotQ2).toBeDefined();

    const voidResult = await service.voidQuestion(
      liveSesi.id,
      snapshotQ2!.id,
      'Kunci jawaban salah cetak'
    );

    expect(voidResult.sessionId).toBe(liveSesi.id);
    expect(voidResult.questionId).toBe(snapshotQ2!.id);
    // Kerusakan penuh untuk 3 siswa: 3 * 100 base damage = 300 damage
    expect(voidResult.damageAwarded).toBe(300);
    expect(voidResult.remainingMonsterHp).toBe(120); // 420 - 300 = 120

    // 3. Verifikasi status butir soal di sesi telah ditandai isVoided
    const updatedSesi = await service.getSession(liveSesi.id);
    const updatedQ2 = updatedSesi?.butirSoal.find((q) => q.id === snapshotQ2!.id);
    expect(updatedQ2?.isVoided).toBe(true);
    expect(updatedQ2?.voidReason).toBe('Kunci jawaban salah cetak');
    expect(updatedQ2?.voidedAt).toBeDefined();
    expect(updatedSesi?.monsterHp).toBe(120);
  });

  it('mengakhiri sesi pertarungan (SELESAI) jika anulir atau serangan menghabiskan seluruh HP monster', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Kuis Cepat',
      mapel: 'Matematika',
      jenjang: 'Fase B - Kelas 4',
      topik: 'Penjumlahan',
    });

    await service.addManualQuestion(set.id, {
      teks: '1 + 1?',
      pilihanJawaban: [
        { teks: '2', benar: true },
        { teks: '1', benar: false },
      ],
    });

    const sesi = await service.launchSession(set.id);
    await service.joinLobby(sesi.pinKelas, 'Siswa A');

    // 1 siswa * 1 soal * 0.7 * 100 = 70 HP
    const liveSesi = await service.startBattle(sesi.id);
    expect(liveSesi.monsterHp).toBe(70);

    const q = liveSesi.butirSoal[0];
    // Anulir: 1 siswa * 100 base damage = 100 damage (lebih besar dari HP 70)
    const voidResult = await service.voidQuestion(liveSesi.id, q.id);

    expect(voidResult.remainingMonsterHp).toBe(0);

    const concludedSesi = await service.getSession(liveSesi.id);
    expect(concludedSesi?.status).toBe('SELESAI');
    expect(concludedSesi?.monsterHp).toBe(0);
  });
});

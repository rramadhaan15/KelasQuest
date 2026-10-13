import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { CurriculumService } from '../src/domain/curriculum-service';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';
import { MathEvaluator } from '../src/domain/math-evaluator';
import { QuotaManager } from '../src/domain/quota-manager';

describe('Ticket 08: Peluncuran Sesi Boss Battle dan Snapshot Immutability (ADR 0001)', () => {
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

  it('menolak peluncuran jika paket soal belum berstatus siap main / memiliki galat struktural', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Paket Belum Siap',
      mapel: 'Matematika',
      jenjang: 'Fase B - Kelas 4',
      topik: 'Pecahan',
    });

    // Paket belum memiliki butir soal sama sekali (DRAF)
    await expect(service.launchSession(set.id, {})).rejects.toThrow(
      /belum siap main/i
    );
  });

  it('memunculkan konfirmasi lunak jika masih ada butir soal yang belum ditinjau', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Paket Campuran',
      mapel: 'Matematika',
      jenjang: 'Fase B - Kelas 4',
      topik: 'Pecahan',
    });

    // Tambah soal via AI (status otomatis BELUM_DITINJAU)
    await service.streamGenerateQuestions(set.id);

    // Verifikasi kesiapan mengindikasikan hasUnreviewed: true
    const readiness = await service.validateSetReadiness(set.id);
    expect(readiness.isReady).toBe(true);
    expect(readiness.hasUnreviewed).toBe(true);

    // Peluncuran tanpa izin konfirmasi harus meminta konfirmasi (soft warning)
    await expect(
      service.launchSession(set.id, { allowUnreviewed: false })
    ).rejects.toThrow(/konfirmasi.*belum ditinjau/i);

    // Peluncuran dengan konfirmasi lunak diizinkan (allowUnreviewed: true)
    const sesi = await service.launchSession(set.id, { allowUnreviewed: true });
    expect(sesi).toBeDefined();
    expect(sesi.status).toBe('LOBI');
    expect(sesi.peringatanBelumDitinjau).toBe(true);
  });

  it('membekukan salinan statis butir soal sehingga perubahan draf setelah peluncuran tidak mengubah sesi aktif (Immutability ADR 0001)', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Matematika Aljabar',
      mapel: 'Matematika',
      jenjang: 'Fase D - Kelas 7',
      topik: 'Aljabar',
    });

    const q1 = await service.addManualQuestion(set.id, {
      teks: 'Berapa 2x jika x = 5?',
      pilihanJawaban: [
        { teks: '10', benar: true },
        { teks: '7', benar: false },
      ],
    });

    const q2 = await service.addManualQuestion(set.id, {
      teks: 'Berapa 3y jika y = 4?',
      pilihanJawaban: [
        { teks: '12', benar: true },
        { teks: '7', benar: false },
      ],
    });

    // Peluncuran sesi Boss Battle
    const sesi = await service.launchSession(set.id, {
      namaBoss: 'Naga Aljabar',
      tingkatKesulitanBoss: 'MENANTANG',
    });

    expect(sesi.pinKelas).toMatch(/^[A-Z0-9]{6}$/);
    expect(sesi.butirSoal.length).toBe(2);
    expect(sesi.butirSoal[0].teks).toBe('Berapa 2x jika x = 5?');
    expect(sesi.butirSoal[0].originalQuestionId).toBe(q1.id);

    // SEKARANG Guru mengubah atau menghapus butir soal pada draf induk
    await service.updateQuestion(q1.id, {
      teks: 'TEKS INI TELAH DIUBAH SECARA DRASTIS OLEH GURU SETELAH SESI DIMULAI!',
    });
    await service.deleteQuestion(q2.id);
    await service.addManualQuestion(set.id, {
      teks: 'Soal baru nomor 3 ditambahkan ke draf induk',
      pilihanJawaban: [
        { teks: 'A', benar: true },
        { teks: 'B', benar: false },
      ],
    });

    // Ambil sesi aktif kembali dari peladen
    const sesiAktif = await service.getSession(sesi.id);
    expect(sesiAktif).not.toBeNull();

    // Pastikan butir soal di sesi aktif TIDAK TERPENGARUH SAMA SEKALI
    expect(sesiAktif!.butirSoal.length).toBe(2);
    expect(sesiAktif!.butirSoal[0].teks).toBe('Berapa 2x jika x = 5?');
    expect(sesiAktif!.butirSoal[1].teks).toBe('Berapa 3y jika y = 4?');

    // Siswa dapat menemukan sesi menggunakan PIN 6 karakter
    const sesiByPin = await service.getSessionByPin(sesi.pinKelas);
    expect(sesiByPin).not.toBeNull();
    expect(sesiByPin?.id).toBe(sesi.id);
  });
});

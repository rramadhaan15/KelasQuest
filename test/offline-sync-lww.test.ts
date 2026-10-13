import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { CurriculumService } from '../src/domain/curriculum-service';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';
import { MathEvaluator } from '../src/domain/math-evaluator';
import { QuotaManager } from '../src/domain/quota-manager';
import { OfflineSyncEngine, InMemoryOfflineStore } from '../src/domain/offline-sync-engine';
import { PaketSoal, ButirSoal } from '../src/domain/types';

describe('Ticket 07: Offline Draft Sync with Question-Level LWW Conflict Resolution', () => {
  let repository: InMemoryStudioSoalRepository;
  let curriculumService: CurriculumService;
  let aiGenerator: MockAIQuestionGenerator;
  let mathEvaluator: MathEvaluator;
  let quotaManager: QuotaManager;
  let service: StudioSoalService;
  let offlineStore: InMemoryOfflineStore;
  let syncEngine: OfflineSyncEngine;

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
    offlineStore = new InMemoryOfflineStore();
    syncEngine = new OfflineSyncEngine(offlineStore, service);
  });

  it('menyimpan draf lokal secara otomatis ke offline store', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Pecahan Kelas 4',
      mapel: 'Matematika',
      jenjang: 'Fase B - Kelas 4',
      topik: 'Pecahan Senilai',
    });

    const localDraft: PaketSoal = {
      ...set,
      judul: 'Pecahan Kelas 4 (Draf Offline)',
      diperbaruiPada: new Date().toISOString(),
    };

    await offlineStore.saveDraft(localDraft);
    const retrieved = await offlineStore.getDraft(set.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.judul).toBe('Pecahan Kelas 4 (Draf Offline)');
  });

  it('menggabungkan perubahan luring dan peladen menggunakan LWW per butir soal tanpa menghilangkan soal konkuren peladen', async () => {
    // 1. Guru membuat paket dengan 2 soal awal di peladen
    const set = await service.createSet('guru-1', {
      judul: 'Matematika Bab 1',
      mapel: 'Matematika',
      jenjang: 'Fase B - Kelas 4',
      topik: 'Operasi Hitung',
    });

    const q1 = await service.addManualQuestion(set.id, {
      teks: 'Berapa 10 + 10?',
      pilihanJawaban: [
        { teks: '20', benar: true },
        { teks: '30', benar: false },
      ],
    });

    const q2 = await service.addManualQuestion(set.id, {
      teks: 'Berapa 5 x 5?',
      pilihanJawaban: [
        { teks: '25', benar: true },
        { teks: '35', benar: false },
      ],
    });

    // 2. Simulasi: Guru luring mengedit q1 pada timestamp T2 (lebih baru)
    const tOffline = new Date(Date.now() + 5000).toISOString();
    const q1OfflineEdit: ButirSoal = {
      ...q1,
      teks: 'Berapa 10 + 10? (Diedit saat luring)',
      diperbaruiPada: tOffline,
    };

    // Guru juga menambahkan q3 baru saat luring
    const q3Offline: ButirSoal = {
      id: 'soal-offline-3',
      paketId: set.id,
      urutan: 3,
      teks: 'Berapa 100 / 2? (Dibuat saat luring)',
      kesulitan: 'MUDAH',
      pembahasan: '100 dibagi 2 sama dengan 50',
      waktuDetik: 20,
      sumber: 'MANUAL',
      statusTinjauan: 'DISETUJUI',
      pilihanJawaban: [
        { id: 'opt-1', teks: '50', benar: true },
        { id: 'opt-2', teks: '40', benar: false },
      ],
      isValid: true,
      validasiGalat: [],
      diperbaruiPada: tOffline,
    };

    // 3. Sementara itu di peladen, ada q4 yang masuk secara konkuren (misal AI streaming selesai)
    const q4Server = await service.addManualQuestion(set.id, {
      teks: 'Berapa 7 x 7? (Masuk di server)',
      pilihanJawaban: [
        { teks: '49', benar: true },
        { teks: '42', benar: false },
      ],
    });

    // 4. Sinkronisasi draf luring ke peladen
    const clientDraft: PaketSoal = {
      ...set,
      butirSoal: [q1OfflineEdit, q2, q3Offline], // client tidak tahu q4 ada di server
    };

    const hasilSync = await service.syncOfflineDraft(set.id, clientDraft);

    expect(hasilSync.berhasil).toBe(true);

    // Ambil paket terbaru dari peladen
    const mergedSet = await service.getSet(set.id);
    expect(mergedSet).not.toBeNull();
    const mergedQuestions = mergedSet!.butirSoal;

    // Harusnya ada 4 soal sekarang:
    // - q1 dengan teks baru dari luring (LWW client menang karena timestamp lebih baru)
    // - q2 tetap ada
    // - q3 dari luring masuk ke peladen
    // - q4 dari peladen TIDAK HILANG (ADR 0003: tidak tertimpa oleh client draft yang usang)
    expect(mergedQuestions.length).toBe(4);

    const mergedQ1 = mergedQuestions.find((q) => q.id === q1.id);
    expect(mergedQ1?.teks).toBe('Berapa 10 + 10? (Diedit saat luring)');

    const mergedQ3 = mergedQuestions.find((q) => q.id === 'soal-offline-3');
    expect(mergedQ3).toBeDefined();

    const mergedQ4 = mergedQuestions.find((q) => q.id === q4Server.id);
    expect(mergedQ4).toBeDefined();
    expect(mergedQ4?.teks).toContain('Berapa 7 x 7?');
  });

  it('menyimpan riwayat revisi hingga 10 versi terakhir di peladen dan dapat di-rollback', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Fisika Dasar',
      mapel: 'IPA',
      jenjang: 'Fase D - Kelas 7',
      topik: 'Pengukuran',
    });

    // Buat 12 pembaruan berturut-turut untuk menguji batas 10 revisi
    for (let i = 1; i <= 12; i++) {
      await service.addManualQuestion(set.id, {
        teks: `Soal nomor ${i}`,
        pilihanJawaban: [
          { teks: 'A', benar: true },
          { teks: 'B', benar: false },
        ],
      });
    }

    const revisions = await service.getRevisions(set.id);
    // Kapasitas riwayat revisi maksimal 10
    expect(revisions.length).toBeLessThanOrEqual(10);
    expect(revisions.length).toBe(10);

    // Lakukan rollback ke salah satu versi lama
    const targetVersi = revisions[5].versi;
    const rolledBack = await service.rollbackToRevision(set.id, targetVersi);

    expect(rolledBack).toBeDefined();
    expect(rolledBack.id).toBe(set.id);
    // Memastikan paket yang aktif di peladen sekarang sesuai dengan snapshot target
    const current = await service.getSet(set.id);
    expect(current?.butirSoal.length).toBe(revisions[5].snapshot.butirSoal.length);
  });

  it('mendeteksi konflik multi-tab/perangkat dengan peringatan pengambilalihan sesi', async () => {
    const set = await service.createSet('guru-1', {
      judul: 'Biologi Sel',
      mapel: 'IPA',
      jenjang: 'Fase E - Kelas 10',
      topik: 'Struktur Sel',
    });

    // Tab A membuka sesi penyuntingan
    const tabA = service.registerEditorSession(set.id, 'session-tab-A');
    expect(tabA.takenOver).toBe(false);

    // Tab B membuka paket yang sama (misal di tab lain atau laptop lain)
    const tabB = service.registerEditorSession(set.id, 'session-tab-B');
    expect(tabB.takenOver).toBe(false);

    // Saat Tab A mencoba mengecek sesi atau menyimpan, sistem mendeteksi pengambilalihan
    const statusTabA = service.checkEditorSession(set.id, 'session-tab-A');
    expect(statusTabA.takenOver).toBe(true);

    // Sedangkan Tab B tetap sah sebagai editor aktif
    const statusTabB = service.checkEditorSession(set.id, 'session-tab-B');
    expect(statusTabB.takenOver).toBe(false);
  });
});

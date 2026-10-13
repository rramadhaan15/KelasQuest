import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { CurriculumService } from '../src/domain/curriculum-service';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';
import { MathEvaluator } from '../src/domain/math-evaluator';
import { QuotaManager } from '../src/domain/quota-manager';
import { StudentResponseRecord } from '../src/domain/types';

describe('Ticket 11: Pengaliran Balik Analitik Pasca Permainan ke Statistik Butir Soal', () => {
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

  it('mengalirkan balik log jawaban sesi ke Statistik Butir Soal paket induk dan menandai Akurasi Rendah (<30%)', async () => {
    // 1. Guru membuat paket soal dengan 2 butir soal
    const set = await service.createSet('guru-1', {
      judul: 'Pecahan Senilai',
      mapel: 'Matematika',
      jenjang: 'Fase B - Kelas 4',
      topik: 'Pecahan',
    });

    // Soal 1: Banyak siswa akan salah paham
    const q1 = await service.addManualQuestion(set.id, {
      teks: 'Berapakah pecahan senilai dari 1/2?',
      pilihanJawaban: [
        { teks: '2/4', benar: true },
        {
          teks: '2/3',
          benar: false,
          labelMiskonsepsi: 'Menambahkan 1 pada pembilang dan penyebut',
        },
        {
          teks: '1/3',
          benar: false,
          labelMiskonsepsi: 'Hanya mengubah penyebut tanpa pembilang',
        },
      ],
    });

    // Soal 2: Soal mudah dengan akurasi tinggi
    const q2 = await service.addManualQuestion(set.id, {
      teks: 'Berapakah 2/2 dalam bentuk bilangan bulat?',
      pilihanJawaban: [
        { teks: '1', benar: true },
        { teks: '2', benar: false },
      ],
    });

    // 2. Luncurkan sesi Boss Battle
    const sesi = await service.launchSession(set.id);
    await service.joinLobby(sesi.pinKelas, 'Siswa 1');
    await service.joinLobby(sesi.pinKelas, 'Siswa 2');
    await service.joinLobby(sesi.pinKelas, 'Siswa 3');
    await service.joinLobby(sesi.pinKelas, 'Siswa 4');
    await service.startBattle(sesi.id);

    const snapQ1 = sesi.butirSoal.find((q) => q.originalQuestionId === q1.id)!;
    const snapQ2 = sesi.butirSoal.find((q) => q.originalQuestionId === q2.id)!;

    const optQ1Benar = snapQ1.pilihanJawaban.find((p) => p.benar)!;
    const optQ1Salah1 = snapQ1.pilihanJawaban.find((p) => p.teks === '2/3')!;
    const optQ1Salah2 = snapQ1.pilihanJawaban.find((p) => p.teks === '1/3')!;

    const optQ2Benar = snapQ2.pilihanJawaban.find((p) => p.benar)!;

    // 3. Simulasikan respon dari 4 siswa:
    // Soal 1: Hanya 1 dari 4 yang benar (akurasi 25% < 30%)
    // 2 siswa memilih '2/3' (miskonsepsi tambah 1)
    // 1 siswa memilih '1/3' (miskonsepsi ubah penyebut)
    const responses: StudentResponseRecord[] = [
      {
        studentId: 's1',
        questionId: snapQ1.id,
        selectedOptionId: optQ1Benar.id,
        isCorrect: true,
      },
      {
        studentId: 's2',
        questionId: snapQ1.id,
        selectedOptionId: optQ1Salah1.id,
        isCorrect: false,
      },
      {
        studentId: 's3',
        questionId: snapQ1.id,
        selectedOptionId: optQ1Salah1.id,
        isCorrect: false,
      },
      {
        studentId: 's4',
        questionId: snapQ1.id,
        selectedOptionId: optQ1Salah2.id,
        isCorrect: false,
      },
      // Soal 2: Semua 4 siswa menjawab benar (akurasi 100%)
      {
        studentId: 's1',
        questionId: snapQ2.id,
        selectedOptionId: optQ2Benar.id,
        isCorrect: true,
      },
      {
        studentId: 's2',
        questionId: snapQ2.id,
        selectedOptionId: optQ2Benar.id,
        isCorrect: true,
      },
      {
        studentId: 's3',
        questionId: snapQ2.id,
        selectedOptionId: optQ2Benar.id,
        isCorrect: true,
      },
      {
        studentId: 's4',
        questionId: snapQ2.id,
        selectedOptionId: optQ2Benar.id,
        isCorrect: true,
      },
    ];

    // 4. Conclude session & run analytics rollup
    await service.concludeSession(sesi.id, responses);

    // 5. Verifikasi statistik pada butir soal di paket induk
    const updatedQ1 = await service.getQuestion(q1.id);
    expect(updatedQ1).not.toBeNull();
    expect(updatedQ1?.statistik).toBeDefined();
    expect(updatedQ1?.statistik?.totalMenjawab).toBe(4);
    expect(updatedQ1?.statistik?.totalBenar).toBe(1);
    expect(updatedQ1?.statistik?.akurasiPersen).toBe(25);
    // Akurasi 25% < 30% sehingga memicu label Akurasi Rendah
    expect(updatedQ1?.statistik?.labelAkurasiRendah).toBe(true);

    // Sebaran miskonsepsi teragregasi
    expect(
      updatedQ1?.statistik?.distribusiMiskonsepsi[
        'Menambahkan 1 pada pembilang dan penyebut'
      ]
    ).toBe(2);
    expect(
      updatedQ1?.statistik?.distribusiMiskonsepsi[
        'Hanya mengubah penyebut tanpa pembilang'
      ]
    ).toBe(1);

    // Soal 2: Akurasi 100%, tidak berlabel akurasi rendah
    const updatedQ2 = await service.getQuestion(q2.id);
    expect(updatedQ2?.statistik?.totalMenjawab).toBe(4);
    expect(updatedQ2?.statistik?.totalBenar).toBe(4);
    expect(updatedQ2?.statistik?.akurasiPersen).toBe(100);
    expect(updatedQ2?.statistik?.labelAkurasiRendah).toBe(false);
  });
});

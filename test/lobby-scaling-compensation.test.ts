import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { CurriculumService } from '../src/domain/curriculum-service';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';
import { MathEvaluator } from '../src/domain/math-evaluator';
import { QuotaManager } from '../src/domain/quota-manager';
import {
  calculateMonsterHp,
  calculateDamageCompensationMultiplier,
} from '../src/domain/boss-battle-scaling';

describe('Ticket 09: Lobi Siswa, Penguncian HP Monster Dinamis, dan Kompensasi Diskoneksi (ADR 0004)', () => {
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

  describe('Kalkulator Penskalaan Monster & Kompensasi', () => {
    it('menghitung HP monster berdasarkan rumus jumlah_siswa * total_soal * akurasi * damage', () => {
      // 20 siswa, 10 soal, akurasi target 0.7 (70%), base damage 100 = 14,000 HP
      const hp = calculateMonsterHp(20, 10, 0.7, 100);
      expect(hp).toBe(14000);

      // Skala berubah jika hanya 5 siswa hadir di lobi
      const hpKecil = calculateMonsterHp(5, 10, 0.7, 100);
      expect(hpKecil).toBe(3500);
    });

    it('menghitung pengali kompensasi kerusakan jika siswa terputus', () => {
      // 20 siswa awal, 20 masih aktif => multiplier = 1.0x (normal)
      expect(calculateDamageCompensationMultiplier(20, 20)).toBe(1.0);

      // 20 siswa awal, 10 terputus (10 aktif) => multiplier = 2.0x (siswa tersisa memberi 2x damage)
      expect(calculateDamageCompensationMultiplier(20, 10)).toBe(2.0);

      // 20 siswa awal, 15 aktif => multiplier = 1.33x
      expect(calculateDamageCompensationMultiplier(20, 15)).toBeCloseTo(1.333, 2);

      // Tidak ada siswa aktif => default 1.0 (mencegah pembagian dengan nol)
      expect(calculateDamageCompensationMultiplier(20, 0)).toBe(1.0);
    });
  });

  describe('Alur Lobi dan Pertarungan di StudioSoalService', () => {
    it('mengizinkan siswa bergabung secara anonim dan mengunci HP monster saat guru menekan Mulai Pertarungan', async () => {
      // 1. Guru membuat paket 5 soal dan meluncurkan sesi
      const set = await service.createSet('guru-1', {
        judul: 'Pecahan Sederhana',
        mapel: 'Matematika',
        jenjang: 'Fase B - Kelas 4',
        topik: 'Pecahan',
      });

      for (let i = 1; i <= 5; i++) {
        await service.addManualQuestion(set.id, {
          teks: `Soal pecahan ${i}`,
          waktuDetik: 25,
          pilihanJawaban: [
            { teks: 'Benar', benar: true },
            { teks: 'Salah', benar: false },
          ],
        });
      }

      const sesi = await service.launchSession(set.id, {
        namaBoss: 'Golem Batu',
      });

      // 2. Tiga siswa bergabung ke lobi dengan kode PIN
      const join1 = await service.joinLobby(sesi.pinKelas, 'Budi');
      const join2 = await service.joinLobby(sesi.pinKelas, 'Siti');
      const join3 = await service.joinLobby(sesi.pinKelas, 'Eko');

      expect(join1.studentId).toBeDefined();
      expect(join2.studentId).toBeDefined();
      expect(join3.studentId).toBeDefined();

      const sesiLobi = await service.getSession(sesi.id);
      expect(sesiLobi?.peserta.length).toBe(3);
      expect(sesiLobi?.peserta.map((p) => p.nama)).toEqual(['Budi', 'Siti', 'Eko']);
      // Saat di lobi, HP monster belum dikunci
      expect(sesiLobi?.status).toBe('LOBI');

      // 3. Guru menekan "Mulai Pertarungan"
      const sesiMulai = await service.startBattle(sesi.id);
      expect(sesiMulai.status).toBe('BERLANGSUNG');
      expect(sesiMulai.jumlahSiswaAwal).toBe(3);
      // Formula: 3 siswa * 5 soal * 0.7 * 100 = 1050 HP
      expect(sesiMulai.monsterHp).toBe(1050);
      expect(sesiMulai.monsterHpMaksimal).toBe(1050);
      // Total durasi: 5 soal * 25 detik = 125 detik
      expect(sesiMulai.durasiTotalDetik).toBe(125);
    });

    it('mendeteksi diskoneksi detak jantung siswa dan menghitung pengali kompensasi kerusakan dinamis', async () => {
      const set = await service.createSet('guru-1', {
        judul: 'IPA Ekosistem',
        mapel: 'IPA',
        jenjang: 'Fase D - Kelas 7',
        topik: 'Rantai Makanan',
      });

      for (let i = 1; i <= 5; i++) {
        await service.addManualQuestion(set.id, {
          teks: `Soal ekosistem ${i}`,
          pilihanJawaban: [
            { teks: 'A', benar: true },
            { teks: 'B', benar: false },
          ],
        });
      }

      const sesi = await service.launchSession(set.id);
      const s1 = await service.joinLobby(sesi.pinKelas, 'Andi');
      const s2 = await service.joinLobby(sesi.pinKelas, 'Bayu');

      await service.startBattle(sesi.id);

      // Normal awal: 2 aktif dari 2 awal => multiplier 1.0x
      expect(service.getDamageCompensationMultiplier(sesi.id)).toBe(1.0);

      // Bayu terputus (misal baterai habis / sinyal 4G hilang)
      await service.disconnectStudent(sesi.id, s2.studentId);

      // Sekarang 1 aktif dari 2 awal => multiplier 2.0x otomatis aktif
      expect(service.getDamageCompensationMultiplier(sesi.id)).toBe(2.0);

      // Saat detak jantung Bayu pulih
      await service.recordStudentHeartbeat(sesi.id, s2.studentId);
      expect(service.getDamageCompensationMultiplier(sesi.id)).toBe(1.0);
    });
  });
});

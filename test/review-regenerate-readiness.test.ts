import { describe, it, expect, beforeEach } from 'vitest';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { MockAIQuestionGenerator } from '../src/adapters/mock-ai-generator';

describe('Alur Tinjauan Guru, Regenerasi & Kesiapan Paket (Tiket 05)', () => {
  let repository: InMemoryStudioSoalRepository;
  let aiGenerator: MockAIQuestionGenerator;
  let service: StudioSoalService;

  beforeEach(() => {
    repository = new InMemoryStudioSoalRepository();
    aiGenerator = new MockAIQuestionGenerator();
    service = new StudioSoalService(repository, undefined, aiGenerator);
  });

  it('guru dapat menyetujui butir soal individual (statusTinjauan menjadi DISETUJUI)', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'IPA Kelas 7',
      mapel: 'IPA',
      jenjang: '7 SMP',
      topik: 'Ekosistem',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    await service.streamGenerateQuestions(paket.id);
    const setAfter = await service.getSet(paket.id);
    expect(setAfter?.butirSoal[0].statusTinjauan).toBe('BELUM_DITINJAU');

    const approved = await service.approveQuestion(setAfter!.butirSoal[0].id);
    expect(approved.statusTinjauan).toBe('DISETUJUI');

    const refreshed = await service.getSet(paket.id);
    expect(refreshed?.butirSoal[0].statusTinjauan).toBe('DISETUJUI');
  });

  it('guru dapat menggunakan tombol "Setujui Semua yang Valid"', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Matematika Bilangan Bulat',
      mapel: 'Matematika',
      jenjang: '6 SD',
      topik: 'Bilangan Bulat',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    await service.streamGenerateQuestions(paket.id);
    const { approvedCount } = await service.approveAllValidQuestions(paket.id);
    expect(approvedCount).toBe(5);

    const refreshed = await service.getSet(paket.id);
    expect(refreshed?.butirSoal.every((q) => q.statusTinjauan === 'DISETUJUI')).toBe(true);
  });

  it('guru dapat meregenerasi butir soal perorangan dengan arahan chip', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Pecahan Campuran',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    await service.streamGenerateQuestions(paket.id);
    const setBefore = await service.getSet(paket.id);
    const targetId = setBefore!.butirSoal[1].id;

    const regenerated = await service.regenerateQuestion(targetId, 'LEBIH_MUDAH');
    expect(regenerated.id).toBe(targetId);
    expect(regenerated.statusTinjauan).toBe('BELUM_DITINJAU');

    const setAfter = await service.getSet(paket.id);
    expect(setAfter?.butirSoal.length).toBe(5); // Jumlah total soal tidak bertambah
  });

  it('guru dapat menghapus butir soal individual', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Latihan IPA',
      mapel: 'IPA',
      jenjang: '7 SMP',
      topik: 'Fotosintesis',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    await service.streamGenerateQuestions(paket.id);
    const setBefore = await service.getSet(paket.id);
    const deleteId = setBefore!.butirSoal[0].id;

    await service.deleteQuestion(deleteId);

    const setAfter = await service.getSet(paket.id);
    expect(setAfter?.butirSoal.length).toBe(4);
    expect(setAfter?.butirSoal.find((q) => q.id === deleteId)).toBeUndefined();
  });

  it('evaluasi kesiapan paket melaporkan status siap main dan indikasi soal belum ditinjau', async () => {
    const paket = await service.createSet('guru-rina', {
      judul: 'Sejarah Kemerdekaan',
      mapel: 'Sejarah',
      jenjang: '11 SMA',
      topik: 'Proklamasi',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    await service.streamGenerateQuestions(paket.id);
    const readiness1 = await service.validateSetReadiness(paket.id);
    expect(readiness1.isReady).toBe(true);
    expect(readiness1.hasUnreviewed).toBe(true); // Masih ada yang belum ditinjau

    // Setujui semua
    await service.approveAllValidQuestions(paket.id);
    const readiness2 = await service.validateSetReadiness(paket.id);
    expect(readiness2.isReady).toBe(true);
    expect(readiness2.hasUnreviewed).toBe(false);
  });
});

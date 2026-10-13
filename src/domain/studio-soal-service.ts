import { StudioSoalRepository } from './repository-interface';
import {
  PaketSoal,
  ButirSoal,
  CreateSetInput,
  AddManualQuestionInput,
  UpdateQuestionInput,
  PilihanJawaban,
  ParameterPenjanaan,
  RevisiPaketSoal,
  HasilSinkronisasi,
  SnapshotSesi,
  LobbyConfig,
  ButirSoalSnapshot,
} from './types';
import { validateQuestion, calculateSetStatus } from './validation';
import { CurriculumService } from './curriculum-service';
import { AIQuestionGenerator, GenerationContext } from './ai-generator-interface';
import { MathEvaluator } from './math-evaluator';
import { QuotaManager, TeacherQuota } from './quota-manager';
import { mergeQuestionsLWW } from './offline-sync-engine';

export class StudioSoalService {
  constructor(
    private repository: StudioSoalRepository,
    private curriculumService?: CurriculumService,
    private aiGenerator?: AIQuestionGenerator,
    private mathEvaluator?: MathEvaluator,
    private quotaManager?: QuotaManager
  ) {}

  async createSet(guruId: string, input: CreateSetInput): Promise<PaketSoal> {
    const now = new Date().toISOString();
    const id = `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Default & validate generation parameters if provided
    let parameterPenjanaan: ParameterPenjanaan | undefined = undefined;
    if (input.parameterPenjanaan) {
      const params = input.parameterPenjanaan;
      const jumlahSoal = params.jumlahSoal !== undefined ? params.jumlahSoal : 20;
      if (jumlahSoal < 5 || jumlahSoal > 40) {
        throw new Error('Jumlah soal harus antara 5 sampai 40 butir');
      }

      const komposisi = params.komposisiKesulitan || { mudah: 30, sedang: 50, sulit: 20 };
      const totalKomposisi = komposisi.mudah + komposisi.sedang + komposisi.sulit;
      if (totalKomposisi !== 100) {
        throw new Error('Total persentase komposisi kesulitan harus tepat 100%');
      }

      parameterPenjanaan = {
        jumlahSoal,
        komposisiKesulitan: komposisi,
        waktuPerSoalDetik: params.waktuPerSoalDetik || 20,
        gayaSoal: params.gayaSoal || 'KONTEKS_SEHARI_HARI',
        modeMiskonsepsi: params.modeMiskonsepsi !== undefined ? params.modeMiskonsepsi : true,
        instruksiTambahan: params.instruksiTambahan,
      };
    }

    const paket: PaketSoal = {
      id,
      guruId,
      judul: input.judul,
      mapel: input.mapel,
      jenjang: input.jenjang,
      topik: input.topik,
      capaianPembelajaran: input.capaianPembelajaran,
      parameterPenjanaan,
      status: 'DRAF',
      butirSoal: [],
      dibuatPada: now,
      diperbaruiPada: now,
    };

    await this.repository.saveSet(paket);
    return paket;
  }

  async getSet(id: string): Promise<PaketSoal | null> {
    return this.repository.getSet(id);
  }

  async listSets(guruId: string): Promise<PaketSoal[]> {
    return this.repository.listSetsByGuru(guruId);
  }

  async addManualQuestion(
    paketId: string,
    input: AddManualQuestionInput
  ): Promise<ButirSoal> {
    const paket = await this.repository.getSet(paketId);
    if (!paket) {
      throw new Error(`Paket Soal dengan id ${paketId} tidak ditemukan`);
    }

    const now = new Date().toISOString();
    const existingQuestions = await this.repository.listQuestionsBySet(paketId);
    const urutan = existingQuestions.length + 1;
    const questionId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const pilihanJawaban: PilihanJawaban[] = input.pilihanJawaban.map((p, idx) => ({
      id: `opt-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      teks: p.teks,
      benar: p.benar,
      labelMiskonsepsi: p.labelMiskonsepsi,
    }));

    const validation = validateQuestion(input.teks, pilihanJawaban);

    const butirSoal: ButirSoal = {
      id: questionId,
      paketId,
      urutan,
      teks: input.teks,
      kesulitan: input.kesulitan || 'SEDANG',
      subtopik: input.subtopik,
      pembahasan: input.pembahasan || '',
      waktuDetik: input.waktuDetik || 20,
      sumber: 'MANUAL',
      statusTinjauan: 'DISETUJUI', // Sesuai PRD, soal buatan guru sendiri langsung berstatus Disetujui
      pilihanJawaban,
      isValid: validation.isValid,
      validasiGalat: validation.errors,
      diperbaruiPada: now,
    };

    await this.repository.saveQuestion(butirSoal);

    // Perbarui status kesiapan paket
    const updatedQuestions = [...existingQuestions, butirSoal];
    const newStatus = calculateSetStatus(updatedQuestions);

    paket.status = newStatus;
    paket.diperbaruiPada = now;
    await this.repository.saveSet(paket);
    await this.recordRevision(paketId, 'Tambah butir soal manual');

    return butirSoal;
  }

  async updateQuestion(
    questionId: string,
    input: UpdateQuestionInput
  ): Promise<ButirSoal> {
    const existing = await this.repository.getQuestion(questionId);
    if (!existing) {
      throw new Error(`Butir soal dengan id ${questionId} tidak ditemukan`);
    }

    const now = new Date().toISOString();
    const teks = input.teks !== undefined ? input.teks : existing.teks;
    const kesulitan = input.kesulitan !== undefined ? input.kesulitan : existing.kesulitan;
    const subtopik = input.subtopik !== undefined ? input.subtopik : existing.subtopik;
    const pembahasan = input.pembahasan !== undefined ? input.pembahasan : existing.pembahasan;
    const waktuDetik = input.waktuDetik !== undefined ? input.waktuDetik : existing.waktuDetik;

    let pilihanJawaban = existing.pilihanJawaban;
    if (input.pilihanJawaban) {
      pilihanJawaban = input.pilihanJawaban.map((p, idx) => ({
        id: p.id || `opt-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        teks: p.teks,
        benar: p.benar,
        labelMiskonsepsi: p.labelMiskonsepsi,
      }));
    }

    const validation = validateQuestion(teks, pilihanJawaban);

    const updatedQuestion: ButirSoal = {
      ...existing,
      teks,
      kesulitan,
      subtopik,
      pembahasan,
      waktuDetik,
      pilihanJawaban,
      statusTinjauan: input.statusTinjauan || 'DIEDIT',
      isValid: validation.isValid,
      validasiGalat: validation.errors,
      diperbaruiPada: now,
    };

    await this.repository.saveQuestion(updatedQuestion);

    // Perbarui status paket
    const allQuestions = await this.repository.listQuestionsBySet(existing.paketId);
    const paket = await this.repository.getSet(existing.paketId);
    if (paket) {
      paket.status = calculateSetStatus(allQuestions);
      paket.diperbaruiPada = now;
      await this.repository.saveSet(paket);
      await this.recordRevision(existing.paketId, 'Perbarui butir soal');
    }

    return updatedQuestion;
  }

  async streamGenerateQuestions(
    setId: string,
    onQuestionSaved?: (q: ButirSoal) => void | Promise<void>,
    signal?: AbortSignal
  ): Promise<{ totalGenerated: number; questions: ButirSoal[] }> {
    const paket = await this.repository.getSet(setId);
    if (!paket) {
      throw new Error(`Paket Soal dengan id ${setId} tidak ditemukan`);
    }

    if (!this.aiGenerator) {
      throw new Error('AI Generator belum dikonfigurasikan');
    }

    const context: GenerationContext = {
      mapel: paket.mapel,
      jenjang: paket.jenjang,
      topik: paket.topik,
      capaianPembelajaran: paket.capaianPembelajaran,
      jumlahSoal: paket.parameterPenjanaan?.jumlahSoal || 20,
      modeMiskonsepsi: paket.parameterPenjanaan?.modeMiskonsepsi ?? true,
      gayaSoal: paket.parameterPenjanaan?.gayaSoal,
      instruksiTambahan: paket.parameterPenjanaan?.instruksiTambahan,
    };

    const generatedList: ButirSoal[] = [];
    const existing = await this.repository.listQuestionsBySet(setId);
    let currentUrutan = existing.length;

    try {
      for await (const draft of this.aiGenerator.generateQuestionStream(context, signal)) {
        if (signal?.aborted) {
          const err = new Error('Generation aborted');
          err.name = 'AbortError';
          throw err;
        }

        currentUrutan++;
        const now = new Date().toISOString();
        const questionId = `q-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        let pilihanDraft = [...draft.pilihanJawaban];
        let teksDraft = draft.teks;

        if (this.mathEvaluator) {
          const mathCheck = this.mathEvaluator.evaluateMathQuestion(draft.teks, draft.pilihanJawaban);
          if (mathCheck.isArithmeticQuestion && !mathCheck.isCorrect && mathCheck.expectedAnswer) {
            let found = false;
            pilihanDraft = pilihanDraft.map((p) => {
              if (p.teks.trim() === mathCheck.expectedAnswer) {
                found = true;
                return { ...p, benar: true };
              }
              return { ...p, benar: false };
            });

            if (!found && pilihanDraft.length > 0) {
              pilihanDraft[0] = {
                ...pilihanDraft[0],
                teks: mathCheck.expectedAnswer,
                benar: true,
                labelMiskonsepsi: undefined,
              };
            }
          }
          teksDraft = this.mathEvaluator.formatToUnicodeTypography(teksDraft);
        }

        const pilihanJawaban: PilihanJawaban[] = pilihanDraft.map((p, idx) => ({
          id: `opt-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
          teks: p.teks,
          benar: p.benar,
          labelMiskonsepsi: p.labelMiskonsepsi,
        }));

        const validation = validateQuestion(teksDraft, pilihanJawaban);

        const butirSoal: ButirSoal = {
          id: questionId,
          paketId: setId,
          urutan: currentUrutan,
          teks: teksDraft,
          kesulitan: draft.kesulitan,
          subtopik: draft.subtopik,
          pembahasan: draft.pembahasan,
          waktuDetik: draft.waktuDetik,
          sumber: 'AI',
          statusTinjauan: 'BELUM_DITINJAU', // Soal AI selalu mulai dari Belum Ditinjau
          pilihanJawaban,
          isValid: validation.isValid,
          validasiGalat: validation.errors,
          diperbaruiPada: now,
        };

        // Potong kuota harian secara proporsional per butir soal yang berhasil tersimpan
        if (this.quotaManager) {
          await this.quotaManager.consumeQuota(paket.guruId, 1);
        }

        // Simpan langsung secara atomik ke database sebelum memanggil callback (ADR 0002)
        await this.repository.saveQuestion(butirSoal);
        generatedList.push(butirSoal);

        // Perbarui status paket
        const allQuestions = await this.repository.listQuestionsBySet(setId);
        paket.status = calculateSetStatus(allQuestions);
        paket.diperbaruiPada = now;
        await this.repository.saveSet(paket);

        if (onQuestionSaved) {
          await onQuestionSaved(butirSoal);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const currentSaved = await this.repository.listQuestionsBySet(setId);
        paket.status = calculateSetStatus(currentSaved);
        await this.repository.saveSet(paket);
      }
      throw err;
    }

    return {
      totalGenerated: generatedList.length,
      questions: generatedList,
    };
  }

  async approveQuestion(questionId: string): Promise<ButirSoal> {
    const existing = await this.repository.getQuestion(questionId);
    if (!existing) {
      throw new Error(`Butir soal dengan id ${questionId} tidak ditemukan`);
    }

    const updated: ButirSoal = {
      ...existing,
      statusTinjauan: 'DISETUJUI',
      diperbaruiPada: new Date().toISOString(),
    };

    await this.repository.saveQuestion(updated);
    return updated;
  }

  async approveAllValidQuestions(setId: string): Promise<{ approvedCount: number }> {
    const questions = await this.repository.listQuestionsBySet(setId);
    let count = 0;
    const now = new Date().toISOString();

    for (const q of questions) {
      if (q.isValid && q.statusTinjauan !== 'DISETUJUI') {
        q.statusTinjauan = 'DISETUJUI';
        q.diperbaruiPada = now;
        await this.repository.saveQuestion(q);
        count++;
      }
    }

    return { approvedCount: count };
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const existing = await this.repository.getQuestion(questionId);
    if (!existing) return;

    await this.repository.deleteQuestion(questionId);

    const remaining = await this.repository.listQuestionsBySet(existing.paketId);
    const paket = await this.repository.getSet(existing.paketId);
    if (paket) {
      paket.status = calculateSetStatus(remaining);
      paket.diperbaruiPada = new Date().toISOString();
      await this.repository.saveSet(paket);
      await this.recordRevision(existing.paketId, 'Hapus butir soal');
    }
  }

  async regenerateQuestion(
    questionId: string,
    promptDirection?: string,
    customInstruction?: string
  ): Promise<ButirSoal> {
    const existing = await this.repository.getQuestion(questionId);
    if (!existing) {
      throw new Error(`Butir soal dengan id ${questionId} tidak ditemukan`);
    }

    const paket = await this.repository.getSet(existing.paketId);
    if (!paket) {
      throw new Error(`Paket Soal dengan id ${existing.paketId} tidak ditemukan`);
    }

    if (!this.aiGenerator) {
      throw new Error('AI Generator belum dikonfigurasikan');
    }

    const context: GenerationContext = {
      mapel: paket.mapel,
      jenjang: paket.jenjang,
      topik: paket.topik,
      capaianPembelajaran: paket.capaianPembelajaran,
      jumlahSoal: 1,
      modeMiskonsepsi: paket.parameterPenjanaan?.modeMiskonsepsi ?? true,
      gayaSoal: paket.parameterPenjanaan?.gayaSoal,
      instruksiTambahan: [promptDirection, customInstruction].filter(Boolean).join(' - '),
    };

    let newDraft: any = null;
    for await (const draft of this.aiGenerator.generateQuestionStream(context)) {
      newDraft = draft;
      break;
    }

    if (!newDraft) {
      throw new Error('Gagal meregenerasi butir soal dari AI');
    }

    const now = new Date().toISOString();
    let pilihanDraft = [...newDraft.pilihanJawaban];
    let teksDraft = newDraft.teks;

    if (this.mathEvaluator) {
      const mathCheck = this.mathEvaluator.evaluateMathQuestion(newDraft.teks, newDraft.pilihanJawaban);
      if (mathCheck.isArithmeticQuestion && !mathCheck.isCorrect && mathCheck.expectedAnswer) {
        let found = false;
        pilihanDraft = pilihanDraft.map((p: any) => {
          if (p.teks.trim() === mathCheck.expectedAnswer) {
            found = true;
            return { ...p, benar: true };
          }
          return { ...p, benar: false };
        });

        if (!found && pilihanDraft.length > 0) {
          pilihanDraft[0] = {
            ...pilihanDraft[0],
            teks: mathCheck.expectedAnswer,
            benar: true,
            labelMiskonsepsi: undefined,
          };
        }
      }
      teksDraft = this.mathEvaluator.formatToUnicodeTypography(teksDraft);
    }

    const pilihanJawaban: PilihanJawaban[] = pilihanDraft.map((p: any, idx: number) => ({
      id: `opt-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      teks: p.teks,
      benar: p.benar,
      labelMiskonsepsi: p.labelMiskonsepsi,
    }));

    const validation = validateQuestion(teksDraft, pilihanJawaban);

    const updated: ButirSoal = {
      ...existing,
      teks: teksDraft,
      kesulitan: newDraft.kesulitan,
      subtopik: newDraft.subtopik,
      pembahasan: newDraft.pembahasan,
      waktuDetik: newDraft.waktuDetik,
      sumber: 'AI',
      statusTinjauan: 'BELUM_DITINJAU',
      pilihanJawaban,
      isValid: validation.isValid,
      validasiGalat: validation.errors,
      diperbaruiPada: now,
    };

    if (this.quotaManager) {
      await this.quotaManager.consumeQuota(paket.guruId, 1);
    }

    await this.repository.saveQuestion(updated);

    const allQuestions = await this.repository.listQuestionsBySet(existing.paketId);
    paket.status = calculateSetStatus(allQuestions);
    paket.diperbaruiPada = now;
    await this.repository.saveSet(paket);
    await this.recordRevision(existing.paketId, 'Regenerasi butir soal');

    return updated;
  }

  async validateSetReadiness(
    setId: string
  ): Promise<{ isReady: boolean; hasUnreviewed: boolean; invalidQuestions: ButirSoal[] }> {
    const questions = await this.repository.listQuestionsBySet(setId);
    const invalidQuestions = questions.filter((q) => !q.isValid);
    const hasUnreviewed = questions.some((q) => q.statusTinjauan === 'BELUM_DITINJAU');
    const isReady = questions.length > 0 && invalidQuestions.length === 0;

    return {
      isReady,
      hasUnreviewed,
      invalidQuestions,
    };
  }

  async getTeacherQuota(guruId: string): Promise<TeacherQuota | null> {
    return this.quotaManager ? this.quotaManager.getQuota(guruId) : null;
  }

  // --- Offline Sync & Revision History (ADR 0003) ---

  private activeSessions: Map<string, { sessionId: string; updatedAt: number }> = new Map();

  registerEditorSession(paketId: string, sessionId: string): { takenOver: boolean } {
    this.activeSessions.set(paketId, { sessionId, updatedAt: Date.now() });
    return { takenOver: false };
  }

  checkEditorSession(paketId: string, sessionId: string): { takenOver: boolean } {
    const current = this.activeSessions.get(paketId);
    if (!current) return { takenOver: false };
    return { takenOver: current.sessionId !== sessionId };
  }

  private async recordRevision(paketId: string, catatan?: string): Promise<void> {
    const currentSet = await this.getSet(paketId);
    if (!currentSet) return;
    const revisions = await this.repository.listRevisions(paketId);
    const nextVersion = revisions.length > 0 ? revisions[revisions.length - 1].versi + 1 : 1;
    const revisi: RevisiPaketSoal = {
      versi: nextVersion,
      paketId,
      disimpanPada: new Date().toISOString(),
      catatan,
      snapshot: JSON.parse(JSON.stringify(currentSet)),
    };
    await this.repository.saveRevision(revisi);
  }

  async getRevisions(paketId: string): Promise<RevisiPaketSoal[]> {
    return this.repository.listRevisions(paketId);
  }

  async rollbackToRevision(paketId: string, versi: number): Promise<PaketSoal> {
    const revisions = await this.repository.listRevisions(paketId);
    const target = revisions.find((r) => r.versi === versi);
    if (!target) {
      throw new Error(`Revisi versi ${versi} tidak ditemukan`);
    }

    const currentQuestions = await this.repository.listQuestionsBySet(paketId);
    for (const q of currentQuestions) {
      await this.repository.deleteQuestion(q.id);
    }

    for (const q of target.snapshot.butirSoal) {
      await this.repository.saveQuestion(q);
    }

    const restoredSet: PaketSoal = {
      ...target.snapshot,
      diperbaruiPada: new Date().toISOString(),
    };
    await this.repository.saveSet(restoredSet);
    await this.recordRevision(paketId, `Rollback ke versi ${versi}`);

    const updated = await this.getSet(paketId);
    return updated!;
  }

  async syncOfflineDraft(
    paketId: string,
    clientDraft: PaketSoal,
    clientSessionId?: string
  ): Promise<HasilSinkronisasi> {
    if (clientSessionId) {
      const sessionStatus = this.checkEditorSession(paketId, clientSessionId);
      if (sessionStatus.takenOver) {
        return {
          berhasil: false,
          paket: (await this.getSet(paketId))!,
          konflikTerpecahkan: 0,
          pesan: 'Sesi penyuntingan telah diambil alih di perangkat atau tab lain',
        };
      }
    }

    const serverSet = await this.getSet(paketId);
    if (!serverSet) {
      throw new Error(`Paket soal ${paketId} tidak ditemukan`);
    }

    // Merge questions using LWW
    const serverQuestions = serverSet.butirSoal;
    const clientQuestions = clientDraft.butirSoal || [];
    const mergedQuestions = mergeQuestionsLWW(serverQuestions, clientQuestions);

    // Save all merged questions to repository
    for (const q of mergedQuestions) {
      await this.repository.saveQuestion(q);
    }

    serverSet.butirSoal = mergedQuestions;
    serverSet.status = calculateSetStatus(mergedQuestions);
    serverSet.diperbaruiPada = new Date().toISOString();
    if (clientDraft.judul && clientDraft.judul !== serverSet.judul) {
      serverSet.judul = clientDraft.judul;
    }

    await this.repository.saveSet(serverSet);
    await this.recordRevision(paketId, 'Sinkronisasi draf luring LWW');

    return {
      berhasil: true,
      paket: serverSet,
      konflikTerpecahkan: 0,
    };
  }

  // --- Peluncuran Sesi Boss Battle & Snapshot Immutability (ADR 0001) ---

  async launchSession(setId: string, lobbyConfig: LobbyConfig = {}): Promise<SnapshotSesi> {
    const readiness = await this.validateSetReadiness(setId);
    if (!readiness.isReady) {
      throw new Error('Paket soal belum siap main: semua butir soal harus valid dan paket tidak boleh kosong.');
    }

    if (readiness.hasUnreviewed && !lobbyConfig.allowUnreviewed) {
      throw new Error('Memerlukan konfirmasi guru karena masih ada butir soal yang belum ditinjau');
    }

    const paket = await this.getSet(setId);
    if (!paket) {
      throw new Error(`Paket soal dengan id ${setId} tidak ditemukan`);
    }

    // Generate 6-character uppercase PIN
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pinKelas = '';
    for (let i = 0; i < 6; i++) {
      pinKelas += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const sessionId = `sesi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Deep copy / snapshot questions into immutable ButirSoalSnapshot (ADR 0001)
    const butirSoalSnapshot: ButirSoalSnapshot[] = paket.butirSoal.map((q) => ({
      id: `q-snap-${Math.random().toString(36).substring(2, 8)}`,
      originalQuestionId: q.id,
      paketId: q.paketId,
      urutan: q.urutan,
      teks: q.teks,
      kesulitan: q.kesulitan,
      subtopik: q.subtopik,
      pembahasan: q.pembahasan,
      waktuDetik: q.waktuDetik,
      pilihanJawaban: JSON.parse(JSON.stringify(q.pilihanJawaban)),
    }));

    const snapshot: SnapshotSesi = {
      id: sessionId,
      paketId: setId,
      guruId: paket.guruId,
      pinKelas,
      status: 'LOBI',
      config: { ...lobbyConfig },
      butirSoal: butirSoalSnapshot,
      peringatanBelumDitinjau: readiness.hasUnreviewed,
      dibuatPada: now,
    };

    await this.repository.saveSession(snapshot);
    return snapshot;
  }

  async getSession(sessionId: string): Promise<SnapshotSesi | null> {
    return this.repository.getSession(sessionId);
  }

  async getSessionByPin(pin: string): Promise<SnapshotSesi | null> {
    return this.repository.getSessionByPin(pin);
  }
}


import { StudioSoalRepository } from './repository-interface';
import {
  PaketSoal,
  ButirSoal,
  CreateSetInput,
  AddManualQuestionInput,
  UpdateQuestionInput,
  PilihanJawaban,
  ParameterPenjanaan,
} from './types';
import { validateQuestion, calculateSetStatus } from './validation';
import { CurriculumService } from './curriculum-service';

export class StudioSoalService {
  constructor(
    private repository: StudioSoalRepository,
    private curriculumService?: CurriculumService
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
    }

    return updatedQuestion;
  }
}

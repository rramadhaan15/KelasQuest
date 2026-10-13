import {
  SnapshotSesi,
  StudentResponseRecord,
  StatistikButirSoal,
} from './types';
import { StudioSoalRepository } from './repository-interface';

export class PostGameAnalyticsRollup {
  constructor(private repository: StudioSoalRepository) {}

  /**
   * Asynchronously aggregates student responses from a concluded Boss Battle session
   * back to the master ButirSoal entities using originalQuestionId (ADR 0001 & spec).
   * Flags items with < 30% accuracy with `labelAkurasiRendah`.
   */
  async processSessionResponses(
    session: SnapshotSesi,
    responses: StudentResponseRecord[]
  ): Promise<Map<string, StatistikButirSoal>> {
    const updatedStats = new Map<string, StatistikButirSoal>();

    // Group responses by question ID (matches either snapshot id or originalQuestionId)
    const responsesByQuestion = new Map<string, StudentResponseRecord[]>();
    for (const r of responses) {
      const list = responsesByQuestion.get(r.questionId) || [];
      list.push(r);
      responsesByQuestion.set(r.questionId, list);
    }

    for (const snapQ of session.butirSoal) {
      const questionResponses =
        responsesByQuestion.get(snapQ.id) ||
        responsesByQuestion.get(snapQ.originalQuestionId) ||
        [];
      if (questionResponses.length === 0) continue;

      const originalQuestion = await this.repository.getQuestion(
        snapQ.originalQuestionId
      );
      if (!originalQuestion) continue;

      const existingStat = originalQuestion.statistik || {
        questionId: originalQuestion.id,
        totalMenjawab: 0,
        totalBenar: 0,
        akurasiPersen: 0,
        distribusiPilihanSalah: {},
        distribusiMiskonsepsi: {},
        labelAkurasiRendah: false,
        terakhirDiperbaruiPada: new Date().toISOString(),
      };

      let batchTotal = 0;
      let batchBenar = 0;
      const distSalah = { ...existingStat.distribusiPilihanSalah };
      const distMiskonsepsi = { ...existingStat.distribusiMiskonsepsi };

      for (const res of questionResponses) {
        batchTotal++;
        if (res.isCorrect) {
          batchBenar++;
        } else {
          const chosenOpt = snapQ.pilihanJawaban.find(
            (p) => p.id === res.selectedOptionId
          );
          if (chosenOpt) {
            distSalah[chosenOpt.teks] = (distSalah[chosenOpt.teks] || 0) + 1;
            if (chosenOpt.labelMiskonsepsi) {
              distMiskonsepsi[chosenOpt.labelMiskonsepsi] =
                (distMiskonsepsi[chosenOpt.labelMiskonsepsi] || 0) + 1;
            }
          }
        }
      }

      const totalMenjawab = existingStat.totalMenjawab + batchTotal;
      const totalBenar = existingStat.totalBenar + batchBenar;
      const akurasiPersen =
        totalMenjawab > 0 ? Math.round((totalBenar / totalMenjawab) * 100) : 0;
      const labelAkurasiRendah = totalMenjawab > 0 && akurasiPersen < 30;

      const newStat: StatistikButirSoal = {
        questionId: originalQuestion.id,
        totalMenjawab,
        totalBenar,
        akurasiPersen,
        distribusiPilihanSalah: distSalah,
        distribusiMiskonsepsi: distMiskonsepsi,
        labelAkurasiRendah,
        terakhirDiperbaruiPada: new Date().toISOString(),
      };

      originalQuestion.statistik = newStat;
      await this.repository.saveQuestion(originalQuestion);
      updatedStats.set(originalQuestion.id, newStat);
    }

    return updatedStats;
  }
}

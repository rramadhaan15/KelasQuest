import { PaketSoal, ButirSoal } from './types';

export interface StudioSoalRepository {
  saveSet(set: PaketSoal): Promise<void>;
  getSet(id: string): Promise<PaketSoal | null>;
  listSetsByGuru(guruId: string): Promise<PaketSoal[]>;
  deleteSet(id: string): Promise<void>;

  saveQuestion(question: ButirSoal): Promise<void>;
  getQuestion(id: string): Promise<ButirSoal | null>;
  listQuestionsBySet(paketId: string): Promise<ButirSoal[]>;
  deleteQuestion(id: string): Promise<void>;

  saveRevision(revision: import('./types').RevisiPaketSoal): Promise<void>;
  listRevisions(paketId: string): Promise<import('./types').RevisiPaketSoal[]>;
}

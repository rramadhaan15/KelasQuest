import { StudioSoalRepository } from '../domain/repository-interface';
import { PaketSoal, ButirSoal } from '../domain/types';

export class InMemoryStudioSoalRepository implements StudioSoalRepository {
  private sets: Map<string, PaketSoal> = new Map();
  private questions: Map<string, ButirSoal> = new Map();
  private revisions: Map<string, import('../domain/types').RevisiPaketSoal[]> = new Map();
  private sessions: Map<string, import('../domain/types').SnapshotSesi> = new Map();

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const sSets = localStorage.getItem('kq_store_sets');
      if (sSets) {
        const parsed = JSON.parse(sSets);
        for (const [id, val] of Object.entries(parsed)) {
          this.sets.set(id, val as PaketSoal);
        }
      }
      const sQuestions = localStorage.getItem('kq_store_questions');
      if (sQuestions) {
        const parsed = JSON.parse(sQuestions);
        for (const [id, val] of Object.entries(parsed)) {
          this.questions.set(id, val as ButirSoal);
        }
      }
      const sSessions = localStorage.getItem('kq_store_sessions');
      if (sSessions) {
        const parsed = JSON.parse(sSessions);
        for (const [id, val] of Object.entries(parsed)) {
          this.sessions.set(id, val as import('../domain/types').SnapshotSesi);
        }
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  private persistSessions(): void {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.sessions.entries()) {
        obj[k] = v;
      }
      localStorage.setItem('kq_store_sessions', JSON.stringify(obj));
    } catch (e) {
      // ignore storage errors
    }
  }

  private persistSets(): void {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.sets.entries()) {
        obj[k] = v;
      }
      localStorage.setItem('kq_store_sets', JSON.stringify(obj));
    } catch (e) {
      // ignore storage errors
    }
  }

  private persistQuestions(): void {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.questions.entries()) {
        obj[k] = v;
      }
      localStorage.setItem('kq_store_questions', JSON.stringify(obj));
    } catch (e) {
      // ignore storage errors
    }
  }

  async saveSet(set: PaketSoal): Promise<void> {
    this.sets.set(set.id, JSON.parse(JSON.stringify(set)));
    this.persistSets();
  }

  async getSet(id: string): Promise<PaketSoal | null> {
    this.hydrateFromStorage();
    const set = this.sets.get(id);
    if (!set) return null;
    const questions = await this.listQuestionsBySet(id);
    return {
      ...JSON.parse(JSON.stringify(set)),
      butirSoal: questions,
    };
  }

  async listSetsByGuru(guruId: string): Promise<PaketSoal[]> {
    this.hydrateFromStorage();
    const list: PaketSoal[] = [];
    for (const set of this.sets.values()) {
      if (set.guruId === guruId) {
        const questions = await this.listQuestionsBySet(set.id);
        list.push({
          ...JSON.parse(JSON.stringify(set)),
          butirSoal: questions,
        });
      }
    }
    return list.sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));
  }

  async deleteSet(id: string): Promise<void> {
    this.sets.delete(id);
    for (const [qId, q] of this.questions.entries()) {
      if (q.paketId === id) {
        this.questions.delete(qId);
      }
    }
    this.persistSets();
    this.persistQuestions();
  }

  async saveQuestion(question: ButirSoal): Promise<void> {
    this.questions.set(question.id, JSON.parse(JSON.stringify(question)));
    this.persistQuestions();
  }

  async getQuestion(id: string): Promise<ButirSoal | null> {
    this.hydrateFromStorage();
    const q = this.questions.get(id);
    return q ? JSON.parse(JSON.stringify(q)) : null;
  }

  async listQuestionsBySet(paketId: string): Promise<ButirSoal[]> {
    this.hydrateFromStorage();
    const list: ButirSoal[] = [];
    for (const q of this.questions.values()) {
      if (q.paketId === paketId) {
        list.push(JSON.parse(JSON.stringify(q)));
      }
    }
    return list.sort((a, b) => a.urutan - b.urutan);
  }

  async deleteQuestion(id: string): Promise<void> {
    this.questions.delete(id);
    this.persistQuestions();
  }

  async saveRevision(revision: import('../domain/types').RevisiPaketSoal): Promise<void> {
    const list = this.revisions.get(revision.paketId) || [];
    list.push(JSON.parse(JSON.stringify(revision)));
    if (list.length > 10) {
      list.shift(); // retain max 10 latest revisions
    }
    this.revisions.set(revision.paketId, list);
  }

  async listRevisions(paketId: string): Promise<import('../domain/types').RevisiPaketSoal[]> {
    const list = this.revisions.get(paketId) || [];
    return JSON.parse(JSON.stringify(list));
  }

  async saveSession(session: import('../domain/types').SnapshotSesi): Promise<void> {
    this.sessions.set(session.id, JSON.parse(JSON.stringify(session)));
    this.persistSessions();
  }

  async getSession(id: string): Promise<import('../domain/types').SnapshotSesi | null> {
    this.hydrateFromStorage();
    const s = this.sessions.get(id);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  async getSessionByPin(pin: string): Promise<import('../domain/types').SnapshotSesi | null> {
    this.hydrateFromStorage();
    for (const s of this.sessions.values()) {
      if (s.pinKelas === pin) {
        return JSON.parse(JSON.stringify(s));
      }
    }
    return null;
  }
}


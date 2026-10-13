import { StudioSoalRepository } from '../domain/repository-interface';
import { PaketSoal, ButirSoal } from '../domain/types';

export class InMemoryStudioSoalRepository implements StudioSoalRepository {
  private sets: Map<string, PaketSoal> = new Map();
  private questions: Map<string, ButirSoal> = new Map();

  async saveSet(set: PaketSoal): Promise<void> {
    this.sets.set(set.id, JSON.parse(JSON.stringify(set)));
  }

  async getSet(id: string): Promise<PaketSoal | null> {
    const set = this.sets.get(id);
    if (!set) return null;
    const questions = await this.listQuestionsBySet(id);
    return {
      ...JSON.parse(JSON.stringify(set)),
      butirSoal: questions,
    };
  }

  async listSetsByGuru(guruId: string): Promise<PaketSoal[]> {
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
  }

  async saveQuestion(question: ButirSoal): Promise<void> {
    this.questions.set(question.id, JSON.parse(JSON.stringify(question)));
  }

  async getQuestion(id: string): Promise<ButirSoal | null> {
    const q = this.questions.get(id);
    return q ? JSON.parse(JSON.stringify(q)) : null;
  }

  async listQuestionsBySet(paketId: string): Promise<ButirSoal[]> {
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
  }

  private revisions: Map<string, import('../domain/types').RevisiPaketSoal[]> = new Map();

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

  private sessions: Map<string, import('../domain/types').SnapshotSesi> = new Map();

  async saveSession(session: import('../domain/types').SnapshotSesi): Promise<void> {
    this.sessions.set(session.id, JSON.parse(JSON.stringify(session)));
  }

  async getSession(id: string): Promise<import('../domain/types').SnapshotSesi | null> {
    const s = this.sessions.get(id);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  async getSessionByPin(pin: string): Promise<import('../domain/types').SnapshotSesi | null> {
    for (const s of this.sessions.values()) {
      if (s.pinKelas === pin) {
        return JSON.parse(JSON.stringify(s));
      }
    }
    return null;
  }
}


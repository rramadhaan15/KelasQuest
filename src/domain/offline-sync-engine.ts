import { PaketSoal, ButirSoal, MutasiOffline, HasilSinkronisasi } from './types';
import { StudioSoalService } from './studio-soal-service';

export interface OfflineStore {
  saveDraft(paket: PaketSoal): Promise<void>;
  getDraft(paketId: string): Promise<PaketSoal | null>;
  enqueueMutation(mutation: MutasiOffline): Promise<void>;
  getPendingMutations(paketId: string): Promise<MutasiOffline[]>;
  clearPendingMutations(paketId: string): Promise<void>;
}

export class InMemoryOfflineStore implements OfflineStore {
  private drafts: Map<string, PaketSoal> = new Map();
  private mutations: Map<string, MutasiOffline[]> = new Map();

  async saveDraft(paket: PaketSoal): Promise<void> {
    this.drafts.set(paket.id, JSON.parse(JSON.stringify(paket)));
  }

  async getDraft(paketId: string): Promise<PaketSoal | null> {
    const draft = this.drafts.get(paketId);
    return draft ? JSON.parse(JSON.stringify(draft)) : null;
  }

  async enqueueMutation(mutation: MutasiOffline): Promise<void> {
    const list = this.mutations.get(mutation.paketId) || [];
    list.push(JSON.parse(JSON.stringify(mutation)));
    this.mutations.set(mutation.paketId, list);
  }

  async getPendingMutations(paketId: string): Promise<MutasiOffline[]> {
    const list = this.mutations.get(paketId) || [];
    return JSON.parse(JSON.stringify(list));
  }

  async clearPendingMutations(paketId: string): Promise<void> {
    this.mutations.delete(paketId);
  }
}

/**
 * Merges server and client questions using Last-Write-Wins (LWW) per individual ButirSoal
 * based on ISO-8601 timestamps (`diperbaruiPada`).
 * Preserves concurrent server questions that the offline client did not have (ADR 0003).
 */
export function mergeQuestionsLWW(
  serverQuestions: ButirSoal[],
  clientQuestions: ButirSoal[]
): ButirSoal[] {
  const mergedMap = new Map<string, ButirSoal>();

  // 1. Put all server questions
  for (const sQ of serverQuestions) {
    mergedMap.set(sQ.id, { ...sQ });
  }

  // 2. Merge client questions using LWW
  for (const cQ of clientQuestions) {
    if (mergedMap.has(cQ.id)) {
      const existing = mergedMap.get(cQ.id)!;
      const clientTime = new Date(cQ.diperbaruiPada).getTime();
      const serverTime = new Date(existing.diperbaruiPada).getTime();
      if (clientTime > serverTime) {
        mergedMap.set(cQ.id, { ...cQ });
      }
    } else {
      // New question created offline
      mergedMap.set(cQ.id, { ...cQ });
    }
  }

  const result = Array.from(mergedMap.values());
  // Normalize urutan sequence 1..N
  result.forEach((q, idx) => {
    q.urutan = idx + 1;
  });
  return result;
}

export class OfflineSyncEngine {
  constructor(
    private store: OfflineStore,
    private service: StudioSoalService
  ) {}

  async autosave(draft: PaketSoal): Promise<void> {
    await this.store.saveDraft(draft);
  }

  async sync(paketId: string, clientSessionId?: string): Promise<HasilSinkronisasi> {
    const localDraft = await this.store.getDraft(paketId);
    if (!localDraft) {
      const serverSet = await this.service.getSet(paketId);
      if (!serverSet) {
        return {
          berhasil: false,
          paket: null as any,
          konflikTerpecahkan: 0,
          pesan: 'Paket tidak ditemukan',
        };
      }
      return { berhasil: true, paket: serverSet, konflikTerpecahkan: 0 };
    }

    const syncResult = await this.service.syncOfflineDraft(paketId, localDraft, clientSessionId);
    if (syncResult.berhasil) {
      await this.store.clearPendingMutations(paketId);
      await this.store.saveDraft(syncResult.paket);
    }
    return syncResult;
  }
}

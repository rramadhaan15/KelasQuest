'use client';

import React, { useState } from 'react';
import { PaketSoal, ButirSoal } from '../domain/types';
import { StudioSoalService } from '../domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../adapters/in-memory-repository';
import { BerandaStudioSoal } from '../components/BerandaStudioSoal';
import { EditorPaketSoal } from '../components/EditorPaketSoal';

// Initial repository & service instance
const repository = new InMemoryStudioSoalRepository();
const service = new StudioSoalService(repository);

export default function StudioSoalPage() {
  const [sets, setSets] = useState<PaketSoal[]>([]);
  const [activeSet, setActiveSet] = useState<PaketSoal | null>(null);

  const refreshSets = async () => {
    const list = await service.listSets('guru-demo');
    setSets([...list]);
    if (activeSet) {
      const updated = await service.getSet(activeSet.id);
      setActiveSet(updated ? { ...updated } : null);
    }
  };

  const handleCreateNewSet = async (data: {
    judul: string;
    mapel: string;
    jenjang: string;
    topik: string;
  }) => {
    const created = await service.createSet('guru-demo', data);
    await refreshSets();
    setActiveSet(created);
  };

  const handleSaveQuestion = async (
    paketId: string,
    questionData: any,
    existingId?: string
  ) => {
    if (existingId) {
      await service.updateQuestion(existingId, questionData);
    } else {
      await service.addManualQuestion(paketId, questionData);
    }
    await refreshSets();
  };

  return (
    <main>
      {activeSet ? (
        <EditorPaketSoal
          paket={activeSet}
          onBack={() => setActiveSet(null)}
          onSaveQuestion={handleSaveQuestion}
        />
      ) : (
        <BerandaStudioSoal
          sets={sets}
          onOpenSet={(s) => setActiveSet(s)}
          onCreateNewSet={handleCreateNewSet}
        />
      )}
    </main>
  );
}

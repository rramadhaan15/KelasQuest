'use client';

import React, { useState } from 'react';
import { PaketSoal, ButirSoal } from '../domain/types';
import { StudioSoalService } from '../domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../adapters/in-memory-repository';
import { BerandaStudioSoal } from '../components/BerandaStudioSoal';
import { EditorPaketSoal } from '../components/EditorPaketSoal';

// Initial repository & service instance
import { CurriculumService } from '../domain/curriculum-service';
import { MockAIQuestionGenerator } from '../adapters/mock-ai-generator';
import { MathEvaluator } from '../domain/math-evaluator';
import { QuotaManager, TeacherQuota } from '../domain/quota-manager';

const repository = new InMemoryStudioSoalRepository();
const curriculumService = new CurriculumService();
const aiGenerator = new MockAIQuestionGenerator();
const mathEvaluator = new MathEvaluator();
const quotaManager = new QuotaManager(200);
const service = new StudioSoalService(
  repository,
  curriculumService,
  aiGenerator,
  mathEvaluator,
  quotaManager
);

export default function StudioSoalPage() {
  const [sets, setSets] = useState<PaketSoal[]>([]);
  const [activeSet, setActiveSet] = useState<PaketSoal | null>(null);
  const [quota, setQuota] = useState<TeacherQuota | null>(null);

  const refreshSets = async () => {
    const list = await service.listSets('guru-demo');
    setSets([...list]);
    const q = await service.getTeacherQuota('guru-demo');
    setQuota(q);
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
    capaianPembelajaran?: string;
    parameterPenjanaan?: any;
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

  const handleGenerateAI = async (
    paketId: string,
    onProgress: (q: ButirSoal) => void,
    signal?: AbortSignal
  ) => {
    await service.streamGenerateQuestions(
      paketId,
      async (soal) => {
        onProgress(soal);
        await refreshSets();
      },
      signal
    );
    await refreshSets();
  };

  const handleApproveQuestion = async (questionId: string) => {
    await service.approveQuestion(questionId);
    await refreshSets();
  };

  const handleApproveAll = async (setId: string) => {
    await service.approveAllValidQuestions(setId);
    await refreshSets();
  };

  const handleRegenerateQuestion = async (questionId: string, direction: string) => {
    await service.regenerateQuestion(questionId, direction);
    await refreshSets();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await service.deleteQuestion(questionId);
    await refreshSets();
  };

  return (
    <main>
      {activeSet ? (
        <EditorPaketSoal
          paket={activeSet}
          onBack={() => setActiveSet(null)}
          onSaveQuestion={handleSaveQuestion}
          onGenerateAI={handleGenerateAI}
          onApproveQuestion={handleApproveQuestion}
          onApproveAll={handleApproveAll}
          onRegenerateQuestion={handleRegenerateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          teacherQuota={quota}
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

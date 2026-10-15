'use client';

import React, { useState, useEffect } from 'react';
import { PaketSoal, ButirSoal } from '../domain/types';
import { sharedStudioSoalService } from '../domain/shared-service';
import { TeacherQuota } from '../domain/quota-manager';
import { BerandaStudioSoal } from '../components/BerandaStudioSoal';
import { EditorPaketSoal } from '../components/EditorPaketSoal';
import { StudentPortal } from '../components/StudentPortal';

import { Swords, Gamepad2 } from 'lucide-react';

export default function StudioSoalPage() {
  const [sets, setSets] = useState<PaketSoal[]>([]);
  const [activeSet, setActiveSet] = useState<PaketSoal | null>(null);
  const [quota, setQuota] = useState<TeacherQuota | null>(null);

  // View mode switcher: Teacher Console or Student Play Portal
  const [viewMode, setViewMode] = useState<'GURU' | 'SISWA'>('GURU');
  const [studentPin, setStudentPin] = useState('');

  const service = sharedStudioSoalService;

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

  useEffect(() => {
    refreshSets();

    // Check if URL has ?pin= or ?mode=siswa
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      const urlMode = params.get('mode');
      if (urlPin) {
        setStudentPin(urlPin);
        setViewMode('SISWA');
      } else if (urlMode === 'siswa') {
        setViewMode('SISWA');
      }
    }
  }, []);

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

  const handleImportRawText = async (paketId: string, rawText: string) => {
    await service.importFromRawText(paketId, rawText);
    await refreshSets();
  };

  // Boss Battle Session Handlers
  const handleLaunchSession = async (paketId: string, config?: any) => {
    return await service.launchSession(paketId, config);
  };

  const handleStartBattle = async (sessionId: string) => {
    return await service.startBattle(sessionId);
  };

  const handleVoidQuestion = async (sessionId: string, questionId: string, reason?: string) => {
    return await service.voidQuestion(sessionId, questionId, reason);
  };

  const handleGetSession = async (sessionId: string) => {
    return await service.getSession(sessionId);
  };

  const handleSwitchToStudent = (pin: string) => {
    setStudentPin(pin);
    setViewMode('SISWA');
  };

  if (viewMode === 'SISWA') {
    return (
      <StudentPortal
        initialPin={studentPin}
        service={service}
        onBackToTeacher={() => setViewMode('GURU')}
      />
    );
  }

  return (
    <main>
      {/* Top Quick Role Switcher Banner */}
      <div
        style={{
          background: '#0F172A',
          color: '#94A3B8',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: 600,
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Swords size={15} color="#38BDF8" />
          <span style={{ color: '#38BDF8', fontWeight: 800 }}>KelasQuest</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ color: '#F8FAFC' }}>Mode Guru & Konsol Studio</span>
        </div>
        <button
          type="button"
          onClick={() => setViewMode('SISWA')}
          style={{
            background: '#1E293B',
            color: '#A5B4FC',
            border: '1px solid #4338CA',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Gamepad2 size={13} />
          <span>Mode Siswa (Play)</span>
        </button>
      </div>

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
          onImportRawText={handleImportRawText}
          onLaunchSession={handleLaunchSession}
          onStartBattle={handleStartBattle}
          onVoidQuestion={handleVoidQuestion}
          onGetSession={handleGetSession}
          onSwitchToStudent={handleSwitchToStudent}
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

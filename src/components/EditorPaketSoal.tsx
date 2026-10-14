'use client';

import React, { useState } from 'react';
import { PaketSoal, ButirSoal, TingkatKesulitan, SnapshotSesi } from '../domain/types';
import { validateQuestion } from '../domain/validation';
import { createStudentPreviewSession, StudentPreviewSession } from '../domain/preview-simulator';
import { parseRawQuestions, convertParsedToManualInput } from '../domain/text-parser';

interface EditorPaketSoalProps {
  paket: PaketSoal;
  onBack: () => void;
  onSaveQuestion: (paketId: string, questionData: any, existingId?: string) => Promise<void>;
  onGenerateAI?: (paketId: string, onProgress: (q: ButirSoal) => void, signal?: AbortSignal) => Promise<void>;
  onApproveQuestion?: (questionId: string) => Promise<void>;
  onApproveAll?: (setId: string) => Promise<void>;
  onRegenerateQuestion?: (questionId: string, direction: string) => Promise<void>;
  onDeleteQuestion?: (questionId: string) => Promise<void>;
  onImportRawText?: (paketId: string, rawText: string) => Promise<void>;
  onLaunchSession?: (paketId: string, config?: any) => Promise<SnapshotSesi>;
  onStartBattle?: (sessionId: string) => Promise<SnapshotSesi>;
  onVoidQuestion?: (sessionId: string, questionId: string, reason?: string) => Promise<any>;
  onGetSession?: (sessionId: string) => Promise<SnapshotSesi | null>;
  onSwitchToStudent?: (pin: string) => void;
  teacherQuota?: { remainingQuota: number; totalDailyQuota: number } | null;
}

export function EditorPaketSoal({
  paket,
  onBack,
  onSaveQuestion,
  onGenerateAI,
  onApproveQuestion,
  onApproveAll,
  onRegenerateQuestion,
  onDeleteQuestion,
  onImportRawText,
  onLaunchSession,
  onStartBattle,
  onVoidQuestion,
  onGetSession,
  onSwitchToStudent,
  teacherQuota,
}: EditorPaketSoalProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    paket.butirSoal.length > 0 ? paket.butirSoal[0].id : 'new'
  );

  const [generatingAI, setGeneratingAI] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Approve all states
  const [approvingAll, setApprovingAll] = useState(false);

  const handleApproveAll = async () => {
    if (!onApproveAll) return;
    setApprovingAll(true);
    try {
      await onApproveAll(paket.id);
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui semua butir soal');
    } finally {
      setApprovingAll(false);
    }
  };

  const unreviewedCount = paket.butirSoal.filter(
    (q) => q.statusTinjauan !== 'DISETUJUI'
  ).length;

  // Student Preview states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSession, setPreviewSession] = useState<StudentPreviewSession | null>(null);
  const [previewFeedback, setPreviewFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Bulk Paste states (User Story 13)
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Gemini API Key states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini_api_key') || '';
      setApiKeyInput(stored);
      setHasCustomKey(Boolean(stored));
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      const trimmed = apiKeyInput.trim();
      if (trimmed) {
        localStorage.setItem('gemini_api_key', trimmed);
        setHasCustomKey(true);
      } else {
        localStorage.removeItem('gemini_api_key');
        setHasCustomKey(false);
      }
      setShowApiKeyModal(false);
    }
  };

  // Session Launch & Teacher Lobby states
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [activeSession, setActiveSession] = useState<SnapshotSesi | null>(null);
  const [launching, setLaunching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    if (!showLaunchModal || !activeSession || !onGetSession) return;
    const interval = setInterval(async () => {
      try {
        const latest = await onGetSession(activeSession.id);
        if (latest) {
          setActiveSession({ ...latest });
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [showLaunchModal, activeSession?.id, onGetSession]);

  const handleLaunchSession = async () => {
    if (!onLaunchSession) return;
    setLaunching(true);
    try {
      const sess = await onLaunchSession(paket.id, {
        namaBoss: `Monster ${paket.topik}`,
      });
      setActiveSession(sess);
      setShowLaunchModal(true);
    } catch (err: any) {
      alert(err.message || 'Gagal meluncurkan sesi');
    } finally {
      setLaunching(false);
    }
  };

  const handleStartBattle = async () => {
    if (!activeSession || !onStartBattle) return;
    try {
      const started = await onStartBattle(activeSession.id);
      setActiveSession({ ...started });
    } catch (err: any) {
      alert(err.message || 'Gagal memulai pertarungan');
    }
  };

  const handleVoidQuestion = async (qId: string) => {
    if (!activeSession || !onVoidQuestion) return;
    const reason = prompt('Masukkan alasan pembatalan/anulir soal (ADR 0007):', 'Kekeliruan teks atau kunci jawaban');
    if (reason === null) return;
    try {
      const res = await onVoidQuestion(activeSession.id, qId, reason);
      alert(`Butir soal berhasil dianulir! Kerusakan sebesar ${res.damageAwarded} HP telah otomatis diberikan kepada monster.`);
      setActiveSession((prev) => prev ? { ...prev, monsterHp: res.remainingMonsterHp } : null);
    } catch (err: any) {
      alert(err.message || 'Gagal menganulir soal');
    }
  };

  const activeQuestion =
    activeQuestionId === 'new'
      ? null
      : paket.butirSoal.find((q) => q.id === activeQuestionId) || null;

  // Form states
  const [teks, setTeks] = useState(activeQuestion ? activeQuestion.teks : '');
  const [kesulitan, setKesulitan] = useState<TingkatKesulitan>(
    activeQuestion ? activeQuestion.kesulitan : 'SEDANG'
  );
  const [waktuDetik, setWaktuDetik] = useState(activeQuestion ? activeQuestion.waktuDetik : 20);
  const [pembahasan, setPembahasan] = useState(activeQuestion ? activeQuestion.pembahasan : '');
  const [options, setOptions] = useState<
    Array<{ id?: string; teks: string; benar: boolean; labelMiskonsepsi?: string }>
  >(
    activeQuestion
      ? activeQuestion.pilihanJawaban
      : [
          { teks: '', benar: true },
          { teks: '', benar: false, labelMiskonsepsi: '' },
          { teks: '', benar: false, labelMiskonsepsi: '' },
          { teks: '', benar: false, labelMiskonsepsi: '' },
        ]
  );
  const [saving, setSaving] = useState(false);

  const handleStartAIGeneration = async () => {
    if (!onGenerateAI) return;
    const ac = new AbortController();
    setAbortController(ac);
    setGeneratingAI(true);
    setGenerateProgress(paket.butirSoal.length);
    try {
      await onGenerateAI(
        paket.id,
        (q) => {
          setGenerateProgress((prev) => prev + 1);
          if (!activeQuestionId || activeQuestionId === 'new') {
            setActiveQuestionId(q.id);
          }
        },
        ac.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      setGeneratingAI(false);
      setAbortController(null);
    }
  };

  const handleCancelAIGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  // Switch active question
  const selectQuestion = (q: ButirSoal | null) => {
    if (!q) {
      setActiveQuestionId('new');
      setTeks('');
      setKesulitan('SEDANG');
      setWaktuDetik(20);
      setPembahasan('');
      setOptions([
        { teks: '', benar: true },
        { teks: '', benar: false, labelMiskonsepsi: '' },
        { teks: '', benar: false, labelMiskonsepsi: '' },
        { teks: '', benar: false, labelMiskonsepsi: '' },
      ]);
    } else {
      setActiveQuestionId(q.id);
      setTeks(q.teks);
      setKesulitan(q.kesulitan);
      setWaktuDetik(q.waktuDetik);
      setPembahasan(q.pembahasan);
      setOptions(q.pilihanJawaban);
    }
  };

  const validation = validateQuestion(teks, options);

  const parsedPreview = React.useMemo(() => {
    return parseRawQuestions(rawText);
  }, [rawText]);

  const handleExecuteImport = async () => {
    if (parsedPreview.totalDitemukan === 0) return;
    setIsImporting(true);
    try {
      if (onImportRawText) {
        await onImportRawText(paket.id, rawText);
      } else {
        for (const item of parsedPreview.butirSoal) {
          const manual = convertParsedToManualInput(item);
          await onSaveQuestion(paket.id, manual);
        }
      }
      setShowPasteModal(false);
      setRawText('');
    } finally {
      setIsImporting(false);
    }
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const next = [...options];
    next[index].teks = val;
    setOptions(next);
  };

  const handleCorrectSelect = (index: number) => {
    const next = options.map((opt, i) => ({
      ...opt,
      benar: i === index,
    }));
    setOptions(next);
  };

  const handleMisconceptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index].labelMiskonsepsi = val;
    setOptions(next);
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, { teks: '', benar: false, labelMiskonsepsi: '' }]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const next = options.filter((_, i) => i !== index);
      // Jika opsi benar terhapus, jadikan opsi pertama benar
      if (!next.some((o) => o.benar) && next.length > 0) {
        next[0].benar = true;
      }
      setOptions(next);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveQuestion(
        paket.id,
        {
          teks,
          kesulitan,
          waktuDetik,
          pembahasan,
          pilihanJawaban: options,
        },
        activeQuestionId === 'new' || !activeQuestionId ? undefined : activeQuestionId
      );
      if (activeQuestionId === 'new') {
        // Reset form for next question
        setTeks('');
        setPembahasan('');
        setOptions([
          { teks: '', benar: true },
          { teks: '', benar: false, labelMiskonsepsi: '' },
          { teks: '', benar: false, labelMiskonsepsi: '' },
          { teks: '', benar: false, labelMiskonsepsi: '' },
        ]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--langit)' }}>
      {/* Top Header */}
      <header
        style={{
          background: 'var(--putih)',
          padding: '16px 24px',
          borderBottom: '1px solid var(--abu-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              color: 'var(--abu-teks)',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Kembali ke Beranda
          </button>
          <div>
            <h1 style={{ fontSize: '20px', color: 'var(--tinta)' }}>{paket.judul}</h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#EDE9FE',
                  color: 'var(--ungu-monster)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {paket.jenjang} • {paket.mapel}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: paket.status === 'SIAP_MAIN' ? 'var(--hijau-bg)' : 'var(--merah-bg)',
                  color: paket.status === 'SIAP_MAIN' ? 'var(--hijau-benar)' : 'var(--merah-salah)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {paket.status === 'SIAP_MAIN' ? '✓ Siap Main' : '✎ Draf'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            title="Konfigurasi kunci Google Gemini API untuk generate live (opsional)"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: hasCustomKey ? '#15803D' : '#64748B',
              background: hasCustomKey ? '#DCFCE7' : '#F1F5F9',
              border: hasCustomKey ? '1px solid #86EFAC' : '1px solid var(--abu-border)',
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {hasCustomKey ? '✨ Gemini AI Aktif' : '🔑 Kunci Gemini AI'}
          </button>

          {teacherQuota && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                background: '#FEF3C7',
                color: '#92400E',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid #FDE68A',
              }}
            >
              ⚡ Kuota AI: {teacherQuota.remainingQuota} / {teacherQuota.totalDailyQuota}
            </span>
          )}

          {paket.butirSoal.length > 0 && unreviewedCount > 0 && onApproveAll && (
            <button
              type="button"
              onClick={handleApproveAll}
              disabled={approvingAll}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                cursor: approvingAll ? 'not-allowed' : 'pointer',
              }}
            >
              {approvingAll ? '⏳ Menyetujui...' : `✓ Setujui Semua Soal (${unreviewedCount})`}
            </button>
          )}

          {paket.butirSoal.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPreviewSession(createStudentPreviewSession(paket));
                setShowPreviewModal(true);
                setPreviewFeedback(null);
                setSelectedAnswer(null);
              }}
              style={{
                background: '#EDE9FE',
                color: 'var(--ungu-monster)',
                border: '1px solid #DDD6FE',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🎮 Main sebagai Siswa
            </button>
          )}

          {paket.butirSoal.length > 0 && onLaunchSession && (
            <button
              type="button"
              onClick={handleLaunchSession}
              disabled={launching}
              style={{
                background: 'linear-gradient(135deg, var(--api-serangan), #E0443A)',
                color: 'var(--putih)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                cursor: launching ? 'not-allowed' : 'pointer',
              }}
            >
              {launching ? 'Meluncurkan...' : '🚀 Luncurkan Boss Battle'}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '20px',
          padding: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Left Panel: Questions List */}
        <div
          style={{
            background: 'var(--putih)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(22, 32, 74, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Daftar Soal ({paket.butirSoal.length})</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                title="Tempel teks soal dari Word atau WhatsApp (User Story 13)"
                style={{
                  background: '#F1F5F9',
                  color: 'var(--tinta)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: '1px solid var(--abu-border)',
                }}
              >
                📋 Tempel Teks
              </button>
              <button
                type="button"
                onClick={() => selectQuestion(null)}
                style={{
                  background: 'var(--ungu-monster)',
                  color: 'var(--putih)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                + Tambah Manual
              </button>
            </div>
          </div>

          {/* AI Generator Action & Streaming Banner */}
          {generatingAI ? (
            <div
              style={{
                background: '#FFF7ED',
                border: '1px solid #FDBA74',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#C2410C' }}>
                  👾 AI Sedang Menyusun Soal...
                </span>
                <button
                  type="button"
                  onClick={handleCancelAIGeneration}
                  style={{
                    background: 'var(--merah-bg)',
                    color: 'var(--merah-salah)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Batalkan
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#9A3412' }}>
                {generateProgress} / {paket.parameterPenjanaan?.jumlahSoal || 20} soal tersimpan di server
              </div>
              <div style={{ height: '5px', background: '#FED7AA', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (generateProgress / (paket.parameterPenjanaan?.jumlahSoal || 20)) * 100)}%`,
                    background: 'var(--api-serangan)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartAIGeneration}
              style={{
                background: 'linear-gradient(135deg, var(--api-serangan), #E0443A)',
                color: 'var(--putih)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(255, 107, 53, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              ✨ Buat {paket.parameterPenjanaan?.jumlahSoal || 20} Soal dengan AI
            </button>
          )}

          {/* Quick Approve All Action Card */}
          {paket.butirSoal.length > 0 && unreviewedCount > 0 && onApproveAll && (
            <div
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1.5px solid #10B981',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
                  ⚡ {unreviewedCount} Soal Belum Disetujui
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: '#FEF3C7',
                    color: '#B45309',
                  }}
                >
                  Perlu Tinjauan
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#047857', lineHeight: 1.4 }}>
                Tekan tombol di bawah untuk menyetujui seluruh butir soal sekaligus agar paket siap dimainkan!
              </p>
              <button
                type="button"
                onClick={handleApproveAll}
                disabled={approvingAll}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: approvingAll ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {approvingAll ? '⏳ Sedang Menyetujui...' : `✓ Setujui Semua Soal (${unreviewedCount})`}
              </button>
            </div>
          )}

          {paket.butirSoal.length > 0 && unreviewedCount === 0 && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>✓ Semua {paket.butirSoal.length} butir soal telah disetujui (Siap Main)</span>
            </div>
          )}

          {paket.butirSoal.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--abu-teks)',
                fontSize: '14px',
              }}
            >
              Belum ada butir soal. Klik tombol di atas untuk membuat soal manual pertama Anda!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paket.butirSoal.map((q, idx) => {
                const isActive = activeQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => selectQuestion(q)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: isActive ? '2px solid var(--ungu-monster)' : '1px solid var(--abu-border)',
                      background: isActive ? '#F5F3FF' : 'var(--putih)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>Soal {idx + 1}</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {q.statistik?.labelAkurasiRendah && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '8px',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                            }}
                          >
                            ⚠️ Akurasi Rendah ({q.statistik.akurasiPersen}%)
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '8px',
                            background:
                              q.statusTinjauan === 'DISETUJUI'
                                ? 'var(--hijau-bg)'
                                : q.statusTinjauan === 'DIEDIT'
                                ? '#EFF6FF'
                                : '#FEF3C7',
                            color:
                              q.statusTinjauan === 'DISETUJUI'
                                ? 'var(--hijau-benar)'
                                : q.statusTinjauan === 'DIEDIT'
                                ? '#2563EB'
                                : '#D97706',
                          }}
                        >
                          {q.statusTinjauan === 'DISETUJUI'
                            ? '✓ Disetujui'
                            : q.statusTinjauan === 'DIEDIT'
                            ? '✎ Diedit'
                            : '⏳ Belum Ditinjau'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '8px',
                            background: q.isValid ? 'var(--hijau-bg)' : 'var(--merah-bg)',
                            color: q.isValid ? 'var(--hijau-benar)' : 'var(--merah-salah)',
                          }}
                        >
                          {q.isValid ? 'Valid' : 'Perlu Perbaikan'}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'var(--tinta)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {q.teks || '(Teks soal kosong)'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Question Editor */}
        <div
          style={{
            background: 'var(--putih)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(22, 32, 74, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                {activeQuestionId === 'new' ? 'Tulis Butir Soal Baru' : 'Sunting Butir Soal'}
              </h2>
              {activeQuestion && (
                <>
                  <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background:
                      activeQuestion.statusTinjauan === 'DISETUJUI'
                        ? 'var(--hijau-bg)'
                        : activeQuestion.statusTinjauan === 'DIEDIT'
                        ? '#EFF6FF'
                        : '#FEF3C7',
                    color:
                      activeQuestion.statusTinjauan === 'DISETUJUI'
                        ? 'var(--hijau-benar)'
                        : activeQuestion.statusTinjauan === 'DIEDIT'
                        ? '#2563EB'
                        : '#D97706',
                  }}
                >
                    {activeQuestion.statusTinjauan === 'DISETUJUI'
                      ? '✓ Disetujui'
                      : activeQuestion.statusTinjauan === 'DIEDIT'
                      ? '✎ Diedit'
                      : '⏳ Belum Ditinjau'}
                  </span>
                  {activeQuestion.statistik && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: activeQuestion.statistik.labelAkurasiRendah ? '#FEE2E2' : '#DCFCE7',
                        color: activeQuestion.statistik.labelAkurasiRendah ? '#DC2626' : '#15803D',
                        border: activeQuestion.statistik.labelAkurasiRendah ? '1px solid #FCA5A5' : '1px solid #86EFAC',
                      }}
                    >
                      {activeQuestion.statistik.labelAkurasiRendah ? '⚠️ Akurasi Rendah: ' : '🎯 Akurasi: '}
                      {activeQuestion.statistik.akurasiPersen}% ({activeQuestion.statistik.totalBenar}/{activeQuestion.statistik.totalMenjawab} siswa)
                    </span>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {activeQuestion && activeQuestion.statusTinjauan !== 'DISETUJUI' && onApproveQuestion && (
                <button
                  type="button"
                  onClick={async () => {
                    await onApproveQuestion(activeQuestion.id);
                  }}
                  style={{
                    background: 'var(--hijau-benar)',
                    color: 'var(--putih)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  ✓ Setujui Soal Ini
                </button>
              )}

              {activeQuestion && onDeleteQuestion && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Hapus butir soal ini?')) {
                      await onDeleteQuestion(activeQuestion.id);
                      setActiveQuestionId(null);
                    }
                  }}
                  style={{
                    background: 'var(--merah-bg)',
                    color: 'var(--merah-salah)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  🗑 Hapus
                </button>
              )}

              <select
                value={kesulitan}
                onChange={(e) => setKesulitan(e.target.value as TingkatKesulitan)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--abu-border)',
                  fontSize: '13px',
                }}
              >
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </div>
          </div>

          {/* Quick Regeneration Chips (PRD 7.3) */}
          {activeQuestion && onRegenerateQuestion && (
            <div
              style={{
                background: '#F8FAFC',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--abu-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--abu-teks)' }}>
                ✨ Buat Ulang Soal Ini:
              </span>
              <button
                type="button"
                onClick={() => onRegenerateQuestion(activeQuestion.id, 'LEBIH_MUDAH')}
                style={{
                  background: '#EDE9FE',
                  color: 'var(--ungu-monster)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Lebih Mudah
              </button>
              <button
                type="button"
                onClick={() => onRegenerateQuestion(activeQuestion.id, 'LEBIH_SULIT')}
                style={{
                  background: '#EDE9FE',
                  color: 'var(--ungu-monster)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Lebih Sulit
              </button>
              <button
                type="button"
                onClick={() => onRegenerateQuestion(activeQuestion.id, 'GANTI_KONTEKS')}
                style={{
                  background: '#EDE9FE',
                  color: 'var(--ungu-monster)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Ganti Konteks
              </button>
              <button
                type="button"
                onClick={() => onRegenerateQuestion(activeQuestion.id, 'PERSINGKAT')}
                style={{
                  background: '#EDE9FE',
                  color: 'var(--ungu-monster)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Persingkat
              </button>
            </div>
          )}

          {/* Validation Warning Box */}
          {!validation.isValid && (
            <div
              style={{
                background: 'var(--merah-bg)',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '12px 16px',
                color: 'var(--merah-salah)',
                fontSize: '13px',
              }}
            >
              <strong>Perhatian:</strong>
              <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Question Text */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
              Teks Butir Soal:
            </label>
            <textarea
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Ketik teks butir soal di sini (misal: Berapa hasil dari 3/4 + 1/8?)"
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--abu-border)',
                fontSize: '15px',
              }}
            />
          </div>

          {/* Options */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: 700, fontSize: '14px' }}>
                Pilihan Jawaban (Pilih 1 kunci yang benar):
              </label>
              {options.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  style={{
                    background: 'transparent',
                    color: 'var(--ungu-monster)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  + Tambah Pilihan
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    border: opt.benar ? '2px solid var(--hijau-benar)' : '1px solid var(--abu-border)',
                    borderRadius: '10px',
                    padding: '12px',
                    background: opt.benar ? 'var(--hijau-bg)' : '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      name="correct-option"
                      checked={opt.benar}
                      onChange={() => handleCorrectSelect(idx)}
                      id={`opt-radio-${idx}`}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor={`opt-radio-${idx}`}
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: opt.benar ? 'var(--hijau-benar)' : 'var(--tinta)',
                      }}
                    >
                      Pilihan {String.fromCharCode(65 + idx)} {opt.benar ? '(Kunci Jawaban Benar)' : ''}
                    </label>

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        style={{
                          marginLeft: 'auto',
                          background: 'transparent',
                          color: 'var(--merah-salah)',
                          fontSize: '12px',
                        }}
                      >
                        Hapus Pilihan Jawaban
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={opt.teks}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    placeholder={`Teks pilihan ${String.fromCharCode(65 + idx)}`}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--abu-border)',
                      fontSize: '14px',
                      background: 'var(--putih)',
                    }}
                  />

                  {!opt.benar && (
                    <input
                      type="text"
                      value={opt.labelMiskonsepsi || ''}
                      onChange={(e) => handleMisconceptionChange(idx, e.target.value)}
                      placeholder="Label Miskonsepsi (opsional, misal: pembilang dan penyebut dijumlahkan terpisah)"
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px dashed var(--abu-border)',
                        fontSize: '12px',
                        color: 'var(--abu-teks)',
                        background: 'var(--putih)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
              Pembahasan (Opsional):
            </label>
            <textarea
              value={pembahasan}
              onChange={(e) => setPembahasan(e.target.value)}
              placeholder="Penjelasan langkah penyelesaian untuk siswa..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--abu-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--ungu-monster)',
                color: 'var(--putih)',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 4px 10px rgba(91, 61, 245, 0.25)',
              }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Butir Soal'}
            </button>
          </div>
        </div>
      </div>

      {/* Student Preview Phone Simulator Modal */}
      {showPreviewModal && previewSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 26, 58, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: 'var(--putih)',
              width: '380px',
              maxWidth: '100%',
              borderRadius: '32px',
              border: '8px solid #1E293B',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '560px',
              maxHeight: '90vh',
            }}
          >
            {/* Phone Notch / Top Bar */}
            <div
              style={{
                background: '#1E293B',
                color: 'var(--putih)',
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span>🎮 Pratinjau Main Siswa</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{ background: 'transparent', color: '#94A3B8', fontSize: '14px' }}
              >
                ✕ Tutup
              </button>
            </div>

            {/* In-Game Header */}
            <div style={{ padding: '16px', background: 'var(--langit)', borderBottom: '1px solid var(--abu-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                <span>Soal {previewSession.currentIndex + 1} dari {previewSession.totalQuestions}</span>
                <span style={{ color: 'var(--api-serangan)' }}>⏱ {previewSession.currentQuestion.waktuDetik} dtk</span>
              </div>
              <div style={{ height: '6px', background: '#CBD5E1', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((previewSession.currentIndex + 1) / previewSession.totalQuestions) * 100}%`,
                    background: 'var(--ungu-monster)',
                  }}
                />
              </div>
            </div>

            {/* Question Body */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--tinta)' }}>
                {previewSession.currentQuestion.teks}
              </h3>

              {/* Shuffled Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {previewSession.currentQuestion.pilihanJawaban.map((opt, i) => {
                  const isSelected = selectedAnswer === opt.teks;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={Boolean(previewFeedback)}
                      onClick={() => {
                        setSelectedAnswer(opt.teks);
                        const result = previewSession.submitAnswer(opt.teks);
                        setPreviewFeedback(result);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected
                          ? '2px solid var(--ungu-monster)'
                          : '1px solid var(--abu-border)',
                        background:
                          previewFeedback && isSelected
                            ? previewFeedback.isCorrect
                              ? 'var(--hijau-bg)'
                              : 'var(--merah-bg)'
                            : isSelected
                            ? '#F5F3FF'
                            : 'var(--putih)',
                        color: 'var(--tinta)',
                        fontWeight: 600,
                        fontSize: '14px',
                        textAlign: 'left',
                        cursor: previewFeedback ? 'default' : 'pointer',
                      }}
                    >
                      {String.fromCharCode(65 + i)}. {opt.teks}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Box */}
              {previewFeedback && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: previewFeedback.isCorrect ? 'var(--hijau-bg)' : 'var(--merah-bg)',
                    border: `1px solid ${previewFeedback.isCorrect ? 'var(--hijau-benar)' : 'var(--merah-salah)'}`,
                    fontSize: '13px',
                  }}
                >
                  <strong style={{ color: previewFeedback.isCorrect ? 'var(--hijau-benar)' : 'var(--merah-salah)' }}>
                    {previewFeedback.isCorrect ? '✓ Jawaban Anda Benar!' : '✗ Jawaban Belum Tepat!'}
                  </strong>
                  <p style={{ marginTop: '4px', color: 'var(--tinta)' }}>{previewFeedback.explanation}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions in Phone */}
            <div style={{ padding: '16px', background: 'var(--putih)', borderTop: '1px solid var(--abu-border)' }}>
              {previewFeedback ? (
                previewSession.currentIndex + 1 < previewSession.totalQuestions ? (
                  <button
                    type="button"
                    onClick={() => {
                      previewSession.nextQuestion();
                      setSelectedAnswer(null);
                      setPreviewFeedback(null);
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--ungu-monster)',
                      color: 'var(--putih)',
                      padding: '12px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '15px',
                    }}
                  >
                    Soal Berikutnya →
                  </button>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--hijau-benar)', marginBottom: '8px' }}>
                      Selesai! Skor: {previewSession.score} / 100
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(false)}
                      style={{
                        width: '100%',
                        background: 'var(--ungu-monster)',
                        color: 'var(--putih)',
                        padding: '12px',
                        borderRadius: '12px',
                        fontWeight: 700,
                      }}
                    >
                      Tutup Pratinjau
                    </button>
                  </div>
                )
              ) : (
                <div style={{ fontSize: '12px', textAlign: 'center', color: 'var(--abu-teks)' }}>
                  Pilih salah satu jawaban untuk menguji alur siswa
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Paste Modal (PRD 7.4 / User Story 13) */}
      {showPasteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--putih)',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--abu-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  📋 Tempel Teks Soal (Word / WhatsApp)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--abu-teks)', margin: '4px 0 0 0' }}>
                  Salin dan tempel butir soal massal. Format penomoran 1., 2., dan pilihan A-D akan terurai otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--abu-teks)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Teks Mentah Soal:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`1. Berapakah hasil dari 25 + 75?\nA. 80\nB. 90\n*C. 100\nD. 110\nKunci: C\nPembahasan: 25 + 75 = 100\n\n2. Ibu kota Indonesia adalah...\nA. Surabaya\nB. Jakarta\nC. Bandung\nD. Medan\nKunci: B`}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--abu-border)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Live Detection Summary */}
              {rawText.trim() ? (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid var(--abu-border)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>
                      Hasil Analisis Teks: {parsedPreview.totalDitemukan} Soal Terdeteksi
                    </span>
                    {parsedPreview.totalPerluDiperiksa > 0 ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: '#FEF3C7',
                          color: '#B45309',
                        }}
                      >
                        ⚠️ {parsedPreview.totalPerluDiperiksa} Butir Perlu Diperiksa
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'var(--hijau-bg)',
                          color: 'var(--hijau-benar)',
                        }}
                      >
                        ✓ Semua Soal Valid
                      </span>
                    )}
                  </div>

                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {parsedPreview.butirSoal.map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'var(--putih)',
                          border: q.perluDiperiksa ? '1px solid #FCD34D' : '1px solid var(--abu-border)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--tinta)' }}>
                            {idx + 1}. {q.teks || '(Teks kosong)'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--abu-teks)', whiteSpace: 'nowrap' }}>
                            {q.pilihanJawaban.length} Opsi {q.kunci ? `• Kunci: ${q.kunci}` : ''}
                          </span>
                        </div>
                        {q.perluDiperiksa && (
                          <div style={{ color: '#D97706', fontSize: '11px', marginTop: '2px' }}>
                            Catatan: {q.alasanPemeriksaan.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--abu-teks)', background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                  💡 <strong>Tip Format:</strong> Guru dapat menandai kunci jawaban langsung dengan menambahkan tanda bintang di depan pilihan (contoh: <code>*C. 100</code>) atau baris kunci di bawah soal (contoh: <code>Kunci: C</code>).
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--abu-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                background: '#F8FAFC',
              }}
            >
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                disabled={isImporting}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--abu-border)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={parsedPreview.totalDitemukan === 0 || isImporting}
                style={{
                  background: parsedPreview.totalDitemukan > 0 ? 'var(--ungu-monster)' : 'var(--abu-border)',
                  color: 'var(--putih)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: parsedPreview.totalDitemukan > 0 && !isImporting ? 'pointer' : 'not-allowed',
                }}
              >
                {isImporting ? 'Mengimpor...' : `Impor ${parsedPreview.totalDitemukan} Butir Soal`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Setting Modal */}
      {showApiKeyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 26, 58, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--putih)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--tinta)' }}>
                🔑 Kunci Google Gemini AI (Opsional)
              </h3>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--abu-teks)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--abu-teks)', marginBottom: '16px', lineHeight: 1.5 }}>
              Masukkan API Key Google Gemini Anda agar AI dapat menyusun soal langsung secara live dari model cloud. Kunci ini hanya tersimpan secara lokal dan aman di browser Anda.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Gemini API Key:
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--abu-border)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--abu-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                color: 'var(--abu-teks)',
                marginBottom: '20px',
              }}
            >
              💡 <strong>Catatan:</strong> Jika Anda tidak memiliki API Key, kosongkan saja field ini. KelasQuest secara otomatis menggunakan <strong>Mesin Kurikulum Cerdas Bawaan</strong> yang langsung menghasilkan 20 butir soal lengkap dan bervariasi sesuai topik Anda.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--abu-border)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                style={{
                  background: 'var(--ungu-monster)',
                  color: 'var(--putih)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Lobby & Projector Modal (ADR 0004 & ADR 0007) */}
      {showLaunchModal && activeSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 15, 30, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0F172A',
              color: '#F8FAFC',
              borderRadius: '24px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '2px solid #334155',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              padding: '28px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🏰</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#F1F5F9', margin: 0 }}>
                    Konsol Proyektor Guru: Boss Battle
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  Tampilkan layar ini di proyektor kelas atau bagikan PIN / Link ke siswa
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    background:
                      activeSession.status === 'BERLANGSUNG'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : activeSession.status === 'SELESAI'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(99, 102, 241, 0.2)',
                    color:
                      activeSession.status === 'BERLANGSUNG'
                        ? '#F87171'
                        : activeSession.status === 'SELESAI'
                        ? '#34D399'
                        : '#818CF8',
                    border: `1px solid ${
                      activeSession.status === 'BERLANGSUNG'
                        ? '#EF4444'
                        : activeSession.status === 'SELESAI'
                        ? '#10B981'
                        : '#6366F1'
                    }`,
                  }}
                >
                  {activeSession.status === 'LOBI'
                    ? '🟡 MENUNGGU SISWA'
                    : activeSession.status === 'BERLANGSUNG'
                    ? '🔴 PERTEMPURAN AKTIF'
                    : '🟢 SELESAI'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    color: '#94A3B8',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Giant PIN & Link Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
                border: '2px solid #4338CA',
                borderRadius: '20px',
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#A5B4FC', letterSpacing: '0.1em' }}>
                PIN RUANG KELAS (SISWA MASUK TANPA LOGIN)
              </div>

              {/* Giant PIN Digits */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {activeSession.pinKelas.split('').map((char, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#1E293B',
                      border: '2px solid #6366F1',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontSize: '36px',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      letterSpacing: '2px',
                      boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* Quick Actions (Copy Link & Direct Switch) */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                    const link = `${origin}/play?pin=${activeSession.pinKelas}`;
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }
                  }}
                  style={{
                    background: copiedLink ? '#059669' : '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {copiedLink ? '✓ Link Siswa Disalin!' : '📋 Salin Link Akses Siswa'}
                </button>

                {onSwitchToStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLaunchModal(false);
                      onSwitchToStudent(activeSession.pinKelas);
                    }}
                    style={{
                      background: '#4F46E5',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    }}
                  >
                    🎮 Buka Tampilan Siswa (Uji Sendiri)
                  </button>
                )}
              </div>

              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                🔗 URL Siswa: <code style={{ color: '#38BDF8' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/play?pin={activeSession.pinKelas}</code>
              </div>
            </div>

            {/* Boss Status & Participants Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Boss Info Card */}
              <div
                style={{
                  background: '#1E293B',
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '32px' }}>👹</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#F8FAFC' }}>
                        {activeSession.config?.namaBoss || `Monster ${paket.topik}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {activeSession.butirSoal.length} Soal • Terkunci Snapshot
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Monster HP Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
                    <span style={{ color: '#F87171' }}>HP Monster</span>
                    <span style={{ color: '#F8FAFC' }}>{activeSession.monsterHp ?? 1000} HP</span>
                  </div>
                  <div
                    style={{
                      height: '14px',
                      background: '#0F172A',
                      borderRadius: '7px',
                      overflow: 'hidden',
                      border: '1px solid #475569',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, ((activeSession.monsterHp ?? 1000) / (activeSession.peserta.length > 0 ? activeSession.peserta.length * activeSession.butirSoal.length * 100 : 1000)) * 100))}%`,
                        background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Connected Students Card */}
              <div
                style={{
                  background: '#1E293B',
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC' }}>
                    👥 Siswa Terhubung ({activeSession.peserta.length})
                  </div>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                    ● Lobi Siaga
                  </span>
                </div>

                {activeSession.peserta.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '16px',
                      background: '#0F172A',
                      borderRadius: '12px',
                      border: '1px dashed #334155',
                      color: '#64748B',
                      fontSize: '13px',
                    }}
                  >
                    Menunggu siswa memasukkan PIN {activeSession.pinKelas}...
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: '130px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      padding: '8px',
                      background: '#0F172A',
                      borderRadius: '12px',
                    }}
                  >
                    {activeSession.peserta.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#334155',
                          color: '#F8FAFC',
                          borderRadius: '16px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        ⚡ {p.nama}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls / Start Battle / Void Question */}
            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              {/* Emergency Invariant Void Button (ADR 0007) */}
              {activeSession.status === 'BERLANGSUNG' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 700 }}>
                    🚨 Anulir Soal Darurat (ADR 0007):
                  </span>
                  <select
                    id="select-void-q"
                    style={{
                      background: '#1E293B',
                      color: '#F8FAFC',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                    }}
                  >
                    {activeSession.butirSoal.map((q, i) => (
                      <option key={q.id} value={q.id}>
                        Soal #{i + 1}: {q.teks.substring(0, 32)}...
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('select-void-q') as HTMLSelectElement;
                      if (sel && sel.value) {
                        handleVoidQuestion(sel.value);
                      }
                    }}
                    style={{
                      background: '#7F1D1D',
                      color: '#FCA5A5',
                      border: '1px solid #DC2626',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Anulir & Berikan Full Damage
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  💡 Berdasarkan <strong>ADR 0004</strong>, HP Monster akan dikunci secara otomatis saat pertempuran dimulai sesuai jumlah siswa yang bergabung.
                </div>
              )}

              {/* Big Start / Battle Button */}
              {activeSession.status === 'LOBI' ? (
                <button
                  type="button"
                  onClick={handleStartBattle}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px 28px',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                    letterSpacing: '0.02em',
                  }}
                >
                  ⚔️ Mulai Pertarungan Sekarang!
                </button>
              ) : (
                <div style={{ fontWeight: 800, color: '#34D399', fontSize: '14px' }}>
                  ✓ Pertarungan sedang aktif di perangkat siswa
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

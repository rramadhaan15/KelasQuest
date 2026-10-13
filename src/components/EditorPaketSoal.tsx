'use client';

import React, { useState } from 'react';
import { PaketSoal, ButirSoal, TingkatKesulitan } from '../domain/types';
import { validateQuestion } from '../domain/validation';

interface EditorPaketSoalProps {
  paket: PaketSoal;
  onBack: () => void;
  onSaveQuestion: (paketId: string, questionData: any, existingId?: string) => Promise<void>;
  onGenerateAI?: (paketId: string, onProgress: (q: ButirSoal) => void, signal?: AbortSignal) => Promise<void>;
}

export function EditorPaketSoal({ paket, onBack, onSaveQuestion, onGenerateAI }: EditorPaketSoalProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    paket.butirSoal.length > 0 ? paket.butirSoal[0].id : 'new'
  );

  const [generatingAI, setGeneratingAI] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Daftar Soal ({paket.butirSoal.length})</h3>
            <button
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>Soal {idx + 1}</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
              {activeQuestionId === 'new' ? 'Tulis Butir Soal Baru' : 'Sunting Butir Soal'}
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Tingkat Kesulitan:</label>
              <select
                value={kesulitan}
                onChange={(e) => setKesulitan(e.target.value as TingkatKesulitan)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--abu-border)',
                }}
              >
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </div>
          </div>

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
              Pertanyaan:
            </label>
            <textarea
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Ketik pertanyaan di sini (misal: Berapa hasil dari 3/4 + 1/8?)"
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
                        Hapus Opsi
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
    </div>
  );
}

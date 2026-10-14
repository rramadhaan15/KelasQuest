'use client';

import React, { useState, useEffect } from 'react';
import { StudioSoalService } from '../domain/studio-soal-service';
import { SnapshotSesi, ButirSoalSnapshot } from '../domain/types';

interface StudentPortalProps {
  initialPin?: string;
  service: StudioSoalService;
  onBackToTeacher: () => void;
}

export function StudentPortal({ initialPin = '', service, onBackToTeacher }: StudentPortalProps) {
  const [pin, setPin] = useState(initialPin.toUpperCase());
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State alur siswa
  const [step, setStep] = useState<'JOIN' | 'LOBBY' | 'BATTLE' | 'VICTORY'>('JOIN');
  const [session, setSession] = useState<SnapshotSesi | null>(null);
  const [studentId, setStudentId] = useState<string>('');

  // Pertarungan state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; explanation: string; misconception?: string } | null>(null);
  const [combo, setCombo] = useState(1);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);

  useEffect(() => {
    if (initialPin) {
      setPin(initialPin.toUpperCase());
    }
  }, [initialPin]);

  // Polling detak lobi saat menunggu guru memulai
  useEffect(() => {
    if (step === 'LOBBY' && session) {
      const interval = setInterval(async () => {
        const updated = await service.getSession(session.id);
        if (updated) {
          setSession({ ...updated });
          if (updated.status === 'BERLANGSUNG') {
            setStep('BATTLE');
          }
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step, session, service]);

  // Timer per soal di arena pertarungan
  useEffect(() => {
    if (step === 'BATTLE' && !answerFeedback && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, answerFeedback, timeLeft]);

  // Aksi Masuk Lobi
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !nama.trim()) {
      setErrorMsg('PIN Kelas dan Nama Panggilan wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await service.joinLobby(pin.trim().toUpperCase(), nama.trim());
      setStudentId(result.studentId);
      setSession(result.session);
      if (result.session.status === 'BERLANGSUNG') {
        setStep('BATTLE');
      } else {
        setStep('LOBBY');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal bergabung ke sesi');
    } finally {
      setLoading(false);
    }
  };

  // Aksi Siswa Menjawab Soal
  const handleSelectAnswer = async (optTeks: string, isCorrect: boolean, optLabel?: string) => {
    if (answerFeedback || !session) return;

    setSelectedAnswer(optTeks);
    const currentQ = session.butirSoal[currentIndex];

    if (isCorrect) {
      const damage = Math.round(100 * combo);
      setTotalDamageDealt((prev) => prev + damage);
      setCorrectAnswersCount((prev) => prev + 1);
      setCombo((prev) => prev + 1);

      // Kurangi HP monster di peladen
      const battleResult = await service.attackMonster(session.id, damage);
      setSession((prev) => prev ? { ...prev, monsterHp: battleResult.remainingMonsterHp } : null);

      setAnswerFeedback({
        isCorrect: true,
        explanation: currentQ.pembahasan || 'Jawaban Anda tepat!',
      });

      if (battleResult.isMonsterDefeated) {
        setTimeout(() => setStep('VICTORY'), 1200);
      }
    } else {
      setCombo(1);
      setAnswerFeedback({
        isCorrect: false,
        explanation: currentQ.pembahasan || 'Jawaban belum tepat.',
        misconception: optLabel,
      });
    }
  };

  // Lanjut ke soal berikutnya
  const handleNextQuestion = () => {
    if (!session) return;
    if (currentIndex + 1 < session.butirSoal.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      const nextQ = session.butirSoal[currentIndex + 1];
      setTimeLeft(nextQ.waktuDetik || 25);
    } else {
      setStep('VICTORY');
    }
  };

  // 1. LAYAR 1: GERBANG MASUK SISWA (JOIN PORTAL)
  if (step === 'JOIN') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #16204A 0%, #2A1B6D 50%, #431E7D 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
          <button
            type="button"
            onClick={onBackToTeacher}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
            }}
          >
            ← Kembali ke Mode Guru
          </button>
        </div>

        <div
          style={{
            background: 'var(--putih)',
            borderRadius: '24px',
            maxWidth: '420px',
            width: '100%',
            padding: '32px 24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚔️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--tinta)', marginBottom: '4px' }}>
            Arena Siswa KelasQuest
          </h1>
          <p style={{ color: 'var(--abu-teks)', fontSize: '14px', marginBottom: '24px' }}>
            Kalahkan Monster Boss bersama teman sekelasmu!
          </p>

          {errorMsg && (
            <div
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px',
                textAlign: 'left',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: 'var(--tinta)' }}>
                KODE PIN ROOM / KELAS:
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="Misal: KLQ882"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '2px solid var(--abu-border)',
                  fontSize: '22px',
                  fontWeight: 800,
                  textAlign: 'center',
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  color: 'var(--ungu-monster)',
                  background: '#F8FAFC',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: 'var(--tinta)' }}>
                NAMA PANGGILAN KAMU:
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi, Siti, Rian"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--abu-border)',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--ungu-monster), #7C3AED)',
                color: 'var(--putih)',
                padding: '14px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(91, 61, 245, 0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
              }}
            >
              {loading ? 'Memasuki Arena...' : '🚀 Gabung Pertarungan!'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--abu-teks)' }}>
            🔒 Masuk langsung tanpa login & aman data pribadi (UU PDP).
          </div>
        </div>
      </div>
    );
  }

  // 2. LAYAR 2: LOBI SISWA (MENUNGGU GURU MEMULAI)
  if (step === 'LOBBY' && session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: 'var(--putih)',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px 24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: '#F1F5F9',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--tinta)',
              marginBottom: '16px',
            }}
          >
            PIN Room: <strong style={{ color: 'var(--ungu-monster)', fontSize: '15px' }}>{session.pinKelas}</strong>
          </div>

          {/* Boss Monster Avatar Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
              border: '2px dashed #FDBA74',
              borderRadius: '18px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>👾</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#C2410C', margin: 0 }}>
              {session.config.namaBoss || 'Monster Penjaga Gerbang'}
            </h2>
            <p style={{ fontSize: '13px', color: '#9A3412', marginTop: '4px', marginBottom: '0' }}>
              Jumlah Butir Soal: {session.butirSoal.length} Soal Bersama
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
              Ksatria Kelas yang Sudah Hadir ({session.peserta.length}):
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxHeight: '120px', overflowY: 'auto' }}>
              {session.peserta.map((p) => (
                <span
                  key={p.id}
                  style={{
                    background: p.nama === nama ? 'var(--hijau-bg)' : '#EDE9FE',
                    color: p.nama === nama ? 'var(--hijau-benar)' : 'var(--ungu-monster)',
                    border: p.nama === nama ? '1px solid var(--hijau-benar)' : '1px solid #DDD6FE',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {p.nama} {p.nama === nama ? '(Kamu)' : ''}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⏳</span>
            <span>Menunggu Guru Menekan &ldquo;Mulai Pertarungan&rdquo;...</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              // Jika ini simulasi / guru ingin mulai langsung dari siswa
              await service.startBattle(session.id);
              setStep('BATTLE');
            }}
            style={{
              marginTop: '16px',
              background: 'transparent',
              color: 'var(--abu-teks)',
              fontSize: '12px',
              textDecoration: 'underline',
            }}
          >
            (Simulasi: Mulai Pertarungan Sekarang)
          </button>
        </div>
      </div>
    );
  }

  // 3. LAYAR 3: ARENA PERTARUNGAN LIVE SISWA
  if (step === 'BATTLE' && session) {
    const currentQ = session.butirSoal[currentIndex];
    const maxHp = session.monsterHpMaksimal || 2000;
    const currentHp = session.monsterHp ?? maxHp;
    const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px',
        }}
      >
        <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Bar: Monster Status & HP Bar */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '18px',
              padding: '14px 16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px' }}>👾</span>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#C2410C' }}>
                    {session.config.namaBoss || 'Boss Monster'}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--abu-teks)' }}>Target HP Bersama Seluruh Kelas</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--merah-salah)' }}>
                  {currentHp} / {maxHp} HP
                </span>
                {combo > 1 && (
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--api-serangan)' }}>
                    🔥 Combo x{combo}!
                  </div>
                )}
              </div>
            </div>

            {/* HP Progress Bar */}
            <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${hpPercent}%`,
                  background: 'linear-gradient(90deg, #FF6B35, #E0443A)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div
            style={{
              background: 'var(--putih)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ungu-monster)' }}>
                Soal {currentIndex + 1} dari {session.butirSoal.length}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: timeLeft <= 5 ? '#FEE2E2' : '#F1F5F9',
                  color: timeLeft <= 5 ? '#DC2626' : 'var(--tinta)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}
              >
                ⏳ {timeLeft} dtk
              </span>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.5, color: 'var(--tinta)' }}>
              {currentQ.teks}
            </h2>

            {/* Option Buttons (A, B, C, D with Thumb-Friendly Tap Sizes) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.pilihanJawaban.map((opt, idx) => {
                const isSelected = selectedAnswer === opt.teks;
                const colors = [
                  { bg: '#FAF5FF', border: '#C084FC', badge: '#9333EA', letter: 'A' },
                  { bg: '#EFF6FF', border: '#93C5FD', badge: '#2563EB', letter: 'B' },
                  { bg: '#FFF7ED', border: '#FDBA74', badge: '#EA580C', letter: 'C' },
                  { bg: '#ECFDF5', border: '#6EE7B7', badge: '#059669', letter: 'D' },
                ];
                const c = colors[idx % colors.length];

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={Boolean(answerFeedback)}
                    onClick={() => handleSelectAnswer(opt.teks, opt.benar, opt.labelMiskonsepsi)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid var(--ungu-monster)' : `1px solid ${c.border}`,
                      background: answerFeedback
                        ? opt.benar
                          ? 'var(--hijau-bg)'
                          : isSelected
                          ? 'var(--merah-bg)'
                          : c.bg
                        : c.bg,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: answerFeedback ? 'default' : 'pointer',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: c.badge,
                        color: 'var(--putih)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {c.letter}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tinta)' }}>
                      {opt.teks}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Banner */}
            {answerFeedback && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: answerFeedback.isCorrect ? 'var(--hijau-bg)' : 'var(--merah-bg)',
                  border: `1px solid ${answerFeedback.isCorrect ? 'var(--hijau-benar)' : 'var(--merah-salah)'}`,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '14px', color: answerFeedback.isCorrect ? 'var(--hijau-benar)' : 'var(--merah-salah)' }}>
                  {answerFeedback.isCorrect ? '⚔️ SERANGAN TELAK! Monster Terkena Damage!' : '🛡️ Kurang Tepat!'}
                </div>
                {answerFeedback.misconception && (
                  <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>
                    💡 Catatan: {answerFeedback.misconception}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--tinta)', marginTop: '4px' }}>
                  {answerFeedback.explanation}
                </div>
              </div>
            )}

            {/* Next Button */}
            {answerFeedback && (
              <button
                type="button"
                onClick={handleNextQuestion}
                style={{
                  width: '100%',
                  background: 'var(--ungu-monster)',
                  color: 'var(--putih)',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  marginTop: '6px',
                }}
              >
                {currentIndex + 1 < session.butirSoal.length ? 'Soal Berikutnya →' : 'Selesaikan Pertarungan 🏆'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. LAYAR 4: KEMENANGAN (VICTORY ROLLUP)
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #16204A 0%, #2A1B6D 50%, #431E7D 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--putih)',
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          padding: '36px 24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏆</div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--hijau-benar)', marginBottom: '6px' }}>
          VICTORY!
        </h1>
        <p style={{ color: 'var(--tinta)', fontSize: '15px', fontWeight: 600, marginBottom: '24px' }}>
          Hebat sekali, <strong>{nama}</strong>! Kamu dan teman sekelas berhasil menaklukkan Monster Boss!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid var(--abu-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--abu-teks)', display: 'block' }}>
              TOTAL SERANGAN
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--api-serangan)' }}>
              {totalDamageDealt} DMG
            </span>
          </div>
          <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid var(--abu-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--abu-teks)', display: 'block' }}>
              SOAL BENAR
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--hijau-benar)' }}>
              {correctAnswersCount} / {session?.butirSoal.length || 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToTeacher}
          style={{
            width: '100%',
            background: 'var(--ungu-monster)',
            color: 'var(--putih)',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 800,
          }}
        >
          Selesai & Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}

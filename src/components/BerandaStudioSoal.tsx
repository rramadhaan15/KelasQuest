'use client';

import React, { useState } from 'react';
import { PaketSoal } from '../domain/types';

interface BerandaStudioSoalProps {
  sets: PaketSoal[];
  onOpenSet: (set: PaketSoal) => void;
  onCreateNewSet: (data: { judul: string; mapel: string; jenjang: string; topik: string }) => Promise<void>;
}

export function BerandaStudioSoal({ sets, onOpenSet, onCreateNewSet }: BerandaStudioSoalProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  // Form states for new set
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [jenjang, setJenjang] = useState('5 SD');
  const [topik, setTopik] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredSets = sets.filter(
    (s) =>
      s.judul.toLowerCase().includes(search.toLowerCase()) ||
      s.topik.toLowerCase().includes(search.toLowerCase()) ||
      s.mapel.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topik.trim()) return;
    setCreating(true);
    try {
      await onCreateNewSet({
        judul: judul.trim() || topik.trim(),
        mapel,
        jenjang,
        topik,
      });
      setShowModal(false);
      setJudul('');
      setTopik('');
    } finally {
      setCreating(false);
    }
  };

  const handleQuickTopic = (quickTopik: string, quickMapel: string, quickJenjang: string) => {
    setTopik(quickTopik);
    setJudul(quickTopik);
    setMapel(quickMapel);
    setJenjang(quickJenjang);
    setShowModal(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', minHeight: '100vh' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--tinta)' }}>
            Studio Soal KelasQuest
          </h1>
          <p style={{ color: 'var(--abu-teks)', marginTop: '4px', fontSize: '15px' }}>
            Ruang kerja guru untuk menyiapkan paket soal Boss Battle
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--ungu-monster)',
            color: 'var(--putih)',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '15px',
            boxShadow: '0 4px 14px rgba(91, 61, 245, 0.3)',
          }}
        >
          + Paket Baru
        </button>
      </header>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan judul, topik, atau mata pelajaran..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--abu-border)',
            fontSize: '15px',
            background: 'var(--putih)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          }}
        />
      </div>

      {/* Empty State */}
      {sets.length === 0 ? (
        <div
          style={{
            background: 'var(--putih)',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(22, 32, 74, 0.05)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👾</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            Mulai dari Topik Pelajaran
          </h2>
          <p style={{ color: 'var(--abu-teks)', maxWidth: '500px', margin: '0 auto 24px auto', fontSize: '15px' }}>
            Ketik topik yang ingin Anda ajarkan hari ini, lalu susun butir soal pilihan ganda lengkap dengan miskonsepsi!
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleQuickTopic('Penjumlahan pecahan berpenyebut beda', 'Matematika', '5 SD')}
              style={{
                background: '#EDE9FE',
                color: 'var(--ungu-monster)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              📐 Penjumlahan Pecahan (5 SD)
            </button>
            <button
              onClick={() => handleQuickTopic('Fotosintesis dan Rantai Makanan', 'IPA', '7 SMP')}
              style={{
                background: '#E8F7F0',
                color: 'var(--hijau-benar)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              🌿 Fotosintesis (7 SMP)
            </button>
            <button
              onClick={() => handleQuickTopic('Proklamasi Kemerdekaan Indonesia', 'Sejarah', '11 SMA')}
              style={{
                background: '#FEE2E2',
                color: 'var(--merah-salah)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              📜 Proklamasi Kemerdekaan (11 SMA)
            </button>
          </div>
        </div>
      ) : filteredSets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--abu-teks)' }}>
          Tidak ada paket soal yang cocok dengan pencarian &quot;{search}&quot;.
        </div>
      ) : (
        /* Package Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredSets.map((paket) => {
            const isReady = paket.status === 'SIAP_MAIN';
            return (
              <div
                key={paket.id}
                onClick={() => onOpenSet(paket)}
                style={{
                  background: 'var(--putih)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(22, 32, 74, 0.05)',
                  cursor: 'pointer',
                  border: '1px solid var(--abu-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#EDE9FE',
                        color: 'var(--ungu-monster)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {paket.jenjang}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#E2E8F0',
                        color: 'var(--tinta)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {paket.mapel}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '10px',
                      background: isReady ? 'var(--hijau-bg)' : 'var(--merah-bg)',
                      color: isReady ? 'var(--hijau-benar)' : 'var(--merah-salah)',
                    }}
                  >
                    {isReady ? '✓ Siap Main' : '✎ Draf'}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--tinta)' }}>{paket.judul}</h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--abu-teks)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Topik: {paket.topik}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--abu-border)',
                    fontSize: '13px',
                    color: 'var(--abu-teks)',
                  }}
                >
                  <span>{paket.butirSoal.length} Butir Soal</span>
                  <span style={{ color: 'var(--ungu-monster)', fontWeight: 700 }}>Buka Editor →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Buat Paket Baru */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 26, 58, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--putih)',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Buat Paket Soal Baru</h2>
            <p style={{ color: 'var(--abu-teks)', fontSize: '14px', marginBottom: '20px' }}>
              Masukkan detail topik pelajaran untuk memulai ruang kerja guru.
            </p>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                  Apa yang ingin diuji? (Topik Pelajaran)*
                </label>
                <input
                  type="text"
                  required
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder="Contoh: Penjumlahan pecahan berpenyebut beda"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--abu-border)',
                    fontSize: '15px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                  Judul Paket Soal (Opsional)
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Bawaan: sama dengan topik"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--abu-border)',
                    fontSize: '15px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                    Jenjang & Kelas
                  </label>
                  <select
                    value={jenjang}
                    onChange={(e) => setJenjang(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid var(--abu-border)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="4 SD">4 SD</option>
                    <option value="5 SD">5 SD</option>
                    <option value="6 SD">6 SD</option>
                    <option value="7 SMP">7 SMP</option>
                    <option value="8 SMP">8 SMP</option>
                    <option value="9 SMP">9 SMP</option>
                    <option value="10 SMA">10 SMA</option>
                    <option value="11 SMA">11 SMA</option>
                    <option value="12 SMA">12 SMA</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                    Mata Pelajaran
                  </label>
                  <select
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid var(--abu-border)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="IPA">IPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Informatika">Informatika</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    color: 'var(--abu-teks)',
                    padding: '10px 16px',
                    fontWeight: 700,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    background: 'var(--ungu-monster)',
                    color: 'var(--putih)',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}
                >
                  {creating ? 'Membuat...' : 'Mulai Tulis Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { PaketSoal, GayaSoal, ParameterPenjanaan } from '../domain/types';
import { CurriculumService, CapaianItem } from '../domain/curriculum-service';
import { Sparkles, Plus, CheckCircle2, X } from 'lucide-react';

const curriculumService = new CurriculumService();

interface BerandaStudioSoalProps {
  sets: PaketSoal[];
  onOpenSet: (set: PaketSoal) => void;
  onCreateNewSet: (data: {
    judul: string;
    mapel: string;
    jenjang: string;
    topik: string;
    capaianPembelajaran?: string;
    parameterPenjanaan?: Partial<ParameterPenjanaan>;
  }) => Promise<void>;
}

export function BerandaStudioSoal({ sets, onOpenSet, onCreateNewSet }: BerandaStudioSoalProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  // Form states for new set
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [jenjang, setJenjang] = useState('5 SD');
  const [topik, setTopik] = useState('');
  const [selectedCp, setSelectedCp] = useState<string>('');
  const [cpList, setCpList] = useState<CapaianItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced parameters
  const [jumlahSoal, setJumlahSoal] = useState(20);
  const [mudahPct, setMudahPct] = useState(30);
  const [sedangPct, setSedangPct] = useState(50);
  const [sulitPct, setSulitPct] = useState(20);
  const [waktuPerSoal, setWaktuPerSoal] = useState(20);
  const [gayaSoal, setGayaSoal] = useState<GayaSoal>('KONTEKS_SEHARI_HARI');
  const [modeMiskonsepsi, setModeMiskonsepsi] = useState(true);
  const [instruksiTambahan, setInstruksiTambahan] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    curriculumService.getCurriculum(mapel, jenjang).then((res) => {
      setCpList(res.capaianList);
      if (res.capaianList.length > 0) {
        setSelectedCp(res.capaianList[0].kode);
      } else {
        setSelectedCp('');
      }
    });
  }, [mapel, jenjang]);

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
        capaianPembelajaran: selectedCp || undefined,
        parameterPenjanaan: {
          jumlahSoal,
          komposisiKesulitan: { mudah: mudahPct, sedang: sedangPct, sulit: sulitPct },
          waktuPerSoalDetik: waktuPerSoal,
          gayaSoal,
          modeMiskonsepsi,
          instruksiTambahan: instruksiTambahan.trim() || undefined,
        },
      });
      setShowModal(false);
      setJudul('');
      setTopik('');
      setShowAdvanced(false);
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
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#F5F3FF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={28} color="var(--ungu-monster)" />
          </div>
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
              Penjumlahan Pecahan (5 SD)
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
              Fotosintesis (7 SMP)
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
              Proklamasi Kemerdekaan (11 SMA)
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isReady && <CheckCircle2 size={11} />}
                    {isReady ? 'Siap Main' : 'Draf'}
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
            background: 'rgba(16, 26, 58, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: 'var(--putih)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: 'calc(100vh - 32px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px 24px',
                borderBottom: '1px solid var(--abu-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--tinta)' }}>
                  Buat Paket Soal Baru
                </h2>
                <p style={{ color: 'var(--abu-teks)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Masukkan detail topik pelajaran untuk memulai ruang kerja guru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--abu-teks)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleCreate}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  flex: 1,
                }}
              >
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
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--abu-border)',
                      fontSize: '14px',
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
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--abu-border)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                      Jenjang & Kelas
                    </label>
                    <select
                      value={jenjang}
                      onChange={(e) => setJenjang(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--abu-border)',
                        fontSize: '14px',
                        background: 'var(--putih)',
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
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--abu-border)',
                        fontSize: '14px',
                        background: 'var(--putih)',
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

                {/* Capaian Pembelajaran Kurikulum Merdeka */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                    Capaian Pembelajaran (Kurikulum Merdeka)
                  </label>
                  <select
                    value={selectedCp}
                    onChange={(e) => setSelectedCp(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--abu-border)',
                      fontSize: '13px',
                      background: 'var(--putih)',
                    }}
                  >
                    <option value="">-- Pilih Capaian Pembelajaran (Opsional) --</option>
                    {cpList.map((cp) => (
                      <option key={cp.kode} value={cp.kode}>
                        [{cp.kode}] {cp.elemen}: {cp.deskripsi.substring(0, 75)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggle Pengaturan Lanjutan */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      background: 'transparent',
                      color: 'var(--ungu-monster)',
                      fontSize: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 0,
                    }}
                  >
                    {showAdvanced ? '▲ Sembunyikan Pengaturan Lanjutan' : '▼ Buka Pengaturan Lanjutan'}
                  </button>
                </div>

                {showAdvanced && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--abu-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                          Jumlah Soal (5 - 40):
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={40}
                          value={jumlahSoal}
                          onChange={(e) => setJumlahSoal(parseInt(e.target.value) || 20)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--abu-border)',
                            fontSize: '13px',
                            background: 'var(--putih)',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                          Waktu / Soal (detik):
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={60}
                          value={waktuPerSoal}
                          onChange={(e) => setWaktuPerSoal(parseInt(e.target.value) || 20)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--abu-border)',
                            fontSize: '13px',
                            background: 'var(--putih)',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700 }}>
                          Komposisi Kesulitan:
                        </label>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: mudahPct + sedangPct + sulitPct === 100 ? 'var(--hijau-benar)' : '#D97706',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Total: {mudahPct + sedangPct + sulitPct}% {mudahPct + sedangPct + sulitPct === 100 ? <CheckCircle2 size={11} /> : '(Target 100%)'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--abu-teks)', marginBottom: '4px' }}>
                            Mudah (%)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="30"
                            value={mudahPct}
                            onChange={(e) => setMudahPct(parseInt(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--abu-border)',
                              fontSize: '13px',
                              background: 'var(--putih)',
                            }}
                          />
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--abu-teks)', marginBottom: '4px' }}>
                            Sedang (%)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="50"
                            value={sedangPct}
                            onChange={(e) => setSedangPct(parseInt(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--abu-border)',
                              fontSize: '13px',
                              background: 'var(--putih)',
                            }}
                          />
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--abu-teks)', marginBottom: '4px' }}>
                            Sulit (%)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="20"
                            value={sulitPct}
                            onChange={(e) => setSulitPct(parseInt(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--abu-border)',
                              fontSize: '13px',
                              background: 'var(--putih)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                        Gaya Soal:
                      </label>
                      <select
                        value={gayaSoal}
                        onChange={(e) => setGayaSoal(e.target.value as GayaSoal)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--abu-border)',
                          fontSize: '13px',
                          background: 'var(--putih)',
                        }}
                      >
                        <option value="KONTEKS_SEHARI_HARI">Konteks Sehari-hari</option>
                        <option value="LANGSUNG">Langsung</option>
                        <option value="CERITA_PENDEK">Cerita Pendek</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="mode-miskonsepsi"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          id="mode-miskonsepsi"
                          checked={modeMiskonsepsi}
                          onChange={(e) => setModeMiskonsepsi(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--ungu-monster)', cursor: 'pointer' }}
                        />
                        <span>Mode Miskonsepsi (Pilihan salah dibuat dari kekeliruan umum siswa)</span>
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                        Instruksi Tambahan (Opsional):
                      </label>
                      <input
                        type="text"
                        value={instruksiTambahan}
                        onChange={(e) => setInstruksiTambahan(e.target.value)}
                        placeholder="Contoh: Pakai nama dan tempat lokal di Jawa Barat"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--abu-border)',
                          fontSize: '13px',
                          background: 'var(--putih)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--abu-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#F8FAFC',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    color: 'var(--abu-teks)',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
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
                    padding: '9px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(91, 61, 245, 0.25)',
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

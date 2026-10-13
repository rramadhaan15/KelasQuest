export type StatusKesiapanPaket = 'DRAF' | 'SIAP_MAIN';

export type StatusTinjauan = 'BELUM_DITINJAU' | 'DISETUJUI' | 'DIEDIT';

export type SumberSoal = 'AI' | 'MANUAL';

export type TingkatKesulitan = 'MUDAH' | 'SEDANG' | 'SULIT';

export interface PilihanJawaban {
  id: string;
  teks: string;
  benar: boolean;
  labelMiskonsepsi?: string;
}

export interface ButirSoal {
  id: string;
  paketId: string;
  urutan: number;
  teks: string;
  kesulitan: TingkatKesulitan;
  subtopik?: string;
  pembahasan: string;
  waktuDetik: number;
  sumber: SumberSoal;
  statusTinjauan: StatusTinjauan;
  pilihanJawaban: PilihanJawaban[];
  isValid: boolean;
  validasiGalat: string[];
  diperbaruiPada: string;
}

export type GayaSoal = 'LANGSUNG' | 'KONTEKS_SEHARI_HARI' | 'CERITA_PENDEK';

export interface KomposisiKesulitan {
  mudah: number;
  sedang: number;
  sulit: number;
}

export interface ParameterPenjanaan {
  jumlahSoal: number;
  komposisiKesulitan: KomposisiKesulitan;
  waktuPerSoalDetik: number;
  gayaSoal: GayaSoal;
  modeMiskonsepsi: boolean;
  instruksiTambahan?: string;
}

export interface PaketSoal {
  id: string;
  guruId: string;
  judul: string;
  mapel: string;
  jenjang: string;
  topik: string;
  capaianPembelajaran?: string;
  parameterPenjanaan?: ParameterPenjanaan;
  status: StatusKesiapanPaket;
  butirSoal: ButirSoal[];
  dibuatPada: string;
  diperbaruiPada: string;
}

export interface CreateSetInput {
  judul: string;
  mapel: string;
  jenjang: string;
  topik: string;
  capaianPembelajaran?: string;
  parameterPenjanaan?: Partial<ParameterPenjanaan>;
}

export interface AddManualQuestionInput {
  teks: string;
  kesulitan?: TingkatKesulitan;
  subtopik?: string;
  pembahasan?: string;
  waktuDetik?: number;
  pilihanJawaban: Array<{
    teks: string;
    benar: boolean;
    labelMiskonsepsi?: string;
  }>;
}

export interface UpdateQuestionInput {
  teks?: string;
  kesulitan?: TingkatKesulitan;
  subtopik?: string;
  pembahasan?: string;
  waktuDetik?: number;
  pilihanJawaban?: Array<{
    id?: string;
    teks: string;
    benar: boolean;
    labelMiskonsepsi?: string;
  }>;
  statusTinjauan?: StatusTinjauan;
}

export interface RevisiPaketSoal {
  versi: number;
  paketId: string;
  disimpanPada: string;
  catatan?: string;
  snapshot: PaketSoal;
}

export interface MutasiOffline {
  id: string;
  paketId: string;
  jenis: 'SIMPAN_SOAL' | 'HAPUS_SOAL' | 'PERBARUI_PAKET';
  payload: any;
  stempelWaktu: string;
}

export interface HasilSinkronisasi {
  berhasil: boolean;
  paket: PaketSoal;
  konflikTerpecahkan: number;
  pesan?: string;
}

export interface SesiPenyuntingan {
  paketId: string;
  clientSessionId: string;
  terakhirAktifPada: string;
}

export interface LobbyConfig {
  namaBoss?: string;
  tingkatKesulitanBoss?: 'NORMAL' | 'MENANTANG' | 'EPIC';
  allowUnreviewed?: boolean;
}

export interface ButirSoalSnapshot {
  id: string;
  originalQuestionId: string;
  paketId: string;
  urutan: number;
  teks: string;
  kesulitan: TingkatKesulitan;
  subtopik?: string;
  pembahasan: string;
  waktuDetik: number;
  pilihanJawaban: PilihanJawaban[];
}

export type StatusSesi = 'LOBI' | 'BERLANGSUNG' | 'SELESAI';

export interface SnapshotSesi {
  id: string;
  paketId: string;
  guruId: string;
  pinKelas: string;
  status: StatusSesi;
  config: LobbyConfig;
  butirSoal: ButirSoalSnapshot[];
  peringatanBelumDitinjau?: boolean;
  dibuatPada: string;
  monsterHp?: number;
  monsterHpMaksimal?: number;
}

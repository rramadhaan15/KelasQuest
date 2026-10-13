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

export interface PaketSoal {
  id: string;
  guruId: string;
  judul: string;
  mapel: string;
  jenjang: string;
  topik: string;
  capaianPembelajaran?: string;
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

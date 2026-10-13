import seedData from '../data/kurikulum-merdeka-seed.json';

export interface CapaianItem {
  kode: string;
  mapel: string;
  fase: string;
  elemen: string;
  deskripsi: string;
}

export interface CurriculumLookupResult {
  fase: string;
  mapel: string;
  capaianList: CapaianItem[];
}

export class CurriculumService {
  private faseMapping: Record<string, string>;
  private capaianList: CapaianItem[];

  constructor() {
    this.faseMapping = seedData.faseMapping;
    this.capaianList = seedData.capaianPembelajaran;
  }

  async getCurriculum(mapel: string, jenjang: string): Promise<CurriculumLookupResult> {
    const fase = this.faseMapping[jenjang] || 'Fase C';
    const filtered = this.capaianList.filter(
      (item) => item.mapel.toLowerCase() === mapel.toLowerCase() && item.fase === fase
    );

    return {
      fase,
      mapel,
      capaianList: filtered.length > 0 ? filtered : this.capaianList.filter((item) => item.mapel.toLowerCase() === mapel.toLowerCase()),
    };
  }

  async searchCapaian(query: string, mapel?: string): Promise<CapaianItem[]> {
    const q = query.toLowerCase();
    return this.capaianList.filter((item) => {
      const matchMapel = !mapel || item.mapel.toLowerCase() === mapel.toLowerCase();
      const matchText =
        item.deskripsi.toLowerCase().includes(q) ||
        item.elemen.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q);
      return matchMapel && matchText;
    });
  }
}

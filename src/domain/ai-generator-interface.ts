import { TingkatKesulitan } from './types';

export interface GenerationContext {
  mapel: string;
  jenjang: string;
  topik: string;
  capaianPembelajaran?: string;
  jumlahSoal: number;
  modeMiskonsepsi?: boolean;
  gayaSoal?: string;
  instruksiTambahan?: string;
}

export interface GeneratedQuestionDraft {
  teks: string;
  kesulitan: TingkatKesulitan;
  subtopik?: string;
  pembahasan: string;
  waktuDetik: number;
  pilihanJawaban: Array<{
    teks: string;
    benar: boolean;
    labelMiskonsepsi?: string;
  }>;
}

export interface AIQuestionGenerator {
  generateQuestionStream(
    context: GenerationContext,
    signal?: AbortSignal
  ): AsyncIterable<GeneratedQuestionDraft>;
}

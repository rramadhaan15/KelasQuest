import { AIQuestionGenerator, GenerationContext, GeneratedQuestionDraft } from '../domain/ai-generator-interface';

export class MockAIQuestionGenerator implements AIQuestionGenerator {
  async *generateQuestionStream(
    context: GenerationContext,
    signal?: AbortSignal
  ): AsyncIterable<GeneratedQuestionDraft> {
    const total = context.jumlahSoal || 20;

    for (let i = 1; i <= total; i++) {
      if (signal?.aborted) {
        const error = new Error('Generation aborted');
        error.name = 'AbortError';
        throw error;
      }

      // Berikan delay simulasi sangat singkat
      await new Promise((resolve) => setTimeout(resolve, 5));

      if (signal?.aborted) {
        const error = new Error('Generation aborted');
        error.name = 'AbortError';
        throw error;
      }

      yield {
        teks: `Soal #${i}: Berapa hasil kalkulasi pada topik ${context.topik} untuk nomor ${i}?`,
        kesulitan: i % 3 === 0 ? 'SULIT' : i % 2 === 0 ? 'SEDANG' : 'MUDAH',
        subtopik: context.topik,
        pembahasan: `Pembahasan rinci untuk butir soal nomor ${i}.`,
        waktuDetik: 20,
        pilihanJawaban: [
          {
            teks: `Jawaban Benar ${i}`,
            benar: true,
          },
          {
            teks: `Pengecoh A (${i})`,
            benar: false,
            labelMiskonsepsi: context.modeMiskonsepsi
              ? `Miskonsepsi kalkulasi terpisah pada nomor ${i}`
              : undefined,
          },
          {
            teks: `Pengecoh B (${i})`,
            benar: false,
            labelMiskonsepsi: context.modeMiskonsepsi
              ? `Miskonsepsi lupa menyamakan penyebut pada nomor ${i}`
              : undefined,
          },
          {
            teks: `Pengecoh C (${i})`,
            benar: false,
          },
        ],
      };
    }
  }
}

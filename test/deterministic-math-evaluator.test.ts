import { describe, it, expect } from 'vitest';
import { MathEvaluator } from '../src/domain/math-evaluator';
import { StudioSoalService } from '../src/domain/studio-soal-service';
import { InMemoryStudioSoalRepository } from '../src/adapters/in-memory-repository';
import { AIQuestionGenerator, GenerationContext, GeneratedQuestionDraft } from '../src/domain/ai-generator-interface';

// Mock AI generator yang sengaja menghasilkan kunci salah pada soal berhitung
class BuggyMathAIGenerator implements AIQuestionGenerator {
  async *generateQuestionStream(
    context: GenerationContext
  ): AsyncIterable<GeneratedQuestionDraft> {
    // Model keliru: menandai 4/12 sebagai benar untuk 3/4 + 1/8
    yield {
      teks: 'Berapa hasil dari 3/4 + 1/8?',
      kesulitan: 'SEDANG',
      subtopik: 'Pecahan',
      pembahasan: 'Samakan penyebut menjadi 6/8 + 1/8 = 7/8.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '7/8', benar: false }, // Kunci asli benar tapi model salah tandai
        { teks: '4/12', benar: true, labelMiskonsepsi: 'Jumlahkan pembilang dan penyebut' }, // Model keliru tandai ini benar!
        { teks: '1/2', benar: false },
        { teks: '5/8', benar: false },
      ],
    };
  }
}

describe('Evaluator Deterministik Perhitungan Matematika (Tiket 04)', () => {
  const evaluator = new MathEvaluator();

  it('memvalidasi perhitungan pecahan deterministik secara akurat', () => {
    const hasil = evaluator.evaluateExpression('3/4 + 1/8');
    expect(hasil).toBe('7/8');
  });

  it('memvalidasi operasi aritmetika campuran deterministik', () => {
    expect(evaluator.evaluateExpression('12 * 5 - 10')).toBe('50');
    expect(evaluator.evaluateExpression('15 / 3 + 7')).toBe('12');
  });

  it('mendeteksi jika kunci jawaban AI keliru pada soal matematika', () => {
    const check = evaluator.evaluateMathQuestion('Berapa hasil dari 3/4 + 1/8?', [
      { teks: '7/8', benar: false },
      { teks: '4/12', benar: true }, // Salah!
      { teks: '1/2', benar: false },
      { teks: '5/8', benar: false },
    ]);

    expect(check.isArithmeticQuestion).toBe(true);
    expect(check.isCorrect).toBe(false);
    expect(check.expectedAnswer).toBe('7/8');
  });

  it('mengonversi notasi operasi ke tipografi Unicode standar untuk kenyamanan layar kecil (ADR 0005)', () => {
    const formatted = evaluator.formatToUnicodeTypography('3 * 4 / 2 = 6');
    expect(formatted).toBe('3 × 4 ÷ 2 = 6');
  });

  it('pipeline secara otomatis mengoreksi kunci jawaban jika model menandai opsi yang salah (ADR 0006)', async () => {
    const repository = new InMemoryStudioSoalRepository();
    const buggyAI = new BuggyMathAIGenerator();
    const service = new StudioSoalService(repository, undefined, buggyAI, evaluator);

    const paket = await service.createSet('guru-rina', {
      judul: 'Pecahan Validasi Deterministik',
      mapel: 'Matematika',
      jenjang: '5 SD',
      topik: 'Pecahan',
      parameterPenjanaan: { jumlahSoal: 5 },
    });

    const result = await service.streamGenerateQuestions(paket.id);
    expect(result.questions).toHaveLength(1);

    const saved = result.questions[0];
    // Kunci jawaban harus sudah otomatis dikoreksi menjadi 7/8 oleh evaluator deterministik
    const opsiBenar = saved.pilihanJawaban.find((p) => p.benar);
    expect(opsiBenar?.teks).toBe('7/8');

    const opsiSalah = saved.pilihanJawaban.find((p) => p.teks === '4/12');
    expect(opsiSalah?.benar).toBe(false);
  });
});

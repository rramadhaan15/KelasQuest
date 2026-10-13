import { PaketSoal, ButirSoal } from './types';

export interface StudentPreviewSession {
  totalQuestions: number;
  currentIndex: number;
  currentQuestion: ButirSoal;
  score: number;
  submitAnswer: (answerText: string) => { isCorrect: boolean; explanation: string };
  nextQuestion: () => boolean;
}

export function createStudentPreviewSession(paket: PaketSoal): StudentPreviewSession {
  if (paket.butirSoal.length === 0) {
    throw new Error('Paket Soal tidak memiliki butir soal untuk dipratinjau');
  }

  // Siapkan salinan butir soal dengan opsi yang diacak untuk simulasi siswa
  const questions: ButirSoal[] = paket.butirSoal.map((q) => {
    const shuffledOptions = [...q.pilihanJawaban].sort(() => Math.random() - 0.5);
    return {
      ...q,
      pilihanJawaban: shuffledOptions,
    };
  });

  let currentIndex = 0;
  let correctCount = 0;

  return {
    get totalQuestions() {
      return questions.length;
    },
    get currentIndex() {
      return currentIndex;
    },
    get currentQuestion() {
      return questions[currentIndex];
    },
    get score() {
      return Math.round((correctCount / questions.length) * 100);
    },
    submitAnswer(answerText: string) {
      const q = questions[currentIndex];
      const selected = q.pilihanJawaban.find((p) => p.teks === answerText);
      const isCorrect = selected ? selected.benar : false;

      if (isCorrect) {
        correctCount++;
      }

      return {
        isCorrect,
        explanation: q.pembahasan || (isCorrect ? 'Jawaban Anda benar!' : 'Jawaban belum tepat.'),
      };
    },
    nextQuestion() {
      if (currentIndex + 1 < questions.length) {
        currentIndex++;
        return true;
      }
      return false;
    },
  };
}

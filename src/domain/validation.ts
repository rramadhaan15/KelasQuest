import { ButirSoal, PilihanJawaban } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateQuestion(
  teks: string,
  pilihanJawaban: Array<{ teks: string; benar: boolean }>
): ValidationResult {
  const errors: string[] = [];

  if (!teks || teks.trim().length === 0) {
    errors.push('Teks butir soal tidak boleh kosong');
  }

  if (!pilihanJawaban || pilihanJawaban.length < 2 || pilihanJawaban.length > 5) {
    errors.push('Jumlah pilihan jawaban harus antara 2 sampai 5 pilihan');
  } else {
    const correctCount = pilihanJawaban.filter((p) => p.benar).length;
    if (correctCount !== 1) {
      errors.push('Harus memiliki tepat satu jawaban benar');
    }

    const emptyOptions = pilihanJawaban.some((p) => !p.teks || p.teks.trim().length === 0);
    if (emptyOptions) {
      errors.push('Teks pilihan jawaban tidak boleh kosong');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateSetStatus(butirSoalList: ButirSoal[]): 'DRAF' | 'SIAP_MAIN' {
  if (butirSoalList.length === 0) {
    return 'DRAF';
  }

  const allValid = butirSoalList.every((soal) => soal.isValid);
  return allValid ? 'SIAP_MAIN' : 'DRAF';
}

export const calculateStatusKesiapanPaket = calculateSetStatus;


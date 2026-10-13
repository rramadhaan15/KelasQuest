import { AddManualQuestionInput } from './types';

export interface ParsedRawOption {
  huruf: string;
  teks: string;
  benar: boolean;
}

export interface ParsedRawQuestion {
  nomor?: number;
  teks: string;
  pilihanJawaban: ParsedRawOption[];
  kunci?: string;
  pembahasan?: string;
  perluDiperiksa: boolean;
  alasanPemeriksaan: string[];
}

export interface ParseRawQuestionsResult {
  butirSoal: ParsedRawQuestion[];
  totalDitemukan: number;
  totalPerluDiperiksa: number;
}

/**
 * Mem-parse teks mentah dari dokumen Word atau pesan WhatsApp menjadi daftar kartu soal.
 * Menangani penomoran otomatis, pilihan A-D/E baik per baris maupun sebaris,
 * tanda kunci bintang (*A.) atau baris Kunci: C, dan pembahasan.
 */
export function parseRawQuestions(rawText: string): ParseRawQuestionsResult {
  if (!rawText || !rawText.trim()) {
    return {
      butirSoal: [],
      totalDitemukan: 0,
      totalPerluDiperiksa: 0,
    };
  }

  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  const rawBlocks = splitIntoQuestionBlocks(normalized);

  const parsedQuestions: ParsedRawQuestion[] = [];

  for (const block of rawBlocks) {
    const parsed = parseSingleBlock(block.content, block.nomor);
    if (parsed) {
      parsedQuestions.push(parsed);
    }
  }

  const totalPerluDiperiksa = parsedQuestions.filter((q) => q.perluDiperiksa).length;

  return {
    butirSoal: parsedQuestions,
    totalDitemukan: parsedQuestions.length,
    totalPerluDiperiksa,
  };
}

interface BlockMatch {
  nomor?: number;
  content: string;
}

function splitIntoQuestionBlocks(text: string): BlockMatch[] {
  // Pola nomor soal:
  // "1. ", "1) ", "Soal 1:", "No. 1.", "Nomor 1 - "
  const questionNumRegex = /(?:^|\n)(?:(?:Soal|No\.?|Nomor)?\s*(\d+)[\.\)\:\-]\s*)/gi;
  const matches: Array<{ index: number; length: number; num: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = questionNumRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const num = parseInt(match[1], 10);
    // Index awal nomor soal (abaikan newline di depan jika ada)
    const matchIndex = fullMatch.startsWith('\n') ? match.index + 1 : match.index;
    matches.push({
      index: matchIndex,
      length: fullMatch.length - (fullMatch.startsWith('\n') ? 1 : 0),
      num,
    });
  }

  if (matches.length > 0) {
    const blocks: BlockMatch[] = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startContentIndex = current.index + current.length;
      const endContentIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const content = text.substring(startContentIndex, endContentIndex).trim();
      blocks.push({
        nomor: current.num,
        content,
      });
    }
    return blocks;
  }

  // Jika tidak ditemukan penomoran 1., 2., pisahkan berdasarkan baris kosong ganda
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs.map((content, idx) => ({
      nomor: idx + 1,
      content,
    }));
  }

  return [{ nomor: 1, content: text }];
}

function parseSingleBlock(content: string, defaultNomor?: number): ParsedRawQuestion | null {
  if (!content.trim()) return null;

  let workingText = content;

  // 1. Ekstrak pembahasan jika ada
  let pembahasan: string | undefined;
  const pembahasanRegex = /(?:Pembahasan|Penjelasan|Solusi|Keterangan)\s*[:=]\s*([\s\S]*)$/i;
  const matchPembahasan = workingText.match(pembahasanRegex);
  if (matchPembahasan) {
    pembahasan = matchPembahasan[1].trim();
    workingText = workingText.substring(0, matchPembahasan.index).trim();
  }

  // 2. Ekstrak kunci jawaban eksplisit jika ada
  let kunciExplicit: string | undefined;
  const kunciRegex = /(?:Kunci(?:\s+Jawaban)?|Jawaban|Ans(?:wer)?|Key)\s*[:=]\s*\(?([A-Ea-e])\)?/i;
  const matchKunci = workingText.match(kunciRegex);
  if (matchKunci) {
    kunciExplicit = matchKunci[1].toUpperCase();
    workingText = workingText.substring(0, matchKunci.index).trim();
  }

  // 3. Ekstrak opsi pilihan jawaban (A, B, C, D, E)
  // Menangani format per baris atau sebaris: "A. ...", "*B. ...", "C) ...", "(D) ..."
  const optionDelimRegex = /(?:^|\s)([\*\-\[xX\]\s]*)\(?([A-Ea-e])\)?[.\-\)]\s+/g;
  const optionMatches: Array<{
    index: number;
    matchLength: number;
    prefix: string;
    letter: string;
  }> = [];

  let optMatch: RegExpExecArray | null;
  while ((optMatch = optionDelimRegex.exec(workingText)) !== null) {
    const fullMatch = optMatch[0];
    const prefix = optMatch[1];
    const letter = optMatch[2].toUpperCase();
    const actualIndex = fullMatch.startsWith(' ') ? optMatch.index + 1 : optMatch.index;
    const actualLength = fullMatch.length - (fullMatch.startsWith(' ') ? 1 : 0);

    optionMatches.push({
      index: actualIndex,
      matchLength: actualLength,
      prefix,
      letter,
    });
  }

  let questionText = '';
  const options: ParsedRawOption[] = [];

  if (optionMatches.length >= 2) {
    // Teks soal adalah teks sebelum opsi pertama
    questionText = workingText.substring(0, optionMatches[0].index).trim();

    for (let i = 0; i < optionMatches.length; i++) {
      const cur = optionMatches[i];
      const startText = cur.index + cur.matchLength;
      const endText = i + 1 < optionMatches.length ? optionMatches[i + 1].index : workingText.length;
      let optText = workingText.substring(startText, endText).trim();

      // Cek penanda asterisk pada prefix atau suffix
      let isMarkedCorrect = cur.prefix.includes('*') || cur.prefix.toLowerCase().includes('x');
      if (optText.endsWith('*')) {
        isMarkedCorrect = true;
        optText = optText.replace(/\*+$/, '').trim();
      }

      const isCorrectByExplicitKey = kunciExplicit ? cur.letter === kunciExplicit : false;
      const benar = isMarkedCorrect || isCorrectByExplicitKey;

      options.push({
        huruf: cur.letter,
        teks: optText,
        benar,
      });
    }
  } else {
    // Tidak cukup opsi ditemukan, seluruh teks dianggap teks soal
    questionText = workingText.trim();
  }

  // Validasi & flagging untuk pemeriksaan guru
  const alasanPemeriksaan: string[] = [];

  if (!questionText) {
    alasanPemeriksaan.push('Teks butir soal kosong');
  }

  if (options.length < 2) {
    alasanPemeriksaan.push('Pilihan jawaban kurang dari 2');
  } else if (options.length > 5) {
    alasanPemeriksaan.push('Pilihan jawaban lebih dari 5');
  }

  const correctCount = options.filter((o) => o.benar).length;
  if (options.length >= 2) {
    if (correctCount === 0) {
      alasanPemeriksaan.push('Kunci jawaban belum ditentukan');
    } else if (correctCount > 1) {
      alasanPemeriksaan.push('Terdapat lebih dari satu kunci jawaban');
    }
  }

  return {
    nomor: defaultNomor,
    teks: questionText,
    pilihanJawaban: options,
    kunci: kunciExplicit || options.find((o) => o.benar)?.huruf,
    pembahasan,
    perluDiperiksa: alasanPemeriksaan.length > 0,
    alasanPemeriksaan,
  };
}

/**
 * Mengonversi ParsedRawQuestion menjadi AddManualQuestionInput yang siap ditambahkan
 * ke paket soal melalui StudioSoalService.
 */
export function convertParsedToManualInput(parsed: ParsedRawQuestion): AddManualQuestionInput {
  // Jika tidak ada jawaban benar yang terdeteksi, kita tandai pilihan pertama sebagai fallback
  // namun guru tetap dapat memperbaikinya di editor.
  const hasCorrect = parsed.pilihanJawaban.some((p) => p.benar);

  const pilihanJawaban = parsed.pilihanJawaban.map((p, idx) => ({
    teks: p.teks,
    benar: hasCorrect ? p.benar : idx === 0,
  }));

  // Jika pilihan jawaban kurang dari 2 (misalnya parsing gagal menemukan opsi), berikan opsi draf standar
  while (pilihanJawaban.length < 2) {
    const idx = pilihanJawaban.length;
    pilihanJawaban.push({
      teks: `Pilihan ${String.fromCharCode(65 + idx)}`,
      benar: idx === 0,
    });
  }

  return {
    teks: parsed.teks || 'Butir Soal Baru (dari tempel teks)',
    kesulitan: 'SEDANG',
    pembahasan: parsed.pembahasan || '',
    waktuDetik: 20,
    pilihanJawaban,
  };
}

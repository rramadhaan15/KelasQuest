export interface MathEvaluationResult {
  isArithmeticQuestion: boolean;
  isCorrect: boolean;
  expectedAnswer?: string;
  detectedExpression?: string;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export class MathEvaluator {
  formatToUnicodeTypography(text: string): string {
    let result = text.replace(/\s*\*\s*/g, ' × ');

    // Only convert / to ÷ when in an equation context (e.g. "12 / 3 = 4")
    // Preserves fractional notation (e.g. "3/4 + 1/2")
    if (text.includes('=')) {
      result = result.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 ÷ $2');
    }

    return result
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\+\-/g, '±');
  }

  evaluateExpression(expr: string): string | null {
    const cleanExpr = expr.trim();

    // 1. Cek operasi pecahan: a/b (+|-|*|/) c/d
    const fractionMatch = cleanExpr.match(
      /^(\d+)\/(\d+)\s*([\+\-\*\/])\s*(\d+)\/(\d+)$/
    );

    if (fractionMatch) {
      const n1 = parseInt(fractionMatch[1]);
      const d1 = parseInt(fractionMatch[2]);
      const op = fractionMatch[3];
      const n2 = parseInt(fractionMatch[4]);
      const d2 = parseInt(fractionMatch[5]);

      let resNum = 0;
      let resDen = 1;

      if (op === '+') {
        resNum = n1 * d2 + n2 * d1;
        resDen = d1 * d2;
      } else if (op === '-') {
        resNum = n1 * d2 - n2 * d1;
        resDen = d1 * d2;
      } else if (op === '*') {
        resNum = n1 * n2;
        resDen = d1 * d2;
      } else if (op === '/') {
        resNum = n1 * d2;
        resDen = d1 * n2;
      }

      if (resDen === 0) return null;

      const common = gcd(resNum, resDen);
      const reducedNum = resNum / common;
      const reducedDen = resDen / common;

      if (reducedDen === 1) {
        return `${reducedNum}`;
      }
      return `${reducedNum}/${reducedDen}`;
    }

    // 2. Cek operasi aritmetika dasar: integer operations with +, -, *, /
    try {
      // Hanya izinkan angka, spasi, dan operator aritmatika aman
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(cleanExpr)) {
        // Evaluasi aman menggunakan Function tanpa variabel luar
        const res = Function(`"use strict"; return (${cleanExpr})`)();
        if (typeof res === 'number' && Number.isFinite(res)) {
          return `${res}`;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  evaluateMathQuestion(
    teks: string,
    pilihanJawaban: Array<{ teks: string; benar: boolean }>
  ): MathEvaluationResult {
    // Cari pola ekspresi matematika di dalam teks, misal: "3/4 + 1/8" atau "12 * 5 - 10"
    const pattern = /(\d+\/\d+\s*[\+\-\*\/]\s*\d+\/\d+|\d+\s*[\+\-\*\/]\s*\d+(?:\s*[\+\-\*\/]\s*\d+)*)/;
    const match = teks.match(pattern);

    if (!match) {
      return { isArithmeticQuestion: false, isCorrect: true };
    }

    const expression = match[1].trim();
    const expectedAnswer = this.evaluateExpression(expression);

    if (!expectedAnswer) {
      return { isArithmeticQuestion: false, isCorrect: true };
    }

    const markedCorrect = pilihanJawaban.find((p) => p.benar);
    const isCorrect = markedCorrect ? markedCorrect.teks.trim() === expectedAnswer : false;

    return {
      isArithmeticQuestion: true,
      isCorrect,
      expectedAnswer,
      detectedExpression: expression,
    };
  }
}

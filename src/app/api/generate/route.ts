import { NextRequest, NextResponse } from 'next/server';
import { GenerationContext, GeneratedQuestionDraft } from '../../../domain/ai-generator-interface';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { context: GenerationContext; apiKey?: string };
    const context = body.context;
    if (!context || !context.topik) {
      return NextResponse.json({ success: false, message: 'Topik harus diisi' }, { status: 400 });
    }

    const apiKey =
      body.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'GEMINI_API_KEY tidak dikonfigurasi di server' },
        { status: 200 }
      );
    }

    const count = context.jumlahSoal || 20;
    const prompt = `Anda adalah asisten penyusun soal kurikulum Merdeka Indonesia yang ahli.
Tugas: Buatkan ${count} butir soal pilihan ganda (4 pilihan jawaban: A, B, C, D) untuk:
- Mata Pelajaran: ${context.mapel}
- Jenjang / Kelas: ${context.jenjang}
- Topik Utama: ${context.topik}
${context.capaianPembelajaran ? `- Capaian Pembelajaran: ${context.capaianPembelajaran}` : ''}
${context.gayaSoal ? `- Gaya Soal: ${context.gayaSoal}` : '- Gaya Soal: Konteks Sehari-hari'}
${context.instruksiTambahan ? `- Instruksi Tambahan: ${context.instruksiTambahan}` : ''}

Ketentuan Kualitas (PRD KelasQuest):
1. Setiap soal harus orisinal, menarik, dan menggunakan bahasa Indonesia yang baik sesuai jenjang siswa.
2. Tepat 1 jawaban benar.
3. 3 pilihan salah harus masuk akal (bukan pengecoh konyol) dan merefleksikan miskonsepsi umum siswa.
4. Setiap pilihan salah wajib memiliki label miskonsepsi penjelasan mengapa siswa memilih jawaban tersebut.
5. Sertakan pembahasan singkat yang jelas untuk jawaban yang benar.
6. Sebar tingkat kesulitan secara wajar (MUDAH, SEDANG, SULIT).

Format output WAJIB HANYA berupa JSON Array murni tanpa markdown triple-backtick:
[
  {
    "teks": "Teks soal pertanyaan...",
    "kesulitan": "MUDAH" | "SEDANG" | "SULIT",
    "subtopik": "${context.topik}",
    "pembahasan": "Penjelasan mengapa jawaban tersebut benar...",
    "waktuDetik": 20,
    "pilihanJawaban": [
      { "teks": "Pilihan A", "benar": true },
      { "teks": "Pilihan B", "benar": false, "labelMiskonsepsi": "Label miskonsepsi B" },
      { "teks": "Pilihan C", "benar": false, "labelMiskonsepsi": "Label miskonsepsi C" },
      { "teks": "Pilihan D", "benar": false, "labelMiskonsepsi": "Label miskonsepsi D" }
    ]
  }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      return NextResponse.json({ success: false, message: `Gemini API error: ${errBody}` }, { status: 200 });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ success: false, message: 'Format respons Gemini kosong' }, { status: 200 });
    }

    const parsedQuestions = JSON.parse(candidateText) as GeneratedQuestionDraft[];
    return NextResponse.json({ success: true, questions: parsedQuestions });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

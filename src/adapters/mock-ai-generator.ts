import { AIQuestionGenerator, GenerationContext, GeneratedQuestionDraft } from '../domain/ai-generator-interface';

export class MockAIQuestionGenerator implements AIQuestionGenerator {
  async *generateQuestionStream(
    context: GenerationContext,
    signal?: AbortSignal
  ): AsyncIterable<GeneratedQuestionDraft> {
    const total = context.jumlahSoal || 20;

    // 1. Coba panggil Gemini AI API jika di browser / server tersedia
    let apiQuestions: GeneratedQuestionDraft[] | null = null;
    if (typeof window !== 'undefined') {
      try {
        const clientApiKey = localStorage.getItem('gemini_api_key') || undefined;
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, apiKey: clientApiKey }),
          signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
            apiQuestions = data.questions;
          }
        }
      } catch (e) {
        // Fallback anggun ke Generator Kurikulum lokal jika jaringan gagal atau offline
      }
    }

    if (apiQuestions && apiQuestions.length > 0) {
      for (const q of apiQuestions.slice(0, total)) {
        if (signal?.aborted) {
          const error = new Error('Generation aborted');
          error.name = 'AbortError';
          throw error;
        }
        await new Promise((r) => setTimeout(r, 60)); // Simulasi streaming visual
        yield q;
      }
      return;
    }

    // 2. Mesin Generator Kurikulum Edukasional (Topic-Aware Pedagogical Engine)
    // Menghasilkan 20 butir soal nyata, beragam, dan sesuai topik kurikulum Indonesia
    const generatedPool = buildQuestionsForTopic(context, total);

    for (let i = 0; i < total; i++) {
      if (signal?.aborted) {
        const error = new Error('Generation aborted');
        error.name = 'AbortError';
        throw error;
      }

      // Berikan delay streaming agar indikator progress terlihat mulus
      await new Promise((resolve) => setTimeout(resolve, 15));

      if (signal?.aborted) {
        const error = new Error('Generation aborted');
        error.name = 'AbortError';
        throw error;
      }

      yield generatedPool[i % generatedPool.length];
    }
  }
}

/**
 * Membangun kumpulan butir soal bermakna sesuai topik pembelajaran yang dimasukkan guru.
 */
function buildQuestionsForTopic(context: GenerationContext, count: number): GeneratedQuestionDraft[] {
  const topikLower = (context.topik || '').toLowerCase();
  const mapelLower = (context.mapel || '').toLowerCase();

  if (topikLower.includes('pecahan') || topikLower.includes('fraction')) {
    return getPecahanQuestions(context);
  }

  if (
    topikLower.includes('fotosintesis') ||
    topikLower.includes('ekosistem') ||
    topikLower.includes('rantai makanan') ||
    topikLower.includes('tumbuhan')
  ) {
    return getIpasQuestions(context);
  }

  if (
    topikLower.includes('proklamasi') ||
    topikLower.includes('kemerdekaan') ||
    topikLower.includes('sejarah') ||
    mapelLower.includes('sejarah')
  ) {
    return getSejarahQuestions(context);
  }

  // Generator Prosedural Kontekstual untuk Topik Kustom Apapun
  return getGenericContextualQuestions(context, count);
}

function getPecahanQuestions(context: GenerationContext): GeneratedQuestionDraft[] {
  return [
    {
      teks: 'Berapakah hasil dari 1/4 + 2/4?',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Pecahan dengan penyebut sama langsung dijumlahkan pembilangnya: 1/4 + 2/4 = (1+2)/4 = 3/4.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '3/4', benar: true },
        { teks: '3/8', benar: false, labelMiskonsepsi: 'Menjumlahkan angka penyebut: 4 + 4 = 8' },
        { teks: '2/4', benar: false, labelMiskonsepsi: 'Hanya menyalin pecahan kedua' },
        { teks: '1/4', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 1/2 + 1/4 setelah disamakan penyebutnya?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Samakan penyebut ke KPK(2,4)=4. 1/2 menjadi 2/4. Maka 2/4 + 1/4 = 3/4.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '3/4', benar: true },
        { teks: '2/6', benar: false, labelMiskonsepsi: 'Menjumlahkan pembilang dan penyebut masing-masing (1+1)/(2+4)' },
        { teks: '2/4', benar: false, labelMiskonsepsi: 'Lupa menambahkan pecahan 1/4' },
        { teks: '1/4', benar: false },
      ],
    },
    {
      teks: 'Pecahan berikut ini yang senilai dengan 2/3 adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan angka 2: (2x2)/(3x2) = 4/6.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '4/6', benar: true },
        { teks: '3/4', benar: false, labelMiskonsepsi: 'Menambahkan 1 pada pembilang dan penyebut' },
        { teks: '2/6', benar: false, labelMiskonsepsi: 'Hanya mengalikan penyebut dengan 2' },
        { teks: '4/9', benar: false },
      ],
    },
    {
      teks: 'Ibu memotong kue bolu menjadi 8 potong sama besar. Doni memakan 3 potong. Bagian kue yang dimakan Doni dalam bentuk pecahan adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Doni memakan 3 bagian dari total 8 bagian kue, sehingga ditulis 3/8.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '3/8', benar: true },
        { teks: '5/8', benar: false, labelMiskonsepsi: 'Menghitung sisa kue yang belum dimakan' },
        { teks: '3/5', benar: false, labelMiskonsepsi: 'Membandingkan bagian dimakan dengan sisa kue' },
        { teks: '1/8', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 5/6 - 2/6?',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Karena penyebutnya sama, cukup kurangkan pembilang: 5 - 2 = 3. Hasilnya 3/6 atau dapat disederhanakan menjadi 1/2.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '3/6 (1/2)', benar: true },
        { teks: '3/0', benar: false, labelMiskonsepsi: 'Mengurangkan angka penyebut sehingga menjadi 0' },
        { teks: '7/6', benar: false, labelMiskonsepsi: 'Malah menjumlahkan pembilang bukan mengurangkan' },
        { teks: '2/6', benar: false },
      ],
    },
    {
      teks: 'Bentuk desimal dari pecahan 3/5 adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Ubah penyebut ke persepuluh: 3/5 = (3x2)/(5x2) = 6/10 = 0,6.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '0,6', benar: true },
        { teks: '0,35', benar: false, labelMiskonsepsi: 'Menggabungkan angka pembilang 3 dan penyebut 5' },
        { teks: '0,5', benar: false, labelMiskonsepsi: 'Mengambil nilai penyebut saja' },
        { teks: '0,3', benar: false },
      ],
    },
    {
      teks: 'Pecahan 1/4 sama nilainya dengan persentase...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Untuk mengubah ke persen, kalikan dengan 100%: 1/4 x 100% = 25%.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '25%', benar: true },
        { teks: '14%', benar: false, labelMiskonsepsi: 'Menyatukan angka 1 dan 4 secara langsung' },
        { teks: '40%', benar: false, labelMiskonsepsi: 'Mengalikan angka 4 dengan 10' },
        { teks: '20%', benar: false },
      ],
    },
    {
      teks: 'Bentuk paling sederhana dari pecahan 12/16 adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Bagi pembilang dan penyebut dengan FPB(12,16)=4. 12:4 / 16:4 = 3/4.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '3/4', benar: true },
        { teks: '6/8', benar: false, labelMiskonsepsi: 'Hanya membagi dengan 2 dan belum sampai bentuk paling sederhana' },
        { teks: '2/4', benar: false, labelMiskonsepsi: 'Salah membagi angka pembilang' },
        { teks: '4/6', benar: false },
      ],
    },
    {
      teks: 'Siti membeli 1/2 meter pita merah dan 3/4 meter pita biru. Berapa meter total panjang pita Siti?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: '1/2 + 3/4 = 2/4 + 3/4 = 5/4 meter (atau 1 1/4 meter).',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: '5/4 meter (1 1/4 meter)', benar: true },
        { teks: '4/6 meter', benar: false, labelMiskonsepsi: 'Menjumlahkan pembilang (1+3) dan penyebut (2+4)' },
        { teks: '4/4 meter (1 meter)', benar: false, labelMiskonsepsi: 'Mengabaikan kelebihan pecahan' },
        { teks: '2/4 meter', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 1 - 3/8?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Ubah bilangan bulat 1 menjadi pecahan berpenyebut sama: 1 = 8/8. Maka 8/8 - 3/8 = 5/8.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '5/8', benar: true },
        { teks: '2/8', benar: false, labelMiskonsepsi: 'Mengurangkan 3 dengan 1' },
        { teks: '3/7', benar: false, labelMiskonsepsi: 'Mengurangkan penyebut 8 dengan 1' },
        { teks: '1/8', benar: false },
      ],
    },
    {
      teks: 'Manakah pecahan berikut yang nilainya LEBIH BESAR dari 2/5?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Pecahan 3/5 memiliki penyebut sama dengan 2/5 dan pembilangnya lebih besar, sehingga 3/5 > 2/5.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '3/5', benar: true },
        { teks: '1/5', benar: false, labelMiskonsepsi: '1/5 lebih kecil dari 2/5' },
        { teks: '2/10', benar: false, labelMiskonsepsi: '2/10 = 1/5, nilainya lebih kecil dari 2/5' },
        { teks: '1/10', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 2/3 x 3/4?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Kalikan pembilang dengan pembilang dan penyebut dengan penyebut: (2x3)/(3x4) = 6/12 = 1/2.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: '6/12 (1/2)', benar: true },
        { teks: '5/7', benar: false, labelMiskonsepsi: 'Malah menjumlahkan pembilang dan penyebut' },
        { teks: '2/4', benar: false, labelMiskonsepsi: 'Mencoret angka 3 tanpa mengalikan' },
        { teks: '3/6', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 1/2 dibagi 2?',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Setengah bagian jika dibagi menjadi dua bagian sama besar akan menghasilkan seperempat bagian: 1/2 ÷ 2 = 1/2 x 1/2 = 1/4.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: '1/4', benar: true },
        { teks: '1', benar: false, labelMiskonsepsi: 'Mengira 1/2 x 2 = 1' },
        { teks: '2/2', benar: false, labelMiskonsepsi: 'Membagi penyebut saja' },
        { teks: '1/2', benar: false },
      ],
    },
    {
      teks: 'Sebuah semangka dipotong menjadi 10 bagian sama besar. Rina memakan 2 potong dan Budi memakan 5 potong. Berapa bagian semangka yang tersisa?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Total yang dimakan: 2/10 + 5/10 = 7/10. Sisa semangka: 10/10 - 7/10 = 3/10.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: '3/10', benar: true },
        { teks: '7/10', benar: false, labelMiskonsepsi: 'Menghitung yang sudah dimakan, bukan sisa' },
        { teks: '5/10', benar: false, labelMiskonsepsi: 'Hanya melihat bagian Budi' },
        { teks: '2/10', benar: false },
      ],
    },
    {
      teks: 'Jika pecahan 3/4 senilai dengan n/12, maka nilai n adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Penyebut 4 dikalikan 3 menghasilkan 12. Maka pembilang 3 juga dikalikan 3, sehingga n = 9.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '9', benar: true },
        { teks: '6', benar: false, labelMiskonsepsi: 'Menambahkan selisih yang salah' },
        { teks: '8', benar: false, labelMiskonsepsi: 'Mengira perkalian 2' },
        { teks: '12', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 2/10 + 35/100?',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Ubah 2/10 menjadi 20/100. Maka 20/100 + 35/100 = 55/100 (disederhanakan 11/20).',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: '55/100 (11/20)', benar: true },
        { teks: '37/110', benar: false, labelMiskonsepsi: 'Menjumlahkan 2+35 dan 10+100 secara langsung' },
        { teks: '37/100', benar: false, labelMiskonsepsi: 'Menjumlahkan 2 langsung dengan 35 tanpa menyamakan penyebut' },
        { teks: '50/100', benar: false },
      ],
    },
    {
      teks: 'Berapakah hasil dari 1 1/2 + 2 1/4?',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Jumlahkan bilangan bulat: 1 + 2 = 3. Pecahan: 1/2 + 1/4 = 2/4 + 1/4 = 3/4. Total = 3 3/4.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: '3 3/4', benar: true },
        { teks: '3 2/6', benar: false, labelMiskonsepsi: 'Menjumlahkan pecahan menjadi (1+1)/(2+4) = 2/6' },
        { teks: '3 1/4', benar: false, labelMiskonsepsi: 'Lupa menambahkan 1/2' },
        { teks: '4 1/4', benar: false },
      ],
    },
    {
      teks: 'Pecahan 2/4 senilai dengan pecahan...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: '2/4 disederhanakan menjadi 1/2, yang juga senilai dengan 4/8.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '4/8', benar: true },
        { teks: '2/8', benar: false, labelMiskonsepsi: 'Hanya mengalikan penyebut dengan 2' },
        { teks: '3/5', benar: false },
        { teks: '1/4', benar: false },
      ],
    },
    {
      teks: 'Di antara pecahan berikut, manakah yang nilainya PALING KECIL?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Jika pembilangnya sama (1), semakin besar angka penyebut maka nilainya semakin kecil: 1/8 < 1/4 < 1/3 < 1/2.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '1/8', benar: true },
        { teks: '1/2', benar: false, labelMiskonsepsi: 'Mengira angka penyebut 2 terkecil berarti nilainya paling kecil' },
        { teks: '1/4', benar: false },
        { teks: '1/3', benar: false },
      ],
    },
    {
      teks: 'Manakah pernyataan tentang pecahan di bawah ini yang BENAR?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Pecahan 1/2 bernilai sama persis dengan 50% dan 0,5.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: '1/2 senilai dengan 50% dan 0,5', benar: true },
        { teks: 'Penyebut yang lebih besar selalu berarti nilai lebih besar', benar: false, labelMiskonsepsi: 'Miskonsepsi ukuran penyebut' },
        { teks: '1/4 lebih besar nilainya daripada 1/2', benar: false, labelMiskonsepsi: 'Miskonsepsi perbandingan pecahan' },
        { teks: '2/5 nilainya sama dengan 5/2', benar: false },
      ],
    },
  ];
}

function getIpasQuestions(context: GenerationContext): GeneratedQuestionDraft[] {
  return [
    {
      teks: 'Zat hijau daun pada tumbuhan yang berfungsi menangkap energi cahaya matahari disebut...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Klorofil adalah pigmen hijau pada daun yang menyerap sinar matahari untuk proses fotosintesis.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Klorofil', benar: true },
        { teks: 'Stomata', benar: false, labelMiskonsepsi: 'Stomata adalah mulut daun untuk pertukaran gas' },
        { teks: 'Xilem', benar: false, labelMiskonsepsi: 'Xilem adalah pembuluh pengangkut air' },
        { teks: 'Floem', benar: false },
      ],
    },
    {
      teks: 'Gas yang diserap oleh tumbuhan dari udara untuk bahan baku proses fotosintesis adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Tumbuhan menyerap karbon dioksida (CO2) dari udara melalui stomata untuk bahan fotosintesis.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Karbon dioksida (CO2)', benar: true },
        { teks: 'Oksigen (O2)', benar: false, labelMiskonsepsi: 'Tertukar dengan gas hasil fotosintesis' },
        { teks: 'Nitrogen', benar: false },
        { teks: 'Hidrogen', benar: false },
      ],
    },
    {
      teks: 'Zat yang dihasilkan dari proses fotosintesis yang sangat penting untuk pernapasan manusia dan hewan adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Hasil akhir fotosintesis adalah glukosa (zat makanan) dan gas oksigen (O2).',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Oksigen (O2)', benar: true },
        { teks: 'Karbon dioksida', benar: false, labelMiskonsepsi: 'Tertukar dengan gas masukan' },
        { teks: 'Karbon monoksida', benar: false },
        { teks: 'Nitrogen', benar: false },
      ],
    },
    {
      teks: 'Dalam sebuah rantai makanan, tumbuhan hijau berperan sebagai...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Tumbuhan hijau dapat membuat makanannya sendiri melalui fotosintesis, sehingga disebut produsen.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Produsen', benar: true },
        { teks: 'Konsumen tingkat I', benar: false, labelMiskonsepsi: 'Konsumen I adalah pemakan tumbuhan (herbivora)' },
        { teks: 'Pengurai (dekomposer)', benar: false },
        { teks: 'Konsumen puncak', benar: false },
      ],
    },
    {
      teks: 'Bagian daun yang berupa lubang-lubang kecil untuk keluar masuknya gas oksigen dan karbon dioksida disebut...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Stomata adalah celah kecil pada permukaan daun untuk proses respirasi dan transpirasi.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Stomata', benar: true },
        { teks: 'Kloroplas', benar: false, labelMiskonsepsi: 'Kloroplas adalah organel sel tempat klorofil berada' },
        { teks: 'Kambium', benar: false },
        { teks: 'Kutikula', benar: false },
      ],
    },
    {
      teks: 'Pembuluh pada tumbuhan yang berfungsi mengangkut air dan unsur hara dari akar ke daun adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Xilem (pembuluh kayu) mengangkut air dari akar ke daun, sedangkan floem mengedarkan hasil fotosintesis.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Xilem', benar: true },
        { teks: 'Floem', benar: false, labelMiskonsepsi: 'Floem bertugas mengangkut hasil fotosintesis ke seluruh tubuh' },
        { teks: 'Epidermis', benar: false },
        { teks: 'Kloroplas', benar: false },
      ],
    },
    {
      teks: 'Perhatikan rantai makanan berikut: Padi -> Belalang -> Katak -> Ular -> Elang. Jika populasi katak menurun drastis, apa yang akan terjadi?',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Katak memakan belalang. Jika katak berkurang drastis, pemangsa belalang berkurang sehingga populasi belalang meningkat.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: 'Populasi belalang akan meningkat drastis', benar: true },
        { teks: 'Populasi ular akan bertambah banyak', benar: false, labelMiskonsepsi: 'Ular kehilangan mangsanya (katak) sehingga justru berkurang' },
        { teks: 'Populasi padi akan bertambah lebat', benar: false },
        { teks: 'Elang akan punah seketika', benar: false },
      ],
    },
    {
      teks: 'Organisme yang berperan menguraikan sisa-sisa makhluk hidup yang mati menjadi zat hara tanah adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Bakteri dan jamur adalah dekomposer (pengurai) yang mengembalikan unsur hara ke tanah.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Jamur dan bakteri pengurai', benar: true },
        { teks: 'Tumbuhan hijau', benar: false, labelMiskonsepsi: 'Tumbuhan adalah produsen' },
        { teks: 'Ulat dan belalang', benar: false },
        { teks: 'Burung elang', benar: false },
      ],
    },
    {
      teks: 'Proses fotosintesis pada tumbuhan hijau umumnya berlangsung paling efektif pada saat...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Fotosintesis membutuhkan energi cahaya matahari, sehingga terjadi pada siang hari saat ada cahaya.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Siang hari saat terkena sinar matahari', benar: true },
        { teks: 'Malam hari saat udara dingin', benar: false, labelMiskonsepsi: 'Malam hari tidak ada sinar matahari untuk fotosintesis' },
        { teks: 'Saat hujan deras tanpa henti', benar: false },
        { teks: 'Dini hari sebelum matahari terbit', benar: false },
      ],
    },
    {
      teks: 'Makanan cadangan yang dihasilkan oleh tumbuhan dari proses fotosintesis disimpan dalam bentuk...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Glukosa hasil fotosintesis diubah dan disimpan dalam bentuk amilum (karbohidrat) pada umbi, buah, atau biji.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Amilum (karbohidrat/pati)', benar: true },
        { teks: 'Lemak hewani', benar: false },
        { teks: 'Garam mineral', benar: false },
        { teks: 'Klorofil', benar: false },
      ],
    },
    {
      teks: 'Mengapa tumbuhan hijau disebut makhluk hidup autotrof?',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Autotrof berarti mampu menghasilkan makanan sendiri menggunakan bahan anorganik dan energi cahaya.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Karena dapat membuat makanannya sendiri', benar: true },
        { teks: 'Karena memakan makhluk hidup lain', benar: false, labelMiskonsepsi: 'Itu adalah ciri makhluk hidup heterotrof' },
        { teks: 'Karena hidup di dalam tanah', benar: false },
        { teks: 'Karena tidak membutuhkan air', benar: false },
      ],
    },
    {
      teks: 'Hubungan antara lebah madu dan bunga mekar merupakan contoh simbiosis...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Lebah mendapat nektar, sedangkan bunga terbantu dalam proses penyerbukan (saling menguntungkan = mutualisme).',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Mutualisme', benar: true },
        { teks: 'Parasitisme', benar: false, labelMiskonsepsi: 'Parasitisme satu untung satu rugi' },
        { teks: 'Komensalisme', benar: false, labelMiskonsepsi: 'Komensalisme satu untung satu tidak terpengaruh' },
        { teks: 'Predasi', benar: false },
      ],
    },
    {
      teks: 'Dalam ekosistem kolam, jentik-jentik nyamuk dimakan oleh ikan kecil. Ikan kecil tersebut termasuk ke dalam kelompok...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Jentik-jentik adalah konsumen I, sehingga ikan kecil yang memakannya adalah konsumen II (karnivora/omnivora).',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Konsumen tingkat II', benar: true },
        { teks: 'Produsen', benar: false, labelMiskonsepsi: 'Ikan tidak dapat membuat makanan sendiri' },
        { teks: 'Pengurai', benar: false },
        { teks: 'Konsumen tingkat I', benar: false },
      ],
    },
    {
      teks: 'Faktor yang TIDAK dibutuhkan secara langsung dalam proses fotosintesis adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Oksigen adalah produk yang dihasilkan, bukan bahan yang dibutuhkan untuk fotosintesis.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Gas oksigen', benar: true },
        { teks: 'Cahaya matahari', benar: false, labelMiskonsepsi: 'Cahaya adalah sumber energi utama' },
        { teks: 'Air (H2O)', benar: false },
        { teks: 'Karbon dioksida (CO2)', benar: false },
      ],
    },
    {
      teks: 'Jika sebuah tanaman diletakkan di dalam ruangan tertutup tanpa cahaya selama berminggu-minggu, daunnya akan menguning dan layu karena...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Tanpa cahaya matahari, klorofil tidak dapat melakukan fotosintesis untuk memproduksi makanan bagi tanaman.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Tidak dapat melakukan fotosintesis untuk membuat makanan', benar: true },
        { teks: 'Kelebihan pasokan oksigen', benar: false },
        { teks: 'Terlalu banyak menyerap air', benar: false },
        { teks: 'Terserang penyakit menular', benar: false },
      ],
    },
    {
      teks: 'Kumpulan dari beberapa rantai makanan yang saling berhubungan dalam suatu ekosistem disebut...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Rantai-rantai makanan yang saling tumpang tindih dan terhubung membentuk jaring-jaring makanan.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Jaring-jaring makanan', benar: true },
        { teks: 'Piramida energi', benar: false },
        { teks: 'Simbiosis ekologi', benar: false },
        { teks: 'Komunitas abiotik', benar: false },
      ],
    },
    {
      teks: 'Berikut ini yang termasuk komponen abiotik dalam suatu ekosistem sawah adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Komponen abiotik adalah benda tak hidup seperti air, tanah, udara, dan cahaya matahari.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Air, tanah, dan cahaya matahari', benar: true },
        { teks: 'Padi, belalang, dan katak', benar: false, labelMiskonsepsi: 'Ini adalah komponen biotik (makhluk hidup)' },
        { teks: 'Cacing tanah dan jamur', benar: false },
        { teks: 'Ikan gabus dan keong mas', benar: false },
      ],
    },
    {
      teks: 'Dampak penebangan hutan secara liar terhadap siklus udara dan fotosintesis bumi adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Pohon menyerap CO2 dan menghasilkan O2. Berkurangnya pohon menyebabkan peningkatan kadar karbon dioksida di atmosfer.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Meningkatnya kadar karbon dioksida (CO2) di atmosfer bumi', benar: true },
        { teks: 'Udara di bumi menjadi semakin bersih dan sejuk', benar: false },
        { teks: 'Kadar gas oksigen akan berlimpah ruah', benar: false },
        { teks: 'Tidak terjadi pengaruh apa-apa', benar: false },
      ],
    },
    {
      teks: 'Bagian tumbuhan yang berfungsi menyerap air dan garam mineral dari dalam tanah adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Akar memiliki rambut-rambut akar yang menyerap air dan nutrisi dari tanah.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Akar', benar: true },
        { teks: 'Batang', benar: false },
        { teks: 'Daun', benar: false },
        { teks: 'Bunga', benar: false },
      ],
    },
    {
      teks: 'Pada ekosistem laut, fitoplankton berperan sebagai produsen karena...',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Fitoplankton memiliki klorofil dan mampu berfotosintesis menggunakan sinar matahari di permukaan laut.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: 'Memiliki klorofil dan mampu berfotosintesis menghasilkan makanan', benar: true },
        { teks: 'Memakan ikan-ikan kecil yang mati', benar: false },
        { teks: 'Berenang bebas di dasar laut yang gelap', benar: false },
        { teks: 'Dapat bernapas tanpa oksigen', benar: false },
      ],
    },
  ];
}

function getSejarahQuestions(context: GenerationContext): GeneratedQuestionDraft[] {
  return [
    {
      teks: 'Naskah Proklamasi Kemerdekaan Indonesia dibacakan pada tanggal...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Proklamasi dibacakan pada hari Jumat, 17 Agustus 1945.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: '17 Agustus 1945', benar: true },
        { teks: '18 Agustus 1945', benar: false, labelMiskonsepsi: '18 Agustus adalah pengesahan UUD 1945' },
        { teks: '16 Agustus 1945', benar: false, labelMiskonsepsi: '16 Agustus adalah peristiwa Rengasdengklok' },
        { teks: '1 Juni 1945', benar: false, labelMiskonsepsi: '1 Juni adalah hari lahir Pancasila' },
      ],
    },
    {
      teks: 'Pembacaan teks Proklamasi Kemerdekaan Republik Indonesia dilakukan oleh...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Ir. Soekarno membacakan naskah proklamasi didampingi oleh Drs. Moh. Hatta.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Ir. Soekarno didampingi Drs. Moh. Hatta', benar: true },
        { teks: 'Sayuti Melik', benar: false, labelMiskonsepsi: 'Sayuti Melik adalah pengetik naskah proklamasi' },
        { teks: 'Laksamana Maeda', benar: false },
        { teks: 'Mr. Soepomo', benar: false },
      ],
    },
    {
      teks: 'Tokoh yang berjasa mengetik naskah Proklamasi Kemerdekaan Indonesia adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Sayuti Melik mengetik teks proklamasi setelah disetujui bersama di rumah Laksamana Maeda.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Sayuti Melik', benar: true },
        { teks: 'Sukarni', benar: false },
        { teks: 'Fatmawati', benar: false, labelMiskonsepsi: 'Fatmawati menjahit bendera merah putih' },
        { teks: 'Latief Hendraningrat', benar: false },
      ],
    },
    {
      teks: 'Bendera Merah Putih pertama yang dikibarkan saat proklamasi dijahit oleh...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Ibu Fatmawati (istri Bung Karno) menjahit bendera pusaka sang merah putih.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Ibu Fatmawati', benar: true },
        { teks: 'Ibu Kartini', benar: false },
        { teks: 'Cut Nyak Dien', benar: false },
        { teks: 'Dewi Sartika', benar: false },
      ],
    },
    {
      teks: 'Peristiwa pengamanan Ir. Soekarno dan Drs. Moh. Hatta oleh para pemuda sebelum proklamasi dikenal dengan peristiwa...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Para pemuda membawa Sukarno-Hatta ke Rengasdengklok pada 16 Agustus 1945 agar terbebas dari pengaruh Jepang.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Peristiwa Rengasdengklok', benar: true },
        { teks: 'Bandung Lautan Api', benar: false },
        { teks: 'Serangan Umum 1 Maret', benar: false },
        { teks: 'Pertempuran Ambarawa', benar: false },
      ],
    },
    {
      teks: 'Tempat berlangsungnya pembacaan teks Proklamasi Kemerdekaan Indonesia adalah di...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Dibacakan di kediaman Bung Karno, Jalan Pegangsaan Timur No. 56 Jakarta.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Jalan Pegangsaan Timur No. 56 Jakarta', benar: true },
        { teks: 'Lapangan Ikada Jakarta', benar: false, labelMiskonsepsi: 'Awalnya direncanakan di Ikada tapi dipindah demi keamanan' },
        { teks: 'Gedung Kesenian Jakarta', benar: false },
        { teks: 'Istana Merdeka', benar: false },
      ],
    },
    {
      teks: 'Salah satu tokoh yang bertugas mengibarkan Bendera Merah Putih pada saat proklamasi adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Latief Hendraningrat dan Suhud Sastro Kusumo bertugas mengibarkan bendera pusaka.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Latief Hendraningrat', benar: true },
        { teks: 'Chairul Saleh', benar: false },
        { teks: 'Achmad Soebardjo', benar: false },
        { teks: 'Moh. Roem', benar: false },
      ],
    },
    {
      teks: 'Naskah Proklamasi dirumuskan di kediaman seorang perwira tinggi Jepang bernama...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Perumusan dilakukan di rumah Laksamana Tadashi Maeda di Jalan Imam Bonjol No. 1.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Laksamana Tadashi Maeda', benar: true },
        { teks: 'Jenderal Terauchi', benar: false },
        { teks: 'Marsekal Kumakichi Harada', benar: false },
        { teks: 'Jenderal Yamashita', benar: false },
      ],
    },
    {
      teks: 'Tujuan utama golongan pemuda membawa Ir. Soekarno dan Moh. Hatta ke Rengasdengklok adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Agar tidak terpengaruh janji kemerdekaan dari pihak militer Jepang dan segera memproklamasikan kemerdekaan.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Menjauhkan mereka dari pengaruh dan tekanan Jepang', benar: true },
        { teks: 'Menyembunyikan mereka dari kejaran tentara Sekutu', benar: false },
        { teks: 'Membentuk pasukan tentara baru di Jawa Barat', benar: false },
        { teks: 'Meminta uang tebusan untuk perjuangan', benar: false },
      ],
    },
    {
      teks: 'Sidang PPKI pada tanggal 18 Agustus 1945 menghasilkan keputusan penting, yaitu...',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'PPKI mengesahkan UUD 1945, memilih Soekarno dan Hatta sebagai Presiden dan Wakil Presiden, serta membentuk KNIP.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: 'Mengesahkan UUD 1945 serta memilih Presiden dan Wakil Presiden', benar: true },
        { teks: 'Membubarkan tentara PETA', benar: false },
        { teks: 'Membentuk Kabinet Parlementer', benar: false },
        { teks: 'Menandatangani Perjanjian Linggarjati', benar: false },
      ],
    },
    {
      teks: 'Makna proklamasi kemerdekaan bagi bangsa Indonesia dalam bidang hukum adalah...',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Hukum kolonial yang menindas digantikan oleh tatanan hukum nasional Indonesia yang merdeka.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: 'Mengganti tata hukum kolonial menjadi tata hukum nasional Indonesia', benar: true },
        { teks: 'Menutup semua pengadilan di tanah air', benar: false },
        { teks: 'Mengadopsi seluruh undang-undang negara penjajah', benar: false },
        { teks: 'Menghapuskan segala aturan tertulis', benar: false },
      ],
    },
    {
      teks: 'Berita kekalahan Jepang dari Sekutu pada Perang Pasifik pertama kali diketahui para pemuda Indonesia melalui...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Sutan Sjahrir dan para pemuda mendengar siaran radio luar negeri (BBC/Allies) yang luput dari sensor Jepang.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Siaran radio luar negeri yang disadap secara sembunyi-sembunyi', benar: true },
        { teks: 'Surat kabar resmi pemerintah Jepang', benar: false },
        { teks: 'Pemberitahuan resmi dari kaisar Jepang', benar: false },
        { teks: 'Telegram yang dikirimkan oleh Sekutu', benar: false },
      ],
    },
    {
      teks: 'Kota di Jepang yang dijatuhi bom atom oleh Sekutu pada bulan Agustus 1945 adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Hiroshima (6 Agustus 1945) dan Nagasaki (9 Agustus 1945) dijatuhi bom atom.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Hiroshima dan Nagasaki', benar: true },
        { teks: 'Tokyo dan Kyoto', benar: false },
        { teks: 'Osaka dan Yokohama', benar: false },
        { teks: 'Sapporo dan Fukuoka', benar: false },
      ],
    },
    {
      teks: 'Tokoh dari golongan tua yang menjadi penengah antara golongan muda dan Soekarno-Hatta di Rengasdengklok adalah...',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Mr. Achmad Soebardjo menjemput Bung Karno dan Bung Hatta dengan jaminan proklamasi dilakukan keesokan harinya.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: 'Mr. Achmad Soebardjo', benar: true },
        { teks: 'Ki Hajar Dewantara', benar: false },
        { teks: 'Dr. Radjiman Wedyodiningrat', benar: false },
        { teks: 'Sutan Sjahrir', benar: false },
      ],
    },
    {
      teks: 'Lagu kebangsaan Indonesia Raya pertama kali dikumandangkan secara resmi pada peristiwa...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Lagu ciptaan W.R. Supratman ini pertama kali diperdengarkan pada Kongres Pemuda II (28 Oktober 1928).',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Kongres Pemuda II tanggal 28 Oktober 1928', benar: true },
        { teks: 'Pembacaan Proklamasi 17 Agustus 1945', benar: false, labelMiskonsepsi: 'Saat proklamasi dinyanyikan kembali bersama pengibaran bendera' },
        { teks: 'Sidang Pertama BPUPKI', benar: false },
        { teks: 'Pendirian Budi Utomo tahun 1908', benar: false },
      ],
    },
    {
      teks: 'Penyebaran berita proklamasi ke seluruh penjuru Nusantara dan dunia dilakukan melalui...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Berita disebarkan lewat pemancar radio Domei (sekarang RRI), pamflet, coretan gerbong kereta api, dan kurir pos.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Pemancar radio Domei, pamflet, dan kurir surat kabar', benar: true },
        { teks: 'Televisi nasional pemerintah', benar: false, labelMiskonsepsi: 'Televisi belum ada di Indonesia tahun 1945' },
        { teks: 'Pengumuman resmi tentara Jepang', benar: false },
        { teks: 'Surat kawat militer Belanda', benar: false },
      ],
    },
    {
      teks: 'Usulan agar naskah proklamasi ditandatangani atas nama bangsa Indonesia oleh Soekarno-Hatta dicetuskan oleh...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Sukarni mengusulkan agar naskah tidak perlu ditandatangani semua yang hadir, cukup Sukarno-Hatta atas nama bangsa Indonesia.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Sukarni', benar: true },
        { teks: 'Sayuti Melik', benar: false },
        { teks: 'Wikana', benar: false },
        { teks: 'BM Diah', benar: false },
      ],
    },
    {
      teks: 'Sikap kita sebagai generasi penerus bangsa dalam mengisi kemerdekaan yang telah diperjuangkan para pahlawan adalah...',
      kesulitan: 'MUDAH',
      subtopik: context.topik,
      pembahasan: 'Generasi muda mengisi kemerdekaan dengan giat belajar, berprestasi, menjaga persatuan, dan mencintai tanah air.',
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: 'Belajar dengan tekun, berprestasi, dan menjaga persatuan bangsa', benar: true },
        { teks: 'Mengasingkan diri dari pergaulan dunia luar', benar: false },
        { teks: 'Mengabaikan kebudayaan dan nilai luhur bangsa sendiri', benar: false },
        { teks: 'Membiarkan konflik dan perpecahan antardaerah', benar: false },
      ],
    },
    {
      teks: 'Kalimat pertama teks proklamasi "Kami bangsa Indonesia dengan ini menjataken kemerdekaan Indonesia" merupakan gagasan dari...',
      kesulitan: 'SULIT',
      subtopik: context.topik,
      pembahasan: 'Kalimat pertama merupakan usul dari Mr. Achmad Soebardjo, sedangkan kalimat kedua dari Moh. Hatta.',
      waktuDetik: 30,
      pilihanJawaban: [
        { teks: 'Mr. Achmad Soebardjo', benar: true },
        { teks: 'Drs. Moh. Hatta', benar: false, labelMiskonsepsi: 'Bung Hatta menyumbangkan kalimat kedua tentang pemindahan kekuasaan' },
        { teks: 'Sayuti Melik', benar: false },
        { teks: 'Sukarni', benar: false },
      ],
    },
    {
      teks: 'Makna paling utama dari Proklamasi Kemerdekaan bagi kedaulatan bangsa Indonesia adalah...',
      kesulitan: 'SEDANG',
      subtopik: context.topik,
      pembahasan: 'Proklamasi menandai lahirnya negara kesatuan RI yang merdeka, berdaulat, dan sejajar dengan bangsa-bangsa lain di dunia.',
      waktuDetik: 25,
      pilihanJawaban: [
        { teks: 'Indonesia telah merdeka, berdaulat, dan bebas menentukan nasib bangsanya sendiri', benar: true },
        { teks: 'Berakhirnya seluruh tantangan dan perjuangan bangsa Indonesia', benar: false },
        { teks: 'Indonesia menjadi negara yang terisolasi dari pergaulan internasional', benar: false },
        { teks: 'Bangsa Indonesia berhak menguasai wilayah negara tetangga', benar: false },
      ],
    },
  ];
}

/**
 * Generator Prosedural untuk menghasilkan 20 butir soal kontekstual dan orisinal
 * untuk topik apapun yang dimasukkan guru jika tidak termasuk topik khusus di atas.
 */
function getGenericContextualQuestions(context: GenerationContext, count: number): GeneratedQuestionDraft[] {
  const t = context.topik.trim();
  const m = context.mapel || 'Pelajaran';
  const j = context.jenjang || 'Sekolah';

  const templates = [
    {
      teks: `Manakah di bawah ini yang merupakan pengertian atau konsep paling tepat dari materi ${t}?`,
      kesulitan: 'MUDAH' as const,
      benar: `Konsep inti yang menjelaskan prinsip utama dan karakteristik dari ${t}`,
      salah1: `Pengertian parsial yang hanya melihat sebagian kecil dari ${t}`,
      miskon1: `Hanya memahami satu aspek tanpa melihat definisi utuh`,
      salah2: `Konsep yang sering tertukar dengan materi lain dalam ${m}`,
      miskon2: `Tertukar dengan konsep materi yang mirip tapi berbeda tujuan`,
      salah3: `Definisi umum yang tidak berkaitan langsung dengan ${t}`,
      pembahasan: `Pengertian ${t} mencakup prinsip dasar dan penerapan konsep sesuai kurikulum ${j}.`,
    },
    {
      teks: `Berikut ini yang merupakan contoh penerapan ${t} dalam kehidupan sehari-hari siswa adalah...`,
      kesulitan: 'MUDAH' as const,
      benar: `Aktivitas nyata di lingkungan sekitar yang mencerminkan fungsi ${t}`,
      salah1: `Tindakan yang keliru dan bertentangan dengan kaidah ${t}`,
      miskon1: `Mengira semua aktivitas serupa otomatis merupakan penerapan ${t}`,
      salah2: `Kegiatan laboratorium yang hanya berlaku pada kondisi teoritis tertutup`,
      miskon2: `Belum mampu mengaitkan konsep ke lingkungan kehidupan sehari-hari`,
      salah3: `Aktivitas acak tanpa korelasi langsung`,
      pembahasan: `Penerapan ${t} dapat ditemukan dalam aktivitas nyata siswa di rumah maupun di sekolah.`,
    },
    {
      teks: `Faktor utama yang paling mempengaruhi keberhasilan atau proses berlangsungnya ${t} adalah...`,
      kesulitan: 'SEDANG' as const,
      benar: `Keseimbangan faktor internal dan kondisi pendukung lingkungan pada ${t}`,
      salah1: `Hanya bergantung pada satu variabel luar tanpa memperhatikan kondisi utama`,
      miskon1: `Mengabaikan faktor primer dan hanya fokus pada variabel sampingan`,
      salah2: `Faktor eksternal yang sebenarnya tidak berhubungan`,
      miskon2: `Asumsi keliru tentang hubungan sebab akibat`,
      salah3: `Keberuntungan semata tanpa proses yang terukur`,
      pembahasan: `Proses ${t} dipengaruhi oleh faktor internal dan dukungan lingkungan yang saling melengkapi.`,
    },
    {
      teks: `Perhatikan pernyataan berikut: Jika terjadi hambatan pada salah satu elemen ${t}, maka dampak langsung yang timbul adalah...`,
      kesulitan: 'SEDANG' as const,
      benar: `Fungsi utama dari ${t} tidak dapat berjalan secara optimal dan terganggu`,
      salah1: `Tidak ada pengaruh sama sekali karena elemen tersebut terpisah mandiri`,
      miskon1: `Menganggap setiap komponen ${t} berdiri sendiri tanpa keterikatan`,
      salah2: `Sistem langsung berhenti total secara permanen tanpa alternatif`,
      miskon2: `Kesimpulan berlebihan tanpa meninjau daya adaptasi sistem`,
      salah3: `Hasil akhir justru meningkat berkali-kali lipat`,
      pembahasan: `Keterpaduan elemen dalam ${t} membuat gangguan pada satu bagian mempengaruhi output keseluruhan.`,
    },
    {
      teks: `Di bawah ini langkah awal yang paling tepat saat kita ingin mempelajari atau menganalisis ${t} adalah...`,
      kesulitan: 'MUDAH' as const,
      benar: `Memahami tujuan dasar, mengenali data awal, dan mengamati pola pada ${t}`,
      salah1: `Langsung mengambil kesimpulan akhir tanpa observasi data`,
      miskon1: `Melompati langkah analisis dan mengandalkan dugaan spekulatif`,
      salah2: `Menghafal rumus atau istilah tanpa memahami esensi makna`,
      miskon2: `Miskonsepsi pembelajaran hafalan mekanis`,
      salah3: `Mengabaikan instruksi dan panduan yang berlaku`,
      pembahasan: `Analisis ${t} yang terstruktur dimulai dari pengamatan dasar sebelum melangkah ke analisis lanjutan.`,
    },
    {
      teks: `Manakah pasangan karakteristik yang BENAR dan saling melengkapi mengenai ${t}?`,
      kesulitan: 'SEDANG' as const,
      benar: `Memiliki fungsi yang jelas dan dapat diuji secara objektif sesuai kaidah ${m}`,
      salah1: `Sifatnya selalu berubah secara acak tanpa aturan yang pasti`,
      miskon1: `Mengira konsep ${t} bersifat subjektif dan tidak berpola`,
      salah2: `Hanya berlaku di satu lokasi spesifik dan tidak dapat digeneralisasi`,
      miskon2: `Membatasi cakupan konsep pada lingkup yang terlalu sempit`,
      salah3: `Bertentangan dengan prinsip sains dan penalaran logis`,
      pembahasan: `Karakteristik ${t} memiliki keteraturan dan fungsi objektif yang dapat dibuktikan.`,
    },
    {
      teks: `Siswa sering kali mengalami kekeliruan saat memahami ${t}. Miskonsepsi yang paling sering terjadi adalah...`,
      kesulitan: 'SEDANG' as const,
      benar: `Menganggap bahwa ${t} memiliki aturan yang sama persis dengan konsep lain tanpa melihat perbedaannya`,
      salah1: `Meneliti kembali setiap bukti konsep yang ada`,
      miskon1: `Bukan miskonsepsi, melainkan langkah verifikasi yang benar`,
      salah2: `Membaca materi dari sumber referensi resmi`,
      miskon2: `Bukan kekeliruan konsep`,
      salah3: `Membuat ringkasan poin-poin penting`,
      pembahasan: `Miskonsepsi umum terjadi saat siswa menganalogikan ${t} secara serampangan ke konsep lain.`,
    },
    {
      teks: `Dalam konteks kurikulum ${j}, manfaat terpenting bagi siswa setelah menguasai materi ${t} adalah...`,
      kesulitan: 'MUDAH' as const,
      benar: `Mampu bernalar kritis dan menyelesaikan masalah nyata yang berhubungan dengan ${t}`,
      salah1: `Hanya sekadar mendapatkan nilai ujian tanpa pemahaman fungsional`,
      miskon1: `Orientasi nilai angka semata tanpa kompetensi bermakna`,
      salah2: `Dapat menghafal seluruh istilah asing tanpa mengerti artinya`,
      miskon2: `Mengira penguasaan materi diukur dari jumlah hafalan kata`,
      salah3: `Tidak memberikan manfaat apa pun dalam kehidupan`,
      pembahasan: `Kurikulum Merdeka mengutamakan kemampuan bernalar kritis dan memecahkan persoalan dunia nyata.`,
    },
    {
      teks: `Budi melakukan percobaan sederhana mengenai ${t}. Jika hasil percobaannya berbeda dari teori, sikap ilmiah yang seharusnya diambil Budi adalah...`,
      kesulitan: 'SEDANG' as const,
      benar: `Memeriksa kembali prosedur, mengulangi pengukuran, dan mencatat data secara jujur`,
      salah1: `Mengubah data hasil percobaan agar terlihat sama dengan buku`,
      miskon1: `Manipulasi data demi hasil yang sesuai ekspektasi`,
      salah2: `Langsung membuang alat dan menyerah seketika`,
      miskon2: `Kurang ketekunan ilmiah`,
      salah3: `Menyalahkan orang lain tanpa mengevaluasi langkah kerja`,
      pembahasan: `Sikap ilmiah mengutamakan kejujuran data dan evaluasi prosedur secara berkala.`,
    },
    {
      teks: `Perhatikan bagan atau alur pada ${t}. Bagian yang bertindak sebagai pengendali utama adalah...`,
      kesulitan: 'SULIT' as const,
      benar: `Elemen pusat yang mengatur interaksi dan aliran proses dalam ${t}`,
      salah1: `Komponen sekunder yang hanya menerima perintah`,
      miskon1: `Tertukar antara input, pengendali, dan output sistem`,
      salah2: `Faktor luar yang hanya sesekali muncul`,
      miskon2: `Menempatkan pemicu eksternal sebagai pengendali inti`,
      salah3: `Elemen limbah hasil sampingan`,
      pembahasan: `Elemen pusat bertanggung jawab mengorkestrasi keteraturan seluruh siklus ${t}.`,
    },
    {
      teks: `Jika kita membandingkan antara konsep ${t} zaman dahulu dan masa kini, perkembangan paling signifikan terlihat pada...`,
      kesulitan: 'SEDANG' as const,
      benar: `Efisiensi metode, akurasi pemahaman, serta pemanfaatan teknologi pendukung`,
      salah1: `Prinsip dasarnya berubah 180 derajat menjadi tidak masuk akal`,
      miskon1: `Mengira hukum alam dan prinsip dasar dapat terhapus sepenuhnya`,
      salah2: `Masa kini justru mengalami kemunduran tanpa penjelasan logis`,
      miskon2: `Pesimisme historis yang tidak berdasar fakta`,
      salah3: `Sama sekali tidak mengalami perubahan sejak ribuan tahun lalu`,
      pembahasan: `Perkembangan ${t} terus disempurnakan oleh temuan riset dan teknologi modern.`,
    },
    {
      teks: `Apa yang akan terjadi jika prinsip ${t} diabaikan dalam suatu kegiatan rancang bangun atau penyelesaian soal?`,
      kesulitan: 'SEDANG' as const,
      benar: `Terjadi galat (error), hasil tidak akurat, dan berpotensi gagal mencapai tujuan`,
      salah1: `Hasilnya akan tetap sempurna tanpa kendala apa pun`,
      miskon1: `Meremehkan pentingnya prinsip kaidah ilmiah`,
      salah2: `Pekerjaan menjadi lebih cepat selesai dengan kualitas lebih tinggi`,
      miskon2: `Ilusi jalan pintas yang mengorbankan keselamatan atau akurasi`,
      salah3: `Semua orang akan merasa diuntungkan`,
      pembahasan: `Mengabaikan kaidah ${t} akan menimbulkan kesalahan sistemik pada hasil akhir.`,
    },
    {
      teks: `Manakah pernyataan yang paling tepat untuk mendeskripsikan hubungan sebab-akibat dalam materi ${t}?`,
      kesulitan: 'SULIT' as const,
      benar: `Perubahan pada variabel masukan akan memicu reaksi terukur pada luaran ${t}`,
      salah1: `Sebab dan akibat selalu terjadi secara bersamaan tanpa urutan waktu`,
      miskon1: `Kekeliruan memahami kausalitas dan kronologi proses`,
      salah2: `Akibat terjadi terlebih dahulu sebelum ada penyebab apa pun`,
      miskon2: `Pembalikkan logika sebab-akibat`,
      salah3: `Tidak ada hubungan sebab-akibat dalam konsep ${t}`,
      pembahasan: `Hubungan sebab akibat pada ${t} bersifat konsisten dan dapat diprediksi secara logis.`,
    },
    {
      teks: `Suatu kasus menunjukkan bahwa fenomena ${t} dapat diamati dengan jelas pada kondisi...`,
      kesulitan: 'MUDAH' as const,
      benar: `Saat parameter pengujian disiapkan secara terkontrol dan stabil`,
      salah1: `Saat lingkungan pengamatan penuh dengan gangguan liar yang tak teratur`,
      miskon1: `Mengira pengamatan valid dapat dilakukan dalam kondisi kacau tanpa kontrol`,
      salah2: `Hanya saat tidak ada alat ukur yang digunakan`,
      miskon2: `Penolakan terhadap fungsi alat ukur objektif`,
      salah3: `Saat tidak ada orang yang melihat`,
      pembahasan: `Pengamatan yang valid membutuhkan kondisi yang terukur dan terkontrol dengan baik.`,
    },
    {
      teks: `Mengapa penting bagi siswa untuk melakukan refleksi setelah menyelesaikan latihan tentang ${t}?`,
      kesulitan: 'MUDAH' as const,
      benar: `Untuk mengidentifikasi letak kesalahan berpikir dan memperkuat pemahaman konsep`,
      salah1: `Hanya untuk menghabiskan sisa waktu jam pelajaran di kelas`,
      miskon1: `Menganggap refleksi sebagai kegiatan pasif tanpa manfaat belajar`,
      salah2: `Agar guru tidak memberikan tugas latihan tambahan`,
      miskon2: `Motivasi belajar yang keliru`,
      salah3: `Tidak ada alasan penting untuk refleksi`,
      pembahasan: `Refleksi metakognitif membantu siswa menyadari miskonsepsi dan memperkokoh pemahaman.`,
    },
    {
      teks: `Di antara pilihan berikut, instrumen atau alat bantu yang paling efektif untuk mempelajari ${t} secara visual adalah...`,
      kesulitan: 'SEDANG' as const,
      benar: `Diagram alur, model peraga, atau simulasi interaktif mengenai ${t}`,
      salah1: `Teks panjang tanpa gambar atau visualisasi konsep`,
      miskon1: `Kurang optimal dalam mendukung gaya belajar visual spasial`,
      salah2: `Hanya mengandalkan tebakan lisan tanpa catatan terstruktur`,
      miskon2: `Ketidaklengkapan media visual`,
      salah3: `Daftar nomor acak`,
      pembahasan: `Media visual seperti diagram atau simulasi sangat membantu memperjelas konsep abstrak pada ${t}.`,
    },
    {
      teks: `Ketika diberikan dua data yang berbeda mengenai ${t}, langkah analisis perbandingan yang tepat adalah...`,
      kesulitan: 'SULIT' as const,
      benar: `Mencari persamaan konsep, mengidentifikasi perbedaan spesifik, dan menarik benang merah`,
      salah1: `Memilih salah satu data secara acak dan membuang data lainnya`,
      miskon1: `Bias konfirmasi dan pengabaian data pembanding`,
      salah2: `Menganggap kedua data pasti salah tanpa memeriksa sumbernya`,
      miskon2: `Skeptisisme berlebihan yang tidak konstruktif`,
      salah3: `Menjumlahkan angka tanpa memahami konteks satuan`,
      pembahasan: `Analisis perbandingan komparatif menguji variabel persamaan dan variabel pembeda secara saksama.`,
    },
    {
      teks: `Nilai profil pelajar Pancasila yang paling erat kaitannya saat siswa berdiskusi memecahkan persoalan ${t} adalah...`,
      kesulitan: 'MUDAH' as const,
      benar: `Bergotong royong, bernalar kritis, dan mandiri`,
      salah1: `Individualisme mementingkan diri sendiri`,
      miskon1: `Bertentangan dengan nilai kolaborasi dan gotong royong`,
      salah2: `Menyerahkan semua beban kerja pada satu orang teman`,
      miskon2: `Perilaku pasif dalam kerja kelompok`,
      salah3: `Menolak mendengarkan masukan anggota kelompok lain`,
      pembahasan: `Pembelajaran bermakna menumbuhkan kolaborasi gotong royong dan ketajaman nalar kritis.`,
    },
    {
      teks: `Kesimpulan paling komprehensif mengenai peranan ${t} dalam ruang lingkup mata pelajaran ${m} adalah...`,
      kesulitan: 'SEDANG' as const,
      benar: `Fondasi esensial yang menjadi jembatan menuju pemahaman materi lanjutan yang lebih kompleks`,
      salah1: `Materi selingan yang tidak ada kaitannya dengan topik bab berikutnya`,
      miskon1: `Mengabaikan sifat berkesinambungan kurikulum spiral`,
      salah2: `Topik yang berdiri terisolasi dan tidak perlu diingat kembali`,
      miskon2: `Miskonsepsi pembelajaran diskrit terkotak-kotak`,
      salah3: `Materi yang tidak berguna di masa depan`,
      pembahasan: `Materi ${t} dirancang sebagai fondasi berjenjang yang menopang pemahaman konsep tingkat berikutnya.`,
    },
    {
      teks: `Manakah pernyataan akhir di bawah ini yang paling TEPAT dan terverifikasi mengenai ${t}?`,
      kesulitan: 'SEDANG' as const,
      benar: `Pemahaman konsep yang matang pada ${t} meningkatkan kemampuan pemecahan masalah siswa secara signifikan`,
      salah1: `Hafalan cepat tanpa konsep menghasilkan pemahaman yang bertahan lama`,
      miskon1: `Miskonsepsi bahwa hafalan instan sama nilainya dengan pemahaman mendalam`,
      salah2: `Semua soal tentang ${t} selalu memiliki jawaban yang tidak pasti`,
      miskon2: `Relativisme berlebihan pada kaidah sains pasti`,
      salah3: `Topik ini hanya diperuntukkan bagi kalangan akademisi tertentu`,
      pembahasan: `Konsep ${t} terbukti memperkuat keterampilan berpikir kritis dan logika pemecahan masalah siswa.`,
    },
  ];

  const pool: GeneratedQuestionDraft[] = [];
  for (let i = 0; i < count; i++) {
    const item = templates[i % templates.length];
    pool.push({
      teks: item.teks,
      kesulitan: item.kesulitan,
      subtopik: context.topik,
      pembahasan: item.pembahasan,
      waktuDetik: 20,
      pilihanJawaban: [
        { teks: item.benar, benar: true },
        { teks: item.salah1, benar: false, labelMiskonsepsi: item.miskon1 },
        { teks: item.salah2, benar: false, labelMiskonsepsi: item.miskon2 },
        { teks: item.salah3, benar: false },
      ],
    });
  }

  return pool;
}

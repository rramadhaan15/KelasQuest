/**
 * Formula: Locks initial monster HP upon lobby conclusion (`Mulai Pertarungan`)
 * calculated from: `jumlah_siswa_aktif * total_soal_paket * target_akurasi * rata_rata_damage_per_jawaban` (ADR 0004 & spec).
 */
export function calculateMonsterHp(
  jumlahSiswa: number,
  totalSoal: number,
  targetAkurasi: number = 0.7,
  baseDamage: number = 100
): number {
  if (jumlahSiswa <= 0 || totalSoal <= 0) return 0;
  return Math.round(jumlahSiswa * totalSoal * targetAkurasi * baseDamage);
}

/**
 * Formula: Damage Compensation Multiplier
 * If active students disconnect during battle, active students deal proportionally higher damage
 * so the monster remains beatable despite disconnects (ADR 0004 & spec).
 */
export function calculateDamageCompensationMultiplier(
  initialActiveCount: number,
  currentActiveCount: number
): number {
  if (initialActiveCount <= 0 || currentActiveCount <= 0) {
    return 1.0;
  }
  if (currentActiveCount >= initialActiveCount) {
    return 1.0;
  }
  return initialActiveCount / currentActiveCount;
}

/**
 * Calculates total session duration proportionally from question timers.
 */
export function calculateTotalDuration(
  questions: Array<{ waktuDetik: number }>
): number {
  return questions.reduce((sum, q) => sum + (q.waktuDetik || 20), 0);
}

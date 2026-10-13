export interface TeacherQuota {
  totalDailyQuota: number;
  usedQuota: number;
  remainingQuota: number;
  resetsAt: string;
}

export class QuotaManager {
  private quotaMap: Map<string, { used: number; resetDate: string }> = new Map();

  constructor(private defaultDailyLimit: number = 200) {}

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getTomorrowMidnightISO(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  async getQuota(guruId: string): Promise<TeacherQuota> {
    const today = this.getTodayDateString();
    let record = this.quotaMap.get(guruId);

    if (!record || record.resetDate !== today) {
      record = { used: 0, resetDate: today };
      this.quotaMap.set(guruId, record);
    }

    const remaining = Math.max(0, this.defaultDailyLimit - record.used);

    return {
      totalDailyQuota: this.defaultDailyLimit,
      usedQuota: record.used,
      remainingQuota: remaining,
      resetsAt: this.getTomorrowMidnightISO(),
    };
  }

  async consumeQuota(guruId: string, count: number = 1): Promise<void> {
    const today = this.getTodayDateString();
    let record = this.quotaMap.get(guruId);

    if (!record || record.resetDate !== today) {
      record = { used: 0, resetDate: today };
      this.quotaMap.set(guruId, record);
    }

    if (record.used + count > this.defaultDailyLimit) {
      throw new Error(
        `Kuota harian pembuatan soal telah habis (${record.used}/${this.defaultDailyLimit}). Silakan gunakan editor manual atau tunggu reset esok hari.`
      );
    }

    record.used += count;
  }
}

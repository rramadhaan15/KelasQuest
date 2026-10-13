---
title: Spesifikasi Teknis Studio Soal KelasQuest
status: ready-for-agent
triage-label: ready-for-agent
version: 1.0.0
created-at: 2026-10-13
---

# Spesifikasi: Studio Soal KelasQuest

## Problem Statement

Guru SD, SMP, dan SMA di Indonesia menghabiskan waktu 1 hingga 2 jam untuk menyusun paket soal asesmen formatif yang kontekstual dan sesuai dengan Capaian Pembelajaran Kurikulum Merdeka. Ketika membuat soal secara manual, pilihan jawaban pengecoh sering kali terlalu mudah ditebak dan gagal mengidentifikasi miskonsepsi nyata siswa. Sementara itu, alat bantu kecerdasan buatan umum tidak memahami struktur kurikulum nasional, menghasilkan kunci jawaban yang kerap keliru tanpa mekanisme verifikasi, dan tidak siap dimainkan secara langsung di dalam kelas. Selain itu, banyak guru mengajar menggunakan ponsel pintar dengan koneksi internet seluler yang tidak stabil di sekolah, sehingga rentan kehilangan data pekerjaan ketika koneksi terputus.

## Solution

Studio Soal menyediakan ruang kerja terintegrasi bagi guru untuk menghasilkan paket soal pilihan ganda berkualitas tinggi siap main dalam waktu kurang dari 3 menit. Sistem memanfaatkan kecerdasan buatan terarah yang menghasilkan butir soal lengkap dengan pembahasan dan label miskonsepsi pada setiap pilihan jawaban salah. Guru memegang kendali penuh untuk meninjau, menyunting, menambah butir soal manual, atau meregenerasi butir soal individual sebelum diluncurkan ke sesi permainan kooperatif kelas (Boss Battle). Arsitektur dirancang responsif dan tangguh untuk gawai seluler berdaya rendah, mendukung penyimpanan inkremental luring, verifikasi komputasi deterministik untuk soal numerik, serta pembekuan salinan statis (*snapshot*) saat sesi permainan dimulai guna menjaga integritas data evaluasi.

## User Stories

1. As a teacher, I want to create a new Paket Soal by inputting a lesson topic, education level, and subject, so that I can generate tailored questions aligned with the curriculum in seconds.
2. As a teacher, I want to select curated Capaian Pembelajaran (CP) from an internal database, so that the generated questions strictly align with official national learning standards.
3. As a teacher, I want default sensible configuration values (20 questions, 30% easy / 50% medium / 20% hard, 20 seconds per question), so that I can generate a complete game set without tedious manual configuration.
4. As a teacher, I want the AI generation process to stream questions incrementally and display the first question within 5 seconds, so that I can immediately start reviewing without waiting for the full set.
5. As a teacher with unstable mobile internet, I want each generated question to be saved atomically to the server database immediately upon validation, so that I do not lose finished questions if my network disconnects midway.
6. As a teacher, I want mathematical calculations in generated questions to be pre-verified by a deterministic code evaluator, so that numerical questions and answer keys are guaranteed 100% accurate without AI hallucinations.
7. As a teacher, I want each incorrect answer option to have an explanatory Label Miskonsepsi, so that I can diagnose the specific conceptual mistakes my students make.
8. As a teacher, I want mathematical notation in MVP to render cleanly using standard Unicode typography on entry-level mobile devices, so that questions load instantly without layout shift or heavy library overhead.
9. As a teacher, I want to review each question with explicit review statuses (Belum Ditinjau, Disetujui, Diedit), so that I can maintain quality control over every item in the set.
10. As a teacher, I want a single-click "Setujui Semua" action for all structurally valid questions, so that I can rapidly approve good sets when preparing right before class starts.
11. As a teacher, I want to regenerate an individual question using quick suggestion chips (Lebih Mudah, Lebih Sulit, Ganti Konteks, Persingkat), so that I can refine specific questions without redoing the entire set.
12. As a teacher, I want to manually create or edit multiple-choice questions with 2 to 5 options, so that I can blend my own proprietary questions into the AI-generated set.
13. As a teacher, I want to paste raw text from Word or WhatsApp and have the system parse it into structured question cards, so that I can quickly digitize existing question banks.
14. As a teacher, I want my drafts to be automatically saved locally in IndexedDB when offline, so that I can continue composing questions without fear of data loss during network outages.
15. As a teacher working offline, I want conflict resolution to operate on the individual Butir Soal level using Last-Write-Wins timestamps, so that offline edits on one question do not overwrite newly generated or edited questions on the server.
16. As a teacher, I want the system to enforce structural validation (one valid question text, exactly one correct option) as a hard requirement for the "Siap Main" package status, so that broken questions cannot be deployed to students.
17. As a teacher in a hurry, I want unreviewed questions to trigger only a confirmation dialog ("soft warning") rather than blocking game launch, so that I can preserve the product promise of starting a game in under 3 minutes.
18. As a teacher, I want to preview the game experience in a "Main sebagai Siswa" mode, so that I can verify timer pacing and mobile layout before running it with live students.
19. As a teacher, I want my daily AI generation quota to be deducted proportionally per validated question rather than per full package, so that canceling midway does not unfairly consume my daily allowance.
20. As a teacher, I want to see my remaining daily question quota and reset schedule in the creation interface, so that I can manage my usage transparently.
21. As a teacher, I want to launch a Boss Battle session that freezes a static Snapshot Sesi of all questions, so that subsequent edits to my draft do not alter active games or historical analytics.
22. As a teacher, I want Boss Battle to play all questions contained in the package while dynamically scaling Monster HP and duration to the question count, so that every student is assessed across all intended learning items.
23. As a teacher, I want the Monster HP to be locked only when I click "Mulai Pertarungan" in the classroom lobby, so that the monster's health accurately reflects the actual number of attending students.
24. As a teacher running a live session, I want automatic damage compensation for active students if peers disconnect, so that the monster remains beatable despite device battery or connection failures.
25. As a teacher running a live Boss Battle, I want an emergency "Anulir Soal" (Void / Bonus Damage) action on my control console, so that I can skip a flawed question and award full damage to all students without losing classroom momentum.
26. As a teacher reviewing past performance, I want post-game accuracy and most-frequent misconception choices to roll up asynchronously into the master Paket Soal, so that questions with poor classroom accuracy (<30%) are automatically flagged for review.
27. As a teacher, I want optimistic concurrency protection with a multi-tab warning if I open the same package in two browser tabs, so that I do not accidentally overwrite my own edits.
28. As a teacher, I want uploaded source documents (PDFs, book photos) to be purged after 30 days while preserving extracted textual citations on question cards, so that student and school data privacy is safeguarded while retaining academic references.
29. As a teacher, I want to export questions, answer sheets, and explanations to printable PDF and Word documents (P1), so that I can administer paper-based evaluations in classrooms without sufficient mobile devices.
30. As a teacher in a future release, I want to publish my vetted question sets to a Community Question Bank with post-moderation flagging, so that I can share pedagogical resources with fellow educators nationwide.

## Implementation Decisions

### Architectural Seams and Modules

1. **Primary Test Seam (Application Service Facade)**: All business logic, lifecycle rules, generation pipelines, and game launch orchestration are exposed through a single high-level application interface: `StudioSoalService`. Callers (HTTP API routes, server actions, background workers) interact solely with this interface.
2. **AI Generation Pipeline Module**: Encapsulates prompt construction with Kurikulum Merdeka context, streaming chunk parsing, deterministic math validation, misconception extractor, and atomic database persistence per item. It depends on an abstract `AIProvider` adapter, allowing the system to swap live model endpoints with in-memory deterministic fakes during testing.
3. **Deterministic Math Evaluator Adapter**: An isolated arithmetic calculation evaluator executed in the backend worker. For questions containing numeric equations, it evaluates mathematical truth deterministically before invoking any linguistic critique models, enforcing 100% computational accuracy while optimizing token consumption.
4. **Offline Persistence & Sync Module**: Implements local caching via browser IndexedDB with an event queue. Synchronization employs Last-Write-Wins (LWW) at the granular `ButirSoal` entity level, comparing ISO-8601 modification timestamps (`diperbarui_pada`) and maintaining a 10-revision audit trail on the server.
5. **Session Launch & Snapshotting Module**: Handles `launchSession`. It clones the package's questions into immutable `SnapshotSesi` rows, generates a unique 6-character classroom pin, and initiates the game lobby state.
6. **Classroom Lobby & Monster Scaling Engine**: Locks the initial monster HP upon lobby conclusion (`Mulai Pertarungan`) calculated from the formula: `jumlah_siswa_aktif * total_soal_paket * target_akurasi * rata_rata_damage_per_jawaban`. Monitored connection heartbeats dynamically calculate damage compensation multipliers during active play.
7. **Post-Game Async Analytics Rollup**: Background queue worker consuming game completion events. Aggregates class accuracy and misconception distribution into `StatistikButirSoal` linked to the original question ID, applying visual flags for items with accuracy under 30%.
8. **Curriculum Reference Data Store**: Pre-seeded static database containing national BSKAP Kurikulum Merdeka schemas (phases A through F, subjects, elements, and learning competencies), queried locally with response times under 50 ms.
9. **Media Lifecycle & Privacy Daemon**: Scheduled background job that purges raw binary attachments (PDF, DOCX, images) from object storage 30 days after upload, leaving textual context excerpts on the question entity.

### Domain Interfaces and Contracts

The primary module exposes the following behavioral contracts at the seam:

- **Create Set**: `createSet(teacherId: string, input: CreateSetInput): Promise<PaketSoal>`
- **Stream Generation**: `streamGenerateQuestions(setId: string, params: GenerateParams, onQuestionPersisted: (q: ButirSoal) => void): Promise<GenerateSummary>`
- **Review Question**: `reviewQuestion(questionId: string, action: 'approve' | 'edit' | 'regenerate' | 'delete', payload?: Partial<ButirSoal>): Promise<ButirSoal>`
- **Validate Set Readiness**: `validateSetReadiness(setId: string): Promise<{ isReady: boolean; hasUnreviewed: boolean; invalidQuestions: string[] }>`
- **Launch Session**: `launchSession(setId: string, lobbyConfig: LobbyConfig): Promise<SnapshotSesi>`
- **Conclude Session & Aggregate**: `concludeSession(sessionId: string, responses: StudentResponseRecord[]): Promise<void>`
- **Emergency Void Question**: `voidQuestion(sessionId: string, questionId: string): Promise<VoidResult>`

### Canonical State Machines

- **Status Kesiapan Paket State Machine**:
  - `DRAF` -> Becomes `SIAP_MAIN` when 100% of questions pass structural validation (non-empty prompt, 2-5 options, exactly 1 marked correct).
  - `SIAP_MAIN` -> Transitions back to `DRAF` if any question is edited into an invalid state.
- **Status Tinjauan Butir Soal State Machine**:
  - Newly generated AI questions start in `BELUM_DITINJAU`.
  - Manual questions or reviewed AI questions transition to `DISETUJUI` or `DIEDIT`.
  - Regenerating an item resets its status back to `BELUM_DITINJAU`.

## Testing Decisions

### What Makes a Good Test

Tests must exercise external behaviors and business invariants through the primary `StudioSoalService` interface seam, avoiding coupling to internal database table layouts, private helper methods, or UI component render details. Tests must verify:

1. **State Invariants**: A package cannot achieve `SIAP_MAIN` if any question lacks a correct answer or text, but unreviewed questions permit session launch with a confirmation flag.
2. **Immutability Invariants**: Mutating a `PaketSoal` after `launchSession` has completed does not alter the questions, options, or answer keys inside the active `SnapshotSesi`.
3. **Atomic Persistence Invariants**: Simulating network disconnection during a 20-question generation stream verifies that previously generated questions remain persisted in the database and quota is deducted only for persisted items.
4. **Deterministic Math Invariants**: Questions containing basic arithmetic are evaluated and rejected/regenerated if the marked correct option contradicts deterministic calculator output.
5. **Conflict Resolution Invariants**: Simultaneous offline edits to distinct questions merge successfully via timestamp LWW without dropping concurrent questions.
6. **Classroom Sizing Invariants**: Monster HP correctly recalculates when students enter the lobby, locks upon start, and applies compensation multipliers if simulated student heartbeats drop.
7. **Emergency Invariants**: Triggering the void action immediately awards full simulated damage for all students and logs the question for diagnostic review.

### Tested Modules

- `StudioSoalService` (API & Application Service Seam)
- `AIQuestionGenerator` (tested against in-memory deterministic mock)
- `OfflineSyncEngine` (tested against simulated network disconnects and timestamp conflicts)
- `BossBattleScalingCalculator` (tested against player counts, question counts, and disconnect scenarios)
- `PostGameAnalyticsRollup` (tested against session completion payloads)

### Prior Art & Test Setup

Tests are structured as integration-level behavioral specifications using standard automated test runners, utilizing in-memory repository adapters and deterministic mock AI drivers to execute the entire suite hermetically in seconds without external API costs.

## Out of Scope

The following features and capabilities are explicitly excluded from the MVP scope:

- Automatic grading or authoring of open-ended essay questions.
- Generative AI image creation for diagrams or illustrations.
- Full LMS student management, formal grading gradebooks, or high-stakes summative exam security lockdowns.
- Full KaTeX bundle parser rendering (deferred to Phase P1; MVP strictly uses Unicode typography).
- Multi-teacher real-time collaborative editing (Google Docs style co-editing).
- Direct student access or student logins to Studio Soal.
- Real-time web scraping of government education portals.
- Pre-moderated marketplace transactions for question packs.

## Further Notes

- **Compliance**: Adheres to Indonesian Personal Data Protection (UU PDP) legislation; student participants enter sessions anonymously via game pins without registered student accounts.
- **Device Support**: Mobile-first design targeted for low-end devices starting at 360 px width and Android 8 (Chrome/WebView), maintaining an initial bundle footprint below 200 KB gzipped.

import { StudioSoalService } from './studio-soal-service';
import { InMemoryStudioSoalRepository } from '../adapters/in-memory-repository';
import { CurriculumService } from './curriculum-service';
import { MockAIQuestionGenerator } from '../adapters/mock-ai-generator';
import { MathEvaluator } from './math-evaluator';
import { QuotaManager } from './quota-manager';

// Shared repository & service instance with localStorage hydration
export const sharedRepository = new InMemoryStudioSoalRepository();
export const sharedCurriculumService = new CurriculumService();
export const sharedAiGenerator = new MockAIQuestionGenerator();
export const sharedMathEvaluator = new MathEvaluator();
export const sharedQuotaManager = new QuotaManager(200);

export const sharedStudioSoalService = new StudioSoalService(
  sharedRepository,
  sharedCurriculumService,
  sharedAiGenerator,
  sharedMathEvaluator,
  sharedQuotaManager
);

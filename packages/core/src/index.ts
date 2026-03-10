// ============================================
// @ae-ai/core - Main Export
// ============================================

// Utilities
export {
  compressJSX,
  extractCodeBlock,
  convertToES3,
  wrapWithTryCatch,
  safeJsonParse,
  deepClone,
  generateId,
  nowISO,
} from './utils';

// Validation
export {
  validateJSXSecurity,
  sanitizeJSX,
  validateLayerName,
  validateAngleRange,
  validateOpacity,
  validateScale,
  validateCharacterName,
  validateEmail,
} from './validation';

export {
  validateJSXSyntax,
  formatValidationResult,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from './validation/jsx-syntax';

// AI
export {
  AE_EXPERT_SYSTEM_PROMPT,
  buildCharacterContext,
  buildAnimationPrompt,
  buildLayerAnalysisPrompt,
  estimateTokenCount,
  trimContextToFit,
} from './ai';

export {
  buildCharacterContextFromData,
  truncateContext,
  type CharacterContext,
  type FormattedContext,
} from './ai/character-context';

export {
  parseOpenAIStream,
  parseClaudeStream,
  streamAIResponse,
  type StreamChunk,
  type StreamCallbacks,
} from './ai/streaming';

export {
  RateLimiter,
  openAILimiter,
  claudeLimiter,
  type RateLimiterConfig,
} from './ai/rate-limiter';

// Re-export types for convenience
export type * from '@ae-ai/types';

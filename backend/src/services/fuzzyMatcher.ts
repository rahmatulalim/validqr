import levenshtein from 'fast-levenshtein';

/**
 * Debug object returned alongside the fuzzy score.
 * Contains step-by-step computation details for jury transparency.
 */
export interface FuzzyDebug {
  input: string;
  target: string;
  levenshteinDistance: number;
  levenshteinScore: number;
  tokensA: string[];
  tokensB: string[];
  matchedTokens: string[];
  tokenScore: number;
  finalScore: number;
}

export interface FuzzyResult {
  score: number;
  debug: FuzzyDebug;
}

/**
 * Hybrid Fuzzy Matching — combines character-level (Levenshtein)
 * and word-level (token overlap) similarity.
 *
 * WHY HYBRID?
 * Full-string Levenshtein alone is too sensitive to word order
 * and short/long string length differences. Token overlap catches keyword matches
 * even when word order changes. Weighted average gives robust results for
 * Indonesian merchant names which often share common words ("warung", "toko", "pak").
 *
 * WEIGHTS: Levenshtein 40% + Token Overlap 60%
 * The higher token weight is intentional — keyword overlap is more meaningful
 * for detecting merchant rebrand fraud than character-level distance.
 *
 * CALIBRATION (HackNusa demo stickers):
 *   Sticker A (Asli):    "Warung Bakso Pak Budi" vs "Warung Bakso Pak Budi" → 100%
 *   Sticker C (Rebrand): "Bakso Budi Dipatiukur" vs "Warung Bakso Pak Budi" → ~45%
 *   Sticker B (Penipu):  fails at Layer 1 (NMID mismatch) — never reaches fuzzy check
 *
 * @param input Merchant name from scanned QR payload (tag 59)
 * @param target Merchant name from database (registered name)
 * @returns FuzzyResult containing integer score (0–100) and detailed debug object
 */
export const fuzzyMatch = (input: string, target: string): FuzzyResult => {
  const a = input.toLowerCase().trim();
  const b = target.toLowerCase().trim();

  // --- Strategy 1: Character-level Levenshtein ---
  const distance = levenshtein.get(a, b);
  const maxLen = Math.max(a.length, b.length);
  const levenshteinScore = maxLen > 0 ? ((maxLen - distance) / maxLen) * 100 : 100;

  // --- Strategy 2: Word-level Token Overlap ---
  const tokensA = a.split(/\s+/).filter(Boolean);
  const tokensB = b.split(/\s+/).filter(Boolean);
  const matchedTokens = tokensA.filter(t => tokensB.includes(t));
  const maxTokens = Math.max(tokensA.length, tokensB.length);
  const tokenScore = maxTokens > 0
    ? (matchedTokens.length / maxTokens) * 100
    : 0;

  // --- Hybrid Weighted Score ---
  const WEIGHT_LEVENSHTEIN = 0.4;
  const WEIGHT_TOKEN = 0.6;
  const finalScore = (levenshteinScore * WEIGHT_LEVENSHTEIN) + (tokenScore * WEIGHT_TOKEN);

  const debug: FuzzyDebug = {
    input: a,
    target: b,
    levenshteinDistance: distance,
    levenshteinScore: parseFloat(levenshteinScore.toFixed(2)),
    tokensA,
    tokensB,
    matchedTokens,
    tokenScore: parseFloat(tokenScore.toFixed(2)),
    finalScore: Math.round(finalScore),
  };

  return {
    score: Math.round(finalScore),
    debug,
  };
};

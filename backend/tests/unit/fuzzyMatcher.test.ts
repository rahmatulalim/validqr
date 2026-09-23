import { fuzzyMatch } from '../../src/services/fuzzyMatcher';

/**
 * Unit tests for the hybrid fuzzy matching algorithm.
 *
 * Tests validate all 3 HackNusa demo sticker scenarios:
 *   Sticker A (Asli):    exact match → score 100
 *   Sticker C (Rebrand): partial match → SOFT_WARNING range (40–79)
 *   Sticker B (Penipu):  different merchant → low score (< 40)
 *                         NOTE: In practice, Sticker B fails at Layer 1 (NMID mismatch),
 *                         so it never reaches fuzzyMatch. This test validates that even
 *                         if it did reach Layer 2, the score would be low.
 */
describe('fuzzyMatcher (hybrid Levenshtein + Token Overlap)', () => {
  // ── Sticker A: Exact Match ───────────────────────────────────────────────
  describe('Sticker A — Asli (exact match)', () => {
    it('should return score 100 for identical strings', () => {
      const { score, debug } = fuzzyMatch('Warung Bakso Pak Budi', 'Warung Bakso Pak Budi');
      console.log('Sticker A debug:', debug);
      expect(score).toBe(100);
    });

    it('should return score 100 regardless of case', () => {
      const { score } = fuzzyMatch('WARUNG BAKSO PAK BUDI', 'Warung Bakso Pak Budi');
      expect(score).toBe(100);
    });

    it('should return score 100 for strings with extra whitespace', () => {
      const { score } = fuzzyMatch('  Warung Bakso Pak Budi  ', 'Warung Bakso Pak Budi');
      expect(score).toBe(100);
    });
  });

  // ── Sticker C: Rebrand Fraud (SOFT_WARNING range) ───────────────────────
  describe('Sticker C — Rebrand (SOFT_WARNING range)', () => {
    it('should return a mid-range score indicating rebrand fraud', () => {
      const { score, debug } = fuzzyMatch('Bakso Budi Dipatiukur', 'Warung Bakso Pak Budi');
      console.log('\nSticker C debug:');
      console.log(`  Input: "${debug.input}"`);
      console.log(`  Target: "${debug.target}"`);
      console.log(`  Levenshtein distance: ${debug.levenshteinDistance} → score: ${debug.levenshteinScore}%`);
      console.log(`  Token overlap: [${debug.matchedTokens.join(', ')}] → score: ${debug.tokenScore}%`);
      console.log(`  FINAL SCORE: ${debug.finalScore}%`);

      // Must be in SOFT_WARNING range (below threshold of 50, but detected)
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThan(80);
    });

    it('should identify shared keywords (bakso, budi) in debug output', () => {
      const { debug } = fuzzyMatch('Bakso Budi Dipatiukur', 'Warung Bakso Pak Budi');
      expect(debug.matchedTokens).toContain('bakso');
      expect(debug.matchedTokens).toContain('budi');
    });

    it('should include all debug fields', () => {
      const { debug } = fuzzyMatch('Bakso Budi Dipatiukur', 'Warung Bakso Pak Budi');
      expect(debug).toHaveProperty('input');
      expect(debug).toHaveProperty('target');
      expect(debug).toHaveProperty('levenshteinDistance');
      expect(debug).toHaveProperty('levenshteinScore');
      expect(debug).toHaveProperty('tokensA');
      expect(debug).toHaveProperty('tokensB');
      expect(debug).toHaveProperty('matchedTokens');
      expect(debug).toHaveProperty('tokenScore');
      expect(debug).toHaveProperty('finalScore');
    });
  });

  // ── Sticker B: Different Merchant (low score) ────────────────────────────
  describe('Sticker B — Penipu (different merchant, low score)', () => {
    it('should return a low score for a completely different merchant name', () => {
      const { score, debug } = fuzzyMatch('Toko Aksesoris Penipu', 'Warung Bakso Pak Budi');
      console.log('\nSticker B debug (if it reached Layer 2):');
      console.log(`  Score: ${score}%`);
      console.log(`  Matched tokens: [${debug.matchedTokens.join(', ')}]`);

      expect(score).toBeLessThan(40);
    });

    it('should have no matched tokens between penipu and asli names', () => {
      const { debug } = fuzzyMatch('Toko Aksesoris Penipu', 'Warung Bakso Pak Budi');
      expect(debug.matchedTokens).toHaveLength(0);
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('should handle empty input gracefully', () => {
      const { score } = fuzzyMatch('', 'Warung Bakso Pak Budi');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 100 for two empty strings', () => {
      const { score } = fuzzyMatch('', '');
      // Both empty → 100% match (nothing to distinguish)
      expect(score).toBe(100);
    });

    it('should produce DISTINCT scores for all 3 stickers', () => {
      const scoreA = fuzzyMatch('Warung Bakso Pak Budi', 'Warung Bakso Pak Budi').score;
      const scoreC = fuzzyMatch('Bakso Budi Dipatiukur', 'Warung Bakso Pak Budi').score;
      const scoreB = fuzzyMatch('Toko Aksesoris Penipu', 'Warung Bakso Pak Budi').score;

      console.log(`\n  Sticker A score: ${scoreA}% (expected: 100)`);
      console.log(`  Sticker C score: ${scoreC}% (expected: 40–79)`);
      console.log(`  Sticker B score: ${scoreB}% (expected: < 40)`);

      expect(scoreA).toBeGreaterThan(scoreC);
      expect(scoreC).toBeGreaterThan(scoreB);
      expect(scoreA).not.toBe(scoreC);
      expect(scoreC).not.toBe(scoreB);
    });
  });
});

/**
 * Levenshtein distance wrapper.
 *
 * Re-exports fast-levenshtein as a typed utility to avoid importing
 * the library directly in multiple places. This also makes it easier
 * to swap implementations in the future.
 */
import levenshtein from 'fast-levenshtein';

/**
 * Compute the Levenshtein edit distance between two strings.
 * The distance represents the minimum number of single-character edits
 * (insertions, deletions, substitutions) required to change one string into the other.
 *
 * @param a First string
 * @param b Second string
 * @returns Edit distance (integer ≥ 0)
 */
export const getLevenshteinDistance = (a: string, b: string): number => {
  return levenshtein.get(a, b);
};

/**
 * Compute normalized Levenshtein similarity score (0–100).
 * score = ((maxLen - distance) / maxLen) * 100
 *
 * @param a First string
 * @param b Second string
 * @returns Similarity score 0–100
 */
export const levenshteinSimilarity = (a: string, b: string): number => {
  const distance = getLevenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return ((maxLen - distance) / maxLen) * 100;
};

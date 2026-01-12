/**
 * Fountain Spell Assist - Dictionary Unit Tests
 * 
 * Tests for spell checking logic and dictionary utilities
 */

import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  getSuggestions,
  isWordCorrect,
  extractWords,
  findMisspellings,
  getBuiltInDictionary,
} from './dictionary';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('returns correct distance for single character difference', () => {
    expect(levenshteinDistance('hello', 'hallo')).toBe(1);
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
    expect(levenshteinDistance('cat', 'ca')).toBe(1);
  });

  it('returns correct distance for multiple differences', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('sunday', 'saturday')).toBe(3);
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });
});

describe('getSuggestions', () => {
  const dictionary = new Set(['hello', 'help', 'world', 'word', 'work', 'cat', 'bat', 'hat']);

  it('returns suggestions for misspelled words', () => {
    const suggestions = getSuggestions('helo', dictionary);
    expect(suggestions).toContain('hello');
  });

  it('suggests words with single character difference', () => {
    const suggestions = getSuggestions('hllo', dictionary);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('hello');
  });

  it('limits number of suggestions', () => {
    const suggestions = getSuggestions('wo', dictionary, 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it('preserves capitalization of first letter', () => {
    const suggestions = getSuggestions('Helo', dictionary);
    expect(suggestions.some(s => s[0] === 'H')).toBe(true);
  });

  it('returns empty array when no close matches', () => {
    const suggestions = getSuggestions('xyz', dictionary);
    expect(suggestions.length).toBe(0);
  });
});

describe('isWordCorrect', () => {
  const customDictionary = new Set(['customword', 'myname']);

  it('accepts words in built-in dictionary', () => {
    expect(isWordCorrect('hello', new Set())).toBe(true);
    expect(isWordCorrect('world', new Set())).toBe(true);
    expect(isWordCorrect('the', new Set())).toBe(true);
  });

  it('accepts words in custom dictionary', () => {
    expect(isWordCorrect('customword', customDictionary)).toBe(true);
    expect(isWordCorrect('myname', customDictionary)).toBe(true);
  });

  it('accepts case variations', () => {
    expect(isWordCorrect('Hello', new Set())).toBe(true);
    expect(isWordCorrect('HELLO', new Set())).toBe(true);
  });

  it('accepts short all-caps words (acronyms)', () => {
    expect(isWordCorrect('NASA', new Set())).toBe(true);
    expect(isWordCorrect('FBI', new Set())).toBe(true);
    expect(isWordCorrect('USA', new Set())).toBe(true);
  });

  it('accepts numbers', () => {
    expect(isWordCorrect('123', new Set())).toBe(true);
    expect(isWordCorrect('2024', new Set())).toBe(true);
  });

  it('accepts words with numbers', () => {
    expect(isWordCorrect('file1', new Set())).toBe(true);
    expect(isWordCorrect('v2', new Set())).toBe(true);
  });

  it('rejects misspelled words', () => {
    expect(isWordCorrect('teh', new Set())).toBe(false);
    expect(isWordCorrect('wrold', new Set())).toBe(false);
    expect(isWordCorrect('asdfgh', new Set())).toBe(false);
  });
});

describe('extractWords', () => {
  it('extracts words with positions', () => {
    const result = extractWords('Hello world');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: 'Hello', start: 0, end: 5 });
    expect(result[1]).toEqual({ word: 'world', start: 6, end: 11 });
  });

  it('handles punctuation', () => {
    const result = extractWords('Hello, world!');
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe('Hello');
    expect(result[1].word).toBe('world');
  });

  it('includes contractions', () => {
    const result = extractWords("don't won't");
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe("don't");
    expect(result[1].word).toBe("won't");
  });

  it('skips single letters except I and a', () => {
    const result = extractWords('I have a cat');
    const words = result.map(r => r.word);
    expect(words).toContain('I');
    expect(words).toContain('a');
    expect(words).toContain('have');
    expect(words).toContain('cat');
  });

  it('handles empty string', () => {
    expect(extractWords('')).toHaveLength(0);
  });

  it('handles string with only punctuation', () => {
    expect(extractWords('!@#$%')).toHaveLength(0);
  });
});

describe('findMisspellings', () => {
  it('finds misspelled words', () => {
    const result = findMisspellings('Teh quick brown fox');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].word).toBe('Teh');
  });

  it('returns correct positions', () => {
    const result = findMisspellings('The quikc fox');
    const misspelling = result.find(m => m.word === 'quikc');
    expect(misspelling).toBeDefined();
    expect(misspelling!.startIndex).toBe(4);
    expect(misspelling!.endIndex).toBe(9);
  });

  it('provides suggestions', () => {
    const result = findMisspellings('helo world');
    expect(result[0].suggestions.length).toBeGreaterThan(0);
    expect(result[0].suggestions).toContain('hello');
  });

  it('respects custom dictionary', () => {
    const customDict = new Set(['customword']);
    const result = findMisspellings('customword is fine', customDict);
    expect(result.every(m => m.word !== 'customword')).toBe(true);
  });

  it('returns empty array for correct text', () => {
    // Use common words that are in the dictionary
    const result = findMisspellings('The people work together to create something new');
    expect(result).toHaveLength(0);
  });
});

describe('getBuiltInDictionary', () => {
  it('returns a non-empty set', () => {
    const dict = getBuiltInDictionary();
    expect(dict.size).toBeGreaterThan(100);
  });

  it('contains common words', () => {
    const dict = getBuiltInDictionary();
    expect(dict.has('the')).toBe(true);
    expect(dict.has('and')).toBe(true);
    expect(dict.has('hello')).toBe(true);
    expect(dict.has('world')).toBe(true);
  });

  it('contains contractions', () => {
    const dict = getBuiltInDictionary();
    expect(dict.has("don't")).toBe(true);
    expect(dict.has("can't")).toBe(true);
  });
});


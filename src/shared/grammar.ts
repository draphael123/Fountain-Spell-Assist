/**
 * Fountain Spell Assist - Basic Grammar Checking
 * 
 * Detects common grammar mistakes:
 * - Their/there/they're
 * - Your/you're
 * - Its/it's
 * - To/too/two
 * - Then/than
 */

import { Misspelling } from './types';

export interface GrammarError {
  word: string;
  startIndex: number;
  endIndex: number;
  suggestion: string;
  rule: string;
}

/**
 * Common grammar rules
 */
const GRAMMAR_RULES: Array<{
  pattern: RegExp;
  check: (match: RegExpMatchArray, context: string) => GrammarError | null;
}> = [
  // Their/There/They're
  {
    pattern: /\b(their|there|they're)\b/gi,
    check: (match, context) => {
      const word = match[0];
      const lower = word.toLowerCase();
      const index = match.index!;
      
      // Simple heuristics - can be improved
      const before = context.substring(Math.max(0, index - 20), index).toLowerCase();
      const after = context.substring(index + word.length, index + word.length + 20).toLowerCase();
      
      // "their" should be followed by a noun
      if (lower === 'there' && /(is|are|was|were|will|can|should)\s/.test(after)) {
        return null; // "there is/are" is correct
      }
      
      // "they're" = "they are"
      if (lower === 'they\'re' || lower === 'theyre') {
        return null; // Usually correct
      }
      
      // "their" = possessive
      if (lower === 'their' && /(house|car|name|book|idea|way|own|best|first|last|new|old)\b/i.test(after)) {
        return null; // Usually correct
      }
      
      return null; // Don't flag these by default - too many false positives
    },
  },
  
  // Your/You're
  {
    pattern: /\b(your|you're|youre)\b/gi,
    check: (match, context) => {
      const word = match[0];
      const lower = word.toLowerCase();
      const index = match.index!;
      const after = context.substring(index + word.length, index + word.length + 10).toLowerCase();
      
      // "you're" should be followed by verb/adjective
      if ((lower === 'your' || lower === 'youre') && /^(going|doing|sure|right|wrong|here|there|welcome|ready)/.test(after)) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "you're",
          rule: "Use 'you're' (you are) before verbs/adjectives",
        };
      }
      
      // "you're" should be followed by noun
      if (lower === "you're" && /^(name|book|car|house|idea|way|best|first|last|new|old)\b/.test(after)) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "your",
          rule: "Use 'your' (possessive) before nouns",
        };
      }
      
      return null;
    },
  },
  
  // Its/It's
  {
    pattern: /\b(its|it's)\b/gi,
    check: (match, context) => {
      const word = match[0];
      const lower = word.toLowerCase();
      const index = match.index!;
      const after = context.substring(index + word.length, index + word.length + 10).toLowerCase();
      
      // "it's" = "it is" or "it has"
      if (lower === 'its' && /^(going|doing|not|is|was|will|can|should|has|had|been|being)\b/.test(after)) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "it's",
          rule: "Use 'it's' (it is) before verbs",
        };
      }
      
      // "its" = possessive
      if (lower === "it's" && /^(name|book|car|house|idea|way|best|first|last|new|old|own)\b/.test(after)) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "its",
          rule: "Use 'its' (possessive) before nouns",
        };
      }
      
      return null;
    },
  },
  
  // To/Too/Two
  {
    pattern: /\b(to|too|two)\b/gi,
    check: (match, context) => {
      const word = match[0];
      const lower = word.toLowerCase();
      const index = match.index!;
      const before = context.substring(Math.max(0, index - 10), index).toLowerCase();
      const after = context.substring(index + word.length, index + word.length + 10).toLowerCase();
      
      // "too" = also or excessive
      if (lower === 'to' && (/^(also|much|many|big|small|fast|slow)\b/.test(after) || /(,|;)\s*to\s+also/.test(before + word + after))) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "too",
          rule: "Use 'too' for 'also' or 'excessive'",
        };
      }
      
      // "two" = number
      if (lower === 'to' && /^(people|men|women|children|things|items|days|weeks|years|hours|minutes|seconds)\b/.test(after)) {
        // Could be "two" but context needed - skip for now
        return null;
      }
      
      return null;
    },
  },
  
  // Then/Than
  {
    pattern: /\b(then|than)\b/gi,
    check: (match, context) => {
      const word = match[0];
      const lower = word.toLowerCase();
      const index = match.index!;
      const before = context.substring(Math.max(0, index - 10), index).toLowerCase();
      
      // "than" = comparison
      if (lower === 'then' && /(more|less|better|worse|bigger|smaller|faster|slower|older|younger|taller|shorter)\s+then\b/.test(before + word)) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "than",
          rule: "Use 'than' for comparisons",
        };
      }
      
      // "then" = time sequence
      if (lower === 'than' && /(if|when|after|before|first|next|now)\s+than\b/.test(before + word)) {
        return {
          word,
          startIndex: index,
          endIndex: index + word.length,
          suggestion: "then",
          rule: "Use 'then' for time sequence",
        };
      }
      
      return null;
    },
  },
];

/**
 * Find grammar errors in text
 */
export function findGrammarErrors(text: string): GrammarError[] {
  const errors: GrammarError[] = [];
  
  for (const rule of GRAMMAR_RULES) {
    const matches = Array.from(text.matchAll(rule.pattern));
    for (const match of matches) {
      const error = rule.check(match, text);
      if (error) {
        errors.push(error);
      }
    }
  }
  
  return errors;
}

/**
 * Convert grammar error to misspelling format
 */
export function grammarErrorToMisspelling(error: GrammarError): Misspelling {
  return {
    word: error.word,
    startIndex: error.startIndex,
    endIndex: error.endIndex,
    suggestions: [error.suggestion],
  };
}


/**
 * Fountain Spell Assist - Storage Utilities Tests
 * 
 * Tests for pattern matching and storage utilities.
 * Note: Chrome storage API tests would require mocking.
 */

import { describe, it, expect } from 'vitest';
import { matchesDisabledPattern } from './storage';

describe('matchesDisabledPattern', () => {
  it('matches exact hostname', () => {
    expect(matchesDisabledPattern('example.com', ['example.com'])).toBe(true);
    expect(matchesDisabledPattern('other.com', ['example.com'])).toBe(false);
  });

  it('matches wildcard patterns', () => {
    expect(matchesDisabledPattern('sub.example.com', ['*.example.com'])).toBe(true);
    expect(matchesDisabledPattern('deep.sub.example.com', ['*.example.com'])).toBe(true);
    expect(matchesDisabledPattern('example.com', ['*.example.com'])).toBe(false);
  });

  it('matches multiple patterns', () => {
    const patterns = ['*.bank.com', '*.secure.com', 'private.org'];
    expect(matchesDisabledPattern('mybank.bank.com', patterns)).toBe(true);
    expect(matchesDisabledPattern('app.secure.com', patterns)).toBe(true);
    expect(matchesDisabledPattern('private.org', patterns)).toBe(true);
    expect(matchesDisabledPattern('public.org', patterns)).toBe(false);
  });

  it('is case insensitive', () => {
    expect(matchesDisabledPattern('EXAMPLE.COM', ['example.com'])).toBe(true);
    expect(matchesDisabledPattern('example.com', ['EXAMPLE.COM'])).toBe(true);
  });

  it('handles empty patterns array', () => {
    expect(matchesDisabledPattern('example.com', [])).toBe(false);
  });

  it('escapes special regex characters in patterns', () => {
    // Dots should be literal, not regex wildcards
    expect(matchesDisabledPattern('exampleXcom', ['example.com'])).toBe(false);
    expect(matchesDisabledPattern('example.com', ['example.com'])).toBe(true);
  });

  it('handles complex wildcard patterns', () => {
    expect(matchesDisabledPattern('anything.goes.here.test.com', ['*.test.com'])).toBe(true);
    expect(matchesDisabledPattern('test.com', ['*.test.com'])).toBe(false);
  });
});


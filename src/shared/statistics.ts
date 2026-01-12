/**
 * Fountain Spell Assist - Statistics Tracking
 * 
 * Tracks usage statistics for the extension
 */

import { Statistics, STORAGE_KEYS, DEFAULT_STATISTICS } from './types';

/**
 * Get current statistics
 */
export async function getStatistics(): Promise<Statistics> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.STATISTICS);
  return { ...DEFAULT_STATISTICS, ...result[STORAGE_KEYS.STATISTICS] };
}

/**
 * Update statistics
 */
export async function updateStatistics(updates: Partial<Statistics>): Promise<Statistics> {
  const current = await getStatistics();
  const updated = { ...current, ...updates };
  await chrome.storage.sync.set({ [STORAGE_KEYS.STATISTICS]: updated });
  return updated;
}

/**
 * Increment words checked count
 */
export async function incrementWordsChecked(count: number = 1): Promise<void> {
  const stats = await getStatistics();
  await updateStatistics({ wordsChecked: stats.wordsChecked + count });
}

/**
 * Increment misspellings found count
 */
export async function incrementMisspellingsFound(count: number = 1): Promise<void> {
  const stats = await getStatistics();
  await updateStatistics({ misspellingsFound: stats.misspellingsFound + count });
}

/**
 * Increment corrections made count
 */
export async function incrementCorrectionsMade(count: number = 1): Promise<void> {
  const stats = await getStatistics();
  await updateStatistics({ correctionsMade: stats.correctionsMade + count });
}

/**
 * Increment words added to dictionary count
 */
export async function incrementWordsAdded(count: number = 1): Promise<void> {
  const stats = await getStatistics();
  await updateStatistics({ wordsAdded: stats.wordsAdded + count });
}

/**
 * Reset statistics
 */
export async function resetStatistics(): Promise<void> {
  await chrome.storage.sync.set({ 
    [STORAGE_KEYS.STATISTICS]: { ...DEFAULT_STATISTICS, lastReset: Date.now() }
  });
}


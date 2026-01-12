/**
 * Fountain Spell Assist - Storage Utilities
 * 
 * Handles all chrome.storage.sync operations for:
 * - Global settings
 * - Per-site settings
 * - Custom dictionary management
 */

import {
  GlobalSettings,
  SiteSettings,
  DictionaryEntry,
  STORAGE_KEYS,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from './types';

/**
 * Get global settings from storage
 */
export async function getGlobalSettings(): Promise<GlobalSettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.GLOBAL_SETTINGS);
  return { ...DEFAULT_GLOBAL_SETTINGS, ...result[STORAGE_KEYS.GLOBAL_SETTINGS] };
}

/**
 * Save global settings to storage
 */
export async function setGlobalSettings(settings: Partial<GlobalSettings>): Promise<GlobalSettings> {
  const current = await getGlobalSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.sync.set({ [STORAGE_KEYS.GLOBAL_SETTINGS]: updated });
  return updated;
}

/**
 * Get site-specific settings for a hostname
 */
export async function getSiteSettings(hostname: string): Promise<SiteSettings> {
  const key = `${STORAGE_KEYS.SITE_SETTINGS_PREFIX}${hostname}`;
  const result = await chrome.storage.sync.get(key);
  return { ...DEFAULT_SITE_SETTINGS, ...result[key] };
}

/**
 * Save site-specific settings for a hostname
 */
export async function setSiteSettings(
  hostname: string,
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const key = `${STORAGE_KEYS.SITE_SETTINGS_PREFIX}${hostname}`;
  const current = await getSiteSettings(hostname);
  const updated = { ...current, ...settings };
  await chrome.storage.sync.set({ [key]: updated });
  return updated;
}

/**
 * Get all custom dictionary entries
 */
export async function getCustomDictionary(): Promise<DictionaryEntry[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CUSTOM_DICTIONARY);
  return result[STORAGE_KEYS.CUSTOM_DICTIONARY] || [];
}

/**
 * Get just the words from the custom dictionary (for spell checking)
 */
export async function getCustomDictionaryWords(): Promise<Set<string>> {
  const entries = await getCustomDictionary();
  return new Set(entries.map((e) => e.word.toLowerCase()));
}

/**
 * Add a word to the custom dictionary
 * Returns true if the word was added, false if it already existed
 */
export async function addToDictionary(word: string): Promise<boolean> {
  const normalizedWord = word.toLowerCase().trim();
  if (!normalizedWord) return false;

  const entries = await getCustomDictionary();
  
  // Check if word already exists
  if (entries.some((e) => e.word.toLowerCase() === normalizedWord)) {
    return false;
  }

  const newEntry: DictionaryEntry = {
    word: normalizedWord,
    addedAt: Date.now(),
  };

  entries.push(newEntry);
  await chrome.storage.sync.set({ [STORAGE_KEYS.CUSTOM_DICTIONARY]: entries });
  return true;
}

/**
 * Remove a word from the custom dictionary
 * Returns true if the word was removed, false if it wasn't found
 */
export async function removeFromDictionary(word: string): Promise<boolean> {
  const normalizedWord = word.toLowerCase().trim();
  const entries = await getCustomDictionary();
  
  const filtered = entries.filter((e) => e.word.toLowerCase() !== normalizedWord);
  
  if (filtered.length === entries.length) {
    return false; // Word wasn't in dictionary
  }

  await chrome.storage.sync.set({ [STORAGE_KEYS.CUSTOM_DICTIONARY]: filtered });
  return true;
}

/**
 * Import words into the custom dictionary
 * Returns the number of new words added
 */
export async function importDictionary(words: string[]): Promise<number> {
  const entries = await getCustomDictionary();
  const existingWords = new Set(entries.map((e) => e.word.toLowerCase()));
  
  let addedCount = 0;
  const now = Date.now();

  for (const word of words) {
    const normalized = word.toLowerCase().trim();
    if (normalized && !existingWords.has(normalized)) {
      entries.push({ word: normalized, addedAt: now });
      existingWords.add(normalized);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    await chrome.storage.sync.set({ [STORAGE_KEYS.CUSTOM_DICTIONARY]: entries });
  }

  return addedCount;
}

/**
 * Export the custom dictionary as a list of words
 */
export async function exportDictionary(): Promise<string[]> {
  const entries = await getCustomDictionary();
  return entries.map((e) => e.word);
}

/**
 * Clear the entire custom dictionary
 */
export async function clearDictionary(): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.CUSTOM_DICTIONARY]: [] });
}

/**
 * Check if a hostname matches any disabled pattern
 * Patterns support simple wildcards: *.example.com
 */
export function matchesDisabledPattern(hostname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Convert pattern to regex
    // *.example.com -> ^.*\.example\.com$
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars except *
      .replace(/\*/g, '.*'); // Convert * to .*
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(hostname);
  });
}

/**
 * Check if spell checking should be active for a given hostname
 */
export async function isSpellCheckActiveForSite(hostname: string): Promise<boolean> {
  const globalSettings = await getGlobalSettings();
  
  // Check global enable
  if (!globalSettings.enabled) return false;
  
  // Check disabled patterns
  if (matchesDisabledPattern(hostname, globalSettings.disabledPatterns)) {
    return false;
  }
  
  // Check site-specific settings
  const siteSettings = await getSiteSettings(hostname);
  return siteSettings.enabled;
}


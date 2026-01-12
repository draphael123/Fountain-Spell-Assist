/**
 * Fountain Spell Assist - Messaging Utilities
 * 
 * Type-safe wrappers for chrome.runtime messaging between
 * content scripts, popup, options, and background service worker.
 */

import {
  ExtensionMessage,
  MessageResponse,
  GlobalSettings,
  SiteSettings,
  DictionaryEntry,
} from './types';

/**
 * Send a message to the background service worker and await response
 */
async function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error || 'Unknown error'));
        return;
      }
      resolve(response.data as T);
    });
  });
}

/**
 * Get global settings
 */
export async function getGlobalSettings(): Promise<GlobalSettings> {
  return sendMessage({ type: 'GET_GLOBAL_SETTINGS' });
}

/**
 * Update global settings
 */
export async function setGlobalSettings(settings: Partial<GlobalSettings>): Promise<GlobalSettings> {
  return sendMessage({ type: 'SET_GLOBAL_SETTINGS', settings });
}

/**
 * Get settings for a specific site
 */
export async function getSiteSettings(hostname: string): Promise<SiteSettings> {
  return sendMessage({ type: 'GET_SITE_SETTINGS', hostname });
}

/**
 * Update settings for a specific site
 */
export async function setSiteSettings(
  hostname: string,
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  return sendMessage({ type: 'SET_SITE_SETTINGS', hostname, settings });
}

/**
 * Add a word to the custom dictionary
 */
export async function addToDictionary(word: string): Promise<boolean> {
  return sendMessage({ type: 'ADD_TO_DICTIONARY', word });
}

/**
 * Remove a word from the custom dictionary
 */
export async function removeFromDictionary(word: string): Promise<boolean> {
  return sendMessage({ type: 'REMOVE_FROM_DICTIONARY', word });
}

/**
 * Get all custom dictionary entries
 */
export async function getDictionary(): Promise<DictionaryEntry[]> {
  return sendMessage({ type: 'GET_DICTIONARY' });
}

/**
 * Import words into the custom dictionary
 */
export async function importDictionary(words: string[]): Promise<number> {
  return sendMessage({ type: 'IMPORT_DICTIONARY', words });
}

/**
 * Export custom dictionary as word list
 */
export async function exportDictionary(): Promise<string[]> {
  return sendMessage({ type: 'EXPORT_DICTIONARY' });
}

/**
 * Get the current tab's hostname
 */
export async function getCurrentTabHostname(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      const tab = tabs[0];
      if (!tab?.url) {
        reject(new Error('No active tab or URL'));
        return;
      }
      
      try {
        const url = new URL(tab.url);
        resolve(url.hostname);
      } catch {
        reject(new Error('Invalid URL'));
      }
    });
  });
}


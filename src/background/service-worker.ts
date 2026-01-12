/**
 * Fountain Spell Assist - Background Service Worker
 * 
 * Handles:
 * - Message routing between popup/options and content scripts
 * - Storage operations for settings and dictionary
 * - Broadcasting settings changes to active tabs
 */

import {
  ExtensionMessage,
  MessageResponse,
  GlobalSettings,
  SiteSettings,
  DictionaryEntry,
  Statistics,
} from '../shared/types';
import {
  getGlobalSettings,
  setGlobalSettings,
  getSiteSettings,
  setSiteSettings,
  getCustomDictionary,
  addToDictionary,
  removeFromDictionary,
  importDictionary,
  exportDictionary,
  getStatistics,
  updateStatistics,
} from '../shared/storage';
import { DEFAULT_STATISTICS } from '../shared/types';

/**
 * Handle incoming messages from popup, options, or content scripts
 */
async function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case 'GET_GLOBAL_SETTINGS': {
        const settings = await getGlobalSettings();
        return { success: true, data: settings };
      }

      case 'SET_GLOBAL_SETTINGS': {
        const settings = await setGlobalSettings(message.settings);
        // Broadcast to all tabs
        broadcastSettingsChange({ globalSettings: settings });
        return { success: true, data: settings };
      }

      case 'GET_SITE_SETTINGS': {
        const settings = await getSiteSettings(message.hostname);
        return { success: true, data: settings };
      }

      case 'SET_SITE_SETTINGS': {
        const settings = await setSiteSettings(message.hostname, message.settings);
        // Broadcast to tabs with matching hostname
        broadcastSettingsChange({ siteSettings: settings }, message.hostname);
        return { success: true, data: settings };
      }

      case 'ADD_TO_DICTIONARY': {
        const added = await addToDictionary(message.word);
        // Broadcast dictionary change to all tabs so they can update highlights
        broadcastDictionaryChange();
        return { success: true, data: added };
      }

      case 'REMOVE_FROM_DICTIONARY': {
        const removed = await removeFromDictionary(message.word);
        broadcastDictionaryChange();
        return { success: true, data: removed };
      }

      case 'GET_DICTIONARY': {
        const entries = await getCustomDictionary();
        return { success: true, data: entries };
      }

      case 'IMPORT_DICTIONARY': {
        const addedCount = await importDictionary(message.words);
        broadcastDictionaryChange();
        return { success: true, data: addedCount };
      }

      case 'EXPORT_DICTIONARY': {
        const words = await exportDictionary();
        return { success: true, data: words };
      }

      case 'GET_STATISTICS': {
        const stats = await getStatistics();
        return { success: true, data: stats };
      }

      case 'RESET_STATISTICS': {
        const stats = await updateStatistics({ ...DEFAULT_STATISTICS, lastReset: Date.now() });
        return { success: true, data: stats };
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('FSA: Error handling message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Broadcast settings changes to content scripts
 */
async function broadcastSettingsChange(
  data: { globalSettings?: GlobalSettings; siteSettings?: SiteSettings },
  hostname?: string
): Promise<void> {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    
    // If hostname is specified, only send to matching tabs
    if (hostname) {
      try {
        const url = new URL(tab.url);
        if (url.hostname !== hostname) continue;
      } catch {
        continue;
      }
    }
    
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_CHANGED',
        ...data,
      });
    } catch {
      // Tab might not have content script loaded, ignore
    }
  }
}

/**
 * Broadcast dictionary changes to all content scripts
 */
async function broadcastDictionaryChange(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (!tab.id) continue;
    
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'DICTIONARY_CHANGED',
      });
    } catch {
      // Tab might not have content script loaded, ignore
    }
  }
}

// Set up message listener
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    // Handle async response
    handleMessage(message, sender).then(sendResponse);
    return true; // Indicates async response
  }
);

// Log when service worker starts
console.log('Fountain Spell Assist: Service worker initialized');


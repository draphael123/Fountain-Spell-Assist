/**
 * Fountain Spell Assist - Shared Types
 * 
 * Central type definitions used across background, content, popup, and options.
 */

/** Global settings stored in chrome.storage.sync */
export interface GlobalSettings {
  /** Master on/off switch for the extension */
  enabled: boolean;
  /** Whether to show underline highlights on misspellings */
  showUnderlines: boolean;
  /** Language code for spell checking (e.g., "en-US") */
  language: string;
  /** URL patterns where extension should be disabled (e.g., "*.bank.com") */
  disabledPatterns: string[];
}

/** Per-site settings stored in chrome.storage.sync */
export interface SiteSettings {
  /** Whether spell checking is enabled for this specific hostname */
  enabled: boolean;
}

/** Custom dictionary entry */
export interface DictionaryEntry {
  /** The word that was added */
  word: string;
  /** Timestamp when word was added */
  addedAt: number;
}

/** Represents a detected misspelling */
export interface Misspelling {
  /** The misspelled word */
  word: string;
  /** Start index in the text */
  startIndex: number;
  /** End index in the text */
  endIndex: number;
  /** Suggested corrections */
  suggestions: string[];
}

/** Message types for communication between extension components */
export type MessageType =
  | 'GET_SITE_SETTINGS'
  | 'SET_SITE_SETTINGS'
  | 'GET_GLOBAL_SETTINGS'
  | 'SET_GLOBAL_SETTINGS'
  | 'ADD_TO_DICTIONARY'
  | 'REMOVE_FROM_DICTIONARY'
  | 'GET_DICTIONARY'
  | 'IMPORT_DICTIONARY'
  | 'EXPORT_DICTIONARY'
  | 'CHECK_SPELLING'
  | 'SETTINGS_CHANGED';

/** Base message structure */
export interface BaseMessage {
  type: MessageType;
}

/** Get site settings request */
export interface GetSiteSettingsMessage extends BaseMessage {
  type: 'GET_SITE_SETTINGS';
  hostname: string;
}

/** Set site settings request */
export interface SetSiteSettingsMessage extends BaseMessage {
  type: 'SET_SITE_SETTINGS';
  hostname: string;
  settings: Partial<SiteSettings>;
}

/** Get global settings request */
export interface GetGlobalSettingsMessage extends BaseMessage {
  type: 'GET_GLOBAL_SETTINGS';
}

/** Set global settings request */
export interface SetGlobalSettingsMessage extends BaseMessage {
  type: 'SET_GLOBAL_SETTINGS';
  settings: Partial<GlobalSettings>;
}

/** Add word to dictionary request */
export interface AddToDictionaryMessage extends BaseMessage {
  type: 'ADD_TO_DICTIONARY';
  word: string;
}

/** Remove word from dictionary request */
export interface RemoveFromDictionaryMessage extends BaseMessage {
  type: 'REMOVE_FROM_DICTIONARY';
  word: string;
}

/** Get dictionary request */
export interface GetDictionaryMessage extends BaseMessage {
  type: 'GET_DICTIONARY';
}

/** Import dictionary request */
export interface ImportDictionaryMessage extends BaseMessage {
  type: 'IMPORT_DICTIONARY';
  words: string[];
}

/** Export dictionary request */
export interface ExportDictionaryMessage extends BaseMessage {
  type: 'EXPORT_DICTIONARY';
}

/** Settings changed notification (broadcast to content scripts) */
export interface SettingsChangedMessage extends BaseMessage {
  type: 'SETTINGS_CHANGED';
  globalSettings?: GlobalSettings;
  siteSettings?: SiteSettings;
}

/** Union of all message types */
export type ExtensionMessage =
  | GetSiteSettingsMessage
  | SetSiteSettingsMessage
  | GetGlobalSettingsMessage
  | SetGlobalSettingsMessage
  | AddToDictionaryMessage
  | RemoveFromDictionaryMessage
  | GetDictionaryMessage
  | ImportDictionaryMessage
  | ExportDictionaryMessage
  | SettingsChangedMessage;

/** Response wrapper */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Storage keys */
export const STORAGE_KEYS = {
  GLOBAL_SETTINGS: 'globalSettings',
  SITE_SETTINGS_PREFIX: 'site:',
  CUSTOM_DICTIONARY: 'customDictionary',
} as const;

/** Default global settings */
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  enabled: true,
  showUnderlines: true,
  language: 'en-US',
  disabledPatterns: [],
};

/** Default site settings */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  enabled: true,
};


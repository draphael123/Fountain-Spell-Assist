/**
 * Fountain Spell Assist - Keyboard Shortcuts
 * 
 * Handles keyboard shortcuts for the extension
 */

import { getGlobalSettings } from './storage';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
}

let shortcuts: KeyboardShortcut[] = [];

/**
 * Register a keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut): void {
  shortcuts.push(shortcut);
}

/**
 * Unregister all shortcuts
 */
export function unregisterAllShortcuts(): void {
  shortcuts = [];
}

/**
 * Handle keyboard events
 */
export function handleKeyboardEvent(event: KeyboardEvent): boolean {
  // Only handle if not typing in an input field (unless it's a global shortcut)
  const target = event.target as HTMLElement;
  const isInput = target instanceof HTMLInputElement || 
                  target instanceof HTMLTextAreaElement || 
                  target.isContentEditable;
  
  // Check each registered shortcut
  for (const shortcut of shortcuts) {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                     event.code.toLowerCase() === shortcut.key.toLowerCase();
    
    const ctrlMatch = shortcut.ctrl === undefined ? true : (event.ctrlKey === shortcut.ctrl);
    const shiftMatch = shortcut.shift === undefined ? true : (event.shiftKey === shortcut.shift);
    const altMatch = shortcut.alt === undefined ? true : (event.altKey === shortcut.alt);
    const metaMatch = shortcut.meta === undefined ? true : (event.metaKey === shortcut.meta);
    
    if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
      // Check if we should prevent default
      if (shortcut.ctrl || shortcut.shift || shortcut.alt || shortcut.meta) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      shortcut.action();
      return true;
    }
  }
  
  return false;
}

/**
 * Setup keyboard shortcuts for spell checking
 */
export async function setupSpellCheckShortcuts(): Promise<void> {
  const settings = await getGlobalSettings();
  
  // Ctrl+Shift+S: Toggle spell checking for current site
  registerShortcut({
    key: 's',
    ctrl: true,
    shift: true,
    action: async () => {
      const hostname = window.location.hostname;
      const { getSiteSettings, setSiteSettings } = await import('./storage');
      const siteSettings = await getSiteSettings(hostname);
      await setSiteSettings(hostname, { enabled: !siteSettings.enabled });
      
      // Show notification
      showNotification(siteSettings.enabled ? 'Spell checking disabled' : 'Spell checking enabled');
    },
  });
  
  // Ctrl+Shift+U: Toggle underlines
  registerShortcut({
    key: 'u',
    ctrl: true,
    shift: true,
    action: async () => {
      const { setGlobalSettings } = await import('./storage');
      await setGlobalSettings({ showUnderlines: !settings.showUnderlines });
      showNotification(settings.showUnderlines ? 'Underlines hidden' : 'Underlines shown');
    },
  });
}

/**
 * Show a simple notification
 */
function showNotification(message: string): void {
  // Use toast system if available
  try {
    const { showToast } = require('./toast');
    showToast(`FSA: ${message}`, 'info', 2000);
  } catch {
    // Fallback to simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a1a1a;
      color: #fafafa;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      border: 1px solid #2a2a2a;
    `;
    notification.textContent = `FSA: ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}


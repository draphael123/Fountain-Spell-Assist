/**
 * Fountain Spell Assist - Content Script
 * 
 * Runs on web pages to:
 * - Detect and monitor editable fields
 * - Perform spell checking with debouncing
 * - Show misspelling highlights
 * - Display custom context menu for corrections
 */

import { findMisspellings, Misspelling } from '../shared/dictionary';
import { findGrammarErrors, grammarErrorToMisspelling } from '../shared/grammar';
import { incrementWordsChecked, incrementMisspellingsFound, incrementCorrectionsMade, incrementWordsAdded } from '../shared/statistics';
import { setupSpellCheckShortcuts, handleKeyboardEvent } from '../shared/keyboard';
import { showToast } from '../shared/toast';
import { GlobalSettings, SiteSettings, STORAGE_KEYS, DEFAULT_GLOBAL_SETTINGS, DEFAULT_SITE_SETTINGS } from '../shared/types';

// ============================================================================
// Configuration
// ============================================================================

const DEBOUNCE_MS = 500;
const CONTEXT_MENU_ID = 'fsa-context-menu';
const HIGHLIGHT_CONTAINER_CLASS = 'fsa-highlight-container';

// ============================================================================
// State
// ============================================================================

interface FieldState {
  element: HTMLElement;
  container?: HTMLElement;
  lastText: string;
  misspellings: Misspelling[];
  debounceTimer?: ReturnType<typeof setTimeout>;
}

let globalSettings: GlobalSettings = DEFAULT_GLOBAL_SETTINGS;
let siteSettings: SiteSettings = DEFAULT_SITE_SETTINGS;
let customDictionaryWords: Set<string> = new Set();
const fieldStates = new Map<HTMLElement, FieldState>();
let activeContextMenu: HTMLElement | null = null;
let ignoredWords: Set<string> = new Set(); // Session-only ignores

// ============================================================================
// Initialization
// ============================================================================

async function initialize(): Promise<void> {
  console.log('FSA: Content script initializing');
  
  // Load settings
  await loadSettings();
  await loadCustomDictionary();
  
  if (!isEnabled()) {
    console.log('FSA: Disabled for this site');
    return;
  }
  
  // Set up observers and listeners
  setupMutationObserver();
  setupEventListeners();
  setupKeyboardShortcuts();
  
  // Scan existing editable fields
  scanForEditableFields();
  
  console.log('FSA: Content script initialized');
}

/**
 * Setup keyboard shortcuts
 */
async function setupKeyboardShortcuts(): Promise<void> {
  await setupSpellCheckShortcuts();
  document.addEventListener('keydown', (event) => {
    handleKeyboardEvent(event);
  }, true);
}

/**
 * Check if spell checking is enabled
 */
function isEnabled(): boolean {
  return globalSettings.enabled && siteSettings.enabled;
}

/**
 * Load global and site settings from storage
 */
async function loadSettings(): Promise<void> {
  try {
    // Get global settings
    const globalResult = await chrome.storage.sync.get(STORAGE_KEYS.GLOBAL_SETTINGS);
    globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...globalResult[STORAGE_KEYS.GLOBAL_SETTINGS] };
    
    // Get site settings
    const hostname = window.location.hostname;
    const siteKey = `${STORAGE_KEYS.SITE_SETTINGS_PREFIX}${hostname}`;
    const siteResult = await chrome.storage.sync.get(siteKey);
    siteSettings = { ...DEFAULT_SITE_SETTINGS, ...siteResult[siteKey] };
    
    // Check disabled patterns
    if (matchesDisabledPattern(hostname, globalSettings.disabledPatterns)) {
      siteSettings.enabled = false;
    }
  } catch (error) {
    console.error('FSA: Error loading settings:', error);
  }
}

/**
 * Load custom dictionary words
 */
async function loadCustomDictionary(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.CUSTOM_DICTIONARY);
    const entries = result[STORAGE_KEYS.CUSTOM_DICTIONARY] || [];
    customDictionaryWords = new Set(entries.map((e: { word: string }) => e.word.toLowerCase()));
  } catch (error) {
    console.error('FSA: Error loading dictionary:', error);
  }
}

/**
 * Check if hostname matches any disabled pattern
 */
function matchesDisabledPattern(hostname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(hostname);
  });
}

// ============================================================================
// Field Detection
// ============================================================================

/**
 * Check if an element is an editable field we should monitor
 */
function isEditableField(element: HTMLElement): boolean {
  // Input fields
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    // Only text-like inputs
    if (!['text', 'search', 'email', 'url'].includes(type)) {
      return false;
    }
  }
  
  // Textarea
  else if (element instanceof HTMLTextAreaElement) {
    // OK
  }
  
  // Contenteditable
  else if (element.isContentEditable) {
    // OK
  }
  
  else {
    return false;
  }
  
  // Check if it's a sensitive field
  if (isSensitiveField(element)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a field appears to be sensitive (password, credit card, etc.)
 */
function isSensitiveField(element: HTMLElement): boolean {
  // Check input type
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (['password', 'hidden'].includes(type)) return true;
  }
  
  // Check autocomplete attribute
  const autocomplete = element.getAttribute('autocomplete')?.toLowerCase() || '';
  const sensitiveAutocomplete = [
    'off', 'new-password', 'current-password', 'cc-', 'credit-card',
    'card-number', 'cvv', 'cvc', 'expiry', 'security-code',
  ];
  if (sensitiveAutocomplete.some((s) => autocomplete.includes(s))) {
    return true;
  }
  
  // Check common name patterns
  const name = element.getAttribute('name')?.toLowerCase() || '';
  const id = element.id?.toLowerCase() || '';
  const placeholder = element.getAttribute('placeholder')?.toLowerCase() || '';
  const combined = `${name} ${id} ${placeholder}`;
  
  const sensitivePatterns = [
    'password', 'passwd', 'pwd', 'secret',
    'credit', 'card', 'cvv', 'cvc', 'ccv', 'expir',
    'ssn', 'social', 'security',
    'pin', 'token', 'auth',
  ];
  
  if (sensitivePatterns.some((p) => combined.includes(p))) {
    return true;
  }
  
  return false;
}

/**
 * Scan the page for editable fields (including shadow DOM and iframes)
 */
function scanForEditableFields(): void {
  // Find input and textarea elements
  const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input[type="url"], input:not([type]), textarea');
  inputs.forEach((el) => {
    if (el instanceof HTMLElement && isEditableField(el)) {
      attachToField(el);
    }
  });
  
  // Find contenteditable elements
  const contentEditables = document.querySelectorAll('[contenteditable="true"]');
  contentEditables.forEach((el) => {
    if (el instanceof HTMLElement && isEditableField(el)) {
      attachToField(el);
    }
  });
  
  // Scan shadow DOM
  scanShadowDOM(document.body);
  
  // Scan iframes (with permission)
  scanIframes();
}

/**
 * Scan shadow DOM for editable fields
 */
function scanShadowDOM(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null;
  
  while ((node = walker.nextNode())) {
    const element = node as Element;
    
    // Check if element has shadow root
    if (element.shadowRoot) {
      // Scan shadow root
      const shadowInputs = element.shadowRoot.querySelectorAll('input, textarea, [contenteditable="true"]');
      shadowInputs.forEach((el) => {
        if (el instanceof HTMLElement && isEditableField(el)) {
          attachToField(el);
        }
      });
      
      // Recursively scan shadow DOM
      scanShadowDOM(element.shadowRoot);
    }
    
    // Check for editable fields in regular DOM
    if (element instanceof HTMLElement) {
      if (isEditableField(element)) {
        attachToField(element);
      }
    }
  }
}

/**
 * Scan iframes for editable fields
 */
function scanIframes(): void {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    try {
      // Try to access iframe content (may fail due to CORS)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const inputs = iframeDoc.querySelectorAll('input, textarea, [contenteditable="true"]');
        inputs.forEach((el) => {
          if (el instanceof HTMLElement && isEditableField(el)) {
            attachToField(el);
          }
        });
        
        // Also scan shadow DOM in iframe
        scanShadowDOM(iframeDoc.body);
      }
    } catch (e) {
      // CORS or other security restriction - skip this iframe
    }
  });
}

/**
 * Attach spell checking to an editable field
 */
function attachToField(element: HTMLElement): void {
  if (fieldStates.has(element)) return;
  
  const state: FieldState = {
    element,
    lastText: '',
    misspellings: [],
  };
  
  fieldStates.set(element, state);
  
  // Add event listeners
  element.addEventListener('input', handleInput);
  element.addEventListener('focus', handleFocus);
  element.addEventListener('blur', handleBlur);
  element.addEventListener('scroll', handleScroll);
  
  // Initial check if field has content
  const text = getFieldText(element);
  if (text.trim()) {
    scheduleSpellCheck(state);
  }
}

/**
 * Detach spell checking from a field
 */
function detachFromField(element: HTMLElement): void {
  const state = fieldStates.get(element);
  if (!state) return;
  
  // Clear timers
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }
  
  // Remove highlight container
  if (state.container) {
    state.container.remove();
  }
  
  // Remove event listeners
  element.removeEventListener('input', handleInput);
  element.removeEventListener('focus', handleFocus);
  element.removeEventListener('blur', handleBlur);
  element.removeEventListener('scroll', handleScroll);
  
  fieldStates.delete(element);
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleInput(event: Event): void {
  const element = event.target as HTMLElement;
  const state = fieldStates.get(element);
  if (!state) return;
  
  // Auto-correct on space/enter if enabled
  if (globalSettings.autoCorrect && state.misspellings.length > 0) {
    const text = getFieldText(element);
    const lastChar = text[text.length - 1];
    
    // Check if user just typed space or enter
    if (lastChar === ' ' || lastChar === '\n') {
      // Find the most recent misspelling before the cursor
      const cursorPos = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
        ? element.selectionStart || text.length
        : text.length;
      
      // Find misspelling that ends just before cursor
      for (const misspelling of state.misspellings) {
        if (misspelling.endIndex <= cursorPos && misspelling.endIndex >= cursorPos - 5) {
          // Auto-correct if there's a good suggestion
          if (misspelling.suggestions.length > 0) {
            const suggestion = misspelling.suggestions[0];
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
              const newText = text.substring(0, misspelling.startIndex) + 
                            suggestion + 
                            text.substring(misspelling.endIndex);
              element.value = newText;
              element.setSelectionRange(misspelling.startIndex + suggestion.length, misspelling.startIndex + suggestion.length);
              element.dispatchEvent(new Event('input', { bubbles: true }));
              incrementCorrectionsMade(1).catch(() => {});
            }
            break;
          }
        }
      }
    }
  }
  
  scheduleSpellCheck(state);
}

function handleFocus(event: Event): void {
  const element = event.target as HTMLElement;
  const state = fieldStates.get(element);
  if (!state) return;
  
  // Run spell check on focus
  scheduleSpellCheck(state);
}

function handleBlur(_event: Event): void {
  // Keep highlights visible even when field loses focus
}

function handleScroll(event: Event): void {
  const element = event.target as HTMLElement;
  const state = fieldStates.get(element);
  if (!state || !state.container) return;
  
  // Sync scroll position for textarea/input overlay
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    updateHighlightPositions(state);
  }
}

// ============================================================================
// Spell Checking
// ============================================================================

/**
 * Schedule a spell check with debouncing
 */
function scheduleSpellCheck(state: FieldState): void {
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }
  
  state.debounceTimer = setTimeout(() => {
    performSpellCheck(state).catch(() => {});
  }, DEBOUNCE_MS);
}

/**
 * Get text content from a field
 */
function getFieldText(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  return element.innerText || element.textContent || '';
}

/**
 * Perform spell checking on a field
 */
async function performSpellCheck(state: FieldState): Promise<void> {
  if (!isEnabled() || !globalSettings.showUnderlines) {
    clearHighlights(state);
    return;
  }
  
  const text = getFieldText(state.element);
  
  // Skip if text hasn't changed
  if (text === state.lastText) return;
  state.lastText = text;
  
  // Count words for statistics
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 0) {
    incrementWordsChecked(wordCount).catch(() => {});
  }
  
  // Find misspellings
  const allMisspellings = findMisspellings(text, customDictionaryWords);
  
  // Find grammar errors if enabled
  if (globalSettings.grammarCheck) {
    const grammarErrors = findGrammarErrors(text);
    for (const error of grammarErrors) {
      allMisspellings.push(grammarErrorToMisspelling(error));
    }
  }
  
  // Filter out ignored words
  state.misspellings = allMisspellings.filter(
    (m) => !ignoredWords.has(m.word.toLowerCase())
  );
  
  // Update statistics
  if (state.misspellings.length > 0) {
    incrementMisspellingsFound(state.misspellings.length).catch(() => {});
  }
  
  // Update highlights
  updateHighlights(state);
}

// ============================================================================
// Highlight Rendering
// ============================================================================

/**
 * Clear all highlights for a field
 */
function clearHighlights(state: FieldState): void {
  if (state.container) {
    state.container.innerHTML = '';
  }
}

/**
 * Update highlights for a field
 */
function updateHighlights(state: FieldState): void {
  if (!state.misspellings.length) {
    clearHighlights(state);
    if (state.container) {
      state.container.remove();
      state.container = undefined;
    }
    return;
  }
  
  if (state.element.isContentEditable) {
    // For contenteditable, we'll mark spans directly or use overlay
    updateContentEditableHighlights(state);
  } else {
    // For input/textarea, use mirror overlay technique
    updateInputHighlights(state);
  }
}

/**
 * Update highlights for contenteditable elements using overlay
 */
function updateContentEditableHighlights(state: FieldState): void {
  // Create or get container
  if (!state.container) {
    state.container = document.createElement('div');
    state.container.className = HIGHLIGHT_CONTAINER_CLASS;
    document.body.appendChild(state.container);
  }
  
  // Clear existing highlights
  state.container.innerHTML = '';
  
  // Position container over the element
  const rect = state.element.getBoundingClientRect();
  state.container.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    pointer-events: none;
    overflow: hidden;
    z-index: 2147483640;
  `;
  
  // Calculate positions using range
  const text = state.lastText;
  
  for (const misspelling of state.misspellings) {
    const positions = getTextPositions(state.element, misspelling.startIndex, misspelling.endIndex, text);
    
    for (const pos of positions) {
      const highlight = document.createElement('div');
      highlight.className = 'fsa-misspelling';
      highlight.style.cssText = `
        position: absolute;
        left: ${pos.left - rect.left}px;
        top: ${pos.top - rect.top + pos.height - 2}px;
        width: ${pos.width}px;
        height: 2px;
        pointer-events: auto;
        cursor: pointer;
      `;
      highlight.dataset.word = misspelling.word;
      highlight.dataset.suggestions = JSON.stringify(misspelling.suggestions);
      
      // Accessibility
      highlight.setAttribute('role', 'button');
      highlight.setAttribute('aria-label', `Misspelled word: ${misspelling.word}. Right-click for suggestions.`);
      highlight.setAttribute('tabindex', '0');
      
      highlight.addEventListener('contextmenu', handleHighlightContextMenu);
      highlight.addEventListener('click', handleHighlightClick);
      highlight.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showContextMenu(e.clientX || 0, e.clientY || 0, highlight);
        }
      });
      
      state.container.appendChild(highlight);
    }
  }
}

/**
 * Get text positions within a contenteditable or input element
 */
function getTextPositions(
  element: HTMLElement,
  startIndex: number,
  endIndex: number,
  _fullText: string
): Array<{ left: number; top: number; width: number; height: number }> {
  const positions: Array<{ left: number; top: number; width: number; height: number }> = [];
  
  if (element.isContentEditable) {
    // For contenteditable, use Range API
    try {
      const range = document.createRange();
      const textNodes = getTextNodes(element);
      
      let currentIndex = 0;
      let startNode: Node | null = null;
      let startOffset = 0;
      let endNode: Node | null = null;
      let endOffset = 0;
      
      for (const node of textNodes) {
        const nodeLength = node.textContent?.length || 0;
        
        if (!startNode && currentIndex + nodeLength > startIndex) {
          startNode = node;
          startOffset = startIndex - currentIndex;
        }
        
        if (currentIndex + nodeLength >= endIndex) {
          endNode = node;
          endOffset = endIndex - currentIndex;
          break;
        }
        
        currentIndex += nodeLength;
      }
      
      if (startNode && endNode) {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const rects = range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          positions.push({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      }
    } catch {
      // Fall back to element bounds
      const rect = element.getBoundingClientRect();
      positions.push({
        left: rect.left,
        top: rect.top,
        width: 50,
        height: rect.height,
      });
    }
  }
  
  return positions;
}

/**
 * Get all text nodes within an element
 */
function getTextNodes(element: Node): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }
  
  return textNodes;
}

/**
 * Update highlights for input/textarea using mirror technique
 */
function updateInputHighlights(state: FieldState): void {
  const element = state.element as HTMLInputElement | HTMLTextAreaElement;
  
  // Create or get container
  if (!state.container) {
    state.container = document.createElement('div');
    state.container.className = HIGHLIGHT_CONTAINER_CLASS;
    document.body.appendChild(state.container);
  }
  
  // Clear existing highlights
  state.container.innerHTML = '';
  
  // Get element styles
  const computedStyle = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  // Position container
  state.container.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    pointer-events: none;
    overflow: hidden;
    z-index: 2147483640;
  `;
  
  // Create mirror div for measuring text positions
  const mirror = document.createElement('div');
  mirror.className = 'fsa-mirror';
  
  // Copy styles from input
  const stylesToCopy = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'letter-spacing', 'word-spacing', 'text-transform',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'line-height', 'text-align',
  ];
  
  let mirrorStyles = `
    position: absolute;
    left: 0;
    top: 0;
    width: ${element.clientWidth}px;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  
  for (const prop of stylesToCopy) {
    mirrorStyles += `${prop}: ${computedStyle.getPropertyValue(prop)};`;
  }
  
  mirror.style.cssText = mirrorStyles;
  document.body.appendChild(mirror);
  
  const text = element.value;
  const scrollLeft = element.scrollLeft;
  const scrollTop = element.scrollTop;
  
  // Calculate positions for each misspelling
  for (const misspelling of state.misspellings) {
    // Create text before misspelling
    const textBefore = text.substring(0, misspelling.startIndex);
    const misspelledWord = text.substring(misspelling.startIndex, misspelling.endIndex);
    
    // Measure position
    mirror.textContent = textBefore;
    const beforeRect = mirror.getBoundingClientRect();
    
    // Create span for misspelled word
    const span = document.createElement('span');
    span.textContent = misspelledWord;
    mirror.appendChild(span);
    
    const spanRect = span.getBoundingClientRect();
    
    // Calculate relative positions
    const left = spanRect.left - beforeRect.left - scrollLeft;
    const top = beforeRect.height - parseInt(computedStyle.lineHeight) - scrollTop;
    const width = spanRect.width;
    const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) * 1.2;
    
    // Create highlight element
    const highlight = document.createElement('div');
    highlight.className = 'fsa-misspelling';
    highlight.style.cssText = `
      position: absolute;
      left: ${Math.max(0, left + parseInt(computedStyle.paddingLeft))}px;
      top: ${Math.max(0, top + lineHeight)}px;
      width: ${width}px;
      height: 2px;
      pointer-events: auto;
      cursor: pointer;
    `;
    highlight.dataset.word = misspelling.word;
    highlight.dataset.suggestions = JSON.stringify(misspelling.suggestions);
    highlight.dataset.start = misspelling.startIndex.toString();
    highlight.dataset.end = misspelling.endIndex.toString();
    
    // Accessibility
    highlight.setAttribute('role', 'button');
    highlight.setAttribute('aria-label', `Misspelled word: ${misspelling.word}. Right-click for suggestions.`);
    highlight.setAttribute('tabindex', '0');
    
    highlight.addEventListener('contextmenu', handleHighlightContextMenu);
    highlight.addEventListener('click', handleHighlightClick);
    highlight.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showContextMenu(e.clientX || 0, e.clientY || 0, highlight);
      }
    });
    
    state.container.appendChild(highlight);
  }
  
  // Clean up mirror
  mirror.remove();
}

/**
 * Update highlight positions (for scroll sync)
 */
function updateHighlightPositions(state: FieldState): void {
  // Re-render highlights to account for scroll
  updateHighlights(state);
}

// ============================================================================
// Context Menu
// ============================================================================

/**
 * Handle right-click on highlighted word
 */
function handleHighlightContextMenu(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  
  const target = event.target as HTMLElement;
  showContextMenu(event.clientX, event.clientY, target);
}

/**
 * Handle click on highlighted word (also show menu)
 */
function handleHighlightClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  
  const target = event.target as HTMLElement;
  showContextMenu(event.clientX, event.clientY, target);
}

/**
 * Show custom context menu
 */
function showContextMenu(x: number, y: number, highlightElement: HTMLElement): void {
  // Remove existing menu
  hideContextMenu();
  
  const word = highlightElement.dataset.word || '';
  const suggestions: string[] = JSON.parse(highlightElement.dataset.suggestions || '[]');
  
  // Create menu
  const menu = document.createElement('div');
  menu.id = CONTEXT_MENU_ID;
  menu.className = 'fsa-context-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Spell check suggestions');
  
  // Show misspelled word
  const wordLabel = document.createElement('div');
  wordLabel.className = 'fsa-context-menu-word';
  wordLabel.textContent = word;
  menu.appendChild(wordLabel);
  
  // Add suggestions
  if (suggestions.length > 0) {
    const suggestionsLabel = document.createElement('div');
    suggestionsLabel.className = 'fsa-context-menu-label';
    suggestionsLabel.textContent = 'Suggestions';
    menu.appendChild(suggestionsLabel);
    
    for (const suggestion of suggestions.slice(0, 5)) {
      const item = document.createElement('div');
      item.className = 'fsa-context-menu-item fsa-context-menu-suggestion';
      item.textContent = suggestion;
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Replace with ${suggestion}`);
      item.addEventListener('click', () => {
        applySuggestion(highlightElement, suggestion);
        hideContextMenu();
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          applySuggestion(highlightElement, suggestion);
          hideContextMenu();
        }
      });
      menu.appendChild(item);
    }
  } else {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'fsa-context-menu-empty';
    emptyItem.textContent = 'No suggestions';
    menu.appendChild(emptyItem);
  }
  
  // Divider
  const divider = document.createElement('div');
  divider.className = 'fsa-context-menu-divider';
  menu.appendChild(divider);
  
  // Ignore action
  const ignoreItem = document.createElement('div');
  ignoreItem.className = 'fsa-context-menu-item fsa-context-menu-action';
  ignoreItem.innerHTML = `<span class="fsa-context-menu-icon">🚫</span> Ignore`;
  ignoreItem.setAttribute('role', 'menuitem');
  ignoreItem.setAttribute('tabindex', '0');
  ignoreItem.setAttribute('aria-label', 'Ignore this word for this session');
  ignoreItem.addEventListener('click', () => {
    ignoreWord(word);
    hideContextMenu();
  });
  ignoreItem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      ignoreWord(word);
      hideContextMenu();
    }
  });
  menu.appendChild(ignoreItem);
  
  // Add to dictionary action
  const addItem = document.createElement('div');
  addItem.className = 'fsa-context-menu-item fsa-context-menu-action';
  addItem.innerHTML = `<span class="fsa-context-menu-icon">📖</span> Add to Dictionary`;
  addItem.setAttribute('role', 'menuitem');
  addItem.setAttribute('tabindex', '0');
  addItem.setAttribute('aria-label', `Add ${word} to custom dictionary`);
  addItem.addEventListener('click', () => {
    addWordToDictionary(word);
    hideContextMenu();
  });
  addItem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addWordToDictionary(word);
      hideContextMenu();
    }
  });
  menu.appendChild(addItem);
  
  // Position menu
  document.body.appendChild(menu);
  
  // Adjust position if menu would go off screen (improved positioning)
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 10;
  
  let menuX = x;
  let menuY = y;
  
  // Horizontal positioning
  if (x + menuRect.width + padding > viewportWidth) {
    // Try to position to the left of cursor
    menuX = Math.max(padding, x - menuRect.width - padding);
    // If still doesn't fit, align to right edge
    if (menuX + menuRect.width > viewportWidth) {
      menuX = viewportWidth - menuRect.width - padding;
    }
  } else {
    menuX = x + padding;
  }
  
  // Vertical positioning
  if (y + menuRect.height + padding > viewportHeight) {
    // Try to position above cursor
    menuY = Math.max(padding, y - menuRect.height - padding);
    // If still doesn't fit, align to bottom edge
    if (menuY + menuRect.height > viewportHeight) {
      menuY = viewportHeight - menuRect.height - padding;
    }
  } else {
    menuY = y + padding;
  }
  
  menu.style.left = `${menuX}px`;
  menu.style.top = `${menuY}px`;
  
  activeContextMenu = menu;
  
  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
  }, 0);
}

/**
 * Hide context menu
 */
function hideContextMenu(): void {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleDocumentKeydown);
}

function handleDocumentClick(event: MouseEvent): void {
  if (activeContextMenu && !activeContextMenu.contains(event.target as Node)) {
    hideContextMenu();
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    hideContextMenu();
  }
}

/**
 * Apply a suggestion to replace misspelled word
 */
async function applySuggestion(highlightElement: HTMLElement, suggestion: string): Promise<void> {
  // Find the field this highlight belongs to
  const container = highlightElement.parentElement;
  if (!container) return;
  
  // Find matching field state
  for (const [element, state] of fieldStates) {
    if (state.container === container) {
      const word = highlightElement.dataset.word || '';
      const startStr = highlightElement.dataset.start;
      const endStr = highlightElement.dataset.end;
      
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // For input/textarea, use start/end indices
        if (startStr && endStr) {
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          const text = element.value;
          element.value = text.substring(0, start) + suggestion + text.substring(end);
          
      // Update cursor position
      const newCursorPos = start + suggestion.length;
      element.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event for any listeners
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Show toast notification
      showToast(`Replaced "${word}" with "${suggestion}"`, 'success', 2000);
        }
      } else if (element.isContentEditable) {
        // For contenteditable, find and replace the word
        const html = element.innerHTML;
        const newHtml = html.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`), suggestion);
        element.innerHTML = newHtml;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Update statistics
      incrementCorrectionsMade(1).catch(() => {});
      
      // Re-run spell check
      scheduleSpellCheck(state);
      break;
    }
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ignore a word for this session
 */
function ignoreWord(word: string): void {
  ignoredWords.add(word.toLowerCase());
  
  // Re-check all fields to remove highlights for this word
  for (const state of fieldStates.values()) {
    performSpellCheck(state);
  }
}

/**
 * Add word to custom dictionary
 */
async function addWordToDictionary(word: string): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'ADD_TO_DICTIONARY', word });
    customDictionaryWords.add(word.toLowerCase());
    
    // Update statistics
    incrementWordsAdded(1).catch(() => {});
    
    // Show toast notification
    showToast(`Added "${word}" to dictionary`, 'success');
    
    // Re-check all fields
    for (const state of fieldStates.values()) {
      performSpellCheck(state);
    }
  } catch (error) {
    console.error('FSA: Error adding to dictionary:', error);
    showToast('Failed to add word to dictionary', 'error');
  }
}

// ============================================================================
// Mutation Observer
// ============================================================================

/**
 * Set up mutation observer to detect new editable fields
 */
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          if (isEditableField(node)) {
            attachToField(node);
          }
          // Check children
          const editables = node.querySelectorAll('input, textarea, [contenteditable="true"]');
          editables.forEach((el) => {
            if (el instanceof HTMLElement && isEditableField(el)) {
              attachToField(el);
            }
          });
        }
      }
      
      // Check removed nodes
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          if (fieldStates.has(node)) {
            detachFromField(node);
          }
          // Check children
          const editables = node.querySelectorAll('input, textarea, [contenteditable="true"]');
          editables.forEach((el) => {
            if (el instanceof HTMLElement && fieldStates.has(el)) {
              detachFromField(el);
            }
          });
        }
      }
      
      // Check attribute changes (contenteditable might change)
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        const el = mutation.target;
        if (mutation.attributeName === 'contenteditable') {
          if (el.isContentEditable && isEditableField(el)) {
            attachToField(el);
          } else {
            detachFromField(el);
          }
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['contenteditable'],
  });
}

// ============================================================================
// Event Listeners (Window/Document level)
// ============================================================================

function setupEventListeners(): void {
  // Listen for settings changes from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_CHANGED') {
      if (message.globalSettings) {
        globalSettings = message.globalSettings;
      }
      if (message.siteSettings) {
        siteSettings = message.siteSettings;
      }
      
      // Re-check all fields with new settings
      if (isEnabled()) {
        for (const state of fieldStates.values()) {
          performSpellCheck(state);
        }
      } else {
        // Disable - clear all highlights
        for (const state of fieldStates.values()) {
          clearHighlights(state);
        }
      }
    }
    
    if (message.type === 'DICTIONARY_CHANGED') {
      loadCustomDictionary().then(() => {
        for (const state of fieldStates.values()) {
          performSpellCheck(state);
        }
      });
    }
  });
  
  // Update highlight positions on window resize
  window.addEventListener('resize', () => {
    for (const state of fieldStates.values()) {
      if (state.container) {
        updateHighlights(state);
      }
    }
  });
  
  // Update positions on scroll
  window.addEventListener('scroll', () => {
    for (const state of fieldStates.values()) {
      if (state.container) {
        updateHighlights(state);
      }
    }
  }, true);
}

// ============================================================================
// Initialize
// ============================================================================

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}


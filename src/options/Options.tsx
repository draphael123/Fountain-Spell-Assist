/**
 * Fountain Spell Assist - Options Page Component
 * 
 * Full settings interface including:
 * - Global enable/disable
 * - Language selection
 * - Custom dictionary management (add, remove, import, export)
 * - Disabled site patterns
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getGlobalSettings,
  setGlobalSettings,
  getDictionary,
  removeFromDictionary,
  importDictionary,
  exportDictionary,
} from '../shared/messaging';
import type { GlobalSettings, DictionaryEntry } from '../shared/types';

type ModalType = 'import' | 'export' | null;
type ToastType = { message: string; type: 'success' | 'error' } | null;

export function Options() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [newPattern, setNewPattern] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');
  const [toast, setToast] = useState<ToastType>(null);

  // Load settings and dictionary
  useEffect(() => {
    async function load() {
      try {
        const [globalSettings, dict] = await Promise.all([
          getGlobalSettings(),
          getDictionary(),
        ]);
        setSettings(globalSettings);
        setDictionary(dict);
      } catch (error) {
        console.error('Failed to load:', error);
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Update global settings
  const updateSettings = useCallback(async (updates: Partial<GlobalSettings>) => {
    if (!settings) return;
    
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    try {
      await setGlobalSettings(updates);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setSettings(settings); // Revert
      showToast('Failed to save settings', 'error');
    }
  }, [settings, showToast]);

  // Add disabled pattern
  const addPattern = useCallback(async () => {
    if (!settings || !newPattern.trim()) return;
    
    const pattern = newPattern.trim();
    if (settings.disabledPatterns.includes(pattern)) {
      showToast('Pattern already exists', 'error');
      return;
    }
    
    const newPatterns = [...settings.disabledPatterns, pattern];
    await updateSettings({ disabledPatterns: newPatterns });
    setNewPattern('');
    showToast('Pattern added', 'success');
  }, [settings, newPattern, updateSettings, showToast]);

  // Remove disabled pattern
  const removePattern = useCallback(async (pattern: string) => {
    if (!settings) return;
    
    const newPatterns = settings.disabledPatterns.filter((p) => p !== pattern);
    await updateSettings({ disabledPatterns: newPatterns });
    showToast('Pattern removed', 'success');
  }, [settings, updateSettings, showToast]);

  // Remove word from dictionary
  const removeWord = useCallback(async (word: string) => {
    try {
      await removeFromDictionary(word);
      setDictionary((prev) => prev.filter((e) => e.word !== word));
      showToast('Word removed', 'success');
    } catch (error) {
      console.error('Failed to remove word:', error);
      showToast('Failed to remove word', 'error');
    }
  }, [showToast]);

  // Open import modal
  const openImport = useCallback(() => {
    setImportText('');
    setModal('import');
  }, []);

  // Open export modal
  const openExport = useCallback(async () => {
    try {
      const words = await exportDictionary();
      setExportText(words.join('\n'));
      setModal('export');
    } catch (error) {
      console.error('Failed to export:', error);
      showToast('Failed to export dictionary', 'error');
    }
  }, [showToast]);

  // Handle import
  const handleImport = useCallback(async () => {
    const words = importText
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    
    if (words.length === 0) {
      showToast('No words to import', 'error');
      return;
    }
    
    try {
      const added = await importDictionary(words);
      const dict = await getDictionary();
      setDictionary(dict);
      setModal(null);
      showToast(`Imported ${added} new words`, 'success');
    } catch (error) {
      console.error('Failed to import:', error);
      showToast('Failed to import dictionary', 'error');
    }
  }, [importText, showToast]);

  // Copy export text
  const copyExport = useCallback(() => {
    navigator.clipboard.writeText(exportText);
    showToast('Copied to clipboard', 'success');
  }, [exportText, showToast]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="options-container">
      {/* Header */}
      <header className="options-header">
        <div className="options-logo">🖋</div>
        <div>
          <h1 className="options-title">Fountain Spell Assist</h1>
          <p className="options-subtitle">Settings & Configuration</p>
        </div>
      </header>

      {/* General Settings */}
      <section className="section">
        <h2 className="section-title">General</h2>
        <div className="section-card">
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Enable Spell Checking</div>
              <div className="setting-description">
                Master switch for all spell checking functionality
              </div>
            </div>
            <button
              className={`toggle-switch ${settings?.enabled ? 'active' : ''}`}
              onClick={() => updateSettings({ enabled: !settings?.enabled })}
              aria-label="Toggle spell checking"
            />
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Show Underlines</div>
              <div className="setting-description">
                Display red underlines under misspelled words
              </div>
            </div>
            <button
              className={`toggle-switch ${settings?.showUnderlines ? 'active' : ''}`}
              onClick={() => updateSettings({ showUnderlines: !settings?.showUnderlines })}
              aria-label="Toggle underlines"
            />
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Language</div>
              <div className="setting-description">
                Dictionary language for spell checking
              </div>
            </div>
            <div className="select-wrapper">
              <select
                value={settings?.language || 'en-US'}
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Dictionary */}
      <section className="section">
        <h2 className="section-title">Custom Dictionary</h2>
        <div className="section-card">
          <div className="dictionary-header">
            <span className="dictionary-count">
              {dictionary.length} word{dictionary.length !== 1 ? 's' : ''}
            </span>
            <div className="dictionary-actions">
              <button className="btn btn-secondary" onClick={openImport}>
                Import
              </button>
              <button className="btn btn-secondary" onClick={openExport}>
                Export
              </button>
            </div>
          </div>

          {dictionary.length === 0 ? (
            <div className="dictionary-empty">
              <p>No custom words added yet.</p>
              <p>Words you add via "Add to Dictionary" will appear here.</p>
            </div>
          ) : (
            <div className="dictionary-list">
              {dictionary.map((entry) => (
                <div key={entry.word} className="dictionary-item">
                  <span className="dictionary-word">{entry.word}</span>
                  <button
                    className="btn-icon"
                    onClick={() => removeWord(entry.word)}
                    aria-label={`Remove ${entry.word}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Disabled Patterns */}
      <section className="section">
        <h2 className="section-title">Disabled Sites</h2>
        <div className="section-card">
          <div className="patterns-list">
            {settings?.disabledPatterns.length === 0 ? (
              <div className="dictionary-empty">
                <p>No disabled site patterns.</p>
                <p>Add patterns like "*.bank.com" to disable spell checking on sensitive sites.</p>
              </div>
            ) : (
              settings?.disabledPatterns.map((pattern) => (
                <div key={pattern} className="pattern-item">
                  <span className="pattern-value">{pattern}</span>
                  <button
                    className="btn-icon"
                    onClick={() => removePattern(pattern)}
                    aria-label={`Remove ${pattern}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="pattern-add">
            <div className="pattern-input-row">
              <input
                type="text"
                className="pattern-input"
                placeholder="*.example.com"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPattern()}
              />
              <button className="btn btn-add" onClick={addPattern}>
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Import Modal */}
      {modal === 'import' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Import Dictionary</h3>
              <button className="modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="modal-textarea"
                placeholder="Enter words, one per line..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn btn-add" onClick={handleImport}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {modal === 'export' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Export Dictionary</h3>
              <button className="modal-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="modal-textarea"
                value={exportText}
                readOnly
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>
                Close
              </button>
              <button className="btn btn-add" onClick={copyExport}>
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}


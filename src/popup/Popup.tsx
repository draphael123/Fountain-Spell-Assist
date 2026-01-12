/**
 * Fountain Spell Assist - Popup Component
 * 
 * Simple interface for:
 * - Toggling spell check for current site
 * - Toggling underline display
 * - Quick access to options
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getGlobalSettings,
  setGlobalSettings,
  getSiteSettings,
  setSiteSettings,
  getCurrentTabHostname,
} from '../shared/messaging';
import type { GlobalSettings, SiteSettings } from '../shared/types';

export function Popup() {
  const [loading, setLoading] = useState(true);
  const [hostname, setHostname] = useState<string>('');
  const [globalSettings, setGlobalSettingsState] = useState<GlobalSettings | null>(null);
  const [siteSettings, setSiteSettingsState] = useState<SiteSettings | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function load() {
      try {
        const [host, global, site] = await Promise.all([
          getCurrentTabHostname().catch(() => ''),
          getGlobalSettings(),
          getCurrentTabHostname().then((h) => getSiteSettings(h)).catch(() => ({ enabled: true })),
        ]);
        
        setHostname(host);
        setGlobalSettingsState(global);
        setSiteSettingsState(site);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Toggle site enabled
  const handleSiteToggle = useCallback(async () => {
    if (!siteSettings || !hostname) return;
    
    const newEnabled = !siteSettings.enabled;
    setSiteSettingsState({ ...siteSettings, enabled: newEnabled });
    
    try {
      await setSiteSettings(hostname, { enabled: newEnabled });
    } catch (error) {
      console.error('Failed to update site settings:', error);
      setSiteSettingsState(siteSettings); // Revert on error
    }
  }, [siteSettings, hostname]);

  // Toggle underlines
  const handleUnderlinesToggle = useCallback(async () => {
    if (!globalSettings) return;
    
    const newShowUnderlines = !globalSettings.showUnderlines;
    setGlobalSettingsState({ ...globalSettings, showUnderlines: newShowUnderlines });
    
    try {
      await setGlobalSettings({ showUnderlines: newShowUnderlines });
    } catch (error) {
      console.error('Failed to update global settings:', error);
      setGlobalSettingsState(globalSettings); // Revert on error
    }
  }, [globalSettings]);

  // Open options page
  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isActive = globalSettings?.enabled && siteSettings?.enabled;

  return (
    <div className="popup">
      {/* Header */}
      <header className="popup-header">
        <div className="popup-logo">🖋</div>
        <div>
          <div className="popup-title">Fountain</div>
          <div className="popup-subtitle">Spell Assist</div>
        </div>
      </header>

      {/* Current site */}
      {hostname && (
        <div className="site-info">
          <div className="site-label">Current Site</div>
          <div className="site-hostname">{hostname}</div>
        </div>
      )}

      {/* Toggle controls */}
      <div className="toggle-section">
        {/* Site toggle */}
        <div className="toggle-row">
          <div className="toggle-info">
            <span className="toggle-label">
              {siteSettings?.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className="toggle-description">
              Spell check on this site
            </span>
          </div>
          <button
            className={`toggle-switch ${siteSettings?.enabled ? 'active' : ''}`}
            onClick={handleSiteToggle}
            aria-label="Toggle spell check for this site"
          />
        </div>

        {/* Underlines toggle */}
        <div className="toggle-row">
          <div className="toggle-info">
            <span className="toggle-label">Underlines</span>
            <span className="toggle-description">
              Show misspelling highlights
            </span>
          </div>
          <button
            className={`toggle-switch ${globalSettings?.showUnderlines ? 'active' : ''}`}
            onClick={handleUnderlinesToggle}
            aria-label="Toggle underline display"
          />
        </div>
      </div>

      {/* Status indicator */}
      <div className={`status-indicator ${isActive ? '' : 'disabled'}`}>
        <div className="status-dot" />
        <span className="status-text">
          {isActive ? 'Spell checking active' : 'Spell checking paused'}
        </span>
      </div>

      {/* Footer with options link */}
      <footer className="popup-footer">
        <button className="options-link" onClick={openOptions}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Options
        </button>
      </footer>
    </div>
  );
}


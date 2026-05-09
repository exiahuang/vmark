import { useStore, getFilteredItems, getCategoryLabel } from '../store';
import { useTranslation } from '../hooks/useTranslation';
import { useState, useEffect } from 'react';
import './StatusBar.css';

function useVersion() {
  const [version, setVersion] = useState('');
  useEffect(() => {
    fetch(new URL('../../package.json', import.meta.url))
      .then(r => r.json())
      .then(pkg => setVersion(pkg.version || ''))
      .catch(() => {});
  }, []);
  return version;
}

export function StatusBar() {
  const { mode, activeCategory, sortMode, listViewMode, searchMode, setPanelMode, categoryRules, categoryLabels, language } = useStore();
  const state = useStore.getState();
  const filtered = getFilteredItems(state);
  const t = useTranslation();
  const version = useVersion();

  const filteredCount = filtered.length;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-mode">MODE: {mode}</span>
        <span className="status-divider">|</span>
        <span className="status-count">{filteredCount} {filteredCount === 1 ? t.item : t.items}</span>
        <span className="status-divider">|</span>
        <span className="status-category">{getCategoryLabel(activeCategory, categoryRules, categoryLabels, language)}</span>
      </div>
      <div className="status-right">
        <a href="https://github.com/exiahuang/vmark" target="_blank" rel="noopener noreferrer" className="status-link" title={t.github}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        <a href="https://chromewebstore.google.com/detail/vmark-keyboard-new-tab-ma/deobcompomhidbicplpljmfegfhmnkcj" target="_blank" rel="noopener noreferrer" className="status-link" title={t.chromeStore}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C8.21 0 4.83 1.67 2.52 4.21l3.56 6.17A5.98 5.98 0 0 1 6 9.98c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6c-.95 0-1.85-.22-2.65-.61l-3.56 6.17C7.34 23.4 9.6 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
            <path d="M12 5.98c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            <path d="M2.52 4.21C.95 6.18 0 8.71 0 12c0 3.29.95 5.82 2.52 7.79L8 12.2c-.01-.07-.02-.14-.02-.22 0-1.46.51-2.8 1.37-3.86L2.52 4.21z"/>
            <path d="M14.72 9.14c.81.82 1.3 1.95 1.3 2.84 0 1.06-.31 2.05-.85 2.88l5.5 3.15c.84-1.43 1.33-3.1 1.33-6.03 0-1.29-.18-2.53-.52-3.7L14.72 9.14z"/>
          </svg>
        </a>
        <span className="status-divider">|</span>
        <span className="status-sort">SORT: {sortMode.toUpperCase()}</span>
        <span className="status-divider">|</span>
        <span className="status-view">VIEW: {listViewMode.toUpperCase()}</span>
        <span className="status-divider">|</span>
        <span className="status-search">SEARCH: {searchMode === 'regex' ? 'REGEX' : 'PLAIN'}</span>
        <span className="status-divider">|</span>
        <button className="status-button" onClick={() => setPanelMode('HELP')} title={`${t.help} (?)`}>
          ?
        </button>
        <button className="status-button" onClick={() => setPanelMode('SETTINGS')} title={t.settings}>
          {t.settings}
        </button>
        <span className="status-divider">|</span>
        <span className="status-version">v{version}</span>
      </div>
    </div>
  );
}

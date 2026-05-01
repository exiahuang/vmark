import { useRef, useEffect } from 'react';
import { useStore, getCategoryLabel } from '../store';
import './SearchBar.css';

export function SearchBar() {
  const { mode, searchQuery, setSearchQuery, commandInput, setCommandInput, setMode, activeCategory, categoryRules, categoryLabels } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'FILTER' || mode === 'COMMAND') {
      inputRef.current?.focus();
    }
  }, [mode]);

  if (mode === 'NORMAL') {
    return (
      <div className="search-bar" onClick={() => setMode('FILTER')} style={{ cursor: 'text' }}>
        <span className="search-hint">{getCategoryLabel(activeCategory, categoryRules, categoryLabels)}</span>
        {searchQuery && <span className="search-query-chip">/{searchQuery}</span>}
        <span className="search-hint">/ edit, Esc dismiss, : command</span>
      </div>
    );
  }

  const isFilter = mode === 'FILTER';
  const prefix = isFilter ? '/' : ':';
  const value = isFilter ? searchQuery : commandInput;
  const setValue = isFilter ? setSearchQuery : setCommandInput;

  return (
    <div className="search-bar">
      <span className="search-prefix">{prefix}</span>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isFilter ? 'search...' : 'command...'}
        autoFocus
      />
      <span className="search-hint">Esc dismisses input</span>
    </div>
  );
}

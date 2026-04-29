import { useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { SearchBar } from './components/SearchBar';
import { ItemList } from './components/ItemList';
import { StatusBar } from './components/StatusBar';
import { OverlayPanel } from './components/OverlayPanel';
import { hydratePersistedState, useStore } from './store';
import { applyTheme } from './themes';
import './App.css';

function App() {
  const { fetchTabs, fetchBookmarks, fetchHistory, theme, activeCategory, searchQuery, panelMode } = useStore();

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      await hydratePersistedState();
      if (cancelled) return;
      await fetchTabs();
      await fetchBookmarks('');
      await fetchHistory('');
    };

    void initialize();

    const interval = setInterval(() => {
      fetchTabs();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchTabs, fetchBookmarks, fetchHistory]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (activeCategory !== 'HISTORY') return;

    const run = async () => {
      await fetchHistory(searchQuery);
    };

    void run();
  }, [activeCategory, searchQuery, fetchHistory]);

  useEffect(() => {
    if (activeCategory !== 'FAVORITES') return;

    const run = async () => {
      await fetchBookmarks(searchQuery);
    };

    void run();
  }, [activeCategory, searchQuery, fetchBookmarks]);

  return (
    <div className="app">
      <TabBar />
      <SearchBar />
      <ItemList />
      <StatusBar />
      {panelMode !== 'NONE' && <OverlayPanel key={panelMode} />}
    </div>
  );
}

export default App;

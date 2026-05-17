import { useEffect, useState, useCallback, useRef } from 'react';
import { TabBar } from './components/TabBar';
import { SearchBar } from './components/SearchBar';
import { ItemList } from './components/ItemList';
import { NotesPanel } from './components/NotesPanel';
import { StatusBar } from './components/StatusBar';
import { OverlayPanel } from './components/OverlayPanel';
import { FilePreview } from './components/FilePreview';
import { hydratePersistedState, loadNotesFromSync, useStore } from './store';
import { useKeyboard } from './hooks/useKeyboard';
import { applyTheme } from './themes';
import { detectFileType } from './utils/filePreview';
import './App.css';

function App() {
  const { fetchTabs, fetchBookmarks, fetchHistory, theme, activeCategory, searchQuery, panelMode } = useStore();

  useKeyboard();

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      await hydratePersistedState();
      if (cancelled) return;
      const notes = await loadNotesFromSync();
      if (notes.length > 0) {
        useStore.setState({ notes });
      }
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
    const run = async () => { await fetchHistory(); };
    void run();
  }, [activeCategory, fetchHistory]);

  useEffect(() => {
    if (activeCategory !== 'FAVORITES') return;
    const run = async () => { await fetchBookmarks(searchQuery); };
    void run();
  }, [activeCategory, searchQuery, fetchBookmarks]);

  const previewUrl = useStore((s) => s.previewUrl);
  const previewFilename = useStore((s) => s.previewFilename);
  const closePreview = useStore((s) => s.closePreview);

  // unknown 类型也用 iframe 加载，所以不限制
  const showPreview = panelMode === 'FILE_PREVIEW' && previewUrl;

  const [previewWidth, setPreviewWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const middleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = previewWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const container = middleRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const delta = startX - e.clientX;
      const newWidth = Math.max(20, Math.min(80, startWidth + (delta / containerWidth) * 100));
      setPreviewWidth(Math.round(newWidth * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [previewWidth]);

  return (
    <div className="app">
      <TabBar />
      <SearchBar />
      <div className="middle-container" ref={middleRef}>
        <div 
          className="list-panel"
          style={{ flex: showPreview ? `0 0 ${100 - previewWidth}%` : '1 1 auto' }}
        >
          {activeCategory === 'NOTES' ? <NotesPanel /> : <ItemList />}
        </div>
        {showPreview && (
          <>
            <div 
              className={`resize-handle ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
            />
            <div 
              className="preview-panel"
              style={{ flex: `0 0 ${previewWidth}%` }}
            >
              <FilePreview url={previewUrl} filename={previewFilename || undefined} onClose={closePreview} />
            </div>
          </>
        )}
      </div>
      <StatusBar />
      {panelMode !== 'NONE' && panelMode !== 'FILE_PREVIEW' && <OverlayPanel key={panelMode} />}
    </div>
  );
}

export default App;

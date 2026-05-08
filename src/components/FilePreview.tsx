import React, { useState, useEffect, useRef } from 'react';
import { detectFileType, getFileTypeDisplayName, preprocessPreviewUrl } from '../utils/filePreview';
import { useStore } from '../store';
import { debugLog } from '../utils/debug';
import './FilePreview.css';

interface FilePreviewProps {
  url: string;
  filename?: string;
  onClose: () => void;
}

const getOfficeViewerUrl = (url: string, officeViewer: string = 'google'): string => {
  if (url.includes('view.officeapps.live.com')) return url;
  if (url.includes('docs.google.com/viewer')) {
    if (!url.includes('embedded=true')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}embedded=true`;
    }
    return url;
  }
  if (officeViewer === 'microsoft') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
};

// HtmlPreview for HTML content (e.g., Stack Overflow API)
const HtmlPreview: React.FC<{ content: string }> = ({ content }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterQueryRef = useRef(filterQuery);

  useEffect(() => { filterQueryRef.current = filterQuery; }, [filterQuery]);

  // Keyboard: f focuses filter, Esc clears, n/m scrolls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === inputRef.current) {
          setFilterQuery('');
          inputRef.current?.blur();
        } else if (filterQueryRef.current) {
          setFilterQuery('');
        }
      }
      if (e.key === 'n') {
        containerRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
      }
      if (e.key === 'm') {
        containerRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      if (!container.hasAttribute('data-focused')) {
        container.setAttribute('data-focused', 'true');
        container.focus();
      }
    }
    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  const getFilteredHtml = () => {
    if (!filterQuery.trim()) return content;
    const lines = content.split('\n');
    const query = filterQuery.toLowerCase();
    const filtered = lines.filter(line => {
      const text = line.replace(/<[^>]*>/g, '');
      return text.toLowerCase().includes(query);
    });
    return filtered.length > 0
      ? filtered.join('\n')
      : '<div class="file-preview-no-match">No matching lines</div>';
  };

  return (
    <div className="file-preview-markdown-container" ref={containerRef} tabIndex={-1}>
      <div className="file-preview-filter-bar">
        <span className="file-preview-filter-prefix">🔍</span>
        <input
          ref={inputRef}
          key="html-filter-input"
          type="text"
          className="file-preview-filter-input"
          placeholder="Filter lines... (Esc to clear)"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        {filterQuery && (
          <button
            className="file-preview-filter-clear"
            onClick={() => { setFilterQuery(''); inputRef.current?.focus(); }}
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>
      <div className="file-preview-markdown" dangerouslySetInnerHTML={{ __html: getFilteredHtml() }} />
    </div>
  );
};

// MarkdownPreview with always-visible filter bar
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const [html, setHtml] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterQueryRef = useRef(filterQuery);

  // Keep ref in sync
  useEffect(() => { filterQueryRef.current = filterQuery; }, [filterQuery]);

  // Load markdown
  useEffect(() => {
    const load = async () => {
      try {
        const marked = await import('marked');
        const result = await (marked as any).marked(content);
        setHtml(result);
      } catch (err) {
        debugLog('Markdown parse error:', err);
      }
    };
    if (content) load();
  }, [content]);

  // Keyboard: f focuses filter, Esc clears, n/m scrolls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === inputRef.current) {
          setFilterQuery('');
          inputRef.current?.blur();
        } else if (filterQueryRef.current) {
          setFilterQuery('');
        }
      }
      if (e.key === 'n') {
        containerRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
      }
      if (e.key === 'm') {
        containerRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      // Focus container once so keyboard events work
      if (!container.hasAttribute('data-focused')) {
        container.setAttribute('data-focused', 'true');
        container.focus();
      }
    }
    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);  // Empty deps: only attach once

  const getFilteredHtml = () => {
    if (!filterQuery.trim()) return html;
    const lines = html.split('\n');
    const query = filterQuery.toLowerCase();
    const filtered = lines.filter(line => {
      const text = line.replace(/<[^>]*>/g, '');
      return text.toLowerCase().includes(query);
    });
    return filtered.length > 0
      ? filtered.join('\n')
      : '<div class="file-preview-no-match">No matching lines</div>';
  };

  return (
    <div className="file-preview-markdown-container" ref={containerRef} tabIndex={-1}>
      <div className="file-preview-filter-bar">
        <span className="file-preview-filter-prefix">🔍</span>
        <input
          ref={inputRef}
          key="md-filter-input"
          type="text"
          className="file-preview-filter-input"
          placeholder="Filter lines... (Esc to clear)"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        {filterQuery && (
          <button
            className="file-preview-filter-clear"
            onClick={() => { setFilterQuery(''); inputRef.current?.focus(); }}
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>
      <div className="file-preview-markdown" dangerouslySetInnerHTML={{ __html: getFilteredHtml() }} />
    </div>
  );
};

// CodePreview with always-visible filter bar + syntax highlighting
const CodePreview: React.FC<{ content: string; filename: string }> = ({ content, filename }) => {
  const [highlighted, setHighlighted] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterQueryRef = useRef(filterQuery);

  // Keep ref in sync
  useEffect(() => { filterQueryRef.current = filterQuery; }, [filterQuery]);

  // Load and highlight code
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const hljs = await import('highlight.js');
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
          'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 'tsx': 'typescript',
          'py': 'python', 'java': 'java', 'c': 'c', 'cpp': 'cpp',
          'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'rb': 'ruby', 'php': 'php',
          'sh': 'bash', 'bash': 'bash', 'sql': 'sql', 'json': 'json',
          'html': 'xml', 'css': 'css', 'scss': 'scss', 'less': 'less',
          'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml', 'toml': 'ini',
        };
        const lang = langMap[ext] || 'plaintext';
        const result = (hljs as any).highlight(content, { language: lang, ignoreIllegals: true });
        if (!cancelled) {
          debugLog('Highlight done, length:', result.value?.length);
          setHighlighted(result.value || content);
        }
      } catch (err) {
        debugLog('Highlight error:', err);
        if (!cancelled) {
          setHighlighted(content);
        }
      }
    };
    if (content) {
      debugLog('Loading highlight for:', filename);
      load();
    }
    return () => { cancelled = true; };
  }, [content, filename]);

  // Keyboard: f focuses filter, Esc clears, n/m scrolls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === inputRef.current) {
          setFilterQuery('');
          inputRef.current?.blur();
        } else if (filterQueryRef.current) {
          setFilterQuery('');
        }
      }
      if (e.key === 'n') {
        containerRef.current?.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
      }
      if (e.key === 'm') {
        containerRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      if (!container.hasAttribute('data-focused')) {
        container.setAttribute('data-focused', 'true');
        container.focus();
      }
    }
    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);  // Empty deps: only attach once

  const getFilteredContent = () => {
    const html = highlighted || content;
    if (!filterQuery.trim()) return html;
    const lines = html.split('\n');
    const query = filterQuery.toLowerCase();
    const filtered = lines.filter(line => {
      const text = line.replace(/<[^>]*>/g, '');
      return text.toLowerCase().includes(query);
    });
    return filtered.length > 0
      ? filtered.join('\n')
      : '<span class="file-preview-no-match">No matching lines</span>';
  };

  return (
    <div className="file-preview-code" ref={containerRef} tabIndex={-1}>
      <div className="file-preview-filter-bar">
        <span className="file-preview-filter-prefix">🔍</span>
        <input
          ref={inputRef}
          key="code-filter-input"
          type="text"
          className="file-preview-filter-input"
          placeholder="Filter lines... (Esc to clear)"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        {filterQuery && (
          <button
            className="file-preview-filter-clear"
            onClick={() => { setFilterQuery(''); inputRef.current?.focus(); }}
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>
      <pre dangerouslySetInnerHTML={{ __html: getFilteredContent() }} />
    </div>
  );
};

export const FilePreview: React.FC<FilePreviewProps> = ({ url, filename, onClose }) => {
  const [fileType, setFileType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const processedUrl = preprocessPreviewUrl(url);
  const officeViewer = useStore((s) => s.officeViewer);

  const displayFilename = filename || processedUrl.split('/').pop() || 'file';

  useEffect(() => {
    const info = detectFileType(processedUrl);
    const detectedType = info.type;
    setFileType(detectedType);
    setContent('');
    setError(null);

    // 这些类型不需要 fetch，直接渲染
    const noFetchTypes = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'pdf', 'image', 'video', 'audio', 'embed'];
    if (noFetchTypes.includes(detectedType) || !detectedType) {
      setLoading(false);
      return;
    }

    // markdown/code/unknown/gist/stackoverflow 都尝试 fetch
    setLoading(true);
    setError(null);

    // 清理 URL（移除 fragment）
    const cleanUrl = processedUrl.split('#')[0];
    console.log('[FilePreview] Fetching via FETCH_PROXY:', cleanUrl, 'type:', detectedType);

    chrome.runtime.sendMessage({ type: 'FETCH_PROXY', url: cleanUrl }, (response) => {
      console.log('[FilePreview] FETCH_PROXY response:', response, 'lastError:', chrome.runtime.lastError);
      if (chrome.runtime.lastError) {
        setError('Failed to load file: ' + chrome.runtime.lastError.message);
        setLoading(false); return;
      }
      if (response?.ok) {
        setContent(response.text);
        setLoading(false);
      } else if (response?.error) {
        setError(response.error);
        setLoading(false);
      } else {
        setError('Failed to load file');
        setLoading(false);
      }
    });
  }, [processedUrl]);

  const getFileIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'pdf': '📕', 'image': '🖼️', 'video': '🎬', 'audio': '🎵',
      'xlsx': '📊', 'xls': '📊', 'docx': '📝', 'doc': '📝',
      'pptx': '📽️', 'ppt': '📽️', 'markdown': '📄', 'code': '💻',
      'unknown': '📄', 'embed': '🎥', 'gist': '📝', 'stackoverflow': '❓',
    };
    return icons[type] || '📄';
  };

  if (!fileType) return null;

  if (loading) {
    return (
      <div className="file-preview-panel">
        <div className="file-preview-header">
          <div className="file-preview-header-info">
            <span className="file-preview-icon">{getFileIcon(fileType)}</span>
            <span className="file-preview-filename">{displayFilename}</span>
          </div>
          <button className="file-preview-btn file-preview-btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="file-preview-content">
          <div className="file-preview-loading">
            <div className="file-preview-spinner" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-preview-panel">
        <div className="file-preview-header">
          <div className="file-preview-header-info">
            <span className="file-preview-icon">{getFileIcon(fileType)}</span>
            <span className="file-preview-filename">{displayFilename}</span>
          </div>
          <button className="file-preview-btn file-preview-btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="file-preview-content">
          <div className="file-preview-error">
            <div className="file-preview-error-text">{error}</div>
            <button className="file-preview-btn" onClick={() => window.open(url, '_blank')}>Open in New Tab</button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (fileType) {
      case 'pdf':
        return <iframe src={processedUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={displayFilename} />;
      case 'image':
        return <img src={processedUrl} alt={displayFilename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
      case 'video':
        return <video src={processedUrl} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90%' }} />;
      case 'audio':
        return (
          <div style={{ flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '64px' }}>🎵</div>
            <audio src={processedUrl} controls autoPlay />
          </div>
        );
      case 'xlsx': case 'xls': case 'docx': case 'doc': case 'pptx': case 'ppt':
        return <iframe src={getOfficeViewerUrl(processedUrl, officeViewer)} style={{ width: '100%', height: '100%', border: 'none' }} title={displayFilename} />;
      case 'markdown':
        return <MarkdownPreview content={content} />;
      case 'code':
        return <CodePreview content={content} filename={displayFilename} />;
      case 'embed':
        return (
          <iframe
            src={processedUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={displayFilename}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        );
      case 'gist':
        return <CodePreview content={content} filename={displayFilename} />;
      case 'stackoverflow':
        return <HtmlPreview content={content} />;
      default:
        // 尝试用 fetch 获取文本内容（通过 background 代理）
        return (
          <div className="file-preview-content">
            {content ? (
              <pre className="file-preview-text">{content}</pre>
            ) : (
              <div className="file-preview-error">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                <p>Unable to preview this file type.</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  The server denied iframe embedding via X-Frame-Options.
                </p>
                <button className="file-preview-btn" onClick={() => window.open(processedUrl, '_blank')}>Open in New Tab</button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="file-preview-panel">
      <div className="file-preview-header">
        <div className="file-preview-header-info">
          <span className="file-preview-icon">{getFileIcon(fileType)}</span>
          <span className="file-preview-filename">{displayFilename}</span>
          <span className="file-preview-type">{getFileTypeDisplayName(fileType as any)}</span>
        </div>
        <div className="file-preview-header-actions">
          <button className="file-preview-btn" onClick={() => window.open(processedUrl, '_blank')}>Open</button>
          <button className="file-preview-btn file-preview-btn-close" onClick={onClose} title="Close preview">✕</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default FilePreview;

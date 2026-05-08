import React, { useState, useEffect, useRef } from 'react';
import { detectFileType, getFileTypeDisplayName, preprocessPreviewUrl } from '../utils/filePreview';
import { useStore } from '../store';
import { debugLog } from '../utils/debug';
import ReadabilityPreview from './ReadabilityPreview';
import './FilePreview.css';

interface FilePreviewProps {
  url: string;
  filename?: string;
  onClose: () => void;
}

const getOfficeViewerUrl = (url: string, officeViewer: string = 'google'): string => {
  // 如果已经是预览URL，直接返回
  if (url.includes('view.officeapps.live.com')) return url;
  if (url.includes('docs.google.com/viewer')) {
    if (!url.includes('embedded=true')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}embedded=true`;
    }
    return url;
  }

  try {
    const urlObj = new URL(url);
    
    // SharePoint 文件处理 - 支持公司域名
    const isSharePoint = urlObj.hostname.includes('sharepoint.com') || 
                        urlObj.hostname.includes('.sharepoint.') ||
                        url.includes('/_layouts/') ||
                        url.includes('/sites/') ||
                        url.includes('/Shared%20Documents/') ||
                        url.includes('/Documents/');
    
    if (isSharePoint) {
      // SharePoint Doc.aspx 格式
      if (url.includes('/_layouts/15/Doc.aspx') || url.includes('/_layouts/16/Doc.aspx')) {
        const match = url.match(/sourcedoc=([^&]+)/);
        if (match) {
          const sourceDoc = decodeURIComponent(match[1]);
          const downloadUrl = `${urlObj.origin}${sourceDoc}?download=1`;
          return officeViewer === 'microsoft' 
            ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
            : `https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}&embedded=true`;
        }
      }
      
      // 标准 SharePoint 文件路径
      if (urlObj.pathname.includes('/Shared Documents/') || 
          urlObj.pathname.includes('/Documents/') ||
          urlObj.pathname.includes('/sites/')) {
        const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=1`;
        return officeViewer === 'microsoft' 
          ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
          : `https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}&embedded=true`;
      }
    }

    // Google Drive 文件处理
    if (urlObj.hostname === 'drive.google.com') {
      const match = urlObj.pathname.match(/\/file\/d\/([^\/]+)/);
      if (match) {
        const fileId = match[1];
        return `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${fileId}&export=download&embedded=true`;
      }
    }
  } catch {
    // ignore
  }

  // 默认处理
  if (officeViewer === 'microsoft') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  } else {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
};

// OfficeDocumentPreview with fallback options and SharePoint support
const OfficeDocumentPreview: React.FC<{ 
  url: string; 
  fileType: string; 
  officeViewer: string;
  displayFilename: string;
}> = ({ url, fileType, officeViewer, displayFilename }) => {
  const [currentViewer, setCurrentViewer] = useState(officeViewer);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSharePointUrl = url.includes('sharepoint.com') || 
                       url.includes('.sharepoint.') ||
                       url.includes('/_layouts/') ||
                       url.includes('/sites/') ||
                       url.includes('/Shared%20Documents/') ||
                       url.includes('/Documents/');

  const getViewerUrl = (viewer: string) => {
    return getOfficeViewerUrl(url, viewer);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const switchViewer = () => {
    const newViewer = currentViewer === 'google' ? 'microsoft' : 'google';
    setCurrentViewer(newViewer);
    setLoadError(false);
    setIsLoading(true);
  };

  const getFileTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'xlsx': '📊', 'xls': '📊',
      'docx': '📝', 'doc': '📝',
      'pptx': '📽️', 'ppt': '📽️',
    };
    return icons[type] || '📄';
  };

  const getSharePointDirectUrl = () => {
    try {
      const urlObj = new URL(url);
      if (url.includes('/_layouts/15/Doc.aspx') || url.includes('/_layouts/16/Doc.aspx')) {
        const match = url.match(/sourcedoc=([^&]+)/);
        if (match) {
          const sourceDoc = decodeURIComponent(match[1]);
          return `${urlObj.origin}${sourceDoc}`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loadError) {
    return (
      <div className="file-preview-office-error">
        <div className="file-preview-error-icon">{getFileTypeIcon(fileType)}</div>
        <div className="file-preview-error-title">Preview Not Available</div>
        <div className="file-preview-error-text">
          The {currentViewer === 'google' ? 'Google Docs Viewer' : 'Microsoft Office Online'} 
          {' '}cannot display this document.
          {isSharePointUrl && ' SharePoint files may require authentication.'}
        </div>
        <div className="file-preview-error-actions">
          <button className="file-preview-btn" onClick={switchViewer}>
            Try {currentViewer === 'google' ? 'Microsoft' : 'Google'} Viewer
          </button>
          {isSharePointUrl && (
            <button 
              className="file-preview-btn" 
              onClick={() => window.open(getSharePointDirectUrl(), '_blank')}
            >
              Open SharePoint File
            </button>
          )}
          <button className="file-preview-btn" onClick={() => window.open(url, '_blank')}>
            Open Original
          </button>
        </div>
        <div className="file-preview-error-help">
          <p>Possible solutions:</p>
          <ul>
            <li>Try switching between Google and Microsoft viewers</li>
            {isSharePointUrl && <li>Log in to SharePoint first, then try again</li>}
            <li>Download the file to view locally</li>
            <li>Check if the file requires special permissions</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="file-preview-office-container">
      {isLoading && (
        <div className="file-preview-office-loading">
          <div className="file-preview-spinner" />
          <span>
            Loading {currentViewer === 'google' ? 'Google Docs Viewer' : 'Microsoft Office Online'}...
            {isSharePointUrl && ' (SharePoint file)'}
          </span>
        </div>
      )}
      <iframe
        src={getViewerUrl(currentViewer)}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          display: isLoading ? 'none' : 'block'
        }}
        title={displayFilename}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      {!isLoading && !loadError && (
        <div className="file-preview-office-controls">
          <span className="file-preview-office-viewer">
            {currentViewer === 'google' ? 'Google Docs' : 'Microsoft Office'}
            {isSharePointUrl && ' (SharePoint)'}
          </span>
          <button 
            className="file-preview-btn file-preview-btn-small" 
            onClick={switchViewer}
            title={`Switch to ${currentViewer === 'google' ? 'Microsoft' : 'Google'} viewer`}
          >
            Switch Viewer
          </button>
        </div>
      )}
    </div>
  );
};

// CsvPreview for CSV data with table rendering and pagination
const CsvPreview: React.FC<{ content: string }> = ({ content }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(100); // Show 100 rows per page
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterQueryRef = useRef(filterQuery);

  useEffect(() => { filterQueryRef.current = filterQuery; }, [filterQuery]);

  // Parse CSV content
  useEffect(() => {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Limit parsing for very large files
    const maxLines = 10000; // Limit to 10k lines for performance
    const linesToProcess = lines.slice(0, maxLines);
    
    const data = linesToProcess.map(line => {
      // Simple CSV parsing - handles basic cases
      const cells = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
    
    setParsedData(data);
    setCurrentPage(0);
    
    if (lines.length > maxLines) {
      console.log(`[CsvPreview] Large CSV detected, showing first ${maxLines} rows of ${lines.length}`);
    }
  }, [content]);

  // Keyboard navigation
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

  const getFilteredData = () => {
    if (!filterQuery.trim()) return parsedData;
    const query = filterQuery.toLowerCase();
    return parsedData.filter(row => 
      row.some(cell => cell.toLowerCase().includes(query))
    );
  };

  const filteredData = getFilteredData();
  const headers = parsedData[0] || [];
  const dataRows = filteredData.slice(1);
  
  // Pagination
  const totalPages = Math.ceil(dataRows.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, dataRows.length);
  const currentRows = dataRows.slice(startIndex, endIndex);

  return (
    <div className="file-preview-markdown-container" ref={containerRef} tabIndex={-1}>
      <div className="file-preview-filter-bar">
        <span className="file-preview-filter-prefix">🔍</span>
        <input
          ref={inputRef}
          key="csv-filter-input"
          type="text"
          className="file-preview-filter-input"
          placeholder="Filter rows... (Esc to clear)"
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
        <span className="file-preview-csv-info">
          {dataRows.length} rows {totalPages > 1 && `(page ${currentPage + 1}/${totalPages})`}
        </span>
      </div>
      <div className="file-preview-csv-table">
        <table>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, i) => (
              <tr key={startIndex + i}>
                {row.map((cell, j) => (
                  <td key={j} title={cell.length > 50 ? cell : undefined}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {currentRows.length === 0 && filterQuery && (
          <div className="file-preview-no-match">No matching rows</div>
        )}
        {totalPages > 1 && (
          <div className="file-preview-csv-pagination">
            <button 
              className="file-preview-btn file-preview-btn-small"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              First
            </button>
            <button 
              className="file-preview-btn file-preview-btn-small"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <span className="file-preview-csv-page-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button 
              className="file-preview-btn file-preview-btn-small"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>
            <button 
              className="file-preview-btn file-preview-btn-small"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
            >
              Last
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// JsonPreview for JSON data with syntax highlighting and collapsible structure
const JsonPreview: React.FC<{ content: string }> = ({ content }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [formattedJson, setFormattedJson] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterQueryRef = useRef(filterQuery);

  useEffect(() => { filterQueryRef.current = filterQuery; }, [filterQuery]);

  // Parse and format JSON
  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedJson(formatted);
      setIsValidJson(true);
    } catch {
      setFormattedJson(content);
      setIsValidJson(false);
    }
  }, [content]);

  // Keyboard navigation
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

  const getFilteredJson = () => {
    if (!filterQuery.trim()) return formattedJson;
    const lines = formattedJson.split('\n');
    const query = filterQuery.toLowerCase();
    const filtered = lines.filter(line => 
      line.toLowerCase().includes(query)
    );
    return filtered.length > 0
      ? filtered.join('\n')
      : 'No matching lines';
  };

  return (
    <div className="file-preview-code" ref={containerRef} tabIndex={-1}>
      <div className="file-preview-filter-bar">
        <span className="file-preview-filter-prefix">🔍</span>
        <input
          ref={inputRef}
          key="json-filter-input"
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
        {!isValidJson && (
          <span className="file-preview-json-warning" title="Invalid JSON format">
            ⚠️ Invalid JSON
          </span>
        )}
      </div>
      <pre className="file-preview-json">{getFilteredJson()}</pre>
    </div>
  );
};

// XmlPreview for XML data with syntax highlighting
const XmlPreview: React.FC<{ content: string }> = ({ content }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [formattedXml, setFormattedXml] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterQueryRef = useRef(filterQuery);

  useEffect(() => { filterQueryRef.current = filterQuery; }, [filterQuery]);

  // Format XML content
  useEffect(() => {
    try {
      // Simple XML formatting
      let formatted = content
        .replace(/></g, '>\n<')
        .replace(/^\s*\n/gm, '');
      
      // Add indentation
      const lines = formatted.split('\n');
      let indent = 0;
      const indentedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 1);
        }
        const result = '  '.repeat(indent) + trimmed;
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
          indent++;
        }
        return result;
      });
      
      setFormattedXml(indentedLines.join('\n'));
    } catch {
      setFormattedXml(content);
    }
  }, [content]);

  // Keyboard navigation
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

  const getFilteredXml = () => {
    if (!filterQuery.trim()) return formattedXml;
    const lines = formattedXml.split('\n');
    const query = filterQuery.toLowerCase();
    const filtered = lines.filter(line => 
      line.toLowerCase().includes(query)
    );
    return filtered.length > 0
      ? filtered.join('\n')
      : 'No matching lines';
  };

  return (
    <div className="file-preview-code" ref={containerRef} tabIndex={-1}>
      <div className="file-preview-filter-bar">
        <span className="file-preview-filter-prefix">🔍</span>
        <input
          ref={inputRef}
          key="xml-filter-input"
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
      <pre className="file-preview-xml">{getFilteredXml()}</pre>
    </div>
  );
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
  const [retryCount, setRetryCount] = useState(0);
  const processedUrl = preprocessPreviewUrl(url);
  const officeViewer = useStore((s) => s.officeViewer);

  const displayFilename = filename || processedUrl.split('/').pop() || 'file';

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
  };

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

    // markdown/code/csv/json/xml/gist/stackoverflow/readability 尝试 fetch
    setLoading(true);
    setError(null);

    const cleanUrl = processedUrl.split('#')[0];
    console.log('[FilePreview] Fetching:', cleanUrl, 'type:', detectedType);

    chrome.runtime.sendMessage({ type: 'FETCH_PROXY', url: cleanUrl }, (response) => {
      if (chrome.runtime.lastError) {
        setError(`Network error: ${chrome.runtime.lastError.message}`);
        setLoading(false);
        return;
      }
      
      if (response?.ok) {
        setContent(response.text || '');
        setLoading(false);
      } else {
        setError(response?.error || 'Failed to load file');
        setLoading(false);
      }
    });
  }, [processedUrl, retryCount]);

  const getFileIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'pdf': '📕', 'image': '🖼️', 'video': '🎬', 'audio': '🎵',
      'xlsx': '📊', 'xls': '📊', 'docx': '📝', 'doc': '📝',
      'pptx': '📽️', 'ppt': '📽️', 'markdown': '📄', 'code': '💻',
      'csv': '📋', 'json': '📋', 'xml': '📋',
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
            <span>Loading{retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}...</span>
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
            <div className="file-preview-error-icon">⚠️</div>
            <div className="file-preview-error-title">Preview Failed</div>
            <div className="file-preview-error-text">{error}</div>
            <div className="file-preview-error-actions">
              {retryCount < 2 && (
                <button className="file-preview-btn" onClick={handleRetry}>
                  Retry {retryCount > 0 ? `(${retryCount + 1}/3)` : ''}
                </button>
              )}
              <button className="file-preview-btn" onClick={() => window.open(processedUrl, '_blank')}>
                Open in New Tab
              </button>
            </div>
            {retryCount >= 2 && (
              <div className="file-preview-error-help">
                <p>Still having trouble? Try:</p>
                <ul>
                  <li>Check your internet connection</li>
                  <li>Verify the file URL is correct</li>
                  <li>The file server may be temporarily unavailable</li>
                </ul>
              </div>
            )}
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
        return (
          <OfficeDocumentPreview 
            url={processedUrl} 
            fileType={fileType}
            officeViewer={officeViewer}
            displayFilename={displayFilename}
          />
        );
      case 'markdown':
        return <MarkdownPreview content={content} />;
      case 'code':
        return <CodePreview content={content} filename={displayFilename} />;
      case 'csv':
        return <CsvPreview content={content} />;
      case 'json':
        return <JsonPreview content={content} />;
      case 'xml':
        return <XmlPreview content={content} />;
      case 'readability':
        return <ReadabilityPreview content={content} />;
      case 'embed':
        return (
          <iframe
            src={processedUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={displayFilename}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        );
      case 'gist':
        return <CodePreview content={content} filename={displayFilename} />;
      case 'stackoverflow':
        return <HtmlPreview content={content} />;
      default:
        // 对于unknown类型，尝试iframe预览
        return (
          <div className="file-preview-iframe-container">
            <iframe
              src={processedUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={displayFilename}
              onLoad={() => console.log('[FilePreview] Iframe loaded successfully')}
              onError={() => console.log('[FilePreview] Iframe failed to load')}
            />
            <div className="file-preview-iframe-fallback">
              <p>If the preview doesn't load properly:</p>
              <button className="file-preview-btn" onClick={() => window.open(processedUrl, '_blank')}>
                Open in New Tab
              </button>
            </div>
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

import { useEffect, useRef, useCallback } from 'react';
import type { TabItem, TabCategory } from '../types';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  item: TabItem;
  category: TabCategory;
  onClose: () => void;
  onAction: (action: 'open' | 'open-bg' | 'bookmark' | 'delete' | 'copy-url' | 'copy-title') => void;
}

export function ContextMenu({ x, y, item, category, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const isFavorite = category === 'FAVORITES';

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  const menuItems = [
    {
      label: 'Open',
      action: 'open' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ),
    },
    {
      label: 'Open in background',
      action: 'open-bg' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
    { type: 'separator' },
    {
      label: isFavorite ? 'Remove bookmark' : 'Add bookmark',
      action: 'bookmark' as const,
      icon: isFavorite ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Delete / Trash',
      action: 'delete' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      danger: true,
    },
    { type: 'separator' },
    {
      label: 'Copy URL',
      action: 'copy-url' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
    },
    {
      label: 'Copy title',
      action: 'copy-title' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
  ];

  const adjustedPosition = useCallback(() => {
    const menuWidth = 200;
    const menuHeight = menuItems.length * 32;
    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth) {
      adjustedX = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      adjustedY = y - menuHeight;
    }

    return { left: adjustedX, top: adjustedY };
  }, [x, y, menuItems.length]);

  const position = adjustedPosition();

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.left, top: position.top }}
    >
      <div className="context-menu-header">
        <span className="context-menu-title">{item.title || item.url}</span>
      </div>
      {menuItems.map((item, index) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={index} className="context-menu-separator" />;
        }
        const menuItem = item as Exclude<typeof item, { type: string }>;
        return (
          <button
            key={menuItem.action}
            className={`context-menu-item ${menuItem.danger ? 'danger' : ''}`}
            onClick={() => {
              onAction(menuItem.action);
            }}
          >
            <span className="context-menu-icon">{menuItem.icon}</span>
            <span className="context-menu-label">{menuItem.label}</span>
          </button>
        );
      })}
    </div>
  );
}

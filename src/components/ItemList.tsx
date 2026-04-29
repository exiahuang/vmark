import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, getFilteredItems, getVisibleItems, getGroupedItemsByDomain, getItemDisplayTitle, openTabItem } from '../store';
import { useKeyboard } from '../hooks/useKeyboard';
import type { TabItem, TabCategory } from '../types';
import { ContextMenu } from './ContextMenu';
import './ItemList.css';

export function ItemList() {
  const {
    selectedIndex,
    listViewMode,
    searchQuery,
    itemRenames,
    groupCollapsed,
    toggleGroupCollapsed,
    setSelectedIndex,
    activeCategory,
    fetchHistory,
  } = useStore();
  const state = useStore.getState();
  const items = getFilteredItems(state);
  const visibleItems = getVisibleItems(state);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemIndexById = new Map(visibleItems.map((item, index) => [item.id, index]));

  useKeyboard();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: TabItem;
    category: TabCategory;
  } | null>(null);

  const handleContextMenuClose = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (visibleItems.length === 0) return;
    if (selectedIndex >= visibleItems.length) {
      setSelectedIndex(visibleItems.length - 1);
    }
  }, [visibleItems.length, selectedIndex, setSelectedIndex]);

  useEffect(() => {
    const selectedRow = rowRefs.current[selectedIndex];
    selectedRow?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, visibleItems.length, listViewMode]);

  if (items.length === 0) {
    return (
      <div className="item-list" onClick={handleContextMenuClose}>
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <div className="empty-text">No items found</div>
          <div className="empty-hint">{searchQuery ? 'Try a different search' : 'Open some tabs to get started'}</div>
        </div>
      </div>
    );
  }

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleItemDoubleClick = async (item: TabItem) => {
    await openTabItem(item, true);
    useStore.getState().addToHistory(item);
    await fetchHistory(useStore.getState().searchQuery);
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: TabItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      category: activeCategory,
    });
  };

  const handleContextMenuAction = async (action: 'open' | 'open-bg' | 'bookmark' | 'delete' | 'copy-url' | 'copy-title') => {
    if (!contextMenu) return;
    const { item, category } = contextMenu;
    const state = useStore.getState();

    switch (action) {
      case 'open':
        await openTabItem(item, true);
        state.addToHistory(item);
        await state.fetchHistory(state.searchQuery);
        break;
      case 'open-bg':
        await openTabItem(item, false);
        break;
      case 'bookmark':
        if (category !== 'FAVORITES') {
          await state.addFavorite(item);
        }
        break;
      case 'delete':
        await state.trashItem(item, category);
        break;
      case 'copy-url':
        await navigator.clipboard.writeText(item.url);
        break;
      case 'copy-title':
        const title = getItemDisplayTitle(item, state.itemRenames);
        await navigator.clipboard.writeText(title);
        break;
    }
    setContextMenu(null);
  };

  const groupedItems = listViewMode === 'grouped' ? getGroupedItemsByDomain(items) : [];

  return (
    <div className="item-list">
      {listViewMode === 'grouped' ? (
        groupedItems.map((group) => {
          const collapsed = !!groupCollapsed[group.key];
          return (
            <section className="item-group" key={group.key}>
              <button
                type="button"
                className={`item-group-header ${collapsed ? 'collapsed' : ''}`}
                onClick={() => toggleGroupCollapsed(group.key)}
              >
                <span className="item-group-icon">
                  {group.iconUrl ? (
                    <img
                      src={group.iconUrl}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="item-group-fallback">{group.fallback}</span>
                  )}
                </span>
                <span className="item-group-name">{group.label}</span>
                <span className="item-group-count">{group.items.length}</span>
                <span className="item-group-toggle">{collapsed ? '+' : '–'}</span>
              </button>
                {!collapsed && (
                <div className="item-group-body">
                  {group.items.map((item) => {
                    const index = itemIndexById.get(item.id) ?? -1;
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        isSelected={index === selectedIndex}
                        viewMode={listViewMode}
                        displayTitle={getItemDisplayTitle(item, itemRenames)}
                        itemRef={(node) => {
                          if (index >= 0) {
                            rowRefs.current[index] = node;
                          }
                        }}
                        index={index}
                        onSelect={handleItemClick}
                        onDoubleClick={handleItemDoubleClick}
                        onContextMenu={handleItemContextMenu}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      ) : (
        items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            isSelected={index === selectedIndex}
            viewMode={listViewMode}
            displayTitle={getItemDisplayTitle(item, itemRenames)}
            itemRef={(node) => {
              rowRefs.current[index] = node;
            }}
            index={index}
            onSelect={handleItemClick}
            onDoubleClick={handleItemDoubleClick}
            onContextMenu={handleItemContextMenu}
          />
        ))
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          category={contextMenu.category}
          onClose={handleContextMenuClose}
          onAction={handleContextMenuAction}
        />
      )}
    </div>
  );
}

interface ItemRowProps {
  item: TabItem;
  isSelected: boolean;
  viewMode: 'compact' | 'detailed' | 'grouped';
  itemRef: (node: HTMLDivElement | null) => void;
  displayTitle: string;
  index: number;
  onSelect: (index: number) => void;
  onDoubleClick: (item: TabItem) => void;
  onContextMenu: (e: React.MouseEvent, item: TabItem) => void;
}

function ItemRow({ item, isSelected, viewMode, itemRef, displayTitle, index, onSelect, onDoubleClick, onContextMenu }: ItemRowProps) {
  const hostname = getHostname(item.url);
  const faviconUrl = item.favIconUrl || (hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=16` : '');

  return (
    <div
      ref={itemRef}
      className={`item-row ${isSelected ? 'selected' : ''} ${viewMode}`}
      onClick={() => onSelect(index)}
      onDoubleClick={() => onDoubleClick(item)}
      onContextMenu={(e) => onContextMenu(e, item)}
    >
      {viewMode === 'detailed' && (
        <div className="item-favicon">
          {faviconUrl && <img src={faviconUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
        </div>
      )}
      <div className="item-content">
        <div className="item-title">{displayTitle || hostname}</div>
        {viewMode === 'detailed' && (
          <div className="item-url">{item.url}</div>
        )}
      </div>
      {(viewMode === 'compact' || viewMode === 'grouped') && (
        <div className="item-hostname">{hostname}</div>
      )}
    </div>
  );
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

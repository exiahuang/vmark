import { useEffect, useCallback } from 'react';
import { useStore, getFilteredItems, getVisibleItems, getVisibleGroupedItems, getGroupedItemsByDomain, getGroupKey, openTabItem } from '../store';
import type { TabCategory } from '../types';

const TAB_CATEGORIES: TabCategory[] = ['CURRENT', 'FAVORITES', 'HISTORY', 'SNS', 'NEWS', 'RESERVED', 'TECH', 'CLOUD', 'LAN'];
let lastGPressAt = 0;

function cycleCategory(state: ReturnType<typeof useStore.getState>, delta: number, setActiveCategory: (category: TabCategory) => void) {
  const currentIdx = TAB_CATEGORIES.indexOf(state.activeCategory);
  const nextIdx = (currentIdx + delta + TAB_CATEGORIES.length) % TAB_CATEGORIES.length;
  setActiveCategory(TAB_CATEGORIES[nextIdx]);
}

export function useKeyboard() {
  const {
    setMode,
    setPanelMode,
    setActiveCategory,
    setCommandInput,
    setSortMode,
    setListViewMode,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    addFavorite,
    removeFavorite,
    addToHistory,
    fetchTabs,
    fetchHistory,
    trashItem,
    setItemRename,
  } = useStore();

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    const { key, ctrlKey, metaKey } = e;
    const state = useStore.getState();
    const filtered = getVisibleItems(state);
    const currentItem = filtered[state.selectedIndex];

    if (key === 'Escape') {
      e.preventDefault();
      if (state.panelMode !== 'NONE') {
        setPanelMode('NONE');
        return;
      }
      if (state.mode === 'FILTER') {
        setMode('NORMAL');
        return;
      }
      setMode('NORMAL');
      return;
    }

    if (state.panelMode !== 'NONE') {
      return;
    }

    if (key === '/' && state.mode === 'NORMAL') {
      e.preventDefault();
      setMode('FILTER');
      return;
    }

    if (key === ':' && state.mode === 'NORMAL') {
      e.preventDefault();
      setMode('COMMAND');
      return;
    }

    if (state.mode === 'FILTER') {
      if (key === 'Enter') {
        e.preventDefault();
        if (currentItem) {
          await openTabItem(currentItem, true);
          addToHistory(currentItem);
          await fetchHistory(useStore.getState().searchQuery);
        }
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        selectNext();
        return;
      }
      if (key === 'ArrowUp') {
        e.preventDefault();
        selectPrevious();
        return;
      }
      return;
    }

    if (state.mode === 'COMMAND') {
      if (key === 'Enter') {
        e.preventDefault();
        await executeCommand(state.commandInput);
        setCommandInput('');
        setMode('NORMAL');
        return;
      }
      if (key === 'Backspace' && state.commandInput === '') {
        setMode('NORMAL');
        return;
      }
      return;
    }

    if (key === 'j' && !ctrlKey && !metaKey) {
      e.preventDefault();
      selectNext();
      return;
    }

    if (key === 'k' && !ctrlKey && !metaKey) {
      e.preventDefault();
      selectPrevious();
      return;
    }

    if (key === 'h' && !ctrlKey && !metaKey) {
      e.preventDefault();
      cycleCategory(state, -1, setActiveCategory);
      return;
    }

    if (key === 'Enter' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        await openTabItem(currentItem, true);
        addToHistory(currentItem);
        await fetchHistory(useStore.getState().searchQuery);
      }
      return;
    }

    if (key === 'g' && !ctrlKey && !metaKey) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastGPressAt < 400) {
        selectFirst();
      }
      lastGPressAt = now;
      return;
    }

    if (key === 'G' && !ctrlKey && !metaKey) {
      e.preventDefault();
      selectLast();
      return;
    }

    if (key === 'd' && ctrlKey) {
      e.preventDefault();
      const pageSize = Math.floor(filtered.length / 2);
      const newIndex = Math.min(filtered.length - 1, state.selectedIndex + pageSize);
      useStore.getState().setSelectedIndex(newIndex);
      return;
    }

    if (key === 'u' && ctrlKey) {
      e.preventDefault();
      const pageSize = Math.floor(filtered.length / 2);
      const newIndex = Math.max(0, state.selectedIndex - pageSize);
      useStore.getState().setSelectedIndex(newIndex);
      return;
    }

    if (key >= '1' && key <= '9' && !ctrlKey && !metaKey) {
      e.preventDefault();
      const idx = parseInt(key) - 1;
      if (TAB_CATEGORIES[idx]) {
        setActiveCategory(TAB_CATEGORIES[idx]);
      }
      return;
    }

    if (key === 'H' && !ctrlKey && !metaKey) {
      e.preventDefault();
      cycleCategory(state, -1, setActiveCategory);
      return;
    }

    if (key === 'L' && !ctrlKey && !metaKey) {
      e.preventDefault();
      cycleCategory(state, 1, setActiveCategory);
      return;
    }

    if (key === 'l' && !ctrlKey && !metaKey) {
      e.preventDefault();
      cycleCategory(state, 1, setActiveCategory);
      return;
    }

    if (key === '[' && !ctrlKey && !metaKey) {
      e.preventDefault();
      cycleCategory(state, -1, setActiveCategory);
      return;
    }

    if (key === ']' && !ctrlKey && !metaKey) {
      e.preventDefault();
      cycleCategory(state, 1, setActiveCategory);
      return;
    }

    if (key === 'o' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        await openTabItem(currentItem, true);
      }
      return;
    }

    if (key === 'O' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        await openTabItem(currentItem, false);
      }
      return;
    }

    if (key === 'a' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem && state.activeCategory !== 'FAVORITES') {
        await addFavorite(currentItem);
      }
      return;
    }

    if (key === 'd' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (state.activeCategory === 'FAVORITES' && currentItem) {
        await removeFavorite(currentItem.url);
      }
      return;
    }

    if (key === 'x' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        await trashItem(currentItem, state.activeCategory);
      }
      return;
    }

    if (key === 'y' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        await navigator.clipboard.writeText(currentItem.url);
      }
      return;
    }

    if (key === 't' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        await navigator.clipboard.writeText(getItemLabel(currentItem, state.itemRenames));
      }
      return;
    }

    if (key === 'R' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (currentItem) {
        const currentLabel = getItemLabel(currentItem, state.itemRenames);
        const nextLabel = window.prompt('Rename item', currentLabel);
        if (nextLabel !== null) {
          setItemRename(currentItem.url, nextLabel);
        }
      }
      return;
    }

    if (key === 'z' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (state.listViewMode === 'grouped' && currentItem) {
        const groupKey = getGroupKey(currentItem.url);
        if (groupKey) {
          useStore.getState().toggleGroupCollapsed(groupKey);
        }
      }
      return;
    }

    if (key === 'Z' && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (state.listViewMode === 'grouped') {
        const groups = getGroupedItemsByDomain(getFilteredItems(state));
        const allCollapsed = groups.length > 0 && groups.every((group) => state.groupCollapsed[group.key]);
        useStore.getState().setGroupCollapsedForKeys(groups.map((group) => group.key), !allCollapsed);
      }
      return;
    }

    if ((key === 'J' || key === 'K') && !ctrlKey && !metaKey) {
      e.preventDefault();
      if (state.listViewMode === 'grouped') {
        const groups = getVisibleGroupedItems(state);
        if (groups.length === 0 || !currentItem) return;

        const currentGroupKey = getGroupKey(currentItem.url);
        let groupIndex = groups.findIndex((group) => group.key === currentGroupKey);
        if (groupIndex === -1) {
          groupIndex = 0;
        } else {
          const delta = key === 'J' ? 1 : -1;
          const nextIndex = Math.max(0, Math.min(groups.length - 1, groupIndex + delta));
          if (nextIndex === groupIndex) return;
          groupIndex = nextIndex;
        }

        const visibleItems = getVisibleItems(state);
        const targetItem = groups[groupIndex]?.items[0];
        if (!targetItem) return;

        const targetIndex = visibleItems.findIndex((item) => item.id === targetItem.id);
        if (targetIndex >= 0) {
          useStore.getState().setSelectedIndex(targetIndex);
        }
      }
      return;
    }

    if (key === 's' && !ctrlKey && !metaKey) {
      e.preventDefault();
      setSortMode(state.sortMode === 'time' ? 'frequency' : 'time');
      return;
    }

    if (key === 'S' && !ctrlKey && !metaKey) {
      e.preventDefault();
      setPanelMode('SETTINGS');
      return;
    }

    if (key === 'v' && !ctrlKey && !metaKey) {
      e.preventDefault();
      setListViewMode(
        state.listViewMode === 'compact'
          ? 'detailed'
          : state.listViewMode === 'detailed'
            ? 'grouped'
            : 'compact'
      );
      return;
    }

    if (key === 'q' && !ctrlKey && !metaKey) {
      e.preventDefault();
      window.close();
      return;
    }

    if (key === '?' && !ctrlKey && !metaKey) {
      e.preventDefault();
      setPanelMode('HELP');
      return;
    }

    if (key === 'r' && !ctrlKey && !metaKey) {
      e.preventDefault();
      fetchTabs();
      return;
    }

    if (key === 'f' && ctrlKey) {
      e.preventDefault();
      setMode('FILTER');
      return;
    }
  }, [
    setMode,
    setPanelMode,
    setActiveCategory,
    setCommandInput,
    setSortMode,
    setListViewMode,
    addFavorite,
    removeFavorite,
    addToHistory,
    fetchTabs,
    fetchHistory,
    trashItem,
    setItemRename,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCommandInput = useCallback((value: string) => {
    setCommandInput(value);
  }, [setCommandInput]);

  return {
    handleCommandInput,
  };
}

async function executeCommand(input: string) {
  const cmd = input.trim().toLowerCase();

  switch (cmd) {
    case 'reload':
    case 'r':
      await useStore.getState().fetchTabs();
      break;
    case 'clear':
      break;
    case 'settings':
      useStore.getState().setPanelMode('SETTINGS');
      break;
    case 'help':
    case '?':
      useStore.getState().setPanelMode('HELP');
      break;
    case 'reindex':
      await useStore.getState().fetchTabs();
      break;
  }
}

function getItemLabel(item: { title: string; url: string }, renames: Record<string, string>): string {
  return renames[item.url] || item.title || item.url;
}

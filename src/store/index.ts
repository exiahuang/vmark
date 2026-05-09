import { create } from 'zustand';
import type {
  AppState,
  TabCategory,
  TabItem,
  ViewMode,
  SortMode,
  ListViewMode,
  PanelMode,
  SearchMode,
  OfficeViewer,
  CategoryRule,
  Language
} from '../types';
import { getTranslations } from '../i18n';
import { preprocessPreviewUrl, detectFileType } from '../utils/filePreview';

export const DEFAULT_RULES: Record<string, CategoryRule> = {
  SNS: {
    id: 'sns',
    name: 'Social',
    domains: ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'reddit.com'],
    titleKeywords: ['Hacker News'],
  },
  NEWS: {
    id: 'news',
    name: 'News',
    domains: ['news.ycombinator.com', 'cnn.com', 'bbc.com', 'reuters.com'],
  },
  RESERVED: {
    id: 'reserved',
    name: 'Reserved',
  },
  TECH: {
    id: 'tech',
    name: 'Tech',
    domains: ['github.com', 'stackoverflow.com', 'medium.com', 'dev.to', 'docs.rs'],
    titleKeywords: ['GitHub', 'Stack Overflow'],
  },
  CLOUD: {
    id: 'cloud',
    name: 'Cloud',
    domains: [
      'vercel.com',
      'netlify.com',
      'heroku.com',
      'salesforce.com',
      'aws.amazon.com',
      'cloud.google.com',
      'azure.microsoft.com',
      'aliyun.com',
      'alibabacloud.com',
      'aliyuncs.com',
      'tencentcloud.com',
      'cloud.tencent.com',
    ],
  },
  LAN: {
    id: 'lan',
    name: 'LAN',
    urlRegex: '^https?://(192\\.168\\.|10\\.|172\\.1[6-9]\\.|172\\.2[0-9]\\.|172\\.3[0-1]\\.|localhost)',
  },
};

const AUTO_CATEGORIES: TabCategory[] = ['SNS', 'NEWS', 'RESERVED', 'TECH', 'CLOUD', 'LAN'];
type CategorySourceState = Pick<AppState, 'items' | 'favorites' | 'browserHistory'> & Partial<Pick<AppState, 'activeCategory'>>;
type PersistedState = Pick<AppState, 'history' | 'theme' | 'language' | 'sortMode' | 'listViewMode' | 'categoryRules' | 'categoryLabels' | 'itemRenames' | 'groupCollapsed' | 'historyMaxResults' | 'pdfViewer' | 'pptxViewer' | 'xlsxViewer' | 'docxViewer' | 'debug'>;
type CoreCategoryLabelState = Pick<AppState, 'categoryLabels'>;
const STORAGE_KEY = 'vmark.state';
export const DEFAULT_CATEGORY_LABELS = {
  CURRENT: 'Current',
  FAVORITES: 'Favorites',
  HISTORY: 'History',
} as const;

function getRenamedTitle(item: TabItem, renames: Record<string, string>): string {
  return renames[item.url] || item.title || item.url;
}

export function getItemDisplayTitle(item: TabItem, renames: Record<string, string> = {}): string {
  return getRenamedTitle(item, renames);
}

function dedupeByUrl(items: TabItem[]): TabItem[] {
  const seen = new Set<string>();
  const result: TabItem[] = [];

  for (const item of items) {
    const key = normalizeUrlKey(item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.toString();
  } catch {
    return url.trim().toLowerCase();
  }
}

async function savePersistedState(): Promise<void> {
  try {
    await Promise.resolve();
    const state = useStore.getState();
    await chrome.storage.local.set({
      [STORAGE_KEY]: {
        history: state.history,
        theme: state.theme,
        language: state.language,
        sortMode: state.sortMode,
        listViewMode: state.listViewMode,
        categoryRules: state.categoryRules,
        categoryLabels: state.categoryLabels,
        itemRenames: state.itemRenames,
        groupCollapsed: state.groupCollapsed,
        historyMaxResults: state.historyMaxResults,
        pdfViewer: state.pdfViewer,
        pptxViewer: state.pptxViewer,
        xlsxViewer: state.xlsxViewer,
        docxViewer: state.docxViewer,
        debug: state.debug,
      },
    });
  } catch {
    // Ignore storage errors and keep the in-memory state usable.
  }
}

export async function hydratePersistedState(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const persisted = result[STORAGE_KEY] as PersistedState | undefined;

    if (!persisted) return;

    useStore.setState({
      history: Array.isArray(persisted.history) ? persisted.history : [],
      theme: typeof persisted.theme === 'string' ? persisted.theme : 'default',
      language: typeof persisted.language === 'string' && ['en', 'zh', 'ja'].includes(persisted.language) ? persisted.language : 'en',
      sortMode: persisted.sortMode === 'frequency' ? 'frequency' : 'time',
      listViewMode: persisted.listViewMode === 'detailed' || persisted.listViewMode === 'grouped' ? persisted.listViewMode : 'compact',
      categoryRules: mergeCategoryRules(persisted.categoryRules),
      categoryLabels: mergeCategoryLabels(persisted.categoryLabels),
      itemRenames: mergeItemRenames(persisted.itemRenames),
      groupCollapsed: mergeGroupCollapsed(persisted.groupCollapsed),
      historyMaxResults: typeof persisted.historyMaxResults === 'number' && persisted.historyMaxResults > 0 ? persisted.historyMaxResults : 500,
      pdfViewer: ['builtin', 'google', 'microsoft'].includes(persisted.pdfViewer) ? persisted.pdfViewer : 'builtin',
      pptxViewer: ['builtin', 'google', 'microsoft'].includes(persisted.pptxViewer) ? persisted.pptxViewer : 'microsoft',
      xlsxViewer: ['builtin', 'google', 'microsoft'].includes(persisted.xlsxViewer) ? persisted.xlsxViewer : 'microsoft',
      docxViewer: ['builtin', 'google', 'microsoft'].includes(persisted.docxViewer) ? persisted.docxViewer : 'microsoft',
      debug: typeof persisted.debug === 'boolean' ? persisted.debug : false,
    });
  } catch {
    // Ignore hydration failures and continue with empty collections.
  }
}

function mergeCategoryRules(rules: unknown): Record<string, CategoryRule> {
  const base = structuredClone(DEFAULT_RULES);
  if (!rules || typeof rules !== 'object') return base;

  for (const [key, value] of Object.entries(rules as Record<string, CategoryRule>)) {
    const current = base[key];
    if (!current || !value || typeof value !== 'object') continue;
    base[key] = {
      ...current,
      ...value,
      name: typeof value.name === 'string' && value.name.trim() ? value.name : current.name,
      domains: Array.isArray(value.domains) ? value.domains.filter((v): v is string => typeof v === 'string') : current.domains,
      titleKeywords: Array.isArray(value.titleKeywords) ? value.titleKeywords.filter((v): v is string => typeof v === 'string') : current.titleKeywords,
      urlRegex: typeof value.urlRegex === 'string' ? value.urlRegex : current.urlRegex,
      color: typeof value.color === 'string' ? value.color : current.color,
    };
  }

  return base;
}

function mergeCategoryLabels(labels: unknown): Record<'CURRENT' | 'FAVORITES' | 'HISTORY', string> {
  const base: Record<'CURRENT' | 'FAVORITES' | 'HISTORY', string> = { ...DEFAULT_CATEGORY_LABELS };
  if (!labels || typeof labels !== 'object') return base;

  for (const [key, value] of Object.entries(labels as Record<string, string>)) {
    if (!(key in base)) continue;
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) {
      base[key as keyof typeof base] = trimmed;
    }
  }

  return base;
}

function mergeItemRenames(renames: unknown): Record<string, string> {
  if (!renames || typeof renames !== 'object') return {};

  const base: Record<string, string> = {};
  for (const [key, value] of Object.entries(renames as Record<string, string>)) {
    if (typeof key !== 'string') continue;
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    base[key] = trimmed;
  }

  return base;
}

function mergeGroupCollapsed(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {};

  const base: Record<string, boolean> = {};
  for (const [key, collapsed] of Object.entries(value as Record<string, boolean>)) {
    if (typeof key !== 'string') continue;
    if (typeof collapsed !== 'boolean') continue;
    base[key] = collapsed;
  }

  return base;
}

export function getCategoryLabel(
  category: TabCategory,
  rules: Record<string, CategoryRule>,
  labels?: CoreCategoryLabelState['categoryLabels'],
  language: string = 'en'
): string {
  const translations = getTranslations(language as Language);
  
  if (category === 'CURRENT') return labels?.CURRENT || DEFAULT_CATEGORY_LABELS.CURRENT;
  if (category === 'FAVORITES') return labels?.FAVORITES || DEFAULT_CATEGORY_LABELS.FAVORITES;
  if (category === 'HISTORY') return labels?.HISTORY || DEFAULT_CATEGORY_LABELS.HISTORY;
  
  if (category === 'SNS') return rules[category]?.name?.trim() || translations.social;
  if (category === 'NEWS') return rules[category]?.name?.trim() || translations.news;
  if (category === 'RESERVED') return rules[category]?.name?.trim() || translations.reserved;
  if (category === 'TECH') return rules[category]?.name?.trim() || translations.tech;
  if (category === 'CLOUD') return rules[category]?.name?.trim() || translations.cloud;
  if (category === 'LAN') return rules[category]?.name?.trim() || translations.lan;
  
  const customName = rules[category]?.name?.trim();
  const defaultName = DEFAULT_RULES[category]?.name;
  return customName || defaultName || category;
}

export function getItemsForCategory(state: CategorySourceState, category: TabCategory = state.activeCategory ?? 'CURRENT'): TabItem[] {
  if (category === 'CURRENT') return state.items;
  if (category === 'FAVORITES') return state.favorites;
  if (category === 'HISTORY') return state.browserHistory;

  return dedupeByUrl([...state.items, ...state.favorites, ...state.browserHistory]);
}

export function categorizeItems(items: TabItem[], category: string, rules: Record<string, CategoryRule>): TabItem[] {
  const rule = rules[category];
  if (!rule) return items;

  return items.filter(item => {
    if (rule.domains?.length) {
      try {
        const hostname = new URL(item.url).hostname;
        if (rule.domains.some(d => hostname.includes(d))) return true;
      } catch {
        return false;
      }
    }

    if (rule.urlRegex) {
      const regex = new RegExp(rule.urlRegex);
      if (regex.test(item.url)) return true;
    }

    if (rule.titleKeywords?.length) {
      if (rule.titleKeywords.some(k => item.title.includes(k))) return true;
    }

    return false;
  });
}

export function getFilteredItems(state: AppState): TabItem[] {
  const { activeCategory, searchQuery, searchMode, sortMode, categoryRules, itemRenames } = state;

  let filtered = getItemsForCategory(state, activeCategory);

  if (AUTO_CATEGORIES.includes(activeCategory)) {
    filtered = categorizeItems(filtered, activeCategory, categoryRules);
  }

  if (searchQuery) {
    if (searchMode === 'regex') {
      try {
        const regex = new RegExp(searchQuery, 'i');
        filtered = filtered.filter(
          item =>
            regex.test(getRenamedTitle(item, itemRenames)) ||
            regex.test(item.url)
        );
      } catch {
        // Invalid regex, treat as empty result
        filtered = [];
      }
    } else {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          getRenamedTitle(item, itemRenames).toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
      );
    }
  }

  if (sortMode === 'frequency') {
    const urlCounts: Record<string, number> = {};
    filtered.forEach(item => {
      urlCounts[item.url] = (urlCounts[item.url] || 0) + 1;
    });
    filtered = filtered.sort((a, b) => (urlCounts[b.url] || 0) - (urlCounts[a.url] || 0));
  }

  return filtered;
}

export function getVisibleItems(state: AppState): TabItem[] {
  return flattenVisibleGroupedItems(state, getFilteredItems(state));
}

export function getVisibleGroupedItems(state: AppState): Array<{ key: string; label: string; items: TabItem[]; iconUrl: string; fallback: string }> {
  const filtered = getFilteredItems(state);
  const grouped = getGroupedItemsByDomain(filtered);

  if (state.listViewMode !== 'grouped') {
    return grouped;
  }

  return grouped.filter((group) => !state.groupCollapsed[group.key]);
}

type CategoryCountState = Pick<AppState, 'items' | 'favorites' | 'browserHistory' | 'categoryRules'>;

export function getCategoryCount(state: CategoryCountState, category: TabCategory): number {
  const items = getItemsForCategory(state, category);

  if (AUTO_CATEGORIES.includes(category)) {
    return categorizeItems(items, category, state.categoryRules).length;
  }

  return items.length;
}

export function getGroupedItemsByDomain(items: TabItem[]): Array<{ key: string; label: string; items: TabItem[]; iconUrl: string; fallback: string }> {
  const groups = new Map<string, TabItem[]>();

  for (const item of items) {
    const key = getGroupKey(item.url) || 'other';
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([key, groupedItems]) => ({
    key,
    label: key === 'other' ? 'Other' : key,
    items: groupedItems,
    iconUrl: getGroupIconUrl(groupedItems[0]),
    fallback: getGroupFallback(groupedItems[0]),
  }));
}

export function flattenVisibleGroupedItems(state: AppState, items: TabItem[]): TabItem[] {
  if (state.listViewMode !== 'grouped') {
    return items;
  }

  const grouped = getGroupedItemsByDomain(items);
  const visible: TabItem[] = [];

  for (const group of grouped) {
    if (state.groupCollapsed[group.key]) continue;
    visible.push(...group.items);
  }

  return visible;
}

interface Store extends AppState {
  setMode: (mode: ViewMode) => void;
  setPanelMode: (mode: PanelMode) => void;
  setActiveCategory: (category: TabCategory) => void;
  setSortMode: (mode: SortMode) => void;
  setListViewMode: (mode: ListViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  toggleSearchMode: () => void;
  setCommandInput: (input: string) => void;
  setItems: (items: TabItem[]) => void;
  addFavorite: (item: TabItem) => Promise<void>;
  removeFavorite: (url: string) => Promise<void>;
  addToHistory: (item: TabItem) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (delta: number) => void;
  setCategoryRules: (rules: Record<string, CategoryRule>) => void;
  setCategoryLabels: (labels: Record<'CURRENT' | 'FAVORITES' | 'HISTORY', string>) => void;
  setItemRename: (url: string, title: string) => void;
  clearItemRename: (url: string) => void;
  toggleGroupCollapsed: (groupKey: string) => void;
  setGroupCollapsedForKeys: (groupKeys: string[], collapsed: boolean) => void;
  setTheme: (theme: string) => void;
  setLanguage: (language: Language) => void;
  setHistoryMaxResults: (maxResults: number) => void;
  setPreview: (url: string, filename?: string) => void;
  closePreview: () => void;
  setPdfViewer: (viewer: 'builtin' | 'google' | 'microsoft') => void;
  setPptxViewer: (viewer: 'builtin' | 'google' | 'microsoft') => void;
  setXlsxViewer: (viewer: 'builtin' | 'google' | 'microsoft') => void;
  setDocxViewer: (viewer: 'builtin' | 'google' | 'microsoft') => void;
  setDebug: (debug: boolean) => void;
  fetchTabs: () => Promise<void>;
  fetchBookmarks: (query?: string) => Promise<void>;
  fetchHistory: (query?: string) => Promise<void>;
  trashItem: (item: TabItem, category: TabCategory) => Promise<void>;
  selectNext: () => void;
  selectPrevious: () => void;
  selectFirst: () => void;
  selectLast: () => void;
}

export const useStore = create<Store>((set) => ({
  mode: 'NORMAL',
  activeCategory: 'CURRENT',
  sortMode: 'time',
  listViewMode: 'compact',
  searchQuery: '',
  searchMode: 'plain' as SearchMode,
  commandInput: '',
  items: [],
  favorites: [],
  history: [],
  browserHistory: [],
  selectedIndex: 0,
  categoryRules: DEFAULT_RULES,
  categoryLabels: DEFAULT_CATEGORY_LABELS,
  itemRenames: {},
  groupCollapsed: {},
  theme: 'default',
  language: 'en' as Language,
  panelMode: 'NONE',
  previewUrl: null,
  previewFilename: null,
  pdfViewer: 'builtin' as 'builtin' | 'google' | 'microsoft',
  pptxViewer: 'microsoft' as 'builtin' | 'google' | 'microsoft',
  xlsxViewer: 'microsoft' as 'builtin' | 'google' | 'microsoft',
  docxViewer: 'microsoft' as 'builtin' | 'google' | 'microsoft',
  historyMaxResults: 500,
  debug: false,

  setMode: (mode) => set({ mode }),
  setPanelMode: (panelMode) => set({ panelMode }),
  setActiveCategory: (activeCategory) => set({ activeCategory, selectedIndex: 0 }),
  setSortMode: (sortMode) => set((state) => {
    void savePersistedState();
    return { sortMode };
  }),
  setListViewMode: (listViewMode) => set((state) => {
    void savePersistedState();
    return { listViewMode };
  }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchMode: (searchMode: SearchMode) => set({ searchMode }),
  toggleSearchMode: () => set((state) => ({ searchMode: state.searchMode === 'plain' ? 'regex' as SearchMode : 'plain' as SearchMode })),
  setCommandInput: (commandInput) => set({ commandInput }),
  setItems: (items) => set({ items, selectedIndex: 0 }),
  addFavorite: async (item) => {
    try {
      const state = useStore.getState();
      const existing = await chrome.bookmarks.search({ url: item.url });
      const bookmark = existing.find(node => !!node.url);
      if (bookmark?.id) return;

      await chrome.bookmarks.create({
        title: getRenamedTitle(item, state.itemRenames),
        url: item.url,
      });
      await state.fetchBookmarks(state.searchQuery);
    } catch {
      // Ignore bookmark creation failures.
    }
  },
  removeFavorite: async (url) => {
    try {
      const matches = await chrome.bookmarks.search({ url });
      const bookmark = matches.find(node => !!node.url && node.id);
      if (!bookmark?.id) return;

      await chrome.bookmarks.remove(bookmark.id);
      await useStore.getState().fetchBookmarks(useStore.getState().searchQuery);
    } catch {
      // Ignore bookmark removal failures.
    }
  },
  addToHistory: (item) => set((state) => {
    const filtered = state.history.filter(h => h.url !== item.url);
    const history = [item, ...filtered].slice(0, state.historyMaxResults);
    void savePersistedState();
    return { history };
  }),
  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
  moveSelection: (delta) => set((state) => {
    const filtered = getVisibleItems(state);
    if (filtered.length === 0) return { selectedIndex: 0 };
    const newIndex = Math.max(0, Math.min(filtered.length - 1, state.selectedIndex + delta));
    return { selectedIndex: newIndex };
  }),
  setCategoryRules: (categoryRules) => set((state) => {
    const merged = mergeCategoryRules(categoryRules);
    void savePersistedState();
    return { categoryRules: merged };
  }),
  setCategoryLabels: (categoryLabels) => set((state) => {
    const merged = mergeCategoryLabels(categoryLabels);
    void savePersistedState();
    return { categoryLabels: merged };
  }),
  setItemRename: (url, title) => set((state) => {
    const next = { ...state.itemRenames };
    const trimmed = title.trim();
    if (!trimmed) {
      delete next[url];
    } else {
      next[url] = trimmed;
    }
    void savePersistedState();
    return { itemRenames: next };
  }),
  clearItemRename: (url) => set((state) => {
    if (!state.itemRenames[url]) return {};
    const next = { ...state.itemRenames };
    delete next[url];
    void savePersistedState();
    return { itemRenames: next };
  }),
  toggleGroupCollapsed: (groupKey) => set((state) => {
    const beforeVisible = getVisibleItems(state);
    const next = { ...state.groupCollapsed, [groupKey]: !state.groupCollapsed[groupKey] };
    const afterVisible = getVisibleItems({ ...state, groupCollapsed: next });
    const selectedIndex = resolveSelectedIndexAfterVisibilityChange(beforeVisible, afterVisible, state.selectedIndex);
    void savePersistedState();
    return { groupCollapsed: next, selectedIndex };
  }),
  setGroupCollapsedForKeys: (groupKeys, collapsed) => set((state) => {
    const beforeVisible = getVisibleItems(state);
    const next = { ...state.groupCollapsed };
    for (const key of groupKeys) {
      next[key] = collapsed;
    }
    const afterVisible = getVisibleItems({ ...state, groupCollapsed: next });
    const selectedIndex = resolveSelectedIndexAfterVisibilityChange(beforeVisible, afterVisible, state.selectedIndex);

    void savePersistedState();
    return { groupCollapsed: next, selectedIndex };
  }),
   setTheme: (theme) => set((state) => {
    void savePersistedState();
    return { theme };
  }),
  setLanguage: (language: Language) => set((state) => {
    void savePersistedState();
    return { language };
  }),
  setHistoryMaxResults: (historyMaxResults: number) => set((state) => {
    const value = Math.max(1, Math.min(10000, historyMaxResults));
    void savePersistedState();
    const next = { historyMaxResults: value } as Partial<typeof state>;
    if (state.activeCategory === 'HISTORY') {
      setTimeout(() => {
        const s = useStore.getState();
        void s.fetchHistory(s.searchQuery);
      }, 0);
    }
    return next;
  }),

  fetchTabs: async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const extensionId = chrome.runtime.id;
      const newTabUrl = `chrome-extension://${extensionId}/index.html`;

      const items = tabs
        .filter(t => {
          const url = t.url || '';
          return !url.startsWith('chrome://') &&
            !url.startsWith('chrome-extension://') &&
            !url.startsWith('about:') &&
            url !== newTabUrl;
        })
        .filter(t => t.id !== undefined && t.url !== undefined)
        .map(t => ({
          id: t.id!,
          url: t.url!,
          title: t.title || '',
          windowId: t.windowId,
          active: t.active,
          favIconUrl: t.favIconUrl,
          pinned: t.pinned,
        }));

      set({ items });
    } catch {
      set({ items: [] });
    }
  },

  fetchBookmarks: async (query = '') => {
    try {
      const tree = await chrome.bookmarks.getTree();
      const searchText = query.trim().toLowerCase();
      const bookmarks: TabItem[] = [];
      const stack = [...tree];

      while (stack.length > 0) {
        const node = stack.pop();
        if (!node) continue;

        if (node.url) {
          const title = node.title || node.url;
          const matches = !searchText ||
            title.toLowerCase().includes(searchText) ||
            node.url.toLowerCase().includes(searchText);

          if (matches) {
            bookmarks.push({
              id: numericIdFromString(node.id || node.url),
              url: node.url,
              title,
              windowId: 0,
              active: false,
            });
          }
        }

        if (node.children?.length) {
          stack.push(...node.children);
        }
      }

      set({ favorites: bookmarks.reverse(), selectedIndex: 0 });
    } catch {
      set({ favorites: [], selectedIndex: 0 });
    }
  },

  fetchHistory: async (query = '') => {
    try {
      const text = query.trim();
      const state = useStore.getState();
      const entries = await chrome.history.search({
        text,
        maxResults: state.historyMaxResults,
        startTime: 0,
      });

      const browserHistory = entries
        .filter(entry => !!entry.url)
        .filter(entry => {
          const url = entry.url || '';
          return !url.startsWith('chrome://') &&
            !url.startsWith('chrome-extension://') &&
            !url.startsWith('about:');
        })
        .map((entry) => ({
          id: historyEntryId(entry),
          url: entry.url!,
          title: entry.title || entry.url!,
          windowId: 0,
          active: false,
        }));

      set({ browserHistory: dedupeByUrl(browserHistory), selectedIndex: 0 });
    } catch {
      set({ browserHistory: [], selectedIndex: 0 });
    }
  },

  trashItem: async (item, category) => {
    try {
      const state = useStore.getState();

      if (category === 'CURRENT') {
        const tab = state.items.find(t => t.url === item.url);
        if (tab) {
          await chrome.tabs.remove(tab.id);
          await useStore.getState().fetchTabs();
        }
        return;
      }

      if (category === 'FAVORITES') {
        const matches = await chrome.bookmarks.search({ url: item.url });
        const bookmark = matches.find(node => !!node.url && node.id);
        if (bookmark?.id) {
          await chrome.bookmarks.remove(bookmark.id);
          await useStore.getState().fetchBookmarks(useStore.getState().searchQuery);
        }
        return;
      }

      if (category === 'HISTORY') {
        await chrome.history.deleteUrl({ url: item.url });
        await useStore.getState().fetchHistory(useStore.getState().searchQuery);
        return;
      }

      const currentTab = state.items.find(t => t.url === item.url);
      if (currentTab) {
        await chrome.tabs.remove(currentTab.id);
        await useStore.getState().fetchTabs();
        return;
      }

      const bookmarkMatches = await chrome.bookmarks.search({ url: item.url });
      const bookmark = bookmarkMatches.find(node => !!node.url && node.id);
      if (bookmark?.id) {
        await chrome.bookmarks.remove(bookmark.id);
        await useStore.getState().fetchBookmarks(useStore.getState().searchQuery);
        return;
      }

      await chrome.history.deleteUrl({ url: item.url });
      await useStore.getState().fetchHistory(useStore.getState().searchQuery);
    } catch {
      // Ignore trash/delete failures.
    }
  },

  selectNext: () => set((state) => {
    const filtered = getVisibleItems(state);
    if (filtered.length === 0) return { selectedIndex: 0 };
    return { selectedIndex: Math.min(filtered.length - 1, state.selectedIndex + 1) };
  }),

  selectPrevious: () => set((state) => {
    return { selectedIndex: Math.max(0, state.selectedIndex - 1) };
  }),

  selectFirst: () => set({ selectedIndex: 0 }),

  selectLast: () => set((state) => {
    const filtered = getVisibleItems(state);
    return { selectedIndex: Math.max(0, filtered.length - 1) };
  }),

  setPreview: (url, filename) => set({ previewUrl: preprocessPreviewUrl(url), previewFilename: filename || null, panelMode: 'FILE_PREVIEW' }),

  closePreview: () => set({ previewUrl: null, previewFilename: null, panelMode: 'NONE' }),

  setPdfViewer: (pdfViewer) => { set({ pdfViewer }); void savePersistedState(); },
  setPptxViewer: (pptxViewer) => { set({ pptxViewer }); void savePersistedState(); },
  setXlsxViewer: (xlsxViewer) => { set({ xlsxViewer }); void savePersistedState(); },
  setDocxViewer: (docxViewer) => { set({ docxViewer }); void savePersistedState(); },
  setDebug: (debug: boolean) => { set({ debug }); void savePersistedState(); },
}));

function historyEntryId(entry: chrome.history.HistoryItem): number {
  const url = entry.url || '';
  const visitTime = entry.lastVisitTime || 0;
  let hash = 0;
  const input = `${url}:${visitTime}`;

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function numericIdFromString(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function resolveViewerUrl(url: string): string {
  if (url.includes('docs.google.com') || url.includes('view.officeapps.live.com')) return url;
  const state = useStore.getState();
  const info = detectFileType(url);
  const processed = preprocessPreviewUrl(url);

  if (info.type === 'drawio') return `https://viewer.diagrams.net/#U${encodeURIComponent(processed)}`;
  if (info.type === 'googleViewer') return `https://docs.google.com/viewer?url=${encodeURIComponent(processed)}&embedded=true`;

  const viewer: OfficeViewer | undefined =
    info.type === 'pdf' ? state.pdfViewer :
    info.type === 'pptx' || info.type === 'ppt' ? state.pptxViewer :
    info.type === 'xlsx' || info.type === 'xls' ? state.xlsxViewer :
    info.type === 'docx' || info.type === 'doc' ? state.docxViewer :
    undefined;

  if (viewer && viewer !== 'builtin') {
    if (info.type === 'pdf' && viewer === 'microsoft') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(processed)}&embedded=true`;
    }
    if (viewer === 'google') return `https://docs.google.com/viewer?url=${encodeURIComponent(processed)}&embedded=true`;
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(processed)}`;
  }

  return url;
}

export async function openTabItem(item: TabItem, active: boolean): Promise<void> {
  const url = resolveViewerUrl(item.url);
  try {
    const matches = await chrome.tabs.query({ url });
    const existing = matches.find(tab => tab.id !== undefined);

    if (existing?.id !== undefined) {
      await chrome.tabs.update(existing.id, { active });
      if (active && existing.windowId !== undefined) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
      return;
    }

    await chrome.tabs.create({ url, active });
  } catch {
    await chrome.tabs.create({ url, active });
  }
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function getDomainKey(hostname: string): string {
  if (!hostname) return '';
  if (isIpAddress(hostname) || hostname === 'localhost') return hostname;

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) return hostname;

  const publicSuffixes = new Set([
    'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
    'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
    'co.jp', 'ne.jp', 'or.jp', 'go.jp',
    'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
    'com.br', 'com.hk', 'com.sg', 'com.tw',
  ]);

  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  if (publicSuffixes.has(lastTwo) && parts.length >= 3) {
    return `${parts[parts.length - 3]}.${lastTwo}`;
  }

  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

export function getGroupKey(url: string): string {
  return getDomainKey(getHostname(url));
}

function isIpAddress(hostname: string): boolean {
  return /^[0-9.]+$/.test(hostname) || hostname.includes(':');
}

function getGroupIconUrl(item: TabItem | undefined): string {
  if (!item) return '';
  const hostname = getHostname(item.url);
  return item.favIconUrl || (hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=16` : '');
}

function getGroupFallback(item: TabItem | undefined): string {
  if (!item) return 'O';
  const hostname = getHostname(item.url);
  const value = hostname || item.title || 'O';
  return value.slice(0, 1).toUpperCase();
}

function resolveSelectedIndexAfterVisibilityChange(
  beforeVisible: TabItem[],
  afterVisible: TabItem[],
  selectedIndex: number
): number {
  if (afterVisible.length === 0) return 0;

  const currentItem = beforeVisible[selectedIndex];
  if (currentItem) {
    const nextIndex = afterVisible.findIndex((item) => item.id === currentItem.id);
    if (nextIndex >= 0) return nextIndex;
  }

  return Math.min(selectedIndex, afterVisible.length - 1);
}

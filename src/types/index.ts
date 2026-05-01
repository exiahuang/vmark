export interface TabItem {
  id: number;
  url: string;
  title: string;
  windowId: number;
  active: boolean;
  favIconUrl?: string;
  pinned?: boolean;
}

export interface CategoryRule {
  id: string;
  name: string;
  domains?: string[];
  titleKeywords?: string[];
  urlRegex?: string;
  color?: string;
}

export type TabCategory = 
  | 'CURRENT' 
  | 'FAVORITES' 
  | 'HISTORY' 
  | 'SNS' 
  | 'NEWS' 
  | 'RESERVED' 
  | 'TECH' 
  | 'CLOUD' 
  | 'LAN';

export type ViewMode = 'NORMAL' | 'FILTER' | 'COMMAND';

export type SortMode = 'time' | 'frequency';

export type ListViewMode = 'compact' | 'detailed' | 'grouped';

export type PanelMode = 'NONE' | 'HELP' | 'SETTINGS';

export type Language = 'en' | 'zh' | 'ja';

export interface AppState {
  mode: ViewMode;
  activeCategory: TabCategory;
  sortMode: SortMode;
  listViewMode: ListViewMode;
  searchQuery: string;
  commandInput: string;
  items: TabItem[];
  favorites: TabItem[];
  history: TabItem[];
  browserHistory: TabItem[];
  selectedIndex: number;
  categoryRules: Record<string, CategoryRule>;
  categoryLabels: Record<'CURRENT' | 'FAVORITES' | 'HISTORY', string>;
  itemRenames: Record<string, string>;
  groupCollapsed: Record<string, boolean>;
  theme: string;
  language: Language;
  panelMode: PanelMode;
  historyMaxResults: number;
}

import { useStore, getCategoryCount, getCategoryLabel } from '../store';
import { useTranslation } from '../hooks/useTranslation';
import type { TabCategory } from '../types';
import './TabBar.css';

const CATEGORIES: TabCategory[] = ['CURRENT', 'FAVORITES', 'HISTORY', 'SNS', 'NEWS', 'RESERVED', 'TECH', 'CLOUD', 'LAN', 'NOTES'];

export function TabBar() {
  const { activeCategory, setActiveCategory, items, favorites, history, browserHistory, categoryRules, categoryLabels, language } = useStore();
  const t = useTranslation();
  const state = { activeCategory, items, favorites, history, browserHistory, categoryRules };
  const categoryLabelsMap = { NOTES: t.notes, CURRENT: t.current, FAVORITES: t.favorites, HISTORY: t.history };

  return (
    <div className="tab-bar">
      {CATEGORIES.map((key, index) => {
        const isActive = activeCategory === key;
        const count = getCategoryCount(state, key);
        const label = getCategoryLabel(key, categoryRules, categoryLabelsMap, language);
        return (
          <button
            key={key}
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
            title={label}
          >
            <span className="tab-index">{key === 'NOTES' ? '0' : index + 1}</span>
            <span className="tab-label">{label}</span>
            {count > 0 && <span className="tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

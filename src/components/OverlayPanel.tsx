import { useState, useCallback } from 'react';
import { DEFAULT_CATEGORY_LABELS, DEFAULT_RULES, useStore } from '../store';
import { themes, type ThemeName } from '../themes';
import { languages, getTranslations, type Language } from '../i18n';
import type { CategoryRule, TabCategory } from '../types';
import './OverlayPanel.css';

const HELP_SECTIONS = [
  {
    title: 'Navigation',
    shortcuts: [
      ['j / k', 'Up / Down (Normal)'],
      ['↑ / ↓', 'Up / Down (Filter)'],
      ['g / G', 'First / Last'],
      ['h / l', 'Prev / Next category'],
      ['J / K', 'Prev / Next group'],
      ['1-9', 'Jump to tab'],
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      ['Enter / o', 'Open'],
      ['O', 'Open in background'],
      ['x', 'Delete / Trash'],
      ['a / d', 'Add / Remove bookmark'],
      ['R', 'Rename'],
      ['y / t', 'Copy URL / Title'],
      ['z / Z', 'Toggle group / All'],
    ],
  },
  {
    title: 'Search & Settings',
    shortcuts: [
      ['/ or Ctrl+f', 'Filter mode'],
      [':', 'Command mode'],
      ['Esc', 'Dismiss / Close'],
      ['?', 'Help'],
      ['S', 'Settings'],
      ['Ctrl+0', 'Open Vmark'],
    ],
  },
];

const SETTINGS_CATEGORIES: TabCategory[] = ['SNS', 'NEWS', 'RESERVED', 'TECH', 'CLOUD', 'LAN'];
const PRIMARY_CATEGORIES: Array<'CURRENT' | 'FAVORITES' | 'HISTORY'> = ['CURRENT', 'FAVORITES', 'HISTORY'];
const AUTO_CATEGORY_LABELS: Record<TabCategory, string> = {
  CURRENT: 'Tab 1',
  FAVORITES: 'Tab 2',
  HISTORY: 'Tab 3',
  SNS: 'Social',
  NEWS: 'News',
  RESERVED: 'Reserved',
  TECH: 'Tech',
  CLOUD: 'Cloud',
  LAN: 'LAN',
};

function cloneRules(rules: Record<string, CategoryRule>): Record<string, CategoryRule> {
  return JSON.parse(JSON.stringify(rules)) as Record<string, CategoryRule>;
}

function cloneLabels(labels: Record<'CURRENT' | 'FAVORITES' | 'HISTORY', string>) {
  return { ...labels };
}

function listToText(values?: string[]): string {
  return values?.join(', ') || '';
}

function textToList(text: string): string[] {
  const values = text
    .split(/[\n,]/)
    .map(v => v.trim())
    .filter(Boolean);

  return values.length ? Array.from(new Set(values)) : [];
}

function normalizeRule(current: CategoryRule, patch: Partial<CategoryRule>): CategoryRule {
  const defaultRule = DEFAULT_RULES[current.id.toUpperCase()] || current;
  return {
    ...current,
    ...patch,
    name: patch.name?.trim() ? patch.name : defaultRule.name,
    domains: patch.domains ?? current.domains,
    titleKeywords: patch.titleKeywords ?? current.titleKeywords,
    urlRegex: patch.urlRegex ?? current.urlRegex,
    color: patch.color ?? current.color,
  };
}

function getTabSlotLabel(category: TabCategory, t: ReturnType<typeof getTranslations>): string {
  const map: Partial<Record<TabCategory, string>> = {
    CURRENT: 'Tab 1',
    FAVORITES: 'Tab 2',
    HISTORY: 'Tab 3',
    SNS: t.social,
    NEWS: t.news,
    RESERVED: t.reserved,
    TECH: t.tech,
    CLOUD: t.cloud,
    LAN: t.lan,
  };
  return map[category] || category;
}

export function OverlayPanel() {
  const { panelMode, setPanelMode, theme, setTheme, language, setLanguage, categoryRules, setCategoryRules, categoryLabels, setCategoryLabels, historyMaxResults, setHistoryMaxResults } = useStore();
  const [draftRules, setDraftRules] = useState(() => cloneRules(categoryRules));
  const [draftLabels, setDraftLabels] = useState(() => cloneLabels(categoryLabels));
  const [draftMaxResults, setDraftMaxResults] = useState(historyMaxResults);
  const t = getTranslations(language);

  if (panelMode === 'NONE') return null;

  const updateRule = (category: TabCategory, patch: Partial<CategoryRule>) => {
    const nextRules = cloneRules(draftRules);
    const current = nextRules[category] || DEFAULT_RULES[category];
    nextRules[category] = normalizeRule(current || { id: category.toLowerCase(), name: category }, patch);
    setDraftRules(nextRules);
    setCategoryRules(nextRules);
  };

  const resetRule = (category: TabCategory) => {
    const nextRules = cloneRules(draftRules);
    nextRules[category] = cloneRules(DEFAULT_RULES)[category];
    setDraftRules(nextRules);
    setCategoryRules(nextRules);
  };

  const resetAll = () => {
    const nextRules = cloneRules(DEFAULT_RULES);
    const nextLabels = cloneLabels(DEFAULT_CATEGORY_LABELS);
    setDraftRules(nextRules);
    setDraftLabels(nextLabels);
    setCategoryRules(nextRules);
    setCategoryLabels(nextLabels);
    setTheme('default');
    setLanguage('en');
    setHistoryMaxResults(500);
  };

  const updateLabel = (category: 'CURRENT' | 'FAVORITES' | 'HISTORY', value: string) => {
    const nextLabels = cloneLabels(draftLabels);
    nextLabels[category] = value.trim() || DEFAULT_CATEGORY_LABELS[category];
    setDraftLabels(nextLabels);
    setCategoryLabels(nextLabels);
  };

  return (
    <div className="overlay-backdrop" onClick={() => setPanelMode('NONE')}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-header">
              <div>
                <div className="overlay-kicker">{panelMode === 'HELP' ? t.help : t.settings}</div>
                <h2 className="overlay-title">{panelMode === 'HELP' ? t.keyboardReference : t.settings}</h2>
              </div>
              <button className="overlay-close" onClick={() => setPanelMode('NONE')}>{t.close}</button>
            </div>

            {panelMode === 'HELP' ? (
              <div className="shortcut-sections">
                {HELP_SECTIONS.map((section) => (
                  <div key={section.title} className="shortcut-section">
                    <div className="shortcut-section-title">
                      {section.title === 'Navigation' ? t.navigation : section.title === 'Actions' ? t.actions : t.searchSettings}
                    </div>
                    <div className="shortcut-grid">
                      {section.shortcuts.map(([key, desc]) => (
                        <div key={key} className="shortcut-row">
                          <span className="shortcut-key">{key}</span>
                          <span className="shortcut-desc">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="settings-section-heading">{t.language}</div>
            <div className="theme-grid compact">
              {Object.entries(languages).map(([key, value]) => {
                const active = language === key;
                return (
                  <button
                    key={key}
                    className={`theme-card ${active ? 'active' : ''}`}
                    onClick={() => setLanguage(key as Language)}
                  >
                    <span className="theme-name">{value.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="theme-section">
              <div className="settings-section-heading">{t.theme}</div>
              <div className="theme-grid compact">
                {Object.entries(themes).map(([key, value]) => {
                  const active = theme === key;
                  return (
                    <button
                      key={key}
                      className={`theme-card ${active ? 'active' : ''}`}
                      onClick={() => setTheme(key as ThemeName)}
                    >
                      <span className="theme-name">{value.name}</span>
                      <span className="theme-swatch">
                        <span style={{ background: value.colors.primary }} />
                        <span style={{ background: value.colors.surface }} />
                        <span style={{ background: value.colors.bgSecondary }} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="settings-section-heading settings-section-heading-spaced">{t.historySettings}</div>
            <div className="settings-row-fields">
              <label className="settings-field inline">
                <span>{t.historyMaxResults}</span>
                <input
                  type="number"
                  className="settings-inline-input"
                  min={1}
                  max={10000}
                  value={draftMaxResults}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(10000, Number(e.target.value) || 500));
                    setDraftMaxResults(val);
                    setHistoryMaxResults(val);
                  }}
                />
              </label>
            </div>

            <div className="settings-section-heading settings-section-heading-spaced">{t.categoryRules}</div>
            <div className="settings-toolbar">
              <div className="settings-note">
                {t.configureTabs}
              </div>
              <button className="overlay-close" onClick={resetAll}>
                {t.resetAll}
              </button>
            </div>

            <div className="settings-table-wrap">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th className="settings-col-slot">Tab</th>
                    <th className="settings-col-label">{t.label}</th>
                    <th className="settings-col-config">{t.config}</th>
                    <th className="settings-col-action">{t.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {PRIMARY_CATEGORIES.map((category, index) => (
                    <tr key={category}>
                      <td className="settings-cell-slot">{index + 1}</td>
                      <td className="settings-cell-label">{getTabSlotLabel(category, t)}</td>
                      <td className="settings-cell-config">
                        <input
                          className="settings-inline-input"
                          value={draftLabels[category] || DEFAULT_CATEGORY_LABELS[category]}
                          onChange={(e) => updateLabel(category, e.target.value)}
                          placeholder={DEFAULT_CATEGORY_LABELS[category]}
                        />
                      </td>
                      <td className="settings-cell-action">-</td>
                    </tr>
                  ))}

                  {SETTINGS_CATEGORIES.map((category, index) => {
                    const rule = draftRules[category] || DEFAULT_RULES[category];
                    if (!rule) return null;

                    return (
                      <tr key={category}>
                        <td className="settings-cell-slot">{index + 4}</td>
                        <td className="settings-cell-label">{getTabSlotLabel(category, t)}</td>
                        <td className="settings-cell-config">
                          <div className="settings-row-fields">
                            <label className="settings-field inline">
                              <span>{t.name}</span>
                              <input
                                className="settings-inline-input"
                                value={rule.name || ''}
                                onChange={(e) => updateRule(category, { name: e.target.value })}
                              />
                            </label>
                            <label className="settings-field inline">
                              <span>{t.domains}</span>
                              <textarea
                                className="settings-inline-textarea"
                                rows={2}
                                value={listToText(rule.domains)}
                                onChange={(e) => updateRule(category, { domains: textToList(e.target.value) })}
                                placeholder="github.com, docs.rs"
                              />
                            </label>
                            <label className="settings-field inline">
                              <span>{t.keywords}</span>
                              <textarea
                                className="settings-inline-textarea"
                                rows={2}
                                value={listToText(rule.titleKeywords)}
                                onChange={(e) => updateRule(category, { titleKeywords: textToList(e.target.value) })}
                                placeholder="GitHub, Stack Overflow"
                              />
                            </label>
                            <label className="settings-field inline">
                              <span>{t.urlRegex}</span>
                              <input
                                className="settings-inline-input"
                                value={rule.urlRegex || ''}
                                onChange={(e) => updateRule(category, { urlRegex: e.target.value || undefined })}
                                placeholder="^https?://example\\.com"
                              />
                            </label>
                          </div>
                        </td>
                        <td className="settings-cell-action">
                          <button className="settings-reset" onClick={() => resetRule(category)}>
                            {t.reset}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="settings-toolbar settings-toolbar-bottom">
              <div className="settings-note">{t.searchSettings}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

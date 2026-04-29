import { useStore } from '../store';
import { getTranslations } from '../i18n';
import type { Language } from '../i18n';

export function useTranslation() {
  const language = useStore((state) => state.language);
  return getTranslations(language as Language);
}

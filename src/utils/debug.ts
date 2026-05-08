import { useStore } from '../store';

export function setDebug(value: boolean): void {
  try {
    useStore.getState().setDebug(value);
  } catch {
    // Store not available, skip
  }
}

export function debugLog(...args: any[]): void {
  try {
    const state = useStore.getState();
    if (state?.debug) {
      console.log('[Vmark Debug]', ...args);
    }
  } catch {
    // Store not available, skip logging
  }
}

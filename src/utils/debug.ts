let debugEnabled = false;

// 初始化时从 store 获取 debug 状态
try {
  const store = (window as any).__VMARK_STORE__;
  if (store && store.getState) {
    debugEnabled = store.getState().debug || false;
  }
} catch {
  // ignore
}

export function setDebug(value: boolean): void {
  debugEnabled = value;
}

export function debugLog(...args: any[]): void {
  if (debugEnabled) {
    console.log('[Vmark Debug]', ...args);
  }
}

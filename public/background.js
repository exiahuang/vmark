chrome.runtime.onInstalled.addListener(() => {
  console.log('Vmark installed');
});

// Debug logging helper - 从 storage 检查 debug 状态
function debugLog(...args) {
  chrome.storage.local.get(['vmark.state'], (result) => {
    const state = result['vmark.state'];
    if (state && state.debug) {
      console.log('[BG Debug]', ...args);
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_PROXY') {
    debugLog('FETCH_PROXY:', request.url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(request.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain, text/markdown, */*',
      }
    })
      .then(async (response) => {
        clearTimeout(timeout);
        debugLog('Response:', response.status, response.statusText);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        debugLog('Fetched length:', text.length);
        sendResponse({ ok: true, text });
      })
      .catch(error => {
        clearTimeout(timeout);
        debugLog('Fetch error:', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-vmark') return;

  const targetUrl = chrome.runtime.getURL('index.html');

  try {
    const tabs = await chrome.tabs.query({ url: targetUrl });
    const existing = tabs.find((tab) => tab.id !== undefined);

    if (existing?.id !== undefined) {
      await chrome.tabs.update(existing.id, { active: true });
      if (existing.windowId !== undefined) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
      return;
    }
  } catch {
    // Fall through to opening a new tab.
  }

  try {
    await chrome.tabs.create({ url: targetUrl, active: true });
  } catch {
    // Ignore failures in the background worker.
  }
});

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
      cache: 'reload',  // 强制重新请求，避免 304 空响应
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain, text/markdown, application/json, */*',
      }
    })
      .then(async (response) => {
        clearTimeout(timeout);
        debugLog('Response:', response.status, response.statusText);
        // 304 Not Modified 也是成功（background fetch 不受 CORS 限制）
        if (!response.ok && response.status !== 304) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();

        // Qiita API 返回 JSON，提取 body 字段（markdown 内容）
        if (request.url.includes('qiita.com/api/v2/items/')) {
          try {
            const json = JSON.parse(text);
            if (json.body) {
              debugLog('Qiita API: extracted body, length:', json.body.length);
              sendResponse({ ok: true, text: json.body });
              return;
            }
          } catch (e) {
            debugLog('Qiita API: JSON parse failed, using raw text');
          }
        }

        // Stack Overflow API 返回 JSON，提取 items[0].body（HTML 内容）
        if (request.url.includes('api.stackexchange.com')) {
          try {
            const json = JSON.parse(text);
            if (json.items && json.items[0] && json.items[0].body) {
              debugLog('Stack Overflow API: extracted body, length:', json.items[0].body.length);
              sendResponse({ ok: true, text: json.items[0].body });
              return;
            }
          } catch (e) {
            debugLog('Stack Overflow API: JSON parse failed, using raw text');
          }
        }

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

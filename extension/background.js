// Debug logging helper - 从 storage 检查 debug 状态
function debugLog(...args) {
  chrome.storage.local.get(['vmark.state'], (result) => {
    const state = result['vmark.state'];
    if (state && state.debug) {
      console.log('[BG Debug]', ...args);
    }
  });
}

// YouTube embed 需要 Referer header，Chrome extension 页面默认不发送
// 使用 declarativeNetRequest 强制在 YouTube iframe 请求上设置 Referer
// (YouTube error 153 的修复)
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [{
      id: 1,
      condition: {
        initiatorDomains: [chrome.runtime.id],
        requestDomains: ['www.youtube.com', 'www.youtube-nocookie.com'],
        resourceTypes: ['sub_frame'],
      },
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'referer', value: chrome.runtime.id, operation: 'set' },
        ],
      },
    }],
  });
  console.log('Vmark installed, DNR rule registered for YouTube embeds');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_PROXY') {
    debugLog('FETCH_PROXY:', request.url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(request.url, {
      signal: controller.signal,
      cache: 'reload',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain, text/markdown, application/json, text/csv, text/html,application/xhtml+xml,application/xml, application/xml, */*',
      }
    })
      .then(async (response) => {
        clearTimeout(timeout);
        debugLog('Response:', response.status, response.statusText);

        if (!response.ok && response.status !== 304) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();

        // Qiita API
        if (request.url.includes('qiita.com/api/v2/items/')) {
          try {
            const json = JSON.parse(text);
            if (json.body) {
              sendResponse({ ok: true, text: json.body });
              return;
            }
          } catch (e) {
            debugLog('Qiita API: JSON parse failed');
          }
        }

        // Stack Overflow API
        if (request.url.includes('api.stackexchange.com')) {
          try {
            const json = JSON.parse(text);
            if (json.items && json.items[0] && json.items[0].body) {
              sendResponse({ ok: true, text: json.items[0].body });
              return;
            }
          } catch (e) {
            debugLog('Stack Overflow API: JSON parse failed');
          }
        }

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

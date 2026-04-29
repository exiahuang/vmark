chrome.runtime.onInstalled.addListener(() => {
  console.log('Vmark installed');
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

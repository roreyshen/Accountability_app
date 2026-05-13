chrome.storage.sync.get('blocked', ({ blocked = [] }) => {
  const host = location.hostname.replace(/^www\./, '');
  if (blocked.some(domain => host === domain || host.endsWith('.' + domain))) {
    window.stop();
    window.location.replace(chrome.runtime.getURL('blocked.html'));
  }
});

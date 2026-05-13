chrome.storage.sync.get(['blocked', 'schedule', 'pause'], (data) => {
  const { blocked = [], schedule = {}, pause } = data;

  // Check if blocking is actively paused (after the 10-min delay)
  if (pause?.startedAt) {
    const TEN_MIN = 10 * 60 * 1000;
    const PAUSE_DURATION = 30 * 60 * 1000;
    const elapsed = Date.now() - pause.startedAt;
    if (elapsed >= TEN_MIN && elapsed < TEN_MIN + PAUSE_DURATION) return;
  }

  // Check schedule window
  if (schedule.enabled) {
    const hour = new Date().getHours();
    const { start = 9, end = 17 } = schedule;
    // Handle overnight ranges (e.g. 22 to 6)
    const inWindow = start <= end
      ? hour >= start && hour < end
      : hour >= start || hour < end;
    if (!inWindow) return;
  }

  const host = location.hostname.replace(/^www\./, '');
  if (!blocked.some(d => host === d || host.endsWith('.' + d))) return;

  // Increment today's block count
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.local.get({ blockCounts: {} }, ({ blockCounts }) => {
    blockCounts[today] = (blockCounts[today] || 0) + 1;
    chrome.storage.local.set({ blockCounts });
  });

  window.stop();
  window.location.replace(
    chrome.runtime.getURL('blocked.html') + '#' + encodeURIComponent(host)
  );
});

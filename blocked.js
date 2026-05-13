// Clock
const timeEl = document.getElementById('time');
function tick() { timeEl.textContent = new Date().toLocaleTimeString(); }
tick();
setInterval(tick, 1000);

// Blocked site name (passed via URL hash)
const site = decodeURIComponent(location.hash.slice(1));
if (site) document.getElementById('site').textContent = site;

// Daily block count
const today = new Date().toISOString().split('T')[0];
chrome.storage.local.get({ blockCounts: {} }, ({ blockCounts }) => {
  const n = blockCounts[today] || 0;
  document.getElementById('count').textContent = `${n} block${n !== 1 ? 's' : ''} today`;
});

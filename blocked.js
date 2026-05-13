// Clock
const timeEl = document.getElementById('time');
function tick() { timeEl.textContent = new Date().toLocaleTimeString(); }
tick();
setInterval(tick, 1000);

// Blocked site name (passed via URL hash)
const site = decodeURIComponent(location.hash.slice(1));
if (site) document.getElementById('site').textContent = site;

// Daily block count from blockLog
const today = new Date().toISOString().split('T')[0];
chrome.storage.local.get({ blockLog: {} }, ({ blockLog }) => {
  const day = blockLog[today] || {};
  const n = Object.values(day).reduce((s, v) => s + v, 0);
  document.getElementById('count').textContent = `${n} block${n !== 1 ? 's' : ''} today`;
});

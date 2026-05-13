function formatDate(isoDate) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function dayTotal(dayData) {
  return Object.values(dayData || {}).reduce((s, n) => s + n, 0);
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function render({ blockLog = {}, pauseLog = [] }) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = blockLog[today] || {};
  const todayEntries = Object.entries(todayData).sort((a, b) => b[1] - a[1]);
  const todayTotal = dayTotal(todayData);

  const last7 = getLast7Days();
  const weekTotals = last7.map(d => ({ date: d, total: dayTotal(blockLog[d]) }));
  const maxTotal = Math.max(...weekTotals.map(w => w.total), 1);

  let html = '';

  // Today's blocks
  html += `<section>
    <div class="label">Today · ${formatDate(today)}</div>`;

  if (todayEntries.length === 0) {
    html += `<div class="empty">No blocks yet today</div>`;
  } else {
    html += todayEntries.map(([domain, count]) =>
      `<div class="site-row">
        <span class="site-name">${domain}</span>
        <span class="site-count">${count}</span>
      </div>`
    ).join('');
    if (todayEntries.length > 1) {
      html += `<div class="site-row total-row">
        <span class="site-name">total</span>
        <span class="site-count">${todayTotal}</span>
      </div>`;
    }
  }
  html += `</section>`;

  // 7-day chart
  html += `<section><div class="label">Last 7 Days</div>`;
  html += weekTotals.map(({ date, total }) => {
    const pct = total > 0 ? Math.max((total / maxTotal) * 100, 1.5).toFixed(1) : 0;
    return `<div class="day-row">
      <span class="day-label">${formatDate(date)}</span>
      <div class="bar-wrap">
        <div class="bar ${total === 0 ? 'empty' : ''}" style="${total > 0 ? `width:${pct}%` : ''}"></div>
      </div>
      <span class="day-count">${total || ''}</span>
    </div>`;
  }).join('');
  html += `</section>`;

  // Pause history
  html += `<section><div class="label">Pauses</div>`;
  if (pauseLog.length === 0) {
    html += `<div class="empty">No pauses recorded</div>`;
  } else {
    html += pauseLog.slice(0, 30).map(({ pausedAt, resumedAt }) =>
      `<div class="pause-row">
        <span class="pause-time">${formatDateTime(pausedAt)}</span>
        <span class="pause-duration">${formatDuration(resumedAt - pausedAt)}</span>
      </div>`
    ).join('');
  }
  html += `</section>`;

  document.getElementById('root').innerHTML = html;
}

chrome.storage.local.get(['blockLog', 'pauseLog'], render);

function normalizeDomain(raw) {
  return raw.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
}

function render(blocked) {
  const list = document.getElementById('list');
  const sorted = [...blocked].sort();

  if (sorted.length === 0) {
    list.innerHTML = '<li class="empty">No sites blocked</li>';
    return;
  }

  list.innerHTML = sorted
    .map(domain => `<li><span>${domain}</span><button class="remove" data-domain="${domain}">&times;</button></li>`)
    .join('');

  list.querySelectorAll('.remove').forEach(btn => {
    btn.onclick = () => {
      chrome.storage.sync.get('blocked', ({ blocked = [] }) => {
        const updated = blocked.filter(d => d !== btn.dataset.domain);
        chrome.storage.sync.set({ blocked: updated }, () => render(updated));
      });
    };
  });
}

function addDomain() {
  const input = document.getElementById('input');
  const domain = normalizeDomain(input.value);
  if (!domain || !domain.includes('.')) return;

  chrome.storage.sync.get('blocked', ({ blocked = [] }) => {
    if (!blocked.includes(domain)) {
      const updated = [...blocked, domain];
      chrome.storage.sync.set({ blocked: updated }, () => render(updated));
    }
    input.value = '';
    input.focus();
  });
}

document.getElementById('add-btn').onclick = addDomain;
document.getElementById('input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addDomain();
});

chrome.storage.sync.get('blocked', ({ blocked = [] }) => render(blocked));

let isUnlocked = false;
let pauseTimer = null;

const $ = id => document.getElementById(id);
const show = id => { $(id).style.display = ''; };
const hide = id => { $(id).style.display = 'none'; };

const TEN_MIN = 10 * 60 * 1000;
const PAUSE_DURATION = 30 * 60 * 1000;

// --- Hour select helpers ---

function hourLabel(h) {
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

function initHourSelects() {
  ['start-hour', 'end-hour'].forEach(id => {
    const sel = $(id);
    for (let h = 0; h < 24; h++) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = hourLabel(h);
      sel.appendChild(opt);
    }
  });
}

// --- Main render ---

function render({ pin, blocked = [], schedule = {}, pause }) {
  // When no PIN is set, always treat as unlocked
  if (!pin) isUnlocked = true;

  renderPinArea(pin);
  renderSchedule(schedule);
  renderList(blocked);
  renderPause(pause);
}

function renderPinArea(pin) {
  if (!pin) {
    show('no-pin'); hide('locked'); hide('unlocked');
  } else if (isUnlocked) {
    hide('no-pin'); hide('locked'); show('unlocked');
  } else {
    hide('no-pin'); show('locked'); hide('unlocked');
  }
}

function renderList(blocked) {
  const list = $('list');
  const sorted = [...blocked].sort();
  if (sorted.length === 0) {
    list.innerHTML = '<li class="empty">No sites blocked</li>';
    return;
  }
  list.innerHTML = sorted.map(domain =>
    `<li>
      <span class="name">${domain}</span>
      <button class="remove" data-domain="${domain}" ${isUnlocked ? '' : 'disabled'}>&times;</button>
    </li>`
  ).join('');

  if (isUnlocked) {
    list.querySelectorAll('.remove').forEach(btn => {
      btn.onclick = () => {
        chrome.storage.sync.get('blocked', ({ blocked = [] }) => {
          const updated = blocked.filter(d => d !== btn.dataset.domain);
          chrome.storage.sync.set({ blocked: updated }, () => renderList(updated));
        });
      };
    });
  }
}

function renderSchedule(schedule) {
  if (!isUnlocked) { hide('schedule-section'); return; }
  show('schedule-section');
  const enabled = !!schedule.enabled;
  $('schedule-enabled').checked = enabled;
  $('schedule-times').style.display = enabled ? 'flex' : 'none';
  $('start-hour').value = schedule.start ?? 9;
  $('end-hour').value = schedule.end ?? 17;
}

function renderPause(pause) {
  if (pauseTimer) { clearInterval(pauseTimer); pauseTimer = null; }
  const area = $('pause-area');

  if (!isUnlocked) { area.innerHTML = ''; return; }

  if (!pause?.startedAt) {
    area.innerHTML = `<button class="pause-btn" id="pause-btn">Pause blocking (10 min delay)</button>`;
    $('pause-btn').onclick = () =>
      chrome.storage.sync.set({ pause: { startedAt: Date.now() } }, refreshAll);
    return;
  }

  const elapsed = () => Date.now() - pause.startedAt;

  if (elapsed() < TEN_MIN) {
    function updateCountdown() {
      const rem = TEN_MIN - elapsed();
      if (rem <= 0) { clearInterval(pauseTimer); pauseTimer = null; refreshAll(); return; }
      const m = Math.floor(rem / 60000);
      const s = Math.floor((rem % 60000) / 1000);
      area.innerHTML = `
        <div class="pause-status">
          Pausing in ${m}:${String(s).padStart(2, '0')}
          <button id="cancel-pause">Cancel</button>
        </div>`;
      $('cancel-pause').onclick = () => chrome.storage.sync.remove('pause', refreshAll);
    }
    updateCountdown();
    pauseTimer = setInterval(updateCountdown, 1000);

  } else if (elapsed() < TEN_MIN + PAUSE_DURATION) {
    const remMin = Math.ceil((TEN_MIN + PAUSE_DURATION - elapsed()) / 60000);
    area.innerHTML = `
      <div class="pause-status">
        Blocking paused (~${remMin} min left)
        <button id="resume-btn">Resume now</button>
      </div>`;
    $('resume-btn').onclick = () => recordAndEndPause(pause, Date.now());

  } else {
    recordAndEndPause(pause, pause.startedAt + TEN_MIN + PAUSE_DURATION);
  }
}

function recordAndEndPause(pause, resumedAt) {
  const entry = { pausedAt: pause.startedAt + TEN_MIN, resumedAt };
  chrome.storage.local.get({ pauseLog: [] }, ({ pauseLog }) => {
    pauseLog.unshift(entry);
    chrome.storage.local.set({ pauseLog: pauseLog.slice(0, 50) }, () =>
      chrome.storage.sync.remove('pause', refreshAll)
    );
  });
}

function refreshAll() {
  chrome.storage.sync.get(['blocked', 'pin', 'schedule', 'pause'], render);
}

// --- PIN actions ---

$('set-pin-btn').onclick = () => {
  const pin = $('new-pin').value.trim();
  if (pin.length < 4) {
    $('set-pin-error').textContent = 'PIN must be at least 4 characters';
    return;
  }
  $('set-pin-error').textContent = '';
  chrome.storage.sync.set({ pin }, () => { isUnlocked = true; refreshAll(); });
};

$('unlock-btn').onclick = tryUnlock;
$('pin-input').addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });

function tryUnlock() {
  const entered = $('pin-input').value;
  chrome.storage.sync.get('pin', ({ pin }) => {
    if (entered === pin) {
      isUnlocked = true;
      $('pin-input').value = '';
      $('pin-error').textContent = '';
      refreshAll();
    } else {
      $('pin-error').textContent = 'Wrong PIN';
      setTimeout(() => { if ($('pin-error')) $('pin-error').textContent = ''; }, 1500);
    }
  });
}

$('lock-btn').onclick = () => { isUnlocked = false; refreshAll(); };

// --- Add site ---

$('add-btn').onclick = addDomain;
$('input').addEventListener('keydown', e => { if (e.key === 'Enter') addDomain(); });

function normalizeDomain(raw) {
  return raw.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0].split('?')[0];
}

function addDomain() {
  const input = $('input');
  const domain = normalizeDomain(input.value);
  if (!domain || !domain.includes('.')) return;
  chrome.storage.sync.get('blocked', ({ blocked = [] }) => {
    if (!blocked.includes(domain)) {
      chrome.storage.sync.set({ blocked: [...blocked, domain] }, refreshAll);
    }
    input.value = '';
    input.focus();
  });
}

// --- Schedule ---

$('schedule-enabled').onchange = saveSchedule;
$('start-hour').onchange = saveSchedule;
$('end-hour').onchange = saveSchedule;

function saveSchedule() {
  const enabled = $('schedule-enabled').checked;
  $('schedule-times').style.display = enabled ? 'flex' : 'none';
  chrome.storage.sync.set({
    schedule: {
      enabled,
      start: parseInt($('start-hour').value),
      end: parseInt($('end-hour').value),
    }
  });
}

// --- Init ---

initHourSelects();
refreshAll();
$('stats-link').href = chrome.runtime.getURL('stats.html');
$('stats-link').onmouseover = () => { $('stats-link').style.color = '#fff'; };
$('stats-link').onmouseout = () => { $('stats-link').style.color = '#333'; };

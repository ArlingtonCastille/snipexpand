const DEFAULT_SETTINGS = {
  prefix: '|',
  expandMode: 'auto',
  strictMode: true,
  skipDeleteConfirm: false
};

const PREFIX_PATTERN = /^[^\w\s]{1,3}$/;

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

async function saveSettings(updates) {
  const current = await getSettings();
  const merged = { ...current, ...updates };
  await chrome.storage.local.set({ settings: merged });
  showStatus('Saved.');
}

function showStatus(message) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 1800);
}

function isValidPrefix(s) {
  return PREFIX_PATTERN.test(s);
}

function highlightActivePreset(prefix) {
  const presets = document.querySelectorAll('.preset');
  for (const btn of presets) {
    btn.classList.toggle('active', btn.dataset.prefix === prefix);
  }
}

async function init() {
  const settings = await getSettings();

  const prefixInput = document.getElementById('prefix-input');
  const prefixHint = document.getElementById('prefix-hint');
  prefixInput.value = settings.prefix;
  highlightActivePreset(settings.prefix);

  prefixInput.addEventListener('input', async () => {
    const value = prefixInput.value;
    if (!isValidPrefix(value)) {
      prefixInput.classList.add('invalid');
      prefixHint.classList.add('error');
      prefixHint.textContent = 'Prefix must be 1-3 punctuation characters. No letters, numbers, or spaces.';
      return;
    }
    prefixInput.classList.remove('invalid');
    prefixHint.classList.remove('error');
    prefixHint.textContent = '1-3 punctuation characters. No letters, numbers, or spaces.';
    highlightActivePreset(value);
    await saveSettings({ prefix: value });
  });

  document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.prefix;
      prefixInput.value = value;
      prefixInput.classList.remove('invalid');
      prefixHint.classList.remove('error');
      prefixHint.textContent = '1-3 punctuation characters. No letters, numbers, or spaces.';
      highlightActivePreset(value);
      await saveSettings({ prefix: value });
    });
  });

  const radios = document.querySelectorAll('input[name="expandMode"]');
  for (const radio of radios) {
    radio.checked = (radio.value === settings.expandMode);
    radio.addEventListener('change', async (e) => {
      if (e.target.checked) await saveSettings({ expandMode: e.target.value });
    });
  }

  const strictCheckbox = document.getElementById('strict-mode');
  strictCheckbox.checked = settings.strictMode;
  strictCheckbox.addEventListener('change', async (e) => {
    await saveSettings({ strictMode: e.target.checked });
  });

  const skipConfirmCheckbox = document.getElementById('skip-delete-confirm');
  skipConfirmCheckbox.checked = settings.skipDeleteConfirm;
  skipConfirmCheckbox.addEventListener('change', async (e) => {
    await saveSettings({ skipDeleteConfirm: e.target.checked });
  });
}

init();

const DEFAULT_SETTINGS = {
  prefix: '|',
  expandMode: 'auto',
  strictMode: true,
  skipDeleteConfirm: false
};

let editingTrigger = null;
let confirmResolver = null;

async function getSnippets() {
  const { snippets = {} } = await chrome.storage.local.get('snippets');
  return snippets;
}

async function setSnippets(snippets) {
  await chrome.storage.local.set({ snippets });
}

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

function showStatus(message, isError = false) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 2400);
}

function customConfirm(message, title = 'Confirm', okLabel = 'OK') {
  return new Promise((resolve) => {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-ok-btn').textContent = okLabel;
    document.getElementById('confirm-modal').hidden = false;
    confirmResolver = resolve;
    setTimeout(() => document.getElementById('confirm-cancel-btn').focus(), 50);
  });
}

function closeConfirmModal(result) {
  document.getElementById('confirm-modal').hidden = true;
  if (confirmResolver) {
    const r = confirmResolver;
    confirmResolver = null;
    r(result);
  }
}

function isValidTrigger(s) {
  if (!s) return false;
  if (/\s/.test(s)) return false;
  if (s.length > 60) return false;
  return true;
}

async function renderList() {
  try {
    const snippets = await getSnippets();
    const settings = await getSettings();
    const list = document.getElementById('snippet-list');
    const empty = document.getElementById('empty-state');
    list.innerHTML = '';

    const triggers = Object.keys(snippets).sort();
    if (triggers.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    for (const trigger of triggers) {
      const li = document.createElement('li');
      li.className = 'snippet';

      const header = document.createElement('div');
      header.className = 'snippet-header';

      const triggerEl = document.createElement('span');
      triggerEl.className = 'snippet-trigger';
      triggerEl.textContent = `${settings.prefix}${trigger}`;
      header.appendChild(triggerEl);

      const actions = document.createElement('div');
      actions.className = 'snippet-actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openEditor(trigger, snippets[trigger]));
      actions.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteSnippet(trigger));
      actions.appendChild(deleteBtn);

      header.appendChild(actions);
      li.appendChild(header);

      const body = document.createElement('div');
      body.className = 'snippet-body';
      body.textContent = snippets[trigger];
      li.appendChild(body);

      list.appendChild(li);
    }
  } catch (err) {
    console.error('SnipExpand render error:', err);
    showStatus(`Render error: ${err.message || err}`, true);
  }
}

function openEditor(trigger, body) {
  editingTrigger = trigger;
  document.getElementById('editor-title').textContent = trigger ? 'Edit snippet' : 'New snippet';
  document.getElementById('trigger-input').value = trigger || '';
  document.getElementById('body-input').value = body || '';
  document.getElementById('trigger-hint').textContent = '';
  document.getElementById('trigger-hint').classList.remove('error');
  document.getElementById('trigger-input').classList.remove('invalid');
  document.getElementById('body-input').classList.remove('invalid');
  document.getElementById('editor-modal').hidden = false;
  setTimeout(() => document.getElementById('trigger-input').focus(), 50);
}

function closeEditor() {
  document.getElementById('editor-modal').hidden = true;
  editingTrigger = null;
}

async function saveFromEditor() {
  const triggerInput = document.getElementById('trigger-input');
  const bodyInput = document.getElementById('body-input');
  const hint = document.getElementById('trigger-hint');
  const trigger = triggerInput.value.trim();
  const body = bodyInput.value;

  triggerInput.classList.remove('invalid');
  bodyInput.classList.remove('invalid');
  hint.classList.remove('error');
  hint.textContent = '';

  if (!isValidTrigger(trigger)) {
    triggerInput.classList.add('invalid');
    hint.textContent = 'Trigger must be 1-60 characters with no whitespace.';
    hint.classList.add('error');
    triggerInput.focus();
    return;
  }

  if (!body) {
    bodyInput.classList.add('invalid');
    hint.textContent = 'Snippet body cannot be empty.';
    hint.classList.add('error');
    bodyInput.focus();
    return;
  }

  try {
    const snippets = await getSnippets();

    if (trigger !== editingTrigger && Object.prototype.hasOwnProperty.call(snippets, trigger)) {
      triggerInput.classList.add('invalid');
      hint.textContent = `A snippet with trigger "${trigger}" already exists.`;
      hint.classList.add('error');
      triggerInput.focus();
      return;
    }

    if (editingTrigger && editingTrigger !== trigger) {
      delete snippets[editingTrigger];
    }
    snippets[trigger] = body;

    await setSnippets(snippets);
    closeEditor();
    showStatus(`Saved: ${trigger}`);
    await renderList();
  } catch (err) {
    console.error('SnipExpand save error:', err);
    showStatus(`Save error: ${err.message || err}`, true);
  }
}

async function deleteSnippet(trigger) {
  try {
    const settings = await getSettings();
    if (!settings.skipDeleteConfirm) {
      const ok = await customConfirm(
        `Delete the snippet "${trigger}"? This cannot be undone.`,
        'Delete snippet',
        'Delete'
      );
      if (!ok) return;
    }
    const snippets = await getSnippets();
    delete snippets[trigger];
    await setSnippets(snippets);
    showStatus(`Deleted: ${trigger}`);
    await renderList();
  } catch (err) {
    console.error('SnipExpand delete error:', err);
    showStatus(`Delete error: ${err.message || err}`, true);
  }
}

async function exportSnippets() {
  try {
    const snippets = await getSnippets();
    const settings = await getSettings();
    const payload = {
      snipexpand: 'v1',
      exportedAt: new Date().toISOString(),
      settings: { prefix: settings.prefix },
      snippets
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snipexpand-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Snippets exported.');
  } catch (err) {
    console.error('SnipExpand export error:', err);
    showStatus(`Export error: ${err.message || err}`, true);
  }
}

function importSnippets() {
  document.getElementById('import-file').click();
}

async function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || !data.snippets || typeof data.snippets !== 'object') {
      showStatus('Not a valid SnipExpand export.', true);
      return;
    }

    const incoming = data.snippets;
    const cleaned = {};
    for (const [trigger, body] of Object.entries(incoming)) {
      if (typeof trigger !== 'string' || typeof body !== 'string') continue;
      if (!isValidTrigger(trigger)) continue;
      cleaned[trigger] = body;
    }

    const incomingCount = Object.keys(cleaned).length;
    if (incomingCount === 0) {
      showStatus('No valid snippets found in file.', true);
      return;
    }

    const existing = await getSnippets();
    const overlap = Object.keys(cleaned).filter(t => Object.prototype.hasOwnProperty.call(existing, t));
    let proceed = true;
    if (overlap.length > 0) {
      proceed = await customConfirm(
        `${overlap.length} snippet${overlap.length === 1 ? '' : 's'} already exist with the same trigger. Overwrite them?`,
        'Overwrite snippets',
        'Overwrite'
      );
    }
    if (!proceed) {
      showStatus('Import cancelled.');
      return;
    }

    const merged = { ...existing, ...cleaned };
    await setSnippets(merged);
    showStatus(`Imported ${incomingCount} snippet${incomingCount === 1 ? '' : 's'}.`);
    await renderList();
  } catch (err) {
    console.error('SnipExpand import error:', err);
    showStatus(`Import error: ${err.message || err}`, true);
  }
}

document.getElementById('add-btn').addEventListener('click', () => openEditor(null, ''));
document.getElementById('cancel-btn').addEventListener('click', closeEditor);
document.getElementById('save-btn').addEventListener('click', saveFromEditor);
document.getElementById('settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('export-btn').addEventListener('click', exportSnippets);
document.getElementById('import-btn').addEventListener('click', importSnippets);
document.getElementById('import-file').addEventListener('change', handleImportFile);

document.getElementById('confirm-cancel-btn').addEventListener('click', () => closeConfirmModal(false));
document.getElementById('confirm-ok-btn').addEventListener('click', () => closeConfirmModal(true));
document.getElementById('confirm-modal').addEventListener('click', (e) => {
  if (e.target.id === 'confirm-modal') closeConfirmModal(false);
});

document.getElementById('editor-modal').addEventListener('click', (e) => {
  if (e.target.id === 'editor-modal') closeEditor();
});

document.getElementById('trigger-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveFromEditor();
  }
});

document.getElementById('body-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    saveFromEditor();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!document.getElementById('confirm-modal').hidden) {
      closeConfirmModal(false);
    } else if (!document.getElementById('editor-modal').hidden) {
      closeEditor();
    }
  }
});

renderList();

(() => {
  const DEFAULT_SETTINGS = {
    prefix: '|',
    expandMode: 'auto',
    strictMode: true
  };

  let snippets = {};
  let settings = { ...DEFAULT_SETTINGS };
  let cachedClipboard = '';

  async function loadAll() {
    try {
      const data = await chrome.storage.local.get(['snippets', 'settings']);
      snippets = data.snippets || {};
      settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    } catch (err) {
      console.error('SnipExpand load error:', err);
    }
  }

  loadAll();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.snippets) snippets = changes.snippets.newValue || {};
    if (changes.settings) settings = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue || {}) };
  });

  function isEditableTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      const type = (el.type || 'text').toLowerCase();
      const allowed = ['text', 'search', 'email', 'url', 'tel', 'password'];
      return allowed.includes(type);
    }
    return false;
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function findTriggerBeforeCursor(value, cursorPos) {
    const prefix = settings.prefix;
    if (!prefix) return null;
    const before = value.slice(0, cursorPos);
    const lastPrefix = before.lastIndexOf(prefix);
    if (lastPrefix === -1) return null;

    if (settings.strictMode && lastPrefix > 0) {
      const charBefore = before[lastPrefix - 1];
      if (!/\s/.test(charBefore)) return null;
    }

    const trigger = before.slice(lastPrefix + prefix.length);
    if (!trigger || /\s/.test(trigger)) return null;
    if (!Object.prototype.hasOwnProperty.call(snippets, trigger)) return null;

    return { start: lastPrefix, trigger, body: snippets[trigger] };
  }

  async function getClipboardSafe() {
    try {
      const text = await navigator.clipboard.readText();
      cachedClipboard = text;
      return text;
    } catch {
      return cachedClipboard;
    }
  }

  async function applyVariables(body) {
    let result = body;
    if (result.includes('{date}')) {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      result = result.replaceAll('{date}', iso);
    }
    if (result.includes('{time}')) {
      const now = new Date();
      const time = now.toLocaleTimeString();
      result = result.replaceAll('{time}', time);
    }
    if (result.includes('{clipboard}')) {
      const clip = await getClipboardSafe();
      result = result.replaceAll('{clipboard}', clip);
    }
    let cursorOffset = -1;
    if (result.includes('{cursor}')) {
      cursorOffset = result.indexOf('{cursor}');
      result = result.replace('{cursor}', '');
    }
    return { text: result, cursorOffset };
  }

  function setNativeValue(element, value) {
    const tag = element.tagName;
    const proto = tag === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function performExpansion(el, match, includeTriggerEnd) {
    const value = el.value;
    const triggerEndPos = match.start + settings.prefix.length + match.trigger.length;
    const tail = value.slice(triggerEndPos + (includeTriggerEnd ? 1 : 0));
    const head = value.slice(0, match.start);
    const expanded = await applyVariables(match.body);

    const newValue = head + expanded.text + tail;
    setNativeValue(el, newValue);

    let newCursor;
    if (expanded.cursorOffset >= 0) {
      newCursor = head.length + expanded.cursorOffset;
    } else {
      newCursor = head.length + expanded.text.length;
    }
    try { el.setSelectionRange(newCursor, newCursor); } catch (e) { /* some inputs reject this */ }
  }

  function shouldAutoFire(e) {
    if (settings.expandMode === 'tab') return false;
    return e.key === ' ' || e.key === 'Enter' || e.key === 'Tab';
  }

  document.addEventListener('keydown', async (e) => {
    const el = e.target;
    if (!isEditableTarget(el)) return;

    const cursorPos = el.selectionStart;
    if (cursorPos === null || cursorPos !== el.selectionEnd) return;

    if (e.key === 'Tab') {
      const match = findTriggerBeforeCursor(el.value, cursorPos);
      if (match) {
        e.preventDefault();
        await performExpansion(el, match, false);
      }
      return;
    }

    if (settings.expandMode === 'auto' && shouldAutoFire(e)) {
      const match = findTriggerBeforeCursor(el.value, cursorPos);
      if (match) {
        if (e.key === 'Enter') {
          e.preventDefault();
          await performExpansion(el, match, false);
        } else if (e.key === ' ') {
          e.preventDefault();
          await performExpansion(el, match, false);
        }
      }
    }
  }, true);
})();

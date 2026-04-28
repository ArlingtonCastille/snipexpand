# SnipExpand

Type a short trigger, get a long snippet. Local-first text expansion with no account required.

SnipExpand watches the text fields in your browser. Type your prefix followed by a trigger word, hit space, and the snippet expands. Save your most-typed phrases, common email replies, addresses, code blocks, signatures — anything you write more than twice.

## Features

- One-click snippet creation and editing
- Configurable trigger prefix (default `|`, change to anything)
- Auto-expand on space, Tab, or Enter — or strict Tab-only mode
- Strict mode: triggers only fire at word boundaries, never mid-word
- Variables: `{date}`, `{time}`, `{clipboard}`, `{cursor}`
- Export and import snippets as JSON
- All snippets live in `chrome.storage.local`. Nothing is sent anywhere.

## Install

### From source (development)

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Toggle "Developer mode" on (top right).
4. Click "Load unpacked" and select the `snipexpand` folder.
5. Pin the SnipExpand icon to your toolbar.

Chrome Web Store listing coming soon.

## Usage

1. Click the SnipExpand icon, then "+ New snippet."
2. Set a trigger (e.g., `email`) and a body (e.g., `arlington@example.com`).
3. Save it. Now anywhere you can type into a standard text field, type `|email` and a space — the snippet expands.

### Variables

- `{date}` — today's date in ISO format (`2026-04-28`)
- `{time}` — the current time
- `{clipboard}` — the contents of your clipboard
- `{cursor}` — places the cursor at this position after expansion

Example snippet body:

```
Hi {clipboard},

Following up on our conversation. Let me know what works.

— Arlington
{cursor}
```

## Settings

- **Trigger prefix** — choose any 1-3 punctuation characters. Default `|`.
- **Expansion mode** — auto (space/Tab/Enter) or Tab-only.
- **Strict mode** — only fire at word boundaries. Recommended on.

## Limitations (v1)

- Works in standard `<input>` and `<textarea>` fields only. Does not yet work in rich-text editors like Gmail compose, Notion, Google Docs, or Slack. Planned for v1.1.
- Does not work on Chrome's internal pages (`chrome://`) by design.

## Privacy

SnipExpand runs entirely on your machine. No analytics, no servers, no telemetry. The clipboard variable reads your clipboard only at the moment a snippet expands, never in the background.

## Roadmap

- Rich-text editor support (Gmail, Notion, Google Docs)
- Per-site enable/disable
- Snippet folders and tags
- Cursor position memory inside snippets
- Firefox build

## License

MIT. See [LICENSE](LICENSE).

## Support

SnipExpand is free and donationware. If it saves you keystrokes, you can support development:

- [Buy Me a Coffee](https://buymeacoffee.com/arlingtoncastille)
- [Patreon](https://patreon.com/arlingtoncastille)

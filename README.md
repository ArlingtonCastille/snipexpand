# SnipExpand

**Stop typing the same thing twice.**

Save your most-typed phrases — your email address, signatures, common replies, code snippets, addresses — and recall them with a short trigger. Type your prefix and a trigger word, hit space, and the snippet expands in place.

For anyone who writes the same things over and over: customer service reps, developers, writers, anyone who answers email, anyone who fills out forms.

## Features

- **Variables** — insert the current date, time, clipboard contents, or place your cursor mid-snippet
- **Configurable trigger prefix** — any punctuation you want, default `|`
- **Three expansion modes** — auto on whitespace, Tab-only, or strict word-boundary
- **Export and import** snippets as JSON for backup or sharing
- Snippets and settings live entirely on your device. Nothing is sent anywhere.

## Variables

Drop these into any snippet body and they expand at runtime:

- `{date}` — today's date in ISO format (`2026-04-29`)
- `{time}` — the current time
- `{clipboard}` — the contents of your clipboard
- `{cursor}` — places your cursor at this position after expansion

Example snippet body:

```
Hi {clipboard},

Following up on our conversation. Let me know what works.

— Arlington
{cursor}
```

Trigger that with `|reply` (or whatever you named it), and the clipboard contents drop into the greeting while your cursor lands ready to type the rest of the message.

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

## Settings

- **Trigger prefix** — any 1-3 punctuation characters. Default `|`.
- **Expansion mode** — auto (space/Tab/Enter) or Tab-only.
- **Strict mode** — only fire at word boundaries. Recommended on.
- **Skip delete confirmation** — for users who delete frequently and don't want to be asked.

## Privacy

SnipExpand runs entirely on your machine. No analytics, no servers, no telemetry. The clipboard variable reads your clipboard only at the moment a snippet expands, never in the background.

## Scope

- Works in standard `<input>` and `<textarea>` fields. Does not yet work in rich-text editors like Gmail compose, Notion, Google Docs, or Slack. Planned for v1.1.
- Does not run on Chrome's internal pages (`chrome://`) by design.

## Roadmap

- Rich-text editor support (Gmail, Notion, Google Docs)
- Firefox build
- Per-site enable/disable
- Snippet folders and tags
- Cursor position memory inside snippets

## License

MIT. See [LICENSE](LICENSE).

## Support

If SnipExpand earns its keep, here's how to keep it going:

- [Buy Me a Coffee](https://buymeacoffee.com/arlingtoncastille)
- [Patreon](https://patreon.com/arlingtoncastille)

# Warid (وارِد)

Open-source desktop app that records audio and sends it directly to Google Gemini for transcription, translation, or any custom output you design via prompt templates.

No Whisper, no STT middle layer — Gemini is multimodal and understands Arabic, English, and code-switching natively. Define one prompt per template and route every recording through it.

## Features

- **Record from microphone or upload an audio file**
- **Custom prompt templates** — each with its own output language and Gemini model
- **Streaming output** — text appears as Gemini generates it
- **Auto-copy to clipboard** when transcription finishes
- **Global hotkey** (Ctrl+Shift+R) — record from anywhere, even when the app is in the background
- **System tray icon** — keep the app running silently
- **History** — local SQLite store of past transcriptions, searchable
- **Editable output** — fix typos before copying
- **Privacy-first** — your audio is sent only to Google. No third-party server, no analytics.
- **API key stored securely** in the OS keychain
- **Bring your own key** — uses your free Google AI Studio API key

## Installation

Download the latest `.msi` (Windows) / `.dmg` (macOS) / `.AppImage` (Linux) from the [Releases](https://github.com/maslooh/warid/releases) page.

## Getting an API Key

1. Go to [aistudio.google.com](https://aistudio.google.com/apikey)
2. Click **Get API key** → **Create API key in new project**
3. Copy the key
4. Open Warid → Settings → paste the key

The free tier is generous; for most users it never runs out.

## Default Templates

Warid ships with a **Coding Assistant** template tuned for dictating coding tasks. It transcribes mixed Arabic/English speech and rewrites it as a clean, structured developer brief in English.

You can add unlimited custom templates from the **Templates** page. Each template can override:
- the prompt body
- output language (force English, force Arabic, or leave mixed)
- Gemini model (e.g. `gemini-2.5-pro` for higher quality, `gemini-2.5-flash` for speed)

Import/export templates as JSON to share with others. The `templates/` folder in this repo has community-contributed templates.

## Building from Source

Requirements:
- Node.js 18+
- Rust 1.75+
- (Windows) Visual Studio Build Tools with C++ workload
- (Linux) `webkit2gtk-4.1`, `libsoup-3.0`, `libappindicator3-dev`

```bash
git clone https://github.com/maslooh/warid.git
cd warid
npm install
npm run tauri dev      # development
npm run tauri build    # build installer
```

The installer ends up in `src-tauri/target/release/bundle/`.

## Architecture

- **Tauri 2** — Rust backend, ~10 MB bundle, ~30 MB RAM
- **React 18 + TypeScript + Vite** — UI in the system webview
- **Tailwind CSS 3** — sharp/corporate design (no rounded corners, Noto Kufi Arabic)
- **@google/generative-ai** — Gemini SDK called directly from the webview with the user's API key
- **SQLite** (via tauri-plugin-sql) — local templates + history
- **Web Audio API + MediaRecorder** — webm/opus audio capture in the browser engine

The Gemini API call happens entirely in the frontend. The Rust side handles the global hotkey, system tray, and persistent storage.

## Contributing

Pull requests welcome. For bigger changes please open an issue first.

To contribute a community template, add a JSON file under `templates/` and submit a PR.

## License

MIT — see [LICENSE](LICENSE).

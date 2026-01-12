# Fountain Spell Assist

A Chrome extension for on-device spell checking in editable web content. No network calls, no tracking — everything runs locally in your browser.

![Fountain Spell Assist](public/icons/icon128.svg)

## Features

- **On-device spell checking** — Uses a built-in dictionary with 15,000+ common English words
- **Grammar checking** — Detects common grammar mistakes (your/you're, its/it's, then/than, etc.)
- **Auto-correct** — Automatically correct misspellings as you type (optional)
- **Smart field detection** — Automatically attaches to textareas, inputs, and contenteditable elements
- **Shadow DOM & iframe support** — Works with modern web apps and embedded content
- **Rich editor support** — Enhanced detection for Notion, Slack web, Quill, ProseMirror, and other modern editors
- **Privacy-first** — Never sends your text anywhere; all processing is local
- **Sensitive field protection** — Automatically disabled on password fields, credit card inputs, and other sensitive areas
- **Custom dictionary** — Add your own words, import/export, search and bulk operations
- **Per-site control** — Enable/disable spell checking on specific websites
- **Pattern-based blocking** — Disable on sites matching patterns (e.g., `*.bank.com`)
- **Keyboard shortcuts** — Quick toggles (Ctrl+Shift+S, Ctrl+Shift+U, Ctrl+Shift+G)
- **Statistics tracking** — See how many words you've checked and corrections made
- **Accessibility** — Full keyboard navigation and screen reader support
- **Export/Import settings** — Backup and restore all your settings

## Compatibility

### ✅ Works On:
- **Notion** (web app in Chrome) - Full support with enhanced editor detection
- **Slack** (web app in Chrome) - Full support
- **Google Docs** (web) - Works on contenteditable elements
- **Most modern web editors** - Quill, ProseMirror, Slate, Draft.js, etc.
- **Standard form fields** - Inputs, textareas, contenteditable divs

### ❌ Does Not Work On:
- **Slack Desktop App** - Desktop apps don't support Chrome extensions
- **Notion Desktop App** - Desktop apps don't support Chrome extensions
- **Native applications** - Only works in Chrome browser
- **Some iframes with CORS restrictions** - Limited by browser security

## Installation

### Development Setup

1. **Prerequisites**
   - Node.js 18+ 
   - npm or yarn

2. **Clone and install dependencies**
   ```bash
   cd fountain-spell-assist
   npm install
   ```

3. **Build the extension**
   ```bash
   # Development build (with watch mode)
   npm run dev
   
   # Production build
   npm run build
   ```

4. **Load the unpacked extension in Chrome**
   1. Open Chrome and navigate to `chrome://extensions/`
   2. Enable **Developer mode** (toggle in top-right corner)
   3. Click **Load unpacked**
   4. Select the `dist` folder from this project
   5. The extension icon should appear in your toolbar

### About Icons

PNG icons are automatically generated during the build process using `npm run icons`. The generated icons are simple orange placeholders. To use custom icons, replace the PNG files in `public/icons/` with your own designs before building.

## Usage

### Basic Usage

1. Click the extension icon in your toolbar to open the popup
2. Toggle spell checking on/off for the current site
3. Type in any text field — misspelled words will be underlined in red

### Correcting Misspellings

1. Click or right-click on an underlined word
2. Select a suggestion from the context menu
3. Or choose **Ignore** (session only) or **Add to Dictionary** (permanent)

### Options Page

Access full settings by clicking **Options** in the popup or right-clicking the extension icon.

- **Global Enable** — Master on/off switch
- **Show Underlines** — Toggle highlight visibility
- **Auto-Correct** — Automatically replace misspellings on space/enter
- **Grammar Checking** — Detect common grammar mistakes
- **Language** — Select dictionary language (currently en-US, en-GB)
- **Custom Dictionary** — View, search, remove, import, or export your words (with bulk operations)
- **Statistics Dashboard** — View usage statistics and reset if needed
- **Disabled Sites** — Add URL patterns to disable spell checking
- **Export/Import All Settings** — Backup and restore everything

### Keyboard Shortcuts

- **Ctrl+Shift+S** — Toggle spell checking for current site
- **Ctrl+Shift+U** — Toggle underline visibility
- **Ctrl+Shift+G** — Toggle grammar checking

## Project Structure

```
fountain-spell-assist/
├── public/
│   ├── manifest.json       # Chrome extension manifest (MV3)
│   ├── content.css         # Content script styles
│   └── icons/              # Extension icons
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Background service worker
│   ├── content/
│   │   └── content.ts          # Content script (spell checking)
│   ├── popup/
│   │   ├── index.html          # Popup HTML
│   │   ├── main.tsx            # Popup React entry
│   │   ├── Popup.tsx           # Popup component
│   │   └── styles.css          # Popup styles
│   ├── options/
│   │   ├── index.html          # Options HTML
│   │   ├── main.tsx            # Options React entry
│   │   ├── Options.tsx         # Options component
│   │   └── styles.css          # Options styles
│   └── shared/
│       ├── types.ts            # TypeScript type definitions
│       ├── storage.ts          # Chrome storage utilities
│       ├── messaging.ts        # Message passing utilities
│       ├── dictionary.ts       # Spell checker & word list
│       ├── dictionary.test.ts  # Dictionary tests
│       └── storage.test.ts     # Storage tests
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build with watch mode for development |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## How It Works

### Spell Checking

1. **Field Detection** — Content script scans for editable elements (`<textarea>`, `<input type="text">`, `[contenteditable]`)
2. **Input Monitoring** — Debounced (500ms) listener captures text changes
3. **Word Extraction** — Text is tokenized into words with position tracking
4. **Dictionary Lookup** — Each word is checked against the built-in dictionary + custom words
5. **Suggestion Generation** — Uses Levenshtein distance to find similar words

### Highlight Rendering

- **For contenteditable** — Uses Range API to calculate word positions, renders overlay divs
- **For textarea/input** — Uses "mirror div" technique to measure text positions

### Storage

- `chrome.storage.sync` for settings (syncs across devices)
- Custom dictionary and per-site settings persist in sync storage
- Session-only "Ignore" words are stored in memory

## Privacy

Fountain Spell Assist is designed with privacy in mind:

- ✅ **No network calls** — All spell checking happens locally
- ✅ **No analytics** — No tracking or telemetry
- ✅ **No external services** — No API calls to spell check servers
- ✅ **Sensitive field detection** — Automatically skips password fields and financial inputs
- ✅ **User control** — Disable on any site with one click

## Technical Details

- **Manifest Version**: 3 (MV3)
- **Permissions**: `storage`, `activeTab`, `contextMenus`
- **Host Permissions**: `<all_urls>` (required for content script injection)
- **Build Tool**: Vite
- **UI Framework**: React 18
- **Language**: TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — feel free to use, modify, and distribute.

---

Built with care. No AI slop here. 🖋


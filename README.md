# 🚀 Vmark - Keyboard-Driven New Tab Manager for Chrome

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
</p>

<p align="center">
  <strong>⚡ Replace your new tab page with a blazing fast, keyboard-first tab navigation system.</strong><br />
  Open-source. Privacy-first. 100% local.
</p>

---

## ✨ Why Vmark?

Vmark transforms Chrome's new tab into a **powerful command center** for your browsing. Built for power users, developers, and keyboard enthusiasts who want to navigate tabs, bookmarks, and history at the speed of thought.

### 🎯 Key Highlights

| Feature | Description |
|---------|-------------|
| ⌨️ **Vim-style Navigation** | Full keyboard control with `j/k`, `1-9`, `h/l` shortcuts |
| 🗂️ **Auto-Categorization** | Tabs auto-sorted into Social, Tech, News, Cloud, LAN |
| 📌 **Favorites & History** | Quick access to bookmarks and recent visits |
| 🎨 **8 Beautiful Themes** | From dark pink to ocean blue, forest green, and more |
| 🌏 **Multi-Language** | English, 中文, 日本語 support |
| 🔒 **100% Private** | All data stays in your browser, no tracking, no cloud |
| 🪶 **Lightweight** | < 250KB total, instant load |
| ⚙️ **Highly Configurable** | Custom categories, domains, rules, labels |

---

## 🚀 Quick Start

### Install from Chrome Web Store (Recommended)
> 🎉 **Coming soon!** We're preparing the Web Store listing.

### Manual Installation (Developer Mode)
1. Clone this repository
   ```bash
   git clone https://github.com/exiahuang/vmark.git
   cd vmark
   ```
2. Install dependencies
   ```bash
   npm install
   npm run build
   ```
3. Open Chrome → `chrome://extensions`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** → Select the `extension/` folder

---

## ⌨️ Keyboard Shortcuts

### Navigation
| Shortcut | Action |
|----------|--------|
| `j` / `k` | Move down / up |
| `h` / `l` | Previous / Next category |
| `gg` / `G` | First / Last item |
| `1-9` | Jump to tab 1-9 |
| `Enter` / `o` | Open selected |
| `O` | Open in background |

### Tab Management
| Shortcut | Action |
|----------|--------|
| `a` / `d` | Add / Remove bookmark |
| `R` | Rename item |
| `y` / `t` | Copy URL / Title |
| `x` | Delete / Trash |
| `z` / `Z` | Toggle group / All groups |

### Modes
| Shortcut | Action |
|----------|--------|
| `/` | Enter filter mode |
| `:` | Enter command mode |
| `?` | Help panel |
| `S` | Settings |
| `Esc` | Close / Back |
| `Ctrl+0` | Global Vmark shortcut |

---

## 🗂️ Tab Categories

| # | Category | Description |
|---|----------|-------------|
| 1 | **Current** | Currently open tabs |
| 2 | **Favorites** | Your bookmarks |
| 3 | **History** | Recent browsing history |
| 4 | **Social** | Twitter/X, Facebook, Instagram, LinkedIn, Reddit |
| 5 | **News** | Hacker News, CNN, BBC, Reuters |
| 6 | **Reserved** | Custom slot for your needs |
| 7 | **Tech** | GitHub, Stack Overflow, Medium, dev.to |
| 8 | **Cloud** | Vercel, AWS, GCP, Azure, Alibaba Cloud |
| 9 | **LAN** | Local network devices (192.168.x, localhost) |

> 💡 All categories 4-9 are **fully customizable** in Settings!

---

## 🎨 Themes

| Theme | Style |
|-------|-------|
| **Default** | Dark pink/purple |
| **Ocean** | Deep blue |
| **Forest** | Nature green |
| **Sunset** | Warm orange |
| **Lavender** | Soft purple |
| **Cherry** | Bold red |
| **Mint** | Fresh green |
| **Dracula** | Popular dark theme |

---

## 🌏 Multi-Language Support

Vmark supports:
- 🇺🇸 **English**
- 🇨🇳 **中文 (Chinese)**
- 🇯🇵 **日本語 (Japanese)**

Switch languages instantly in Settings → Language.

---

## 🔧 Configuration

Press `S` or `:` to open Settings:

- **Categories 1-3**: Rename labels (Current → My Tabs, etc.)
- **Categories 4-9**: Customize name, domains, keywords, URL regex
- **Language**: Switch between EN/ZH/JA
- **Theme**: Choose from 8 beautiful themes
- **View Mode**: Compact / Detailed / Grouped
- **Sort Mode**: Time / Frequency

Changes apply immediately and persist after refresh.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool |
| **Zustand** | Lightweight state management |
| **Chrome Extension API** | Tab, bookmark, history access |

---

## 🔒 Privacy & Security

- ✅ **No data collection** - Everything stays local
- ✅ **No external requests** - No analytics, no tracking
- ✅ **No cloud sync** - Your data never leaves your browser
- ✅ **Open source** - MIT license, fully auditable

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- ⭐ Star the repo if you like it!

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

## 🔗 Links

- 🌐 **GitHub**: https://github.com/exiahuang/vmark
- 🐛 **Issue Tracker**: https://github.com/exiahuang/vmark/issues
- 💬 **Discussions**: https://github.com/exiahuang/vmark/discussions

---

<p align="center">
  <strong>Built with ❤️ for keyboard enthusiasts and productivity geeks.</strong><br />
  <em>⭐ Star us on GitHub to support development!</em>
</p>

<p align="center">
  <img src="public/favicon.png" alt="The Music of Libreo Logo" width="120" />
</p>

<h1 align="center">The Music of Libreo</h1>

<p align="center">
  A stunning iPod-style music browser with a cinematic cover flow experience, powered by the iTunes API.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss" />
</p>

---

## ✨ Features

- 🎵 **Cover Flow** — Smooth 3D carousel of album artwork, just like the classic iPod
- 🔍 **Live Search** — Instant search across a curated local song database
- 🎧 **YouTube Playback** — Embedded player that streams music directly
- 🖼️ **iTunes API Covers** — Album art loaded dynamically from Apple's iTunes API
- 🌑 **Dark Theme** — Deep black aesthetic with glass-morphism accents
- ⚡ **Fast Loading** — Minimal startup delay with progressive cover preloading

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Music Data | Local database + iTunes API |
| Playback | YouTube Embed |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/ThilakesB/Libreo-of-music.git
cd Libreo-of-music

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/       # UI components (CoverFlow, Player, SearchBar, etc.)
│   ├── data/             # Local song & album database
│   ├── hooks/            # Custom React hooks (album cover loading)
│   ├── services/         # iTunes API & local album services
│   └── types/            # TypeScript type definitions
├── styles/               # Global CSS & theme
└── main.tsx              # App entry point
```

## 📄 License

This project is for personal/educational use.
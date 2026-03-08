# Bauhaus Time Traveler

Real-time AI video performance. Transform your webcam with [Stream Diffusion](https://github.com/cumulo-autumn/StreamDiffusion) via [Daydream](https://daydream.live)—Mondrian colors, geometric goggles and hats, and a mirror-like view.

**Concept, Programming, Music, and Performance by Marlon Barrios-Holano**  
Powered by [Daydream](https://daydream.live)

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **API key**

   Copy `.env.example` to `.env.local` and add your Daydream API key:

   ```bash
   cp .env.example .env.local
   ```

   Get a key at [Daydream Dashboard](https://app.daydream.live/dashboard/api-keys). Never commit `.env.local`.

3. **Optional: performance track**

   Place your audio file at `public/track.mp3` to use the in-app play/pause track (or leave the default if you already have one there).

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## How to use

1. Choose a style preset (default: **Bauhaus time traveler**) or edit the prompt.
2. Click **Start stream** to create a Daydream stream.
3. Allow webcam access, then start the camera and watch the AI output. Use the keyboard shortcuts for a hands-free performance.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| **W** | Start or stop webcam |
| **P** | Play or pause track |
| **F** | Toggle fullscreen on the AI video |

### Interface

- **Theme:** Top-left sun/moon icon toggles light and dark mode (saved in the browser).
- **Videos:** Webcam and AI output are mirrored horizontally (mirror view).
- **Track:** “Play track” button or **P** toggles `public/track.mp3`.

---

## Tech

- [Next.js](https://nextjs.org/) (App Router)
- [@daydreamlive/sdk](https://www.npmjs.com/package/@daydreamlive/sdk) – create streams on the server
- [@daydreamlive/react](https://www.npmjs.com/package/@daydreamlive/react) – broadcast and play in the browser

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Run production server |

---

## Docs

- [Daydream Quickstart](https://docs.daydream.live/api/quickstart)
- [Daydream API](https://docs.daydream.live/api/api-reference/create-stream)

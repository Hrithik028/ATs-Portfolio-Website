# Atharva Thakar — Interactive Portfolio

An editorial, scroll-driven portfolio for Atharva Thakar, a marketing and business strategist based in Sydney. The page uses video scrubbing to move through the TERRA visual sequence and portfolio sections as the visitor scrolls.

## Features

- Full-viewport cinematic experience
- Scroll-scrubbed TERRA and strategy films
- Seamless transition clip between visual sequences
- Adaptive rendering up to 144 Hz on capable desktop displays
- 60 Hz compatibility path for phones and lower-power devices
- Scroll-velocity motion blur with reduced-motion support
- Responsive layouts for desktop and mobile
- No frontend framework or runtime dependencies

## Run locally

The repository includes a small Node.js static server with HTTP byte-range support for the video assets.

```powershell
node preview-server.cjs
```

Open [http://127.0.0.1:8124/](http://127.0.0.1:8124/).

You can also open `index.html` directly, although running the included server provides more reliable video seeking.

## Active site files

- `index.html` — page structure, portfolio content and visual styling
- `scrub-engine.js` — scroll mapping, video seeking, transitions and device adaptation
- `terra-scrub-g4.mp4` — opening TERRA sequence
- `terra-to-strategy-scrub-g4.mp4` — cinematic transition
- `strategy-scrub-g4.mp4` — profile, work, outcomes and contact sequence
- `*-poster.png` — still-image fallbacks used while videos load
- `preview-server.cjs` — local preview server

## Accessibility and performance

The page respects `prefers-reduced-motion`, avoids loading scrubbed video when reduced motion is requested, coalesces video seeks on mobile, and uses still posters as loading fallbacks. High-refresh rendering is adaptive: it does not force 144 Hz on devices that cannot sustain it.

## Current scope

The experimental letter-A/drop intro assets are retained in the repository but are not loaded by the current page. The live experience begins directly with the TERRA sequence.

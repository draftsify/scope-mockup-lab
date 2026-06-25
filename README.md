# Scope Mockup Lab — QNT / Quantumium

A premium, self-contained design mockup of the **Quantumium (QNT)** trading terminal,
built as a client preview. Static HTML/CSS/JS — no build step, deploys instantly to Vercel.

## What's inside

- **`index.html`** — the full terminal view (sidebar, topbar, token header, glass panels over a live chart, buy/sell rail, floating trades table, dock, volume footer).
- **`styles/tokens.css`** — the design system. Every colour, font, radius, spacing and motion value lives here as a CSS variable. Nothing is hard-coded downstream.
- **`styles/app.css`** — component styles and the entrance choreography.
- **`app.js`** — procedural candlestick + volume chart, plus the live interactions.

## Design language

| Token group | Notes |
|---|---|
| Surfaces | near-pure black canvas → elevated glass panels with `backdrop-filter` |
| Accent | mint (`--accent-mint` / `--accent-mint-strong`), used sparingly — CTA + active states only |
| Type | **Inter** (UI), **Instrument Serif** italic (the *Quantumium* signature), **JetBrains Mono** (all numbers & addresses) |
| Labels | uppercase, 10–11px, wide tracking, muted grey |

## Interactions

- Buy / Sell pill with sliding fill + recoloured CTA
- Market / Limit / Adv. tabs with sliding underline
- Live amount → QNT estimate, quick-amount presets
- **Live TradingView chart** embedded and themed to the palette (mint candles, terracotta downs, near-black canvas, chrome hidden) with an animated skeleton until it paints
- **Draggable** trades window (pointer events) + minimise
- Dock hover-magnify with keyboard-hint tooltips
- Animated volume histogram footer, ambient mint glow, grain overlay
- Fully `prefers-reduced-motion` aware

## Run locally

```bash
# any static server works
npx serve .
# or
python3 -m http.server 5173
```

## Deploy

```bash
vercel        # preview
vercel --prod # production
```

> Desktop-first (≥ 1280px). A graceful notice is shown on narrow screens.

# Design Brief

## Overview
Dual-mode design system: **AI Solve Lab** (desktop solver dashboard) and **StreamDeck Alternative** (Raspberry Pi 1024x600 touchscreen widget interface). Dark-primary throughout with distinct visual languages — AI Solve Lab uses purple/cyan glassmorphism; StreamDeck uses Android Auto automotive aesthetic (solid surfaces, large touch targets).

## Tone & Differentiation

| App | Tone | Aesthetic | Primary Font |
|-----|------|-----------|--------------|
| AI Solve Lab | Professional, interactive, premium | Glassmorphic, modern AI tool, dual-solver layout | Bricolage Grotesque (display), Plus Jakarta Sans (body) |
| StreamDeck | Utilitarian, touch-centric, dashboard | Android Auto Material 3, automotive simplicity, 8dp grid | General Sans (unified), JetBrains Mono (status) |

## Color Palettes

### AI Solve Lab (Existing)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | `0.69 0.17 210` | `0.78 0.18 198` | CTAs, active states, progress |
| `secondary` | `0.49 0.28 278` | `0.58 0.24 278` | Alternative actions, accents |
| `destructive` | `0.62 0.22 27` | `0.65 0.22 27` | Mistakes, errors, invalid moves |
| `success` | `0.72 0.19 145` | `0.72 0.19 145` | Hints, correct moves, achievements |
| `background` | `0.96 0.018 252` | `0.135 0.03 250` | Page base |
| `card` | `1 0 0` | `0.21 0.036 248` | Solver panels, modals |
| `muted` | `0.92 0.022 252` | `0.26 0.035 248` | Disabled, secondary UI |

### StreamDeck (Android Auto)
| Token | OKLCH | Usage |
|-------|-------|-------|
| `streamdeck-bg` | `0.12 0.015 250` | Page base — ultra-deep black (near #000) |
| `streamdeck-surface` | `0.20 0.015 250` | Widget cards, status/nav bars, overlays |
| `streamdeck-accent` | `0.68 0.18 255` | Active states, focus ring, mic button, progress fill |
| `streamdeck-success` | `0.65 0.15 140` | State badges, confirmations |
| `streamdeck-text-primary` | `0.95 0.02 252` | Main text — near-white |
| `streamdeck-text-secondary` | `0.70 0.015 252` | Secondary labels, muted text |
| `streamdeck-border` | `0.28 0.01 250` | Minimal dividers, widget borders, map panel border |

## Typography

### AI Solve Lab
| Role | Font | Weight | Scale | Usage |
|------|------|--------|-------|-------|
| Display | Bricolage Grotesque | 600–800 | 24–48px | Headers, rank badges, score values |
| Body | Plus Jakarta Sans | 400–600 | 14–16px | Content, labels, descriptions |
| Mono | System | 400 | 12–14px | Timers, counters, keyboard shortcuts |

### StreamDeck
| Role | Font | Weight | Scale | Usage |
|------|------|--------|-------|-------|
| UI | General Sans | 400–600 | 12–16px | Labels, buttons, status text |
| Status/Time | JetBrains Mono | 400 | 14px | Clock, battery, connectivity indicators |

## Structural Zones

### AI Solve Lab
| Zone | Treatment | Usage |
|------|-----------|-------|
| Header | `bg-background border-b border-border` | Branding, mode toggle, share |
| Main content | `bg-background` | Dual-solver grid (desktop) or stack (mobile) |
| Solver panel | `bg-card rounded-lg border border-border` | Sudoku/Maze containers with glass overlay |
| Leaderboard | `bg-card rounded-lg` with rank badges | Scrollable table, top 10 scores |
| Settings modal | `bg-popover glass` with grouped inputs | Sliders, toggles, algorithm selectors |
| Footer | `bg-muted/30 border-t border-border` | Sound toggle, stats, attribution |

### StreamDeck (1024x600 Raspberry Pi — Android Auto Split-Screen)
| Zone | Dimensions | Treatment | Usage |
|------|-----------|-----------|-------|
| Status bar | Full width × 48px | `streamdeck-surface` + monospace time, notification badge, icons | Time (left), bell + temp + signal (right) |
| Split container | Full width × 504px | Flex row, 65/35 split, gap: 8px, padding: 8px | Map panel (left), media panel (right) |
| Map panel | 65% width | `streamdeck-map-panel`, full-height, route overlay (top), ETA strip (bottom) | Animated route, direction banner, arrival time |
| Media panel | 35% width | `streamdeck-media-panel`, flex column, album art + info + controls | Album art (square), song/artist, progress bar, prev/play/next |
| Navigation bar | Full width × 48px | `streamdeck-nav-bar`, 6 icons + centered prominent mic button | Phone, Messages, Media, Home, Maps, Mic (88×88px accent) |

## Component Patterns

### AI Solve Lab (existing)
Counter badges, rank badges, score display, timer, playback controls, progress bar, settings sliders, comparison grid, weighted overlay, keyboard hints, sound toggle, share button.

### StreamDeck
| Component | Dimensions | Style | Behavior |
|-----------|-----------|-------|----------|
| **Status Bar** | 48px h, full w | Monospace time + icons, muted secondary text | Static top, flex row, time left + icons right |
| **Map Panel** | 65% w, full h (504px) | Route overlay top (30px), ETA strip bottom (36px), animated route | Scrollable, background map imagery, route animation |
| **Media Card** | 35% w, full h | Column layout: square album art + song/artist + progress bar + controls | Compact, album art aspect-square, truncated text |
| **Route Overlay** | Full w × 30px | Semi-transparent dark surface, cyan accent border-bottom, white text | Fixed top in map panel, "Turn left on Main St" format |
| **ETA Strip** | Full w × 36px | Semi-transparent dark surface, cyan accent border-top, small text | Fixed bottom in map panel, "Arriving 2:45 PM • 12 min" format |
| **Widget** | 76×76px min | `streamdeck-widget`, flex center, icon + label, subtle border | Hover: lighter surface; active: accent glow |
| **Mic Button** | 88×88px | `streamdeck-widget-mic`, prominent cyan accent, 2px border, larger font | Centered in nav bar; active: glow shadow + bg lighten |
| **Nav Button** | 76×76px min | Icon button, accent color outline, flex center | Hover: bg lighten; active: glow shadow |
| **Progress Bar** | Full w × 4px | Thin, muted background with accent fill | Smooth transition on song progress |
| **Control Buttons** | 32×32px | Icon-only, accent outline, small 8px icons | Hover/active: glow shadow effect |

## Motion & Interaction

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Widget tap | `scale-in` + glow shadow | 200ms | ease-out |
| Status update | Quick brightness fade | 150ms | ease-in-out |
| Nav button toggle | Color transition | 100ms | ease-in-out |

## Responsive Strategy

- **Desktop (1024px)**: 4-col widget grid, full status/nav bars
- **Tablet (768px)**: 3-col widget grid
- **Mobile (<768px)**: 2-col widget grid, compact status bar

## Constraints

- **Color system**: OKLCH values only, no raw hex or named colors in components
- **Font loading**: `@font-face` for General Sans and JetBrains Mono (local woff2)
- **Touch targets**: Minimum 76×76dp for StreamDeck widgets (8dp grid alignment)
- **Animations**: Max 300ms for responsive feel
- **Dark mode**: Single dark theme for both apps

## Signature Details

**AI Solve Lab**: Glassmorphism + neon glow on overlays; solver panels feature soft border + elevated card treatment.

**StreamDeck (Android Auto)**: Pixel-perfect automotive dashboard; ultra-deep black background (0.12 L), solid slate surfaces (0.20 L), cyan accents (0.68 L) for active/focus states. Split-screen layout: map 65% (left) + media 35% (right), status bar anchored top, persistent nav anchored bottom with prominent centered mic button (88×88px). All touch targets 76px+. Route overlay banner + ETA strip embedded in map panel. Smooth glow shadows on active states.

---

**Design System Version**: v3 (AI Solve Lab + StreamDeck)  
**Last Updated**: 2026-04-18  
**Fonts**: Bricolage Grotesque + Plus Jakarta Sans (AI Solve Lab); General Sans + JetBrains Mono (StreamDeck)

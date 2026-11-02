---
version: "1.0"
name: Carbon Matrix Tactical Browser
description: Precision dark workspace design system for multi-session 2x2 quad-grid desktop web browsing.
colors:
  bg-canvas: "#090A0C"
  bg-surface: "#111317"
  bg-elevated: "#181B21"
  bg-glass: "#1E222A"
  border-hairline: "#232832"
  border-active: "#10B981"
  text-primary: "#F3F4F6"
  text-secondary: "#9CA3AF"
  text-muted: "#6B7280"
  accent-primary: "#10B981"
  accent-hover: "#059669"
  accent-amber: "#F59E0B"
  danger: "#EF4444"
typography:
  display-sm:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  ui-label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.01em
  mono-url:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
rounded:
  none: 0px
  xs: 2px
  sm: 4px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
components:
  tab-item:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xs}"
    padding: 8px
  tab-item-active:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xs}"
    padding: 8px
  pane-toolbar:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    height: 36px
    padding: 4px
---

# QuadNav Design Specification

## Overview
QuadNav uses an **Industrial Carbon & Signal Emerald** aesthetic designed specifically for high-density 2x2 simultaneous web browsing. Chrome overhead is kept ultra-compact (38px tab bar, 34px per-quadrant toolbar) so the 4 web viewports maximize screen real estate.

## Colors
- **Canvas & Chrome (`#090A0C` / `#111317`):** Deep obsidian backgrounds reduce eye strain when viewing 4 simultaneous web pages.
- **Signal Emerald (`#10B981`):** Highlights the active focused quadrant and active tab container badge.
- **Session Container Badges:** Distinct non-purple technical hues (Emerald, Amber, Crimson, Cyan-Teal, Lime, Coral) visually distinguish isolated tab cookie containers (`Sessão #1`, `Sessão #2`, etc.).

## Typography
- **UI Chrome:** `Outfit` / system geometric sans-serif for crisp, compact tab labels and controls.
- **URL & Technical Badges:** `JetBrains Mono` for URL inputs, HTTP/HTTPS protocol indicators, and session partition badges.

## Layout
- **Top Bar (38px):** Traditional browser tab strip with `"+" (Nova Aba)`, session isolation indicator badge, global layout presets (2x2 Equal, Focus Active, Reset Grid), and session management controls.
- **2x2 Viewport Matrix (`calc(100dvh - 38px)`):**
  - 2 top quadrants (Top-Left `Q1`, Top-Right `Q2`)
  - 2 bottom quadrants (Bottom-Left `Q3`, Bottom-Right `Q4`)
  - Separated by 4px interactive splitters (horizontal, vertical, and center 4-way intersection handle) with 1px structural hairlines.

## Elevation & Depth
- Active quadrant displays a crisp 1px `#10B981` border accent, making it immediately clear which quadrant receives keyboard shortcuts.
- Zero blurry glassmorphism or AI-purple gradients; depth is achieved through sharp 1px structural borders (`#232832`) and solid surface steps.

## Shapes
- Crisp technical geometry (`2px` to `4px` radius) across tabs, URL inputs, and navigation buttons.

## Components
- **TabBar:** Supports unlimited tabs, each bound to an isolated session container (`persist:tab-<id>`), with one-click session reset (clears cookies/login of that tab) and tab duplication.
- **QuadrantPane:** Autonomous browser unit with mini toolbar (`Voltar`, `Avançar`, `Recarregar`, `Home`, `URL/Busca`, `Isolar Painel`, `Maximizar`) + `<webview>` (Electron) or `<iframe>` (Web fallback) + friendly `X-Frame-Options` interceptor overlay.

## Do's and Don'ts
- **DO** keep per-quadrant toolbars compact (34px–36px height) so all 4 quadrants have maximum vertical space.
- **DO** visually indicate which tab container (`Sessão Isolada #N`) is active so the user knows logins are separated per tab.
- **DON'T** use purple, violet, or indigo anywhere in the interface.


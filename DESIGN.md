# Warid Design System (v1.0)
**Aesthetic: Sharp & Corporate**

This document defines the visual DNA of Warid. It prioritizes data density, functional clarity, and a professional "industrial" aesthetic with zero-radius corners and high contrast.

## 1. Color Palette

### Base Tokens
| Token | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#FFFFFF` | `#020617` (Slate 950) | Main content area |
| `surface` | `#F8FAFC` (Slate 50) | `#0F172A` (Slate 900) | Sidebar, toolbars, cards |
| `border` | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | Component borders, dividers |
| `text-primary` | `#0F172A` (Slate 900) | `#F1F5F9` (Slate 100) | Headings, main text |
| `text-muted` | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) | Secondary info, placeholders |

### Primary Accent (Blue)
Used for primary actions, recording indicators, and active states.
- **Light:** `#2563EB` (Blue 600)
- **Dark:** `#3B82F6` (Blue 500)

### Status Tokens
- **Error:** `#DC2626` (Red 600)
- **Warning:** `#D97706` (Amber 600)
- **Success:** `#16A34A` (Green 600)

---

## 2. Typography

- **Primary Font:** `Noto Kufi Arabic` (RTL focus)
- **Fallback:** `system-ui, sans-serif`

### Type Scale
- **H1:** 24px / 1.5 (Bold)
- **H2:** 18px / 1.5 (SemiBold)
- **Body:** 14px / 1.6 (Regular)
- **Small:** 12px / 1.6 (Medium)

---

## 3. Shapes & Borders

- **Border Radius:** `0px` (Strictly `rounded-none`). Only very small buttons may use `2px` (`rounded-sm`) if needed for visual separation.
- **Border Width:** `1px`.
- **Shadows:** Minimal to none. Use flat borders for depth.

---

## 4. UI Components

### Sidebar
- Compact (64px collapsed, 240px expanded).
- Slate background with subtle vertical border.
- Active state: Background fill with accent indicator line.

### Buttons
- **Primary:** Background fill (Accent color), white text.
- **Secondary:** Transparent background, slate border.
- **Ghost:** No background/border until hover.

### Inputs
- Background fill (same as surface).
- High-contrast border on focus.
- RTL alignment for Arabic text.

### Recording Indicator
- Pulsing ring around the recording button.
- Accent color for the waveform.

---

## 5. Iconography
- **Library:** [Phosphor Icons](https://phosphoricons.com/)
- **Style:** Regular or Bold (consistent weight across app).
- **Size:** 20px (standard), 24px (major actions).

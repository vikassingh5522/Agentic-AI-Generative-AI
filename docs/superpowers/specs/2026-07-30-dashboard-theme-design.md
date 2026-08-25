# Dashboard Light/Dark Theme — Design Spec

**Date:** 2026-07-30  
**Scope:** Frontend (`FT-OPEN-LAYER-FE`) Preferences → global dashboard theme  
**Status:** Approved for planning

## Goal

From **Preferences** (`/preferences` / Settings → Preferences), choosing **Light Mode** or **Dark Mode** must immediately restyle the whole dashboard shell and settings surfaces. Dark mode base color is `#18122B`. Choice persists in the browser (`localStorage`); backend sync is deferred.

## Decisions

| Topic | Decision |
|-------|----------|
| Approach | Hybrid: CSS tokens + existing `ThemeContext` + Tailwind `dark` class |
| Dark base | `#18122B` for shell / page backgrounds |
| Surfaces | Same base `#18122B` for dark shell; cards use token variables (slightly elevated if contrast needs it via `--app-surface`) |
| Persistence | `localStorage` key `openlayer-theme` now; backend later |
| Default | `light` when missing/invalid storage value |
| Backend | Out of scope for this pass |

## Architecture

1. Wrap the app with existing `ThemeProvider` in `main.jsx`.
2. On theme change, apply both:
   - `data-theme="light|dark"` on `<html>`
   - Tailwind `class="dark"` on `<html>` when dark (remove when light)
3. Persist `light` \| `dark` in `localStorage` under `openlayer-theme`.
4. Define CSS variables in `index.css` for light and dark palettes.
5. Preferences “Select Theme” calls `setThemeMode('light'|'dark')` (not local-only React state).

```
Preferences click → setThemeMode → ThemeContext state
  → localStorage
  → <html data-theme> + classList dark
  → CSS variables + dark: utilities restyle Layout / Sidebar / Topbar / pages
```

## Components & file changes

| File / area | Change |
|-------------|--------|
| `src/main.jsx` | Wrap app with `ThemeProvider` |
| `src/context/ThemeContext.jsx` | Toggle `dark` class on `document.documentElement`; default invalid storage to `light` |
| `src/index.css` | Light/dark CSS variables; dark base `#18122B`; map `theme-*` helpers to variables |
| `src/components/Layout.jsx` | Theme-aware page shell background |
| `src/components/Sidebar.jsx` | Theme-aware sidebar surfaces/text |
| `src/components/Topbar.jsx` | Theme-aware topbar, search, icons |
| `src/pages/settings/Preferences.jsx` | Use `useTheme()`; theme-aware layout; sync selected card with context |
| Other settings pages | Same shell/card tokens as Preferences |
| Shared UI (`Modal`, `Drawer`, `LoadingState`, `ErrorState`) | Existing `theme-*` classes resolve via new variables |

### CSS token sketch

```css
:root,
[data-theme="light"] {
  --app-bg: #f5f6fa;
  --app-surface: #ffffff;
  --app-border: #e5e7eb;
  --app-text: #111827;
  --app-text-muted: #6b7280;
}

[data-theme="dark"] {
  --app-bg: #18122B;
  --app-surface: #18122B;
  --app-border: #2e2742;
  --app-text: #f3f4f6;
  --app-text-muted: #9ca3af;
}
```

Components prefer `bg-[var(--app-bg)]`, `bg-[var(--app-surface)]`, `text-[var(--app-text)]`, borders via `--app-border`, and/or Tailwind `dark:` utilities where already practical.

## Behavior

- Theme applies immediately on click (no Save required for theme).
- Refresh restores last choice from `localStorage`.
- Light preserves the current product look.
- Dark uses `#18122B` shell with readable light text; accent/active states (e.g. Preferences nav highlight `#5B5FEF` / `#EEF2FF`) remain high-contrast.

## Error handling

- Missing or invalid `localStorage` value → default **light**.
- `localStorage` unavailable → theme still works in-session; does not persist across refresh.
- `setThemeMode` accepts only `light` \| `dark`; other values ignored.

## Testing (manual)

1. Preferences → Dark → sidebar, topbar, page background become `#18122B`; text readable.
2. Preferences → Light → restore current light look.
3. Hard refresh → theme sticks.
4. Navigate Dashboard and other routes → shell stays themed.
5. Open settings pages → cards/side nav follow theme.

## Rollout scope (this build)

1. Wire `ThemeProvider` + CSS tokens + Preferences.
2. Theme Layout, Sidebar, Topbar, all `/settings/*` pages.
3. Point shared `theme-*` UI at variables.
4. Apply tokens / `dark:` on high-traffic page shells so the dashboard feels global.
5. Remaining one-off hardcoded `bg-white` / `bg-gray-*` on deep feature pages can adopt the same tokens in follow-ups without changing the theme API.

## Out of scope

- Backend user preference API
- Timezone / language Preference dropdowns (UI only; unchanged behavior)
- Per-organization branded themes
- System/OS preference auto-detect (`prefers-color-scheme`) — not required for this pass

## Success criteria

- One click on Dark/Light in Preferences flips the whole dashboard chrome to dark/light.
- Dark base color is `#18122B`.
- Choice survives refresh via `localStorage`.
- No backend changes required to ship.

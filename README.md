# Flow Timer

Lightweight productivity timer with tasks, goals, sessions history, theming and accent customization. Built with Vite, React, TypeScript, and Tailwind.

English | [Русский](README.ru.md)

## Development

- Live dev: `npm run dev`
- Production build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`

## Deployment

### GitHub Pages (Automatic)

The project is configured for automatic deployment to GitHub Pages:

1. Push to `main` branch triggers automatic build and deploy
2. Site will be available at `https://[username].github.io/[repository-name]/`
3. GitHub Actions workflow handles the entire process

### Manual Deploy

```bash
npm run deploy
```

This builds the project and pushes to `gh-pages` branch.

## Docs

- Architecture overview: [docs/Architecture.md](docs/Architecture.md)
- Public API reference: [docs/API.md](docs/API.md)
- Accent usage guideline: [docs/accent-usage.md](docs/accent-usage.md)
- Music player design: [docs/music-player.md](docs/music-player.md)

## Project Map

- App composition: [src/App.tsx](src/App.tsx)
- Entry: [src/main.tsx](src/main.tsx), Error boundary: [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)
- Hooks:
  - [src/hooks/useLocalStorage.ts](src/hooks/useLocalStorage.ts)
  - [src/hooks/useTasks.ts](src/hooks/useTasks.ts)
  - [src/hooks/useTimer.ts](src/hooks/useTimer.ts)
  - [src/hooks/useTheme.ts](src/hooks/useTheme.ts)
- UI:
  - [src/components/Timer.tsx](src/components/Timer.tsx)
  - [src/components/TaskManager.tsx](src/components/TaskManager.tsx)
  - [src/components/History.tsx](src/components/History.tsx)
  - [src/components/SettingsPanel.tsx](src/components/SettingsPanel.tsx)
  - [src/components/MusicPlayer.tsx](src/components/MusicPlayer.tsx)

## Key Concepts

- Task: work item with optional goal (in seconds). Sessions add to historical time; today’s progress bar uses today-only totals.
- Session: recorded when stopping a work run; break auto-computed as floor(workedSeconds / 5).
- Settings: theme, accent, shadow mode, color-timer, notification preferences.
- Storage keys: described in [`docs.API.md`](docs/API.md).

## Development Conventions

- Types centralization: Task, Session, Settings live in [`src.App.tsx`](src/App.tsx).
- TSDoc: Components and hooks have inline docs explaining responsibilities, inputs, outputs, and side effects.
- Dark mode: `useTheme` sets `data-theme` and toggles `html.dark` for Tailwind.
- Accent colors: use token-to-class maps; green may receive inline hex overrides where needed.

## Making Changes Safely

- Update data model fields in types inside [`src.App.tsx`](src/App.tsx) and then propagate to:
  - Hooks using these types
  - Components props that consume them
  - Docs in [`docs.API.md`](docs/API.md) and [`docs.Architecture.md`](docs/Architecture.md)
- Timer/break mechanics: see [`src.hooks.useTimer()`](src/hooks/useTimer.ts)
- Styling tweaks:
  - Shared color transition rules live in [`src.index.css`](src/index.css)
  - Accent and theme class maps live close to components that render them

## Notifications

- Visual notifications use the Web Notifications API; permission requested on mount.
- Audio notifications use Web Audio API and can be toggled in settings.

## Browser/Privacy Notes

- All data persists in LocalStorage on the client device. No backend is used.
- Clearing browser storage will erase tasks/sessions/settings.

## License

MIT
# Contributing to Shadow Rift

Thanks for your interest! Here's how to contribute.

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/shadow-rift.git
cd shadow-rift
npm install
npm run dev
```

## Project Conventions

- **Components** in `src/components/` — React, JSX, one file per component
- **Game logic** in `src/game/` — pure JS classes, no React dependencies
- **Hooks** in `src/hooks/` — React hooks that bridge game logic ↔ React state
- **Styles** in `src/styles/` — plain CSS, no preprocessors

## Adding a New Fighter

1. Create `src/game/YourFighter.js` extending `Fighter`
2. Implement `drawBody(ctx)` using the canvas 2D API
3. If it's an AI, add an `aiTick(dt, player)` method
4. Import and instantiate in `useGameLoop.js`

## Submitting a PR

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Open a Pull Request with a clear description

## Reporting Bugs

Open an issue with:
- Browser and OS
- What you expected vs what happened
- Console errors if any

# Side Quest

Expo / React Native card game for theme-park scavenger hunts, deployed as a web build to Netlify from `main`. Currently Walt Disney World only.

## Testing is required

Before reporting any change as done:

1. `npm run typecheck`. Three errors already exist on `main` (`@expo/vector-icons` types, `toggleRide` and `disabledRideIds` in SettingsScreen); add no new ones.
2. `npm run test:e2e`. Exports the web build to `dist/` and runs the Playwright suite in `e2e/` at phone size (390×844). All tests must pass.
3. Look at the screenshots in `test-results/screens/` and check the UI visually (layout, overlap, clipped text, see-through modals). Passing assertions alone is not enough for UI work.
4. If you add or change a user-facing flow, add or update a test in `e2e/game.spec.ts` and give new interactive elements a `testID`.

Playwright is pinned to the version matching the preinstalled browsers. Don't run `playwright install`.

## Conventions

- Shared card-game visuals live in `src/components/CardFace.tsx`, `GameButton.tsx`, `CardBurst.tsx`; tokens (`FONTS`, `INK`, `TABLE`, `CATEGORY_FRAME_COLORS`, `RARITY`) in `src/theme/theme.ts`.
- Game state and rules live in `src/store/gameStore.ts`; content in `src/data/`.

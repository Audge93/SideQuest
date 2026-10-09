# Side Quest

Expo / React Native card game for theme-park scavenger hunts, deployed as a web build to Netlify from `main`. Currently Walt Disney World only. The player uses it as a phone web app, so design and test for phones first.

## Testing is required

Before reporting any change as done:

1. `npm run typecheck`. Must pass with no errors. The old individual-ride Settings errors are resolved.
2. `npm run test:e2e`. Exports the web build to `dist/` and runs the Playwright suite in `e2e/` on a standard phone (390×844) and a small phone (375×667). All tests must pass on both.
3. Look at the screenshots in `test-results/screens/<phone|small-phone>/` and check the UI visually (layout, overlap, clipped text, see-through modals). Passing assertions alone is not enough for UI work.
4. If you add or change a user-facing flow, add or update a test in `e2e/game.spec.ts` and give new interactive elements a `testID`.

Playwright is pinned to the version matching the preinstalled browsers. Don't run `playwright install`.

## Conventions

- For adding or editing tasks and trivia, follow `docs/content-guide.md` and run `npm run validate:content`. Source notes for new trivia live in `docs/trivia-sources.md`. The Word plans are historical, not the current content specification.

- Shared card-game visuals live in `src/components/CardFace.tsx`, `GameButton.tsx`, `CardBurst.tsx`; tokens (`FONTS`, `INK`, `TABLE`, `CATEGORY_FRAME_COLORS`, `RARITY`) in `src/theme/theme.ts`.
- Icons are custom SVGs in `src/components/icons/iconData.ts`, rendered with `<GameIcon name=… />`. Don't use emoji or icon fonts in the UI.
- Keep images small: backgrounds are JPEG, no photo-sized assets.
- Game state and rules live in `src/store/gameStore.ts`; content in `src/data/`.

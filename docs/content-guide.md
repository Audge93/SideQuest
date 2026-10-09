# Adding and updating tasks and trivia

Current as of October 8, 2026. This is the maintenance guide for the implemented app. The Word documents in `plans/` describe historical designs and are not the current content specification; their Universal content, counts, and theme-filter descriptions are outdated. Use the TypeScript arrays as the live question and task bank.

## Where content goes

| File / array | Content | Size and categories |
| --- | --- | --- |
| `src/data/tasks.ts`: `SMALL_TASKS` | Quick challenges in the hand | `small`: `find`, `photo`, `act` |
| `src/data/trivia.ts`: `DISNEY_TRIVIA`, `PARK_TRIVIA`, `ARCHIVE_TRIVIA` | Multiple-choice questions | `small`: `trivia`; ensure additions reach `TRIVIA_TASKS` |
| `src/data/tasks.ts`: `BIG_TASKS` | Challenge-board goals | `big`: `treat`, `pins`, `meet`, `explore`, `seek` |
| `src/data/tasks.ts`: `RIDE_ACTIVITY_TASKS` | Objectives on a particular ride | `big`: `ride` |
| `src/data/parks.ts`: `RIDES` | Attraction names, heights, intensity, points | Automatically generates “Ride X” tasks |

The `Task` contract lives in `src/types/index.ts`. `buildTaskPools()` in `src/store/gameStore.ts` determines which cards can appear. Adding content to an existing category needs no UI or store changes.

## Required fields and scoring

Every task requires `id`, `size`, `category`, `displayCategory`, `description`, `points`, and `difficulty`. Use a globally unique, descriptive ID; existing IDs must remain stable because saved games and completion tracking refer to them. Do not renumber or reuse retired IDs. `flavorText` is optional helper text.

| Difficulty | Small task points | Big task points |
| --- | --- | --- |
| `easy` | 5 | 25 |
| `medium` | 10 | 50 |
| `hard` | 15 | 75 |

Keep the instruction short, specific, and possible to judge. New actions should work without involving strangers, blocking walkways, interfering with staff, or breaking attraction rules. Allow a seated performance where practical. Do not require purchases for an `act` card. Avoid duplicate objectives even when the wording differs.

```ts
// Add inside SMALL_TASKS; choose an ID not already used anywhere.
{ id: 'act-example-mime-map', size: 'small', category: 'act',
  displayCategory: 'Act', description: 'Mime reading an imaginary treasure map',
  points: 5, difficulty: 'easy' },
```

## Trivia questions

Disney-wide trivia is welcome, including films, characters, and Disney history. Add two to four distinct, nonempty `triviaChoices`. For a single answer, use zero-based `triviaAnswer`. For multiple correct choices, use `triviaAnswers` (an array of zero-based indexes) instead. By default the player must select every correct choice. Set `triviaRequiredAnswers` only when the source permits a smaller number of accepted answers; for example, 1 when any one of several alternatives is valid. Moving choices requires updating the indexes. Keep the question explicit about how many answers to select. Vary answer positions. Check factual overlap with existing questions, not just identical wording. Verify answers with primary sources and record links in `docs/trivia-sources.md`. Do not label original questions as recovered app content.

```ts
// Add inside an array included in TRIVIA_TASKS; example only.
{ id: 'tri-example-ride-vehicle', size: 'small', category: 'trivia',
  displayCategory: 'Trivia', description: 'Which vehicle is used on this attraction?',
  points: 5, difficulty: 'easy', tag: 'disney',
  triviaChoices: ['Boat', 'Train', 'Jeep', 'Cable car'], triviaAnswer: 0 },
```

Optional `triviaExplanation` is shown only after answering or passing; do not put answer-revealing fun facts in `flavorText`. The result highlights every correct choice and marks incorrect selections. It stays open until Dismiss, including after a pass. Passing uses the normal discard allowance when dismissed; wrong answers score no points. Multiple selections require Submit answers before revealing the result.

For preserved questions, record archive IDs and adaptations in `docs/trivia-sources.md`. Review image/voice dependencies, dated facts, and semantic duplicates before importing. Credit preservation separately from ownership: the archive credit does not establish a reuse license.

## Parks, tags, and ride requirements

The supported park IDs are `wdw-mk`, `wdw-hs`, `wdw-ep`, and `wdw-ak`. The only supported tag is `disney`; no Universal tag or park is currently supported.

Important implementation limit: static `SMALL_TASKS`, `BIG_TASKS`, and `TRIVIA_TASKS` are filtered by category only. Their `parkId` and `tag` fields do not currently restrict where they appear. Keep these prompts usable at any selected park; trivia can ask about another park. A heading or an ID prefix does not create a park filter. To introduce location-specific non-ride tasks, implement and test park filtering in the store first.

Generated rides and `RIDE_ACTIVITY_TASKS` are filtered by selected parks and, when enabled, height. A ride activity must use a valid `rideId`, matching `parkId`, and matching `heightRequirement` from `RIDES` (in inches; 0 means no minimum). For a new attraction, add its canonical `Ride` entry first. Intensity maps gentle/moderate/thrill to easy/medium/hard; points are 25/50/75. Individual ride controls have been removed from Settings. The optional `disabledRideIds` parameter in `generateRideTasks()` is not exposed by the current app.

## Review and verification

1. Search IDs and descriptions before adding content (`rg --text` avoids encoding-related skipped files).
2. Run `npm ci` if dependencies are missing.
3. Run `npm run validate:content` for IDs, normalized duplicate wording, sizes/categories, score tiers, trivia indices, and ride metadata. This does not verify factual accuracy or detect paraphrased duplicates; review those manually.
4. Run `npm run typecheck`. The former SettingsScreen errors referring to `toggleRide` and `disabledRideIds` were resolved when individual ride controls were removed; type checking must pass.
5. Run `npm run test:e2e` for both phone sizes. Follow `CLAUDE.md`; do not run `playwright install`. For UI changes, inspect generated screenshots and update flow tests/testIDs.
6. Review the diff and source notes. Save slots contain copies of cards already dealt. Resuming refreshes known trivia IDs from the current bank so wording and answer corrections reach old saves. Start a fresh game to review newly added content. Random draws do not guarantee any particular new card appears immediately.

Adding a new category is a larger change: update domain types, settings toggles, pool generation, card labels/icons/colors, badge handling, and appropriate tests together. Do not invent a category solely by putting it in a content array.

## Trivia 50/50

Available only for four-choice questions with exactly one accepted correct index. It removes two randomly chosen incorrect options, spends one use, and is limited to one use per dealt question. New games start with 2 uses. Every fifth successful card completion, including challenges and correct trivia, adds 1 up to a balance of 3. Passes and wrong trivia answers do not count. Spent uses and removed choices persist when the question closes or the game resumes. The removal is cleared after that card leaves the hand. Run `npm run test:rules` to verify the reward and eligibility rules.

## Minigame content and rules

The Minigames button is beside Your Hand in the game screen. Both games are available without a cooldown. Their state, score, recent-question history, and first-play help acknowledgment are saved with the active game.

- Trivia Sprint draws 10 short single-answer questions from `TRIVIA_TASKS`, preferring questions outside its recent 50-question history. Long questions/choices and multi-answer questions are excluded from the timed pool. The player chooses 30 or 60 seconds. Normal question points are summed for correct answers; all 10 correct multiplies that sum by 3, 9 correct by 2, otherwise by 1. An absolute deadline keeps running across panel close, backgrounding, and reload. A completed round can award points only once. Results remain readable until the player leaves or starts another round.
- Who Am I uses `src/data/whoAmI.ts`: stable unique IDs, a character name and exactly three original text clues. Each round offers the correct name plus three other names. One guess ends a round. A correct guess after 1/2/3 clues awards 15/10/5 points; wrong guesses or Show Answer award 0. No timer. Recent character history avoids immediate repeats.
- Help appears on first entry to each minigame and can be reopened using Help. Updating the rules requires updating these explanations too.
- Minigames add to session score, without modifying hand cards, card-completion totals, streaks, discards or 50/50 rewards.

Additional shared task expansions live in `src/data/extraTasks.ts`, included by the arrays in `tasks.ts`. The bulk archive lives in `src/data/archiveTrivia.ts`, included by `TRIVIA_TASKS`. Run `npm run validate:content` to verify every park still meets the requested minimums. Current totals are in `docs/content-counts.md`.

Known task wording and attraction display names now refresh on resume too. If a saved challenge board contains one of the retired catalog entries, it is redealt from the current eligible challenge pool; score and completion history remain intact.

## Accessibility, comfort, and support

Settings includes Reduce Motion (Device/On/Off), reading size (Device/Larger/Largest), Readable Font, Higher Contrast, seated-friendly tasks, less walking, and no speaking/performing. Reading preferences remain device-wide when loading a different save. Activity filters apply to new draws and are stored with the game; already dealt cards remain available. Trivia Sprint retains its existing 30/60-second options and scoring.

`src/data/activityPreferences.ts` maintains reviewed task-ID allowlists for seated/nearby observations and activities within one area. Restrictive modes exclude unknown task IDs until reviewed. All trivia is eligible. Ride/ride-activity tasks are excluded from seated/less-walking modes; height metadata never determines accessibility. No-performing excludes Act, Character Meet, and reviewed performance-style photo tasks. When adding content, review its actual instruction against these preferences and update the lists as appropriate. Do not infer wheelchair access or attraction eligibility. Eleven shared `COMFORT_TASKS` provide observation/map activities; these join `BIG_TASKS` and have normal points.

Settings changes that leave fewer than five hand tasks or three challenge tasks are rejected with an explanation. Keep Explore or Seek enabled for a full challenge board in seated mode. Verify initial draws, replacement cards, drafts, and save/resume using `npm run test:rules` and the phone tests.

Hand navigation has Previous, Next, and Read Card controls. Read Card and challenge detail show full instructions in scrolling views. Question results name accepted answers explicitly and remain until dismissed. Native announcements, focus management, labels, and large touch controls are part of the normal UI. Real VoiceOver/TalkBack, device text scaling, and switch-control checks on installed iOS/Android builds remain part of release validation; web tests alone cannot certify those experiences.

Help and privacy copy lives in `src/data/helpAndPrivacy.ts`. Reports open reviewable public GitHub issue drafts and do not automatically send anything. The question report includes the task ID, wording, and choices. Privacy describes local storage, hosting, external links, and confirmed deletion of all local data. Update it whenever data practices change. `npm run build:web` generates `public/privacy.html` from the same policy for a deployable `/privacy.html` URL; keep the generated page synchronized. Review the final hosting configuration and store privacy disclosures before publishing.

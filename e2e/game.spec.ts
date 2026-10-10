import { WHO_AM_I } from '../src/data/whoAmI';
import { test, expect, Page } from '@playwright/test';

// Key screens are saved here so a person (or Claude) can review the UI after a run.
async function snap(page: Page, name: string) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `test-results/screens/${test.info().project.name}/${name}.png` });
}

const byId = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

test('Settings separates accessibility controls and keeps preferences when switching tabs', async ({ page }) => {
  await page.goto('/'); await byId(page, 'home-settings-btn').click();
  await expect(byId(page, 'settings-tab-general')).toHaveAttribute('aria-selected', 'true');
  await expect(byId(page, 'motion-system')).toHaveCount(0);
  await byId(page, 'about-btn').click();
  await expect(byId(page, 'about-panel')).toContainText('GooglyBlox');
  await expect(byId(page, 'about-archive-link')).toHaveCount(0);
  await snap(page, '55-about-credit'); await byId(page, 'about-close-btn').click();
  await byId(page, 'settings-tab-accessibility').click();
  await expect(byId(page, 'settings-tab-accessibility')).toHaveAttribute('aria-selected', 'true');
  await expect(byId(page, 'height-filter-switch')).toHaveCount(0);
  await byId(page, 'motion-on').click(); await byId(page, 'text-extra-large').click();
  await snap(page, '56-settings-accessibility-tab');
  await byId(page, 'settings-tab-general').click(); await expect(byId(page, 'sound-switch')).toBeVisible();
  await byId(page, 'settings-tab-accessibility').click(); await expect(byId(page, 'motion-on')).toBeChecked();
  await expect(byId(page, 'text-extra-large')).toBeChecked();
});

test('profile names validate inline, cancel edits, and persist independently', async ({ page }) => {
  await startGame(page);
  const original = await savedState(page);
  await page.getByText('Profile', { exact: true }).click();
  await byId(page, 'profile-edit-name').click();
  await byId(page, 'profile-name-input').fill('   '); await byId(page, 'profile-name-save').click();
  await expect(page.getByText('Enter a nickname, or choose Cancel.')).toBeVisible();
  await byId(page, 'profile-name-cancel').click();
  expect((await savedState(page)).player.name).toBe(original.player.name);
  await byId(page, 'profile-edit-name').click(); await byId(page, 'profile-name-input').fill('  Adventure Pal  ');
  await byId(page, 'profile-name-save').click();
  await byId(page, 'profile-edit-game-name').click();
  await byId(page, 'profile-game-name-input').fill(' '); await byId(page, 'profile-game-name-save').click();
  await expect(page.getByText('Enter a game name, or choose Cancel.')).toBeVisible();
  await byId(page, 'profile-game-name-cancel').click();
  await byId(page, 'profile-edit-game-name').click(); await byId(page, 'profile-game-name-input').fill('  Birthday Adventure  ');
  await byId(page, 'profile-game-name-save').click();
  await expect(byId(page, 'profile-save-context')).toContainText('Birthday Adventure');
  await page.reload(); await byId(page, 'home-profile-btn').click();
  await expect(byId(page, 'profile-edit-name')).toContainText('Adventure Pal');
  await expect(byId(page, 'profile-save-context')).toContainText('Birthday Adventure');
  await snap(page, '50-profile-summary');
});

test('profile shows milestone goals and earned filters without double counting ended saves', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!); const slot = state.saveSlots.find((s: any) => s);
    const tasks = Array.from({ length: 9 }, (_, i) => ({ ...slot.session.hand[0], id: `finished-${i}`, category: 'find' }));
    for (const session of [state.session, slot.session]) Object.assign(session, { active: false, completedTasks: tasks, totalCompletions: 9, currentStreak: 4, sessionScore: 95 });
    slot.categoryCompletions = { find: 9 }; state.activeSlotId = null;
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload(); await byId(page, 'home-profile-btn').click();
  await expect(byId(page, 'profile-completions')).toContainText('9 completed cards');
  await expect(byId(page, 'badge-progress-sharp-eye-bronze')).toHaveText('9 / 10 cards');
  await expect(byId(page, 'badge-progress-streak-bronze')).toHaveText('4 / 5 card streak');
  await expect(byId(page, 'badge-progress-score-bronze')).toHaveText('95 / 100 points');
  await expect(byId(page, 'badge-progress-hopper-bronze')).toHaveText('1 / 2 parks');
  await expect(byId(page, 'badge-progress-completionist-bronze')).toHaveText('0 / 10 category badges');
  await byId(page, 'badge-filter-earned').click(); await expect(byId(page, 'badge-first-steps')).toContainText('Earned');
  await expect(byId(page, 'badge-score-bronze')).toHaveCount(0);
  await byId(page, 'badge-filter-locked').click(); await expect(byId(page, 'badge-first-steps')).toHaveCount(0);
  await expect(byId(page, 'badge-score-bronze')).toContainText('Earn 100 points in this game');
  await snap(page, '51-profile-badge-progress');
});

test('minigame score badges unlock immediately and celebrate after leaving the minigames', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    for (const session of [state.session, state.saveSlots.find((s: any) => s).session]) session.sessionScore = 95;
    state.settings.textSize = 'extra-large'; state.settings.readableFont = true; state.settings.reduceMotion = 'on';
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload(); await byId(page, 'continue-game-btn').click(); await byId(page, 'save-select-0').click();
  await byId(page, 'minigames-btn').click(); await byId(page, 'choose-who').click(); await byId(page, 'minigame-tips-dismiss').click(); await byId(page, 'who-start').click();
  const round = (await savedState(page)).session.whoAmI;
  const name = WHO_AM_I.find(c => c.id === round.characterId)!.name;
  await byId(page, `who-choice-${round.choices.indexOf(name)}`).click();
  await expect.poll(async () => (await savedState(page)).saveSlots.find((s: any) => s).badges.find((b: any) => b.id === 'score-bronze').earned).toBe(true);
  await page.waitForTimeout(1400); await expect(byId(page, 'badge-dismiss')).toHaveCount(0);
  await byId(page, 'minigames-close').click(); await byId(page, 'minigames-close').click();
  await byId(page, 'badge-dismiss').scrollIntoViewIfNeeded();
  const dismiss = await byId(page, 'badge-dismiss').boundingBox();
  expect(dismiss!.y + dismiss!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await snap(page, '54-readable-badge-unlock');
  await byId(page, 'badge-dismiss').click(); await expect(byId(page, 'badge-dismiss')).toBeHidden();
  await page.getByText('Profile', { exact: true }).click();
  await expect(byId(page, 'badge-score-bronze')).toContainText('Earned');
  await expect(byId(page, 'profile-score')).toHaveText('110 points');
  await expect(byId(page, 'profile-completions')).toContainText('0 completed cards');
});

test('largest-text profile badges and deletion confirmation fit and preserve other saves', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!); const slot = state.saveSlots.find((s: any) => s);
    state.saveSlots[1] = { ...slot, id: 'other-save', name: 'Other Adventure', session: { ...slot.session, id: 'other-session' } };
    state.settings.textSize = 'extra-large'; state.settings.readableFont = true; state.settings.highContrast = true; state.settings.reduceMotion = 'on';
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload(); await byId(page, 'home-profile-btn').click();
  await byId(page, 'badge-score-bronze').scrollIntoViewIfNeeded();
  const tile = await byId(page, 'badge-score-bronze').boundingBox();
  expect(tile!.width).toBeGreaterThan(250); expect(tile!.x + tile!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await snap(page, '52-readable-profile-badges');
  await byId(page, 'profile-delete-save').click();
  await expect(byId(page, 'profile-delete-confirm')).toContainText('Other saves and your nickname stay');
  await snap(page, '53-profile-delete-confirm');
  await byId(page, 'profile-delete-cancel').click();
  expect((await savedState(page)).saveSlots.filter(Boolean)).toHaveLength(2);
  await byId(page, 'profile-delete-save').click(); await byId(page, 'profile-delete-confirm-btn').click();
  await expect(byId(page, 'new-game-btn')).toBeVisible();
  const remaining = (await savedState(page)).saveSlots.filter(Boolean);
  expect(remaining).toHaveLength(1); expect(remaining[0].id).toBe('other-save');
});

test('Sprint nine-correct scoring, paged review, and review resume preserve card rewards', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    const questions = Array.from({ length: 10 }, (_, i) => ({ id: `review-fixture-${i}`, size: 'small', category: 'trivia', displayCategory: 'Trivia', description: `Review question ${i + 1}: choose the first answer.`, points: 5, difficulty: 'easy', triviaChoices: ['Right answer', 'Wrong answer', 'Third answer', 'Fourth answer'], triviaAnswer: 0, triviaExplanation: 'Read this explanation at your own pace.' }));
    for (const session of [state.session, state.saveSlots.find((s: any) => s?.id === state.activeSlotId).session]) Object.assign(session, {
      sessionScore: 20, currentStreak: 3, totalCompletions: 4, discardsRemaining: 1, fiftyFiftyUses: 1, minigameHelpSeen: ['sprint'],
      triviaSprint: { id: 'review-round', questions, answers: Array(9).fill(0), deadline: Date.now() + 60_000, durationSeconds: 60, finished: false, earnedPoints: 0 },
    });
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload(); await byId(page, 'continue-game-btn').click(); await byId(page, 'save-select-0').click();
  const hand = (await savedState(page)).session.hand;
  await byId(page, 'minigames-btn').click();
  await expect(byId(page, 'choose-sprint')).toContainText('60 seconds');
  await byId(page, 'choose-sprint').click();
  await byId(page, 'sprint-choice-1').click();
  await expect(byId(page, 'sprint-results')).toContainText('9/10 correct');
  await expect(byId(page, 'sprint-score-breakdown')).toHaveText('45 question points × 2 = 90 points added to your score.');
  await expect(byId(page, 'sprint-review-previous')).toBeDisabled();
  for (let i = 1; i < 10; i++) await byId(page, 'sprint-review-next').click();
  await expect(byId(page, 'sprint-review-position')).toHaveText('Review 10 of 10');
  await expect(byId(page, 'sprint-review-card')).toContainText('Your answer: Wrong answer');
  await expect(byId(page, 'sprint-review-next')).toBeDisabled();
  await snap(page, '46-sprint-paged-review');
  await expect(byId(page, 'sprint-report-btn')).toHaveCount(0);
  await page.reload(); await byId(page, 'continue-game-btn').click(); await byId(page, 'save-select-0').click();
  await byId(page, 'minigames-btn').click(); await byId(page, 'choose-sprint').click();
  await expect(byId(page, 'sprint-review-position')).toHaveText('Review 10 of 10');
  await expect(byId(page, 'sprint-60')).toHaveCount(0);
  await byId(page, 'sprint-review-previous').click();
  await expect(byId(page, 'sprint-review-question')).toHaveText('Review question 9: choose the first answer.');
  const session = (await savedState(page)).session;
  expect(session).toMatchObject({ sessionScore: 110, currentStreak: 3, totalCompletions: 4, discardsRemaining: 1, fiftyFiftyUses: 1 });
  expect(session.hand).toEqual(hand);
  await byId(page, 'minigames-close').click();
  expect((await savedState(page)).session.triviaSprint).toBeUndefined();
  expect(await score(page)).toBe(110);
});

test('largest-text minigames keep the clock and exit visible and preserve a running Sprint through Help', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startGame(page); await page.getByText('Settings', { exact: true }).click();
  await byId(page, 'settings-tab-accessibility').click();
  await byId(page, 'text-extra-large').click(); await byId(page, 'comfort-readableFont').click(); await page.getByText('‹ Back').click();
  await page.clock.install();
  await byId(page, 'minigames-btn').click(); await byId(page, 'choose-sprint').click(); await byId(page, 'minigame-tips-dismiss').click();
  await expect(byId(page, 'sprint-30')).toHaveCount(0); await expect(byId(page, 'sprint-60')).toHaveCount(0); await byId(page, 'sprint-start').click();
  const round = (await savedState(page)).session.triviaSprint;
  await page.locator('[data-testid^="sprint-choice-"]').last().scrollIntoViewIfNeeded();
  const timer = await byId(page, 'sprint-timer').boundingBox();
  const exit = await byId(page, 'minigames-close').boundingBox();
  expect(timer!.y).toBeGreaterThanOrEqual(0); expect(timer!.y + timer!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(exit!.y + exit!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await snap(page, '47-readable-sprint-clock');
  await byId(page, 'minigame-help').click(); await expect(byId(page, 'sprint-help-clock')).toHaveCount(1);
  await page.clock.fastForward(5000); await byId(page, 'minigame-tips-dismiss').click();
  expect((await savedState(page)).session.triviaSprint.deadline).toBe(round.deadline);
  await page.clock.fastForward(61_000); await expect(byId(page, 'sprint-results')).toContainText('Time’s Up!');
  await expect(byId(page, 'sprint-results')).toContainText('10 unanswered');
  await snap(page, '48-readable-sprint-review');
  await byId(page, 'minigames-close').click(); await byId(page, 'choose-who').click(); await byId(page, 'minigame-tips-dismiss').click(); await byId(page, 'who-start').click();
  await byId(page, 'who-next-clue').click();
  await expect(byId(page, 'who-clue').last()).toBeFocused();
  await byId(page, 'who-next-clue').click();
  await expect(byId(page, 'who-clue').last()).toBeFocused();
  await byId(page, 'who-give-up').click();
  await expect(byId(page, 'who-results')).toContainText('Correct answer:');
  const answer = await byId(page, 'who-correct-answer').boundingBox();
  const firstClue = await byId(page, 'who-clue').first().boundingBox();
  expect(answer!.y + answer!.height).toBeLessThanOrEqual(firstClue!.y);
  expect(answer!.y).toBeGreaterThanOrEqual(0);
  expect(answer!.y + answer!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const whoExit = await byId(page, 'minigames-close').boundingBox();
  expect(whoExit!.y + whoExit!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await snap(page, '49-readable-who-review');
});

test('Who Am I explains clue costs and wrong guesses and resumes results without duplicate points', async ({ page }) => {
  await startGame(page);
  const initial = (await savedState(page)).session;
  await byId(page, 'minigames-btn').click(); await byId(page, 'choose-who').click(); await byId(page, 'minigame-tips-dismiss').click(); await byId(page, 'who-start').click();
  await expect(byId(page, 'who-next-clue')).toContainText('10 points');
  await byId(page, 'who-next-clue').click(); await expect(byId(page, 'who-point-status')).toContainText('10 points');
  const round = (await savedState(page)).session.whoAmI;
  const name = WHO_AM_I.find(c => c.id === round.characterId)!.name;
  await byId(page, `who-choice-${round.choices.findIndex((choice: string) => choice !== name)}`).click();
  await expect(byId(page, 'who-results')).toContainText('No points this round');
  await expect(byId(page, 'who-results')).toContainText(`Correct answer: ${name}`);
  await byId(page, 'minigames-close').click(); await byId(page, 'minigames-close').click();
  await byId(page, 'minigames-btn').click(); await expect(byId(page, 'choose-who')).toContainText('View your answer'); await byId(page, 'choose-who').click();
  await expect(byId(page, 'who-results')).toContainText('Not quite!');
  expect((await savedState(page)).session.sessionScore).toBe(initial.sessionScore);
  await byId(page, 'who-start').click(); await byId(page, 'who-next-clue').click();
  const next = (await savedState(page)).session.whoAmI;
  const correct = WHO_AM_I.find(c => c.id === next.characterId)!.name;
  await byId(page, `who-choice-${next.choices.indexOf(correct)}`).click();
  await expect(byId(page, 'who-results')).toContainText('Correct after 2 clues: 10 points');
  await byId(page, 'minigames-close').click(); await byId(page, 'choose-who').click();
  const finished = (await savedState(page)).session;
  expect(finished.sessionScore).toBe(initial.sessionScore + 10);
  expect(finished.currentStreak).toBe(initial.currentStreak); expect(finished.discardsRemaining).toBe(initial.discardsRemaining); expect(finished.fiftyFiftyUses).toBe(initial.fiftyFiftyUses); expect(finished.totalCompletions).toBe(initial.totalCompletions);
});

test('canceling new-game setup preserves the current game and its settings', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await page.getByText('Main Menu', { exact: true }).click();
  const before = await savedState(page);
  await byId(page, 'new-game-btn').click();
  await byId(page, 'setup-player-name').fill('Different Team');
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'park-option-wdw-ak').click();
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'setup-pins').click();
  await byId(page, 'setup-height-filter').click();
  await byId(page, 'setup-height-plus').click();
  await byId(page, 'setup-back-btn').click();
  await expect(byId(page, 'park-option-wdw-ak')).toBeChecked();
  await byId(page, 'setup-back-btn').click();
  await expect(byId(page, 'setup-player-name')).toHaveValue('Different Team');
  await byId(page, 'setup-back-btn').click();
  await expect(byId(page, 'new-game-setup')).toHaveCount(0);
  const after = await savedState(page);
  expect(after.settings).toEqual(before.settings);
  expect(after.player).toEqual(before.player);
  expect(after.saveSlots).toEqual(before.saveSlots);
  await byId(page, 'new-game-btn').click();
  await expect(byId(page, 'setup-player-name')).toHaveValue('Test Party');
  await byId(page, 'new-game-next-btn').click();
  await expect(byId(page, 'park-option-wdw-mk')).toBeChecked();
});

test('new-game setup validates names and commits reviewed choices to a separate save', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await page.getByText('Main Menu', { exact: true }).click();
  const previous = (await savedState(page)).saveSlots.find(Boolean);
  await byId(page, 'new-game-btn').click();
  await byId(page, 'setup-player-name').fill('   ');
  await expect(byId(page, 'setup-name-error')).toBeVisible();
  await expect(byId(page, 'new-game-next-btn')).toBeDisabled();
  await byId(page, 'setup-player-name').fill('  Family Team  ');
  await byId(page, 'setup-player-name').press('Enter');
  await expect(byId(page, 'setup-game-name')).toBeFocused();
  await byId(page, 'setup-game-name').fill('  EPCOT Adventure  ');
  await expect(byId(page, 'setup-step')).toHaveText('Step 1 of 3 · Names');
  await expect(byId(page, 'setup-park-hint')).toHaveCount(0);
  await snap(page, '57-setup-names');
  await byId(page, 'new-game-next-btn').click();
  await expect(byId(page, 'setup-step')).toHaveText('Step 2 of 3 · Park');
  await expect(byId(page, 'setup-player-name')).toHaveCount(0);
  await expect(byId(page, 'setup-park-hint')).toHaveText('Choose where you’re starting; you can switch parks during play.');
  await byId(page, 'park-option-wdw-ep').click();
  await snap(page, '58-setup-park');
  await byId(page, 'new-game-next-btn').click();
  await expect(byId(page, 'setup-step')).toHaveText('Step 3 of 3 · Options');
  await expect(byId(page, 'setup-review')).toContainText('Family Team');
  await expect(byId(page, 'setup-review')).toContainText('EPCOT Adventure');
  await byId(page, 'setup-pins').click();
  await byId(page, 'setup-height-filter').click();
  await byId(page, 'setup-height-minus').click();
  await expect(byId(page, 'setup-height-value')).toContainText('39 inches');
  await snap(page, '43-setup-review');
  await byId(page, 'start-game-btn').click();
  await byId(page, 'game-tip-skip').click();
  const state = await savedState(page);
  expect(state.player.name).toBe('Family Team');
  expect(state.settings).toMatchObject({ parkIds: ['wdw-ep'], heightFilterEnabled: true, minHeightInches: 39 });
  expect(state.settings.categoryToggles.pins).toBe(false);
  expect(state.saveSlots.filter(Boolean)).toHaveLength(2);
  expect(state.saveSlots.find((s: any) => s?.id === previous.id)).toEqual(previous);
  expect(state.saveSlots.find((s: any) => s?.id === state.activeSlotId).name).toBe('EPCOT Adventure');
});

test('new-game setup supports largest text with reachable fixed actions and automatic naming', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await byId(page, 'home-settings-btn').click();
  await byId(page, 'settings-tab-accessibility').click();
  await byId(page, 'text-extra-large').click();
  await byId(page, 'comfort-readableFont').click();
  await page.getByText('‹ Back').click();
  await byId(page, 'new-game-btn').click();
  await byId(page, 'setup-player-name').fill('Large Text Team');
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'park-option-wdw-ak').click();
  await snap(page, '42-readable-setup');
  let button = await byId(page, 'new-game-next-btn').boundingBox();
  expect(button!.y + button!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'setup-height-filter').click();
  for (let i = 0; i < 40; i++) await byId(page, 'setup-height-minus').click();
  await expect(byId(page, 'setup-height-value')).toContainText('0 inches');
  await snap(page, '44-readable-setup-options');
  button = await byId(page, 'start-game-btn').boundingBox();
  expect(button!.y + button!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await byId(page, 'start-game-btn').click();
  await byId(page, 'game-tip-skip').click();
  const state = await savedState(page);
  const active = state.saveSlots.find((s: any) => s?.id === state.activeSlotId);
  expect(active.name).toMatch(/ - Animal Kingdom$/);
  expect(active.settings.minHeightInches).toBe(0);
  expect(state.session.challengeTasks.every((t: any) => t.category !== 'ride' || !t.heightRequirement)).toBe(true);
  await page.getByText('Settings', { exact: true }).click();
  await expect(byId(page, 'height-decrease-btn')).toBeDisabled();
});

test('full save slots explain the limit and require confirmed deletion', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    const first = state.saveSlots.find(Boolean);
    state.saveSlots = [first, { ...first, id: 'fixture-save-2', name: 'Second Game' }, { ...first, id: 'fixture-save-3', name: 'Third Game' }];
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload();
  await byId(page, 'new-game-btn').click();
  await expect(byId(page, 'save-slots-full')).toBeVisible();
  await expect(byId(page, 'new-game-setup')).toHaveCount(0);
  await byId(page, 'save-delete-0').click();
  await byId(page, 'save-delete-cancel-0').click();
  expect((await savedState(page)).saveSlots.filter(Boolean)).toHaveLength(3);
  await byId(page, 'save-delete-0').click();
  await snap(page, '45-full-save-slots');
  await byId(page, 'save-delete-confirm-0').click();
  expect((await savedState(page)).saveSlots.filter(Boolean)).toHaveLength(2);
  await expect(byId(page, 'save-slots-full')).toContainText('room for a new game');
  await byId(page, 'save-slots-new-game').click();
  await expect(byId(page, 'new-game-setup')).toBeVisible();
});

test('incompatible new-game options show a recoverable error without creating a save', async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    for (const settings of [state.settings, state.saveSlots.find(Boolean).settings]) {
      for (const key of ['ride', 'treat', 'meet', 'explore', 'seek']) settings.categoryToggles[key] = false;
      settings.categoryToggles.pins = true;
    }
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload();
  const original = (await savedState(page)).saveSlots;
  await byId(page, 'new-game-btn').click();
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'setup-pins').click();
  await byId(page, 'start-game-btn').click();
  await expect(byId(page, 'setup-error')).toBeVisible();
  expect((await savedState(page)).saveSlots).toEqual(original);
  await byId(page, 'setup-pins').click();
  await byId(page, 'start-game-btn').click();
  await expect(byId(page, 'game-tip-skip')).toBeVisible();
  expect((await savedState(page)).saveSlots.filter(Boolean)).toHaveLength(2);
});

test('opening tips stay concise and wait for the player to advance', async ({ page }) => {
  await page.goto('/');
  await byId(page, 'new-game-btn').click();
  await page.getByPlaceholder('Enter your name...').fill('Test Party');
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'park-option-wdw-mk').click();
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'start-game-btn').click();
  for (let step = 1; step <= 5; step++) {
    await expect(byId(page, 'game-tip-position')).toHaveText(`${step} of 5`);
    await expect(page.getByText('Passes & Discards', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Trivia Answers', { exact: true })).toHaveCount(0);
    await expect(page.getByText('50/50', { exact: true })).toHaveCount(0);
    if (step === 4) await snap(page, '41-streak-tip');
    const next = await byId(page, 'game-tip-next').boundingBox();
    expect(next!.y + next!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await byId(page, 'game-tip-next').click();
  }
  await expect(byId(page, 'game-tip-position')).toHaveCount(0);
  await expect(byId(page, 'hand-card')).toHaveCount(5);
});

test('hand navigation and park cancel preserve the hand without a duplicate tutorial', async ({ page }) => {
  await startGame(page);
  const original = (await savedState(page)).session.hand.map((t: any) => t.id);
  await expect(byId(page, 'park-chip')).toHaveCount(0);
  await expect(byId(page, 'challenges-heading').locator('[data-testid="minigames-btn"]')).toHaveCount(1);
  await expect(byId(page, 'game-help-btn')).toHaveCount(0);
  await expect(byId(page, 'game-help-panel')).toHaveCount(0);
  await expect(byId(page, 'hand-position')).toHaveCount(0);
  await expect(byId(page, `hand-select-${original[0]}`)).toHaveAttribute('aria-current', 'true');
  await byId(page, 'hand-next').click();
  await expect(byId(page, `hand-select-${original[1]}`)).toHaveAttribute('aria-current', 'true');
  await byId(page, 'hand-previous').click();
  await page.getByText('Park', { exact: true }).click();
  await expect(byId(page, 'switch-park-confirm')).toBeDisabled();
  await page.getByText('Cancel', { exact: true }).click();
  expect((await savedState(page)).session.hand.map((t: any) => t.id)).toEqual(original);
});

test('card taps open activities or trivia directly and outside taps return to the hand', async ({ page }) => {
  await triviaGame(page, 'single');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    const activity = { id: 'tap-activity', category: 'find', displayCategory: 'Find', size: 'small', points: 5, difficulty: 'easy', description: 'Find a hidden star in a sign or decoration. Look closely at its shape and tell your party where you spotted it.' };
    state.session.hand[1] = activity; state.saveSlots.find((s: any) => s.id === state.activeSlotId).session.hand[1] = activity;
    state.session.hand[2] = { ...activity, id: 'tap-discard' }; state.saveSlots.find((s: any) => s.id === state.activeSlotId).session.hand[2] = state.session.hand[2];
    state.settings.reduceMotion = 'on'; state.settings.textSize = 'extra-large'; state.settings.readableFont = true;
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload(); await byId(page, 'continue-game-btn').click(); await byId(page, 'save-select-0').click();
  const original = (await savedState(page)).session;
  await expect(byId(page, 'hand-read')).toHaveCount(0);
  await byId(page, 'hand-select-tap-activity').click();
  await expect(byId(page, 'hand-full-description')).toHaveText(original.hand[1].description);
  await expect(byId(page, 'hand-enlarged-card')).toBeVisible();
  await expect(byId(page, 'enlarged-discard-btn')).toBeVisible(); await expect(byId(page, 'enlarged-complete-btn')).toBeVisible();
  const completeBounds = await byId(page, 'enlarged-complete-btn').boundingBox();
  expect(completeBounds!.y + completeBounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(byId(page, 'reading-close')).toHaveCount(0);
  await byId(page, 'hand-full-description').click(); await expect(byId(page, 'reading-panel')).toBeVisible();
  await snap(page, '60-tap-enlarged-activity');
  await byId(page, 'reading-panel-backdrop').click({ position: { x: 4, y: 4 } });
  await expect(byId(page, 'reading-panel')).toHaveCount(0); await expect(byId(page, 'hand-select-tap-activity')).toHaveAttribute('aria-current', 'true');
  await byId(page, 'hand-previous').click(); await byId(page, 'hand-select-test-trivia').click();
  await expect(byId(page, 'trivia-panel')).toBeVisible(); await expect(byId(page, 'reading-panel')).toHaveCount(0);
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toHaveText('Help: 50/50');
  await expect(byId(page, 'trivia-not-now-btn')).toHaveText('Deselect');
  await expect(byId(page, 'trivia-panel')).not.toContainText('Earn 1 every');
  const left = await byId(page, 'trivia-fifty-fifty-btn').boundingBox(); const right = await byId(page, 'trivia-not-now-btn').boundingBox();
  expect(Math.abs(left!.width - right!.width)).toBeLessThan(1); expect(left!.x + left!.width).toBeLessThan(right!.x);
  expect(right!.y + right!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await snap(page, '61-trivia-footer');
  await byId(page, 'trivia-backdrop').click({ position: { x: 4, y: 4 } });
  await expect(byId(page, 'trivia-panel')).toHaveCount(0);
  expect((await savedState(page)).session.hand).toEqual(original.hand);
  expect((await savedState(page)).session.discardsRemaining).toBe(original.discardsRemaining);
  expect(await score(page)).toBe(original.sessionScore);
  await byId(page, 'hand-select-test-trivia').click(); await byId(page, 'trivia-choice-1').click();
  await expect(byId(page, 'trivia-result')).toContainText('Not quite');
  await byId(page, 'trivia-backdrop').click({ position: { x: 4, y: 4 } });
  await expect(byId(page, 'trivia-panel')).toHaveCount(0); await expect(byId(page, 'draft-option')).toHaveCount(3);
  await pickFirstDraftOption(page);
  await byId(page, 'hand-select-tap-activity').click(); await byId(page, 'enlarged-complete-btn').click();
  await expect(byId(page, 'reading-panel')).toHaveCount(0); await expect.poll(() => score(page)).toBe(5);
  await pickFirstDraftOption(page);
  await byId(page, 'hand-select-tap-discard').click(); await byId(page, 'enlarged-discard-btn').click();
  await expect(byId(page, 'reading-panel')).toHaveCount(0); await expect(byId(page, 'draft-option')).toHaveCount(3);
  expect((await savedState(page)).session.discardsRemaining).toBe(original.discardsRemaining - 1);
  expect(await score(page)).toBe(5);
});

test('multiple-answer selection can be changed without choosing too many answers', async ({ page }) => {
  await triviaGame(page);
  await byId(page, 'complete-btn').click();
  await byId(page, 'trivia-choice-0').click();
  await byId(page, 'trivia-choice-1').click();
  await expect(byId(page, 'trivia-choice-0')).toBeChecked();
  await byId(page, 'trivia-choice-2').click();
  await expect(byId(page, 'trivia-choice-2')).not.toBeChecked();
  await expect(byId(page, 'trivia-submit-btn')).toBeEnabled();
  await byId(page, 'trivia-choice-1').click();
  await expect(byId(page, 'trivia-submit-btn')).toBeDisabled();
  await byId(page, 'trivia-choice-2').click();
  await byId(page, 'trivia-submit-btn').click();
  await expect(byId(page, 'trivia-result')).toContainText('Correct!');
  await expect(byId(page, 'trivia-outcome')).toContainText('Streak: 1');
});

test('fifth completion explains its streak bonus and refills passes and 50/50', async ({ page }) => {
  await triviaGame(page, 'single');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    for (const session of [state.session, state.saveSlots.find((s: any) => s?.id === state.activeSlotId).session]) {
      Object.assign(session, { totalCompletions: 4, currentStreak: 4, discardsRemaining: 0, fiftyFiftyUses: 1 });
    }
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload();
  await byId(page, 'continue-game-btn').click();
  await page.getByText('Select', { exact: true }).first().click();
  await byId(page, 'complete-btn').click();
  await byId(page, 'trivia-choice-0').click();
  await expect(byId(page, 'trivia-outcome')).toContainText('+10 streak bonus!');
  await snap(page, '38-streak-reward');
  await byId(page, 'trivia-dismiss-btn').click();
  await expect.poll(() => score(page)).toBe(20);
  const session = (await savedState(page)).session;
  expect(session).toMatchObject({ currentStreak: 5, totalCompletions: 5, discardsRemaining: 1, fiftyFiftyUses: 2 });
});

test('device reduced motion and largest reading size work through drafts and minigames', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await byId(page, 'settings-tab-accessibility').click();
  await expect(byId(page, 'motion-system')).toBeChecked();
  await byId(page, 'text-extra-large').click();
  await byId(page, 'comfort-readableFont').click();
  await page.getByText('‹ Back').click();
  await page.getByText('Park', { exact: true }).click();
  await snap(page, '40-readable-park-switch');
  const parkConfirm = await byId(page, 'switch-park-confirm').boundingBox();
  expect(parkConfirm!.y + parkConfirm!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.getByText('Cancel', { exact: true }).click();
  await focusCompletableCard(page);
  await byId(page, 'complete-btn').click();
  await expect(byId(page, 'draft-option')).toHaveCount(3);
  await byId(page, 'draft-option').first().click();
  await byId(page, 'add-to-hand').scrollIntoViewIfNeeded();
  await snap(page, '34-readable-draft');
  await byId(page, 'add-to-hand').click();
  await page.getByText('Awesome!', { exact: true }).click();
  await byId(page, 'minigames-btn').click();
  await byId(page, 'choose-sprint').click();
  await snap(page, '35-readable-minigame-help');
  await byId(page, 'minigame-tips-dismiss').click();
  await byId(page, 'sprint-start').click();
  await expect(byId(page, 'sprint-question')).toBeVisible();
  await snap(page, '36-readable-sprint');
  expect((await savedState(page)).settings.reduceMotion).toBe('system');
});

test('comfort preferences persist, readable views fit, and cards have button navigation', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await byId(page, 'settings-tab-accessibility').click();
  await byId(page, 'motion-on').click();
  await byId(page, 'comfort-readableFont').click();
  await byId(page, 'comfort-highContrast').click();
  await byId(page, 'text-extra-large').click();
  await expect(byId(page, 'motion-on')).toBeChecked();
  await expect(byId(page, 'text-extra-large')).toBeChecked();
  await snap(page, '30-comfort-settings');
  await page.getByText('‹ Back').click();
  await byId(page, 'hand-next').click();
  await byId(page, 'hand-previous').click();
  await focusCompletableCard(page);
  const selectedId = (await page.locator('[data-testid^="hand-select-"][aria-current="true"]').getAttribute('data-testid'))!.slice('hand-select-'.length);
  const card = (await savedState(page)).session.hand.find((t: any) => t.id === selectedId);
  await byId(page, `hand-select-${card.id}`).click();
  await expect(byId(page, 'hand-full-description')).toHaveText(card.description);
  await snap(page, '31-readable-card');
  await byId(page, 'reading-panel-backdrop').click({ position: { x: 4, y: 4 } });
  await page.reload();
  await byId(page, 'continue-game-btn').click();
  await page.getByText('Select', { exact: true }).first().click();
  const settings = (await savedState(page)).settings;
  expect(settings).toMatchObject({ reduceMotion: 'on', textSize: 'extra-large', readableFont: true, highContrast: true });
  await byId(page, 'challenge-card').first().click();
  await snap(page, '32-readable-challenge');
  const button = byId(page, 'challenge-complete-btn');
  const bounds = await button.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await button.click();
});

test('seated and quiet activity filters apply to new cards without emptying the board', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await byId(page, 'settings-tab-accessibility').click();
  await byId(page, 'comfort-seatedOnly').click();
  await byId(page, 'comfort-noPerforming').click();
  await byId(page, 'comfort-lessWalking').click();
  await expect(byId(page, 'filter-error')).toHaveCount(0);
  await startGame(page);
  const state = await savedState(page);
  expect(state.session.hand).toHaveLength(5);
  expect(state.session.hand.every((t: any) => !['act','ride','meet'].includes(t.category))).toBe(true);
  expect(state.session.challengeTasks).toHaveLength(3);
  expect(state.session.challengeTasks.every((t: any) => t.id.startsWith('comfort-') || t.id.startsWith('explore-e-1'))).toBe(true);
  await byId(page, 'challenge-card').first().click();
  await byId(page, 'challenge-complete-btn').click();
  expect((await savedState(page)).session.challengeTasks.every((t: any) => t.id.startsWith('comfort-') || t.id.startsWith('explore-e-1'))).toBe(true);
});

test('help, privacy, reporting drafts, and confirmed local deletion work', async ({ page }) => {
  await page.addInitScript(() => { (window as any).openedLinks = []; window.open = ((url: any) => { (window as any).openedLinks.push(String(url)); return null; }) as any; });
  await triviaGame(page, 'single');
  await byId(page, 'complete-btn').click();
  await expect(byId(page, 'trivia-report-btn')).toHaveCount(0);
  await byId(page, 'trivia-not-now-btn').click();
  await page.getByText('Settings', { exact: true }).click();
  for (const key of ['help', 'report', 'privacy']) {
    await byId(page, `settings-${key}-btn`).click();
    await expect(byId(page, `settings-${key}-panel`)).toBeVisible();
    await snap(page, `33-${key}`);
    await byId(page, 'reading-close').click();
  }
  await byId(page, 'settings-delete-btn').click();
  await byId(page, 'reading-close').click();
  expect((await savedState(page)).session).not.toBeNull();
  await byId(page, 'settings-delete-btn').click();
  await byId(page, 'clear-data-confirm').click();
  await expect(byId(page, 'new-game-btn')).toBeVisible();
  await expect.poll(async () => (await savedState(page)).session).toBeNull();
  expect((await savedState(page)).saveSlots).toEqual([null, null, null]);
  expect((await savedState(page)).player.name).toBe('Player 1');
});

async function startGame(page: Page, parkId = 'wdw-mk') {
  await page.goto('/');
  await byId(page, 'new-game-btn').click();
  await page.getByPlaceholder('Enter your name...').fill('Test Party');
  await byId(page, 'new-game-next-btn').click();
  await byId(page, `park-option-${parkId}`).click();
  await byId(page, 'new-game-next-btn').click();
  await byId(page, 'start-game-btn').click();
  const skip = page.getByText('Skip Tips', { exact: true });
  await skip.click();
  await expect(skip).toBeHidden();
  await expect(byId(page, 'hand-card')).toHaveCount(5);
  // Let the opening deal animation settle.
  await page.waitForTimeout(1200);
}

async function score(page: Page) {
  return Number(await byId(page, 'score-value').innerText());
}

// Brings a non-trivia card to the front so "Complete" is available.
async function focusCompletableCard(page: Page) {
  const complete = byId(page, 'complete-btn');
  for (let i = 0; i < 5; i++) {
    if ((await complete.innerText()).includes('Complete')) return;
    await byId(page, 'hand-next').click();
    await page.waitForTimeout(500);
  }
  throw new Error('No completable card in hand');
}

async function pickFirstDraftOption(page: Page) {
  const options = byId(page, 'draft-option');
  await expect(options).toHaveCount(3);
  await page.waitForTimeout(700);
  await options.first().click({ force: true });
  await byId(page, 'add-to-hand').click({ force: true });
  await expect(options).toHaveCount(0);
  await expect(byId(page, 'open-slot')).toHaveCount(0);
  await expect(byId(page, 'hand-card')).toHaveCount(5);
}

test('only Walt Disney World parks are offered', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(byId(page, 'new-game-btn')).toBeVisible();
  await snap(page, '00-home');
  await byId(page, 'new-game-btn').click();
  await byId(page, 'new-game-next-btn').click();
  for (const id of ['wdw-mk', 'wdw-hs', 'wdw-ep', 'wdw-ak']) {
    await expect(byId(page, `park-option-${id}`)).toBeVisible();
  }
  await expect(page.locator('[data-testid^="park-option-"]')).toHaveCount(4);
  for (const gone of ['Universal', 'Zoo', 'Any Park', 'Disneyland', 'Epic Universe']) {
    await expect(page.getByText(gone)).toHaveCount(0);
  }
  await snap(page, '01-new-game');
});

test('the game table renders a full hand and three challenges', async ({ page }) => {
  await startGame(page, 'wdw-hs');
  const centered = byId(page, 'hand-card').first();
  const description = await centered.getByTestId('card-description').boundingBox();
  const footer = await centered.getByTestId('card-footer').boundingBox();
  expect(description!.y + description!.height).toBeLessThanOrEqual(footer!.y + 1);
  await expect(byId(page, 'challenge-card')).toHaveCount(3);
  expect((await savedState(page)).settings.parkIds).toEqual(['wdw-hs']);
  await expect(page.getByText('Park', { exact: true })).toBeVisible();
  expect(await score(page)).toBe(0);
  await snap(page, '02-table');
});

test('completing a hand card scores points, then drafts a replacement into the same slot', async ({ page }) => {
  await startGame(page);
  await focusCompletableCard(page);
  const points = Number((await byId(page, 'complete-btn').innerText()).match(/\+(\d+)/)![1]);

  await byId(page, 'complete-btn').click();
  await page.waitForTimeout(50);
  await page.screenshot({ path: `test-results/screens/${test.info().project.name}/03-complete-burst.png` });
  await expect(byId(page, 'open-slot')).toBeVisible();
  await expect(byId(page, 'complete-btn')).toBeDisabled();
  await expect(byId(page, 'discard-btn')).toBeDisabled();
  await expect.poll(() => score(page)).toBe(points);

  await expect(byId(page, 'draft-option')).toHaveCount(3);
  await page.waitForTimeout(800);
  await snap(page, '04-draft');
  const pending = (await savedState(page)).session;
  await page.reload();
  await byId(page, 'continue-game-btn').click();
  await byId(page, 'save-select-0').click();
  await expect(byId(page, 'draft-option')).toHaveCount(3);
  expect((await savedState(page)).session.draft).toEqual(pending.draft);
  expect(await score(page)).toBe(points);
  await pickFirstDraftOption(page);
  const resumed = (await savedState(page)).session;
  expect(resumed.hand).toHaveLength(5);
  expect(resumed.hand[pending.draft.slotIndex].id).toBe(pending.draft.options[0].id);
  expect(resumed.sessionScore).toBe(points);
  await page.waitForTimeout(800);
  await snap(page, '05-after-draft');
});

test('large game totals and exhausted discards remain readable with the largest text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startGame(page, 'wdw-ep');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    const slot = state.saveSlots.find((s: any) => s?.id === state.activeSlotId);
    for (const settings of [state.settings, slot.settings]) {
      settings.textSize = 'extra-large'; settings.readableFont = true; settings.darkMode = 'light';
    }
    for (const session of [state.session, slot.session]) {
      session.sessionScore = 123456; session.currentStreak = 124; session.discardsRemaining = 0;
    }
    slot.badges = slot.badges.map((b: any) => ({ ...b, earned: true }));
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload(); await byId(page, 'continue-game-btn').click(); await byId(page, 'save-select-0').click();
  await expect(byId(page, 'score-stat')).toHaveAttribute('aria-label', 'Score: 123456 points');
  await expect(byId(page, 'streak-stat')).toHaveAttribute('aria-label', /Streak: 124.*1 more/);
  await expect(byId(page, 'discard-btn')).toBeDisabled();
  await expect(byId(page, 'discard-btn')).toContainText('0 left');
  await expect(byId(page, 'hand-position')).toHaveCount(0);
  await expect(byId(page, 'game-help-btn')).toHaveCount(0);
  const action = await byId(page, 'complete-btn').boundingBox();
  const nav = await byId(page, 'game-nav-bar').boundingBox();
  expect(action!.y + action!.height).toBeLessThanOrEqual(nav!.y);
  expect(await byId(page, 'score-value').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await snap(page, '63-large-game-totals');
  await focusCompletableCard(page);
  await page.locator('[data-testid^="hand-select-"][aria-current="true"]').click();
  await expect(byId(page, 'enlarged-discard-btn')).toBeDisabled();
  await expect(byId(page, 'enlarged-complete-btn')).toBeEnabled();
  await byId(page, 'reading-panel-backdrop').click({ position: { x: 4, y: 4 } });
  expect((await savedState(page)).session.discardsRemaining).toBe(0);
});

test('discarding spends a discard and also offers a draft', async ({ page }) => {
  await startGame(page);
  await focusCompletableCard(page);
  await expect(byId(page, 'discard-btn')).toContainText('2 left');
  await byId(page, 'discard-btn').click();
  await expect(byId(page, 'open-slot')).toBeVisible();
  await pickFirstDraftOption(page);
  await expect(byId(page, 'discard-btn')).toContainText('1 left');
  expect(await score(page)).toBe(0);
});

async function triviaGame(page: Page, mode: 'single' | 'multiple' | 'alternative' = 'multiple') {
  await startGame(page);
  await page.evaluate(mode => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    const fixture = { id: 'test-trivia', size: 'small', category: 'trivia', displayCategory: 'Trivia',
      description: 'Which of these are the correct answers?', points: 10, difficulty: 'medium',
      triviaChoices: ['First answer', 'Wrong choice', 'Second answer', 'Another wrong choice'],
      triviaExplanation: 'This explanation stays available for the player to read until they dismiss the answer.',
      ...(mode === 'single' ? { triviaAnswer: 0 } : { triviaAnswers: [0, 2], ...(mode === 'alternative' ? { triviaRequiredAnswers: 1 } : {}) }) };
    const slot = state.saveSlots.find((s: any) => s?.id === state.activeSlotId);
    slot.session.hand[0] = fixture;
    state.session.hand[0] = fixture;
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  }, mode);
  await page.reload();
  await byId(page, 'continue-game-btn').click();
  await page.getByText('Select', { exact: true }).first().click();
  await expect(byId(page, 'complete-btn')).toContainText('Answer');
}

test('wrong multi-answer trivia reveals every answer and waits for dismissal', async ({ page }) => {
  await triviaGame(page);
  await byId(page, 'complete-btn').click();
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toHaveCount(0);
  await byId(page, 'trivia-choice-0').click();
  await expect(byId(page, 'trivia-result')).toHaveCount(0);
  await byId(page, 'trivia-choice-1').click();
  await byId(page, 'trivia-submit-btn').click();
  await expect(byId(page, 'trivia-result')).toContainText('Not quite');
  await expect(byId(page, 'trivia-outcome')).toContainText('your passes are unchanged');
  await expect(byId(page, 'trivia-choice-0')).toContainText('Correct');
  await expect(byId(page, 'trivia-choice-2')).toContainText('Correct');
  await expect(byId(page, 'trivia-choice-1')).toContainText('Your pick');
  await expect(byId(page, 'trivia-explanation')).toBeVisible();
  await page.waitForTimeout(1600);
  await expect(byId(page, 'draft-option')).toHaveCount(0);
  await snap(page, '06-trivia-wrong');
  await byId(page, 'trivia-dismiss-btn').click();
  await pickFirstDraftOption(page);
  expect(await score(page)).toBe(0);
  const action = await byId(page, 'complete-btn').boundingBox();
  const navigation = await byId(page, 'game-nav-bar').boundingBox();
  expect(action!.y + action!.height).toBeLessThanOrEqual(navigation!.y);
});

test('correct multi-answer selection scores only after dismissal', async ({ page }) => {
  await triviaGame(page);
  await byId(page, 'complete-btn').click();
  await byId(page, 'trivia-choice-0').click();
  await byId(page, 'trivia-choice-2').click();
  await byId(page, 'trivia-submit-btn').click();
  await expect(byId(page, 'trivia-result')).toContainText('Correct! +10');
  expect(await score(page)).toBe(0);
  await byId(page, 'trivia-dismiss-btn').click();
  await expect.poll(() => score(page)).toBe(10);
});

test('passing trivia reveals answers until dismissed, then spends a discard', async ({ page }) => {
  await triviaGame(page);
  await byId(page, 'discard-btn').click();
  await expect(byId(page, 'trivia-result')).toContainText('Passed');
  await expect(byId(page, 'trivia-outcome')).toContainText('Uses 1 pass and resets your streak');
  await expect(byId(page, 'trivia-choice-0')).toContainText('Correct');
  await expect(byId(page, 'trivia-choice-2')).toContainText('Correct');
  await page.waitForTimeout(1600);
  await expect(byId(page, 'draft-option')).toHaveCount(0);
  await snap(page, '06-trivia-passed');
  await byId(page, 'trivia-dismiss-btn').click();
  await pickFirstDraftOption(page);
  await expect(byId(page, 'discard-btn')).toContainText('1 left');
  expect(await score(page)).toBe(0);
});

for (const mode of ['single', 'alternative'] as const) {
  test(`${mode} trivia accepts one choice and waits for dismissal`, async ({ page }) => {
    await triviaGame(page, mode);
    await byId(page, 'complete-btn').click();
    await byId(page, `trivia-choice-${mode === 'single' ? 0 : 2}`).click();
    await expect(byId(page, 'trivia-result')).toContainText('Correct! +10');
    await byId(page, 'trivia-dismiss-btn').click();
    await expect.poll(() => score(page)).toBe(10);
  });
}

test('50/50 removes two wrong choices once and survives closing and resuming', async ({ page }) => {
  await triviaGame(page, 'single');
  await byId(page, 'complete-btn').click();
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toHaveText('Help: 50/50');
  await byId(page, 'trivia-fifty-fifty-btn').click();
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toBeDisabled();
  await expect(byId(page, 'trivia-choice-0')).toBeEnabled();
  const removed = [];
  for (let i = 1; i < 4; i++) {
    if (await byId(page, `trivia-choice-${i}`).getAttribute('aria-disabled') === 'true') removed.push(i);
  }
  expect(removed).toHaveLength(2);
  await snap(page, '14-trivia-fifty-fifty');
  await byId(page, 'trivia-not-now-btn').click();
  await byId(page, 'complete-btn').click();
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toHaveText('Help: 50/50');
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toBeDisabled();
  await page.reload();
  await byId(page, 'continue-game-btn').click();
  await page.getByText('Select', { exact: true }).first().click();
  await byId(page, 'complete-btn').click();
  for (const i of removed) await expect(byId(page, `trivia-choice-${i}`)).toBeDisabled();
  expect((await savedState(page)).session.fiftyFiftyUses).toBe(1);
});

test('completing a challenge scores it and refills the challenge row', async ({ page }) => {
  await startGame(page);
  await byId(page, 'challenge-card').first().click();
  const complete = byId(page, 'challenge-complete-btn');
  await expect(complete).toBeVisible();
  await snap(page, '07-challenge-detail');
  const points = Number((await complete.innerText()).match(/\+(\d+)/)![1]);
  await complete.click();
  await expect.poll(() => score(page)).toBe(points);
  await expect(byId(page, 'challenge-card')).toHaveCount(3);
});

test('switching parks redeals the hand for the new park', async ({ page }) => {
  await startGame(page, 'wdw-mk');
  await page.getByText('Park', { exact: true }).click();
  await byId(page, 'switch-park-wdw-ep').click();
  await page.getByText('Switch', { exact: true }).click();
  await expect(byId(page, 'switch-park-wdw-ep')).toBeHidden();
  expect((await savedState(page)).settings.parkIds).toEqual(['wdw-ep']);
  await expect(byId(page, 'park-chip')).toHaveCount(0);
  await expect(byId(page, 'hand-card')).toHaveCount(5);
});

test('settings and profile render with the custom icon set', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await expect(page.getByText('Haptic Feedback')).toBeVisible();
  expect(await page.locator('svg').count()).toBeGreaterThan(10);
  await snap(page, '08-settings');
  await byId(page, 'about-btn').click();
  await expect(page.getByText('Thank you to GooglyBlox', { exact: false })).toBeVisible();
  await expect(page.getByText('not affiliated', { exact: false })).toBeVisible();
  await snap(page, '08-about');
  await byId(page, 'about-close-btn').click();
  await page.getByText('‹ Back').click();
  await page.getByText('Profile', { exact: true }).click();
  await expect(page.getByText('Sharp Eye (Bronze)')).toBeVisible();
  await snap(page, '09-profile');
});

test('the app still starts when the game font is slow or blocked', async ({ page }) => {
  // Mimics Safari stalling or skipping web fonts; the app must not wait on it.
  await page.route('**/*.ttf', () => {});
  await page.goto('/', { waitUntil: 'commit' });
  await expect(byId(page, 'new-game-btn')).toBeVisible({ timeout: 8000 });
});

const savedState = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('parkquest_state') ?? '{}'));

test('settings themes follow the selection and system appearance, then persist on resume', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  const screen = byId(page, 'settings-screen');
  await byId(page, 'theme-light').click();
  await expect(byId(page, 'theme-light')).toBeChecked();
  await expect(screen).toHaveCSS('background-color', 'rgb(254, 252, 248)');
  await snap(page, '11-settings-light');
  await byId(page, 'theme-dark').click();
  await expect(screen).toHaveCSS('background-color', 'rgb(23, 18, 34)');
  await snap(page, '12-settings-dark');
  await byId(page, 'about-btn').click();
  await expect(byId(page, 'about-panel')).toHaveCSS('background-color', 'rgb(41, 33, 54)');
  await snap(page, '13-about-dark');
  await byId(page, 'about-close-btn').click();
  await byId(page, 'theme-system').click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(screen).toHaveCSS('background-color', 'rgb(23, 18, 34)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(screen).toHaveCSS('background-color', 'rgb(254, 252, 248)');
  await byId(page, 'theme-dark').click();
  await byId(page, 'haptics-switch').click();
  await expect.poll(async () => (await savedState(page)).settings.hapticsEnabled).toBe(false);
  await page.reload();
  await byId(page, 'continue-game-btn').click();
  await page.getByText('Select', { exact: true }).first().click();
  await page.getByText('Settings', { exact: true }).click();
  await expect(screen).toHaveCSS('background-color', 'rgb(23, 18, 34)');
  await expect(byId(page, 'haptics-switch').getByRole('switch')).not.toBeChecked();
  await expect(page.getByText(/Individual Rides/)).toHaveCount(0);
});

test('height and category settings persist and trivia-only games have a full hand', async ({ page }) => {
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await byId(page, 'height-filter-switch').click();
  for (let i = 0; i < 8; i++) await byId(page, 'height-decrease-btn').click();
  await expect.poll(async () => (await savedState(page)).settings.minHeightInches).toBe(32);
  for (const key of ['find', 'photo', 'act', 'ride', 'treat', 'pins', 'meet', 'seek']) {
    await byId(page, `category-switch-${key}`).click();
  }
  await expect(byId(page, 'category-switch-trivia').getByRole('switch')).toBeDisabled();
  await expect(byId(page, 'category-switch-explore').getByRole('switch')).toBeDisabled();
  const state = await savedState(page);
  const slot = state.saveSlots.find((s: any) => s?.id === state.activeSlotId);
  expect(slot.settings).toEqual(state.settings);
  await startGame(page);
  const next = await savedState(page);
  expect(next.session.hand).toHaveLength(5);
  expect(next.session.hand.every((t: any) => t.category === 'trivia')).toBe(true);
  expect(next.session.challengeTasks.every((t: any) => t.category === 'explore')).toBe(true);
  await byId(page, 'complete-btn').click();
  const question = next.session.hand[0];
  const accepted = question.triviaAnswers ?? [question.triviaAnswer];
  const required = question.triviaRequiredAnswers ?? accepted.length;
  for (const index of accepted.slice(0, required)) await byId(page, 'trivia-choice-' + index).click();
  if (await byId(page, 'trivia-submit-btn').count()) await byId(page, 'trivia-submit-btn').click();
  await byId(page, 'trivia-dismiss-btn').click();
  await pickFirstDraftOption(page);
});

test('sound preview plays a bundled effect and mute prevents playback', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).soundPlays = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      (window as any).soundPlays.push(this.src);
      return original.call(this);
    };
  });
  await startGame(page);
  await page.getByText('Settings', { exact: true }).click();
  await byId(page, 'sound-preview-btn').click();
  await expect.poll(() => page.evaluate(() => (window as any).soundPlays.some((s: string) => s.includes('success')))).toBe(true);
  await byId(page, 'sound-switch').click();
  await expect(byId(page, 'sound-preview-btn')).toBeDisabled();
  await page.evaluate(() => { (window as any).soundPlays = []; });
  await page.getByText('‹ Back').click();
  await focusCompletableCard(page);
  await byId(page, 'complete-btn').click();
  await pickFirstDraftOption(page);
  expect(await page.evaluate(() => (window as any).soundPlays.length)).toBe(0);
  await page.reload();
  expect((await savedState(page)).settings.soundEnabled).toBe(false);
});

test('visiting all four parks earns Park Hopper Gold', async ({ page }) => {
  await startGame(page, 'wdw-mk');
  for (const park of ['wdw-hs', 'wdw-ep', 'wdw-ak']) {
    await page.getByText('Park', { exact: true }).click();
    await byId(page, `switch-park-${park}`).click();
    await page.getByText('Switch', { exact: true }).click();
    await expect(byId(page, `switch-park-${park}`)).toBeHidden();
    await byId(page, 'badge-dismiss').click();
    await expect(byId(page, 'badge-dismiss')).toBeHidden();
  }
  // Park badges unlock immediately when the park is selected.
  await expect
    .poll(async () => {
      const slot = (await savedState(page)).saveSlots.find((s: any) => s);
      return ['hopper-bronze', 'hopper-silver', 'hopper-gold'].map(
        id => slot.badges.find((b: any) => b.id === id)?.earned ?? false,
      );
    })
    .toEqual([true, true, true]);
});

test('older saves pick up the new Park Hopper tiers', async ({ page }) => {
  await startGame(page);
  // Rewrite the save the way an older build stored it.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkquest_state')!);
    const slot = state.saveSlots.find((s: any) => s);
    slot.visitedParks = ['wdw-mk', 'uor-us', 'zoo'];
    slot.badges = slot.badges.map((b: any) =>
      b.id === 'hopper-silver' ? { ...b, description: 'Visit 4 parks', icon: '🏰' } : b,
    );
    slot.badges.push({ id: 'hopper-platinum', name: 'Park Hopper (Platinum)', description: 'Visit 10 parks', icon: '🏰', tier: 'platinum', earned: false });
    localStorage.setItem('parkquest_state', JSON.stringify(state));
  });
  await page.reload();
  await byId(page, 'home-profile-btn').click();
  await expect(byId(page, 'parks-visited')).toHaveText('1');
  await expect(page.getByText('Visit 3 parks')).toBeVisible();
  await expect(page.getByText('Visit all 4 Walt Disney World parks')).toBeVisible();
  await expect(page.getByText('Park Hopper (Platinum)')).toHaveCount(0);
  await expect(page.getByText('Visit 4 parks')).toHaveCount(0);
  await snap(page, '10-profile-badges');
});

test('minigames teach the rules, score a perfect sprint, and allow unlimited replay', async ({ page }) => {
  await startGame(page);
  await byId(page, 'minigames-btn').click();
  await byId(page, 'choose-sprint').click();
  await expect(byId(page,'minigame-tips')).toBeVisible();
  await snap(page,'20-sprint-help');
  await byId(page,'minigame-tips-dismiss').click();
  await byId(page,'sprint-start').click();
  await snap(page,'21-sprint');
  const started=await savedState(page);
  const questions=started.session.triviaSprint.questions;
  const expected=questions.reduce((sum:number,q:any)=>sum+q.points,0)*3;
  const previous=started.session.sessionScore;
  for(let i=0;i<10;i++) {
    const q=questions[i];
    await expect(byId(page,'sprint-question')).toHaveText(q.description);
    await byId(page,`sprint-choice-${q.triviaAnswers?.[0] ?? q.triviaAnswer}`).click();
  }
  await expect(byId(page,'sprint-results')).toContainText('10/10 correct');
  await expect.poll(async()=>(await savedState(page)).session.sessionScore).toBe(previous+expected);
  await snap(page,'22-sprint-review');
  await page.waitForTimeout(1500);
  await expect(byId(page,'sprint-results')).toBeVisible();
  await byId(page,'sprint-start').click();
  await expect(byId(page,'sprint-timer')).toBeVisible();
  await byId(page,'minigames-close').click();
  await byId(page,'minigames-close').click();
  await expect(byId(page,'hand-card')).toHaveCount(5);
  await byId(page, 'badge-dismiss').click();
  await expect(byId(page, 'badge-dismiss')).toBeHidden();
  await byId(page,'minigames-btn').click();await byId(page,'choose-sprint').click();
  await expect(byId(page,'minigame-tips')).toHaveCount(0);
  await byId(page,'minigame-help').click();await expect(byId(page,'minigame-tips')).toBeVisible();
});

test('Who Am I reveals clues, preserves progress, and reviews the character at the player pace', async ({page})=>{
  await startGame(page);await byId(page,'minigames-btn').click();await byId(page,'choose-who').click();
  await snap(page,'23-who-help');await byId(page,'minigame-tips-dismiss').click();await byId(page,'who-start').click();
  await expect(byId(page,'who-clue')).toHaveCount(1);
  await byId(page,'who-next-clue').click();await expect(byId(page,'who-clue')).toHaveCount(2);
  await byId(page,'minigames-close').click();await byId(page,'minigames-close').click();
  await page.reload();await byId(page,'continue-game-btn').click();await page.getByText('Select',{exact:true}).first().click();
  await byId(page,'minigames-btn').click();await byId(page,'choose-who').click();
  await expect(byId(page,'who-clue')).toHaveCount(2);
  await byId(page,'who-next-clue').click();await expect(byId(page,'who-next-clue')).toBeDisabled();
  await snap(page,'24-who-clues');
  const previous=await score(page);
  await byId(page,'who-give-up').click();await expect(byId(page,'who-results')).toContainText('Correct answer:');
  expect(await score(page)).toBe(previous);
  await page.waitForTimeout(1500);await expect(byId(page,'who-results')).toBeVisible();
  await snap(page,'25-who-review');
  await byId(page,'who-start').click();await expect(byId(page,'who-clue')).toHaveCount(1);
  const who = (await savedState(page)).session.whoAmI;
  const name = WHO_AM_I.find(c=>c.id===who.characterId)!.name;
  await byId(page,'who-choice-'+who.choices.indexOf(name)).click();
  await expect(byId(page,'who-results')).toContainText('You got it!');
  await expect.poll(async()=>(await savedState(page)).session.sessionScore).toBe(previous+15);
});


test('leaving a Sprint clears it permanently and every new round gets a full minute', async ({page})=>{
  await startGame(page);await byId(page,'minigames-btn').click();await byId(page,'choose-sprint').click();
  await byId(page,'minigame-tips-dismiss').click();
  await expect(byId(page,'sprint-30')).toHaveCount(0); await expect(byId(page,'sprint-60')).toHaveCount(0);
  await page.clock.install(); await byId(page,'sprint-start').click();
  const before = (await savedState(page)).session;
  expect(before.triviaSprint.durationSeconds).toBe(60);
  const question = before.triviaSprint.questions[0];
  await byId(page,`sprint-choice-${question.triviaAnswers?.[0] ?? question.triviaAnswer}`).click();
  await page.clock.fastForward(15_000);
  await expect(byId(page,'sprint-timer')).toContainText('45 seconds');
  await byId(page,'minigames-close').click();
  expect((await savedState(page)).session.triviaSprint).toBeUndefined();
  await expect(byId(page,'choose-sprint')).not.toContainText('Resume');
  await byId(page,'minigames-close').click();
  await page.reload();await byId(page,'continue-game-btn').click();await byId(page,'save-select-0').click();
  await byId(page,'minigames-btn').click();await byId(page,'choose-sprint').click();
  await expect(byId(page,'sprint-results')).toHaveCount(0); await expect(byId(page,'sprint-timer')).toHaveCount(0);
  await page.clock.install();
  await byId(page,'sprint-start').click();
  const fresh = (await savedState(page)).session;
  expect(fresh.triviaSprint.id).not.toBe(before.triviaSprint.id);
  expect(fresh.triviaSprint.answers).toEqual([]); expect(fresh.triviaSprint.durationSeconds).toBe(60);
  await expect(byId(page,'sprint-timer')).toContainText('60 seconds');
  await snap(page, '59-sprint-fresh-minute');
  await byId(page,'minigames-close').click();await byId(page,'minigames-close').click();
  await page.clock.fastForward(61_000);
  await byId(page,'minigames-btn').click();await byId(page,'choose-sprint').click();
  await expect(byId(page,'sprint-results')).toHaveCount(0);
  expect((await savedState(page)).session.triviaSprint).toBeUndefined();
  expect((await savedState(page)).session.sessionScore).toBe(before.sessionScore);
  expect((await savedState(page)).session.hand).toEqual(before.hand);
  await expect(byId(page,'sprint-choice-0')).toHaveCount(0);
});

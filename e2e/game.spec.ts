import { WHO_AM_I } from '../src/data/whoAmI';
import { test, expect, Page } from '@playwright/test';

// Key screens are saved here so a person (or Claude) can review the UI after a run.
async function snap(page: Page, name: string) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `test-results/screens/${test.info().project.name}/${name}.png` });
}

const byId = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

async function startGame(page: Page, parkId = 'wdw-mk') {
  await page.goto('/');
  await byId(page, 'new-game-btn').click();
  await page.getByPlaceholder('Enter your name...').fill('Test Party');
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
    await byId(page, 'hand-card').nth(Math.min(i + 1, 4)).click({ force: true });
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
  await page.goto('/');
  await byId(page, 'new-game-btn').click();
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
  await expect(byId(page, 'challenge-card')).toHaveCount(3);
  await expect(page.getByText('Hollywood Studios')).toBeVisible();
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
  await expect.poll(() => score(page)).toBe(points);

  await expect(byId(page, 'draft-option')).toHaveCount(3);
  await page.waitForTimeout(800);
  await snap(page, '04-draft');
  await pickFirstDraftOption(page);
  await page.waitForTimeout(800);
  await snap(page, '05-after-draft');
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
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toContainText('2 left');
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
  await expect(byId(page, 'trivia-fifty-fifty-btn')).toContainText('used');
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
  await expect(byId(page, 'park-chip')).toContainText('EPCOT');
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
  }
  // Badges are awarded when a task is completed.
  await byId(page, 'challenge-card').first().click();
  await byId(page, 'challenge-complete-btn').click();
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
  await byId(page,'sprint-60').click();
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


test('a sprint expires while its panel is closed and reviews unanswered questions', async ({page})=>{
  await startGame(page);await byId(page,'minigames-btn').click();await byId(page,'choose-sprint').click();
  await byId(page,'minigame-tips-dismiss').click();await byId(page,'sprint-start').click();
  await page.clock.install();
  await byId(page,'minigames-close').click();await byId(page,'minigames-close').click();
  await page.clock.fastForward(31_000);
  await byId(page,'minigames-btn').click();await byId(page,'choose-sprint').click();
  await expect(byId(page,'sprint-results')).toContainText('0/10 correct');
  await expect(byId(page,'sprint-results')).toContainText('Unanswered');
  expect((await savedState(page)).session.triviaSprint.earnedPoints).toBe(0);
  await expect(byId(page,'sprint-choice-0')).toHaveCount(0);
});

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
  await expect(byId(page, 'discard-btn')).toContainText('2 left');
  await byId(page, 'discard-btn').click();
  await expect(byId(page, 'open-slot')).toBeVisible();
  await pickFirstDraftOption(page);
  await expect(byId(page, 'discard-btn')).toContainText('1 left');
  expect(await score(page)).toBe(0);
});

test('answering trivia closes the card into a draft', async ({ page }) => {
  await startGame(page);
  const complete = byId(page, 'complete-btn');
  let found = false;
  for (let i = 0; i < 5 && !found; i++) {
    found = (await complete.innerText()).includes('Answer');
    if (!found) {
      await byId(page, 'hand-card').nth(Math.min(i + 1, 4)).click({ force: true });
      await page.waitForTimeout(500);
    }
  }
  test.skip(!found, 'No trivia card was dealt this run');

  await complete.click();
  await expect(byId(page, 'trivia-choice-0')).toBeVisible();
  await snap(page, '06-trivia');
  await byId(page, 'trivia-choice-0').click();
  await expect(byId(page, 'draft-option')).toHaveCount(3, { timeout: 8000 });
  await pickFirstDraftOption(page);
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
  await page.getByText('‹ Back').click();
  await page.getByText('Profile', { exact: true }).click();
  await expect(page.getByText('Sharp Eye (Bronze)')).toBeVisible();
  await snap(page, '09-profile');
});

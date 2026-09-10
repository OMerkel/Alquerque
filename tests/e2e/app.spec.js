import { expect, test } from '@playwright/test';

const boardImages = (page) => page.locator('#board svg image');

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#board svg')).toBeVisible();
});

test('renders the initial position on the game page', async ({ page }) => {
  await expect(page).toHaveTitle('Alquerque');
  await expect(page.locator('#myheader')).toHaveText('Alquerque');
  const gameBounds = await page.locator('#game-page').boundingBox();
  const viewport = page.viewportSize();
  expect(gameBounds).toMatchObject({ x: 0, y: 0, width: viewport.width });
  expect(gameBounds.height).toBe(viewport.height);
  expect(
    await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight
    }))
  ).toEqual({ horizontal: 0, vertical: 0 });
  await expect(page.locator('#active-player .active-player-symbol')).toHaveText('🧑▼');
  await expect(page.locator('#active-player .active-player-spinner')).toHaveCSS(
    'animation-name',
    'active-player-spin'
  );
  await expect(page.locator('#active-player')).toHaveAttribute('aria-label', 'Human player south');
  await expect(boardImages(page)).toHaveCount(26);
  await expect(page.locator('#board svg rect')).toHaveCount(1);
  await expect(page.locator('#board svg image[href*="light"]')).toHaveCount(12);
  await expect(page.locator('#board svg image[href*="dark"]')).toHaveCount(12);
  await expect(page.locator('#board svg image.selectable-source')).toHaveCount(4);
  await expect(page.locator('#board svg image.selectable-source[href*="light"]')).toHaveCount(4);
  await expect(page.locator('#board svg circle.selectable-source-ring')).toHaveCount(4);
});

test('updates the active-player badge after a move', async ({ page }) => {
  await page.locator('#board svg image[data-x="2"][data-y="1"]').click();
  const selectedRing = page.locator('#board svg circle.selected-source-ring');
  await expect(selectedRing).toHaveCount(1);
  await expect(selectedRing).toHaveCSS('stroke', 'rgb(98, 189, 82)');
  expect(
    await selectedRing.evaluate((ring) => ring === ring.ownerSVGElement.lastElementChild)
  ).toBe(true);
  await page.locator('#board svg rect[data-x="2"][data-y="2"]').click();

  await expect(page.locator('#active-player .active-player-symbol')).toHaveText('🧑▲');
  await expect(page.locator('#active-player')).toHaveAttribute('aria-label', 'Human player north');
  await expect(page.locator('#board svg image.selectable-source')).toHaveCount(1);
  await expect(page.locator('#board svg image.selectable-source[href*="dark"]')).toHaveCount(1);
  await expect(page.locator('#board svg circle.selectable-source-ring')).toHaveCount(1);
  const lastSource = page.locator('#board svg circle.last-move-source');
  const lastTarget = page.locator('#board svg circle.last-move-target');
  await expect(lastSource).toHaveCSS('stroke', 'rgb(131, 217, 255)');
  await expect(lastSource).toHaveCSS('stroke-width', '0.05px');
  await expect(lastSource).toHaveCSS('stroke-dasharray', '0.12px, 0.08px');
  await expect(lastTarget).toHaveCSS('stroke', 'rgb(131, 217, 255)');
  await expect(lastTarget).toHaveCSS('stroke-width', '0.05px');
  await expect(lastTarget).toHaveCSS('stroke-dasharray', 'none');
});

test('animates the pawn while lifting it toward the midpoint', async ({ page }) => {
  const pawn = page.locator('#board svg image[data-x="2"][data-y="1"]');
  await pawn.click();
  await page.locator('#board svg rect[data-x="2"][data-y="2"]').click();
  await page.waitForTimeout(150);

  const transform = await pawn.evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { scale: matrix.a, translateY: matrix.f };
  });
  expect(transform.scale).toBeGreaterThan(1);
  expect(transform.scale).toBeLessThan(1.3);
  expect(transform.translateY).toBeLessThan(0);
  expect(transform.translateY).toBeGreaterThan(-0.5);
});

test('opens and closes the sidebar menu', async ({ page }) => {
  const panel = page.locator('#left-panel');
  await expect(panel).toBeHidden();
  await page.locator('#customMenu').click();
  await expect(panel).toBeVisible();
  await expect(panel.getByText('Rules…')).toBeVisible();
  await panel.getByText('Back', { exact: true }).click();
  await expect(panel).toBeHidden();
});

test('shows the rules subpage full screen and hides the board', async ({ page }) => {
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'Rules…' }).click();

  await expect(page.locator('#rules-page')).toBeVisible();
  await expect(page.locator('#game-page')).toBeHidden();
  await expect(page.locator('#board')).toBeHidden();
  await expect(page.locator('#left-panel')).toBeHidden();
  await expect(page.locator('#rules-page h2').first()).toHaveText('Game Material');
  await expect(page.locator('#rules-page')).toContainText(
    'By default, a checker must not reverse its own previous non-capturing move'
  );
  await expect(page.locator('#rules-page')).toContainText(
    'The Options page can allow such inversions'
  );
  await expect(page.locator('#rules-page')).toContainText(
    'a red X marks the previous square to which it must not return'
  );

  await page.locator('#customBackRules').click();
  await expect(page.locator('#game-page')).toBeVisible();
  await expect(page.locator('#board svg')).toBeVisible();
  await expect(page.locator('#rules-page')).toBeHidden();
});

test('returns from the about subpage through the browser back button', async ({ page }) => {
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'About…' }).click();
  await expect(page.locator('#about-page')).toBeVisible();
  await expect(page.locator('#board')).toBeHidden();

  await page.locator('#about-page').getByText('Third Party Code Licenses').click();
  await expect(
    page.locator('#about-page .ui-collapsible').last().locator('.ui-collapsible-content')
  ).toBeVisible();

  await page.goBack();
  await expect(page.locator('#game-page')).toBeVisible();
  await expect(page.locator('#board svg')).toBeVisible();
});

test('applies an option chosen on the options subpage', async ({ page }) => {
  await page.locator('#customMenu').click();
  await page.getByRole('link', { name: 'Options…' }).click();
  await expect(page.locator('#options-menu')).toBeVisible();
  await expect(page.locator('#board')).toBeHidden();
  await expect(page.locator('#options-menu')).toContainText(
    'selecting an affected checker marks its blocked previous square with a red X'
  );

  await page.locator('label[for="showalgebraicnotation"]').click();
  await expect(page.locator('#showalgebraicnotation')).toBeChecked();
  await expect(page.locator('label[for="showalgebraicnotation"]')).toHaveClass(/ui-radio-on/);

  await page.getByRole('link', { name: 'Ok' }).click();
  await expect(page.locator('#game-page')).toBeVisible();
  await page.locator('#board svg image[data-x="2"][data-y="1"]').click();
  await page.locator('#board svg rect[data-x="2"][data-y="2"]').click();
  await expect(page.locator('#board svg image').first()).toHaveAttribute('href', /board\.jpg/);
});

test('plays a human move and forces the compulsory capture in return', async ({ page }) => {
  const centre = page.locator('#board svg [data-x="2"][data-y="2"]');
  await expect(centre).toHaveJSProperty('tagName', 'rect');

  await page.locator('#board svg image[data-x="2"][data-y="1"]').click();
  await page.locator('#board svg rect[data-x="2"][data-y="2"]').click();

  await expect(page.locator('#board svg image[data-x="2"][data-y="2"]')).toHaveAttribute(
    'href',
    /light/
  );
  await expect(page.locator('#board svg image[href*="light"]')).toHaveCount(12);

  await page.locator('#board svg image[data-x="2"][data-y="3"]').click();
  await page.locator('#board svg rect[data-x="2"][data-y="1"]').click();

  await expect(page.locator('#board svg image[href*="light"]')).toHaveCount(11);
  await expect(page.locator('#board svg image[data-x="2"][data-y="1"]')).toHaveAttribute(
    'href',
    /dark/
  );
});

test('starts a new game from the sidebar', async ({ page }) => {
  await page.locator('#board svg image[data-x="2"][data-y="1"]').click();
  await page.locator('#board svg rect[data-x="2"][data-y="2"]').click();
  await expect(page.locator('#board svg image[data-x="2"][data-y="2"]')).toBeAttached();

  await page.locator('#customMenu').click();
  await page.locator('#new').click();

  await expect(page.locator('#left-panel')).toBeHidden();
  await expect(page.locator('#board svg rect[data-x="2"][data-y="2"]')).toBeAttached();
  await expect(page.locator('#board svg image[href*="light"]')).toHaveCount(12);
  await expect(page.locator('#board svg image[href*="dark"]')).toHaveCount(12);
});

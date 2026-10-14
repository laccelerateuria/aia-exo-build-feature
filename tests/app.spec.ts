import { test, expect } from '@playwright/test';
import path from 'node:path';

const SAMPLE_ZIP = path.join(__dirname, '..', 'data', 'takeout-sample.zip');

test.describe('Dashboard Google Reviews', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the page title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Analyse Google Reviews/);
    await expect(
      page.getByRole('heading', { name: /Analyse ton export Google/ }),
    ).toBeVisible();
  });

  test('shows the upload form controls', async ({ page }) => {
    await expect(page.locator('input#zip')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyser' })).toBeVisible();
  });

  test('blocks submission when no file is selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Analyser' }).click();

    // The file input is `required`, so the browser blocks submission
    // and no results section is rendered.
    await expect(page.locator('input#zip')).toHaveJSProperty('validity.valid', false);
    await expect(page.getByText('/ 5')).toHaveCount(0);
  });

  test('computes the average rating from the sample Takeout export', async ({ page }) => {
    await page.locator('input#zip').setInputFiles(SAMPLE_ZIP);
    await page.getByRole('button', { name: 'Analyser' }).click();

    const result = page.getByRole('region').or(page.locator('section')).first();
    await expect(result).toBeVisible({ timeout: 15_000 });

    // Average is rendered as a French-formatted number with one decimal, e.g. "4,3".
    await expect(page.locator('section span').first()).toHaveText(/^\d,\d$/);
    await expect(page.getByText('/ 5')).toBeVisible();
    await expect(page.getByText(/Calculée sur\s+\d+\s+avis Google/)).toBeVisible();

    const label = await page
      .locator('[aria-label^="Note moyenne"]')
      .getAttribute('aria-label');
    expect(label).toMatch(/^Note moyenne \d,\d sur 5$/);
  });
});

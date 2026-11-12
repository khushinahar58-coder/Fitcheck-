// System: a real browser drives the app the way a user would.
import { test, expect } from '@playwright/test';

test('Wardrobe > Not worn recently shows old pieces and hides recent ones', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Wardrobe' }).first().click();
  await page.getByRole('button', { name: /Not worn recently/ }).click();
  await expect(page.getByText('Wide-Leg Pants').first()).toBeVisible();   // worn exactly 30 days ago
  await expect(page.getByText('Cashmere Sweater').first()).toBeVisible(); // worn 42 days ago
  await expect(page.getByText('Silk Blouse')).toHaveCount(0);            // worn 5 days ago
});

// This was a known bug, kept visible with test.fail(): Home counted the rarely-worn pieces after
// capping the list at six, so it said "6 pieces" when 9 qualify. Fixed in HomeScreen.
test('Home > rarely-worn strip counts the 9 seed pieces worn 30+ days ago', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText("9 pieces you haven't worn in a while")).toBeVisible({ timeout: 3000 });
});

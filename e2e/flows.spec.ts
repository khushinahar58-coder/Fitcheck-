// System: the main journeys in a real browser. The forecast is stubbed so the tests do not
// depend on the weather or the network: a cold, wet day in Celsius-land terms (9°C / 3°C, 85% rain).
import { test, expect, type Page } from '@playwright/test';

const iso = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function stubForecast(page: Page) {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        daily: {
          time: Array.from({ length: 14 }, (_, i) => iso(i)),
          weather_code: Array(14).fill(63),
          temperature_2m_max: Array(14).fill(9),
          temperature_2m_min: Array(14).fill(3),
          precipitation_probability_max: Array(14).fill(85),
          wind_speed_10m_max: Array(14).fill(12),
        },
      },
    })
  );
}

test.beforeEach(async ({ page }) => {
  await stubForecast(page);
  await page.goto('/');
});

test('an occasion gives looks built from the closet, dressed for the forecast', async ({ page }) => {
  await expect(page.getByTestId('weather-strip')).toContainText('Rain · 48°F / 37°');
  await page.getByRole('button', { name: /Dinner Out/ }).click();
  await expect(page.getByRole('heading', { name: 'Your Dinner Out looks' })).toBeVisible();
  await expect(page.getByTestId('reco-weather')).toContainText('rain');
  // Cold and wet: the first look has an outer layer and says why.
  await expect(page.getByText('Outerwear', { exact: true })).toBeVisible();
  await expect(page.getByTestId('look-reason')).toContainText(/for the rain/);

  await page.getByRole('button', { name: /I'd wear this/ }).click();
  await expect(page.getByTestId('weather-card')).toContainText("Today's weather");
  await expect(page.getByTestId('weather-check')).toContainText(/suits the forecast|Rain is likely/);
});

test('the look can be shown on a 3D figure', async ({ page }) => {
  await page.getByRole('button', { name: /Work/ }).first().click();
  await page.getByRole('tab', { name: 'On a figure' }).click();
  await expect(page.getByTestId('figure-card').locator('canvas')).toBeVisible({ timeout: 15000 });
});

test('Ask FitCheck answers from the closet and plans for the day asked about', async ({ page }) => {
  await page.getByRole('button', { name: /Ask FitCheck/ }).click();
  await page.getByLabel('Ask what to wear').fill('Party tomorrow, no heels, with my leather jacket');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();

  await expect(page.getByTestId('ask-understood')).toContainText('Party');
  await expect(page.getByTestId('ask-understood')).toContainText('tomorrow');
  const turn = page.getByTestId('ask-turn');
  await expect(turn).toContainText('Leather Jacket');
  await expect(turn).not.toContainText('Black Heels');

  await turn.getByRole('button', { name: /I'd wear this/ }).click();
  await page.getByRole('button', { name: /^Plan for / }).click();
  await page.getByRole('button', { name: 'View calendar' }).click();
  const planned = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcheck-calendar') ?? '[]'));
  expect(planned).toHaveLength(1);
  expect(planned[0].date).toBe(iso(1));
});

test('Ask FitCheck says so when asked for a piece that is not in the closet', async ({ page }) => {
  await page.getByRole('button', { name: /Ask FitCheck/ }).click();
  await page.getByLabel('Ask what to wear').fill('Dinner tonight with my red sequin dress');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByTestId('ask-turn')).toContainText('I couldn\'t find "red sequin dress" in your closet');
});

test('marking a look worn can be undone', async ({ page }) => {
  await page.getByRole('button', { name: /Casual Weekend/ }).click();
  await page.getByRole('button', { name: /I'd wear this/ }).click();
  await page.getByRole('button', { name: 'Wearing this today' }).click();
  await page.getByRole('button', { name: 'View calendar' }).click();
  await page.getByRole('button', { name: 'Mark as worn' }).first().click();
  await page.getByRole('button', { name: 'Details' }).first().click();
  await expect(page.getByText('Marked as worn')).toBeVisible();
  await page.getByRole('button', { name: "I didn't wear this" }).click();
  await expect(page.getByText('Planned — not yet worn')).toBeVisible();
});

test('each profile has its own closet, and temperatures follow the unit setting', async ({ page }) => {
  await page.getByRole('button', { name: 'Profile and settings' }).click();
  await page.getByRole('button', { name: '°C' }).click();
  await page.getByRole('button', { name: 'Bakul' }).click();
  await expect(page.getByRole('heading', { name: 'Bakul' })).toBeVisible();
  await expect(page.getByTestId('weather-strip')).toContainText('9°C / 3°');

  await page.getByRole('button', { name: 'Wardrobe', exact: true }).click();
  await page.getByRole('button', { name: /^Accessories/ }).first().click();
  await expect(page.getByText('Claude Code Hat').first()).toBeVisible();
  await expect(page.getByText('Blossom Hat').first()).toBeVisible();
  await expect(page.getByText('Silk Scarf')).toHaveCount(0); // that one is in the first closet
});

test('a new profile starts empty and can be filled by typing', async ({ page }) => {
  await page.getByRole('button', { name: 'Profile and settings' }).click();
  await page.getByRole('button', { name: 'New profile' }).click();
  await page.getByLabel('Name for the new profile').fill('Tester');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Your closet is empty.')).toBeVisible();

  await page.getByRole('button', { name: /Type what you own/ }).click();
  await page.getByLabel('Your clothes').fill('white oxford shirt, dark jeans, brown chelsea boots, navy rain jacket');
  await expect(page.getByTestId('draft-piece')).toHaveCount(4);
  await page.getByRole('button', { name: /Add 4 pieces/ }).click();
  await expect(page.getByRole('heading', { name: 'Wardrobe' })).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: /Casual Weekend/ }).click();
  await expect(page.getByTestId('look-reason')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oxford Shirt + Jeans' })).toBeVisible();
});

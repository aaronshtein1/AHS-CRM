import { test, expect } from '@playwright/test';

test('Verify All Leads table rendered on live CRM app', async ({ page }) => {
  await page.goto('https://ahs-crm.vercel.app');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('admin@intakecrm.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  await page.click('#nav-leads');
  await page.waitForTimeout(2000);

  const bodyText = await page.innerText('body');
  console.log('=== ALL LEADS LIVE DOM TABLE ===\n', bodyText);
});

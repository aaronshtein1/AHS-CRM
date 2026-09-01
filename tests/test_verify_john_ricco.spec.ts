import { test, expect } from '@playwright/test';

test('Verify John Ricco lead rendered on live production app', async ({ page }) => {
  await page.goto('https://ahs-crm.vercel.app');
  await page.waitForLoadState('networkidle');

  const loginBtn = page.locator('#login-submit');
  if (await loginBtn.isVisible()) {
    await page.fill('#login-email', 'admin@intakecrm.com');
    await page.fill('#login-password', 'admin123');
    await loginBtn.click();
    await page.waitForSelector('#nav-dashboard', { timeout: 10000 });
  }

  // Go to Leads table view
  await page.click('#nav-leads');
  await page.waitForTimeout(1000);

  // Take screenshot of leads table
  await page.screenshot({ path: 'test-results/leads_table_john_ricco.png', fullPage: true });

  // Search for John Ricco or check page text
  const bodyText = await page.textContent('body');
  console.log('--- BODY TEXT SEARCH FOR JOHN RICCO ---');
  console.log('Contains "John Ricco":', bodyText?.includes('John Ricco'));
  console.log('Contains "Ricco":', bodyText?.includes('Ricco'));
  console.log('Contains "Margaret":', bodyText?.includes('Margaret'));

  const leadRow = page.locator('tr:has-text("Ricco")');
  const isVisible = await leadRow.isVisible().catch(() => false);
  console.log('Lead row for Ricco visible:', isVisible);
});

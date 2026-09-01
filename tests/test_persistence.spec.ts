import { test, expect } from '@playwright/test';

test('Verify complete entry persistence across navigation and page reloads', async ({ page }) => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://ahs-crm.vercel.app';

  // 1. Load app and login
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  const loginBtn = page.locator('#login-submit');
  if (await loginBtn.isVisible()) {
    await page.fill('#login-email', 'admin@intakecrm.com');
    await page.fill('#login-password', 'admin123');
    await loginBtn.click();
    await page.waitForSelector('#nav-dashboard', { timeout: 10000 });
  }

  // 2. Open Eleanor Vance lead detail
  await page.click('#nav-leads');
  await page.waitForTimeout(500);
  await page.click('tr:has-text("Eleanor Vance")');
  await page.waitForSelector('.lead-detail-name', { timeout: 10000 });

  // 3. Add a new timeline comment
  const uniqueComment = `Persistence Test Log - ${Date.now()}`;
  await page.click('button.tab:has-text("Timeline")');
  await page.waitForTimeout(300);
  await page.fill('#lead-comment-input', uniqueComment);
  await page.click('#lead-comment-submit');
  await page.waitForTimeout(500);

  console.log(`Submitted comment: "${uniqueComment}"`);
  await expect(page.locator('.activity-feed')).toContainText(uniqueComment);

  // 4. Hard reload the page (F5) to simulate fresh browser session
  console.log('Reloading page to test persistence...');
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Handle login if needed after reload
  if (await page.locator('#login-submit').isVisible()) {
    await page.fill('#login-email', 'admin@intakecrm.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit');
    await page.waitForSelector('#nav-dashboard', { timeout: 10000 });
  }

  // Navigate back to Eleanor Vance
  await page.click('#nav-leads');
  await page.waitForTimeout(500);
  await page.click('tr:has-text("Eleanor Vance")');
  await page.waitForSelector('.lead-detail-name', { timeout: 10000 });

  // Verify comment is STILL present after page refresh!
  await page.click('button.tab:has-text("Timeline")');
  await page.waitForTimeout(300);
  await expect(page.locator('.activity-feed')).toContainText(uniqueComment);
  console.log('✅ PERSISTENCE CONFIRMED! Comment stuck cleanly across page reload!');
});

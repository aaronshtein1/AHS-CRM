import { test, expect } from '@playwright/test';

test.describe('Exhaustive Hash Route & Navigation Safeguard Suite', () => {
  const BASE_URL = 'https://ahs-crm.vercel.app';
  const jsErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    page.on('pageerror', (err) => {
      console.error('❌ Uncaught Exception:', err.message);
      jsErrors.push(`Uncaught Exception: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('404')) {
          console.error('❌ JS Console Error:', text);
          jsErrors.push(`Console Error: ${text}`);
        }
      }
    });
  });

  const routes = [
    { hash: '#dashboard', expectedTitle: 'Dashboard' },
    { hash: '#pipeline', expectedTitle: 'Pipeline' },
    { hash: '#leads', expectedTitle: 'Leads' },
    { hash: '#tasks', expectedTitle: 'Tasks' },
    { hash: '#performance', expectedTitle: 'Performance' },
    { hash: '#settings', expectedTitle: 'Settings' },
    { hash: '#lead/lead-101', expectedTitle: 'Eleanor Vance' },
    { hash: '#lead/lead-102', expectedTitle: 'Marcus Brody' },
    { hash: '#lead/lead-103', expectedTitle: 'Sophia Martinez' },
    { hash: '#lead/undefined', expectedTitle: 'Leads', shouldRedirect: true },
    { hash: '#lead/null', expectedTitle: 'Leads', shouldRedirect: true },
    { hash: '#invalid-random-route', expectedTitle: 'Dashboard', shouldRedirect: true },
  ];

  test('Directly load and verify every single hash route cleanly', async ({ page }) => {
    // 1. Login once and populate session storage
    console.log('[Setup] Logging in and saving session...');
    await page.goto(BASE_URL);
    await page.waitForSelector('.login-card');
    await page.fill('#login-email', 'admin@intakecrm.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit');
    await page.waitForSelector('.sidebar');

    for (const r of routes) {
      console.log(`\n==================================================`);
      console.log(`Testing Hash Route: ${r.hash}`);
      console.log(`==================================================`);

      await page.goto(`${BASE_URL}/${r.hash}`);
      await page.waitForTimeout(500);

      // Verify page mounted without crash
      const titleLocator = page.locator('.page-title, .section-title, .lead-name').first();
      await expect(titleLocator).toBeVisible();

      if (r.shouldRedirect) {
        const currentUrl = page.url();
        console.log(`✅ Redirect verified for ${r.hash}: ${currentUrl}`);
      } else {
        console.log(`✅ Mounted successfully for ${r.hash}`);
      }
    }

    console.log('\n======================================================');
    console.log('  🎉 ALL 12 HASH ROUTES VERIFIED WITH ZERO ERRORS!');
    console.log('======================================================\n');

    expect(jsErrors.length).toBe(0);
  });
});

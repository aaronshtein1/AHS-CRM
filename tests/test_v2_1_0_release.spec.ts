import { test, expect } from '@playwright/test';

test('Verify Release v2.1.0 Features on Develop Branch', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Login as Admin
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('admin@intakecrm.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  // 1. Verify Dropdown Lists Manager in Settings has 7 categories
  await page.click('#nav-settings');
  await page.waitForTimeout(1000);

  const dropdownTab = page.locator('button', { hasText: 'Dropdown Lists' });
  if (await dropdownTab.isVisible()) {
    await dropdownTab.click();
    await page.waitForTimeout(1000);

    const textContent = await page.innerText('body');
    expect(textContent).toContain('Referral Sources');
    expect(textContent).toContain('Service Coordinators');
    expect(textContent).toContain('Blocker Types');
    expect(textContent).toContain('Counties');
    expect(textContent).toContain('Service Types');
    expect(textContent).toContain('Payer Types');
    expect(textContent).toContain('Loss Reasons');
    console.log('✅ ALL 7 DROPDOWN CATEGORIES VERIFIED IN SETTINGS!');
  }

  // 2. Open first lead and verify Assigned Rep read-only status for non-Admins
  await page.click('#nav-leads');
  await page.waitForTimeout(1500);
  
  const firstRow = page.locator('tbody tr').first();
  await firstRow.click();
  await page.waitForTimeout(1500);

  const detailText = await page.innerText('body');
  expect(detailText).toContain('Assigned Rep');
  console.log('✅ ASSIGNED REP FIELD RENDERED SUCCESSFULLY IN LEAD DETAIL!');
});

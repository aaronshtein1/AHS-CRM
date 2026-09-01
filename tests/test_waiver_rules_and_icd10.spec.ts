import { test, expect } from '@playwright/test';

test.describe('Top 75 ICD-10 Search, Waiver Rules & Admin Dropdown Lists Suite', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://ahs-crm.vercel.app';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const loginBtn = page.locator('#login-submit');
    if (await loginBtn.isVisible()) {
      await page.fill('#login-email', 'admin@intakecrm.com');
      await page.fill('#login-password', 'admin123');
      await loginBtn.click();
      await page.waitForSelector('#nav-dashboard', { timeout: 10000 });
    }
  });

  test('1. Verify ICD-10 Diagnosis Typeahead Search & Selection', async ({ page }) => {
    await page.click('#nav-leads');
    await page.waitForTimeout(500);
    await page.click('tr:has-text("Margaret Inglis")');
    await page.waitForSelector('.lead-detail-name', { timeout: 10000 });

    // Open Medical tab
    await page.click('button.tab:has-text("Medical")');
    await page.waitForTimeout(300);

    // Click Diagnosis field to activate typeahead search
    await page.click('text=Diagnosis');
    await page.waitForTimeout(300);

    const diagnosisInput = page.locator('input[placeholder*="Type ICD-10 code"]');
    await expect(diagnosisInput).toBeVisible();

    // Type "S06" to search TBI codes
    await diagnosisInput.fill('S06');
    await page.waitForTimeout(300);

    // Verify ICD-10 suggestions appear
    const suggestion = page.locator('.icd10-option:has-text("S06.9X0A")');
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    await page.waitForTimeout(500);

    // Verify selected diagnosis badge
    await expect(page.locator('text=[S06.9X0A]')).toBeVisible();
  });

  test('2. Verify Waiver Conditional Rules: Service Coordinator & Forced FFS Medicaid Locking', async ({ page }) => {
    await page.click('#nav-leads');
    await page.waitForTimeout(500);
    await page.click('tr:has-text("Margaret Inglis")');
    await page.waitForSelector('.lead-detail-name', { timeout: 10000 });

    // Open Contact tab
    await page.click('button.tab:has-text("Contact")');
    await page.waitForTimeout(300);

    // Select "NHTD & TBI Waiver" service type
    await page.click('text=Service Type');
    await page.waitForTimeout(200);
    await page.selectOption('select.form-select', 'NHTD & TBI');
    await page.click('button[title="Save"]');
    await page.waitForTimeout(500);

    // Verify Service Coordinator Agency secondary dropdown rendered
    await expect(page.locator('text=WAIVER PROGRAM DETAILED INTAKE')).toBeVisible();
    await expect(page.locator('text=Service Coordinator Agency')).toBeVisible();

    // Open Insurance tab and verify Payer is LOCKED to Medicaid (Fee-for-Service)
    await page.click('button.tab:has-text("Insurance")');
    await page.waitForTimeout(300);

    await expect(page.locator('text=Medicaid (Fee-for-Service) Required')).toBeVisible();
  });

  test('3. Verify Admin Dropdown List Management in Settings', async ({ page }) => {
    await page.click('#nav-settings');
    await page.waitForTimeout(500);

    // Click Dropdown Lists tab
    await page.click('button.tab:has-text("Dropdown Lists")');
    await page.waitForTimeout(300);

    await expect(page.locator('h3:has-text("Dropdown List Manager")')).toBeVisible();

    // Add a custom Referral Source
    const addInput = page.locator('input[placeholder*="Add new Referral Source"]');
    await addInput.fill('Test Columbia County Hospital');
    await page.click('button:has-text("Add Option")');
    await page.waitForTimeout(500);

    // Verify custom option is listed
    await expect(page.locator('text=Test Columbia County Hospital')).toBeVisible();
  });
});

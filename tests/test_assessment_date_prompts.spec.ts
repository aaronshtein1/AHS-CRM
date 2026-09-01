import { test, expect } from '@playwright/test';

test.describe('Assessment Date Prompt & Automated Prep/Reminder Task Suite', () => {
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

  test('Verify Date Modal Prompt, Mandatory Date Entry, Prep Task & Day-of Reminder Generation', async ({ page }) => {
    // 1. Navigate to All Leads and open Eleanor Vance
    await page.click('#nav-leads');
    await page.waitForTimeout(500);
    await page.click('tr:has-text("Eleanor Vance")');
    await page.waitForSelector('.lead-detail-name', { timeout: 10000 });

    // 2. Open Processes tab
    await page.click('button.tab:has-text("Processes")');
    await page.waitForTimeout(300);

    // 3. Verify Eleanor Vance has pre-populated Standard LTC process running with Stage 2 requiring a date
    await expect(page.locator('.stepper-step:has-text("Community Health Assessment")').first()).toBeVisible();
    await expect(page.locator('text=Date Required').first()).toBeVisible();

    // 4. Click "Advance Stage" — Stage 2 is "Community Health Assessment (CHA / UAS-NY)" which REQUIRES A DATE
    const advanceBtn = page.locator('button:has-text("Advance Stage")').first();
    await expect(advanceBtn).toBeVisible();
    await advanceBtn.click();
    await page.waitForTimeout(500);

    // 5. VERIFY ASSESSMENT DATE MODAL POPPED UP!
    const modalHeader = page.locator('h3:has-text("Schedule POC / M11q Appointment Date")');
    await expect(modalHeader).toBeVisible();

    // 6. Verify "Confirm & Advance Stage" button is DISABLED until a date is entered (Mandatory enforcement)
    const confirmBtn = page.locator('button:has-text("Confirm & Advance Stage")');
    await expect(confirmBtn).toBeDisabled();

    // 7. Select a future date (e.g. 5 days from today)
    const targetDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    await page.fill('input[type="date"]', targetDate);
    await page.waitForTimeout(200);

    // 8. Confirm button should now be ENABLED
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await page.waitForTimeout(500);

    // 9. Verify stage advanced to Stage 2 with "Scheduled:" badge
    await expect(page.locator(`text=Scheduled: ${targetDate}`).first()).toBeVisible();

    // 10. Switch to Tasks tab and verify ALL 3 TASKS were generated:
    //     - Main Stage Task
    //     - Prep Task (1 day before)
    //     - Day-of Reminder Task
    await page.click('button.tab:has-text("Tasks")');
    await page.waitForTimeout(300);

    await expect(page.locator('.task-card:has-text("Plan of Care (POC) & M.D. M11q Sign-off")').first()).toBeVisible();
    await expect(page.locator('.task-card:has-text("Prepare documents for POC / M11q Appointment Date")').first()).toBeVisible();
    await expect(page.locator('.task-card:has-text("REMINDER: POC / M11q Appointment Date scheduled today")').first()).toBeVisible();

    console.log('✅ Assessment Date Modal, Mandatory Date Enforcement, Prep Task & Reminder Task VERIFIED CLEANLY WITH PLAYWRIGHT!');
  });
});

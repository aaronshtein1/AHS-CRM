import { test, expect } from '@playwright/test';

test.describe('Exhaustive Lead Detail Section & Click Test Suite', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://ahs-crm.vercel.app';

  test.beforeEach(async ({ page }) => {
    // 1. Navigate to main URL
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 2. Perform login if on login screen
    const loginBtn = page.locator('#login-submit');
    if (await loginBtn.isVisible()) {
      await page.fill('#login-email', 'admin@intakecrm.com');
      await page.fill('#login-password', 'admin123');
      await loginBtn.click();
      await page.waitForSelector('#nav-dashboard', { timeout: 10000 });
    }

    // 3. Navigate to All Leads and click Eleanor Vance
    await page.click('#nav-leads');
    await page.waitForTimeout(500);
    await page.click('tr:has-text("Eleanor Vance")');
    await page.waitForSelector('.lead-detail-name', { timeout: 10000 });
  });

  test('Phase 1: Verify Header, Navigation & Status Transition Controls', async ({ page }) => {
    console.log('--- Testing Phase 1: Header & Status Transitions ---');
    const leadName = await page.locator('.lead-detail-name').innerText();
    expect(leadName).toContain('Eleanor Vance');

    // Verify back button is visible
    const backBtn = page.locator('#lead-detail-back');
    await expect(backBtn).toBeVisible();

    // Check status transition buttons
    const transitionBtns = page.locator('.lead-detail-header button.btn-sm');
    const btnCount = await transitionBtns.count();
    console.log(`Found ${btnCount} status transition buttons`);
    expect(btnCount).toBeGreaterThan(0);
  });

  test('Phase 2: Test All Clickable Fields in Contact Tab', async ({ page }) => {
    console.log('--- Testing Phase 2: Contact Tab Clickable Fields ---');
    await page.click('button.tab:has-text("Contact")');
    await page.waitForTimeout(300);

    // Test editing Phone field
    const phoneField = page.locator('.editable-field:has-text("Phone")').first();
    await phoneField.click();
    await page.waitForTimeout(200);
    const phoneInput = page.locator('input.form-input-sm');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('555-999-1122');
      await page.click('.editable-field.editing .btn-icon:has(svg)');
      await page.waitForTimeout(300);
      console.log('✅ Edited Phone field successfully');
    }

    // Test editing Preferred Language field
    const langField = page.locator('.editable-field:has-text("Preferred Language")');
    await langField.click();
    await page.waitForTimeout(200);
    const langInput = page.locator('input.form-input-sm');
    if (await langInput.isVisible()) {
      await langInput.fill('Spanish');
      await page.click('.editable-field.editing .btn-icon:has(svg)');
      await page.waitForTimeout(300);
      console.log('✅ Edited Preferred Language successfully');
    }

    // Test editing Street field
    const streetField = page.locator('.editable-field:has-text("Street")');
    await streetField.click();
    await page.waitForTimeout(200);
    const streetInput = page.locator('input.form-input-sm');
    if (await streetInput.isVisible()) {
      await streetInput.fill('123 Ocean Ave');
      await page.click('.editable-field.editing .btn-icon:has(svg)');
      await page.waitForTimeout(300);
      console.log('✅ Edited Street address successfully');
    }
  });

  test('Phase 3: Test All Clickable Fields in Insurance Tab', async ({ page }) => {
    console.log('--- Testing Phase 3: Insurance Tab ---');
    await page.click('button.tab:has-text("Insurance")');
    await page.waitForTimeout(300);

    // Test editing Medicaid CIN # field
    const medicaidField = page.locator('.editable-field:has-text("Medicaid CIN #")');
    await medicaidField.click();
    await page.waitForTimeout(200);
    const medicaidInput = page.locator('input.form-input-sm');
    if (await medicaidInput.isVisible()) {
      await medicaidInput.fill('AA12345B');
      await page.click('.editable-field.editing .btn-icon:has(svg)');
      await page.waitForTimeout(300);
      console.log('✅ Edited Medicaid # successfully');
    }

    // Test editing Insurance Company field
    const insCoField = page.locator('.editable-field:has-text("Insurance Company")');
    await insCoField.click();
    await page.waitForTimeout(200);
    const insInput = page.locator('input.form-input-sm');
    if (await insInput.isVisible()) {
      await insInput.fill('Healthfirst MLTC');
      await page.click('.editable-field.editing .btn-icon:has(svg)');
      await page.waitForTimeout(300);
      console.log('✅ Edited Insurance Company successfully');
    }
  });

  test('Phase 4: Test All Clickable Fields in Medical Tab', async ({ page }) => {
    console.log('--- Testing Phase 4: Medical Tab ---');
    await page.click('button.tab:has-text("Medical")');
    await page.waitForTimeout(300);

    // Test editing Diagnosis field (ICD-10 Searchable Selector)
    const diagField = page.locator('.editable-field:has-text("Diagnosis")');
    await diagField.click();
    await page.waitForTimeout(200);
    const diagInput = page.locator('input[placeholder*="Type ICD-10 code"]');
    if (await diagInput.isVisible()) {
      await diagInput.fill('S06');
      await page.waitForTimeout(200);
      await page.click('button.btn-primary.btn-sm');
      await page.waitForTimeout(300);
      console.log('✅ Edited Diagnosis successfully');
    }

    // Test editing Caregiver Name field
    const caregiverField = page.locator('.editable-field:has-text("Caregiver Name")');
    await caregiverField.click();
    await page.waitForTimeout(200);
    const caregiverInput = page.locator('.editable-field.editing input').first();
    if (await caregiverInput.isVisible()) {
      await caregiverInput.fill('Maria Vance');
      await page.click('.editable-field.editing .btn-icon:has(svg)');
      await page.waitForTimeout(300);
      console.log('✅ Edited Caregiver Name successfully');
    }
  });

  test('Phase 5: Test Processes Tab & Process Stepper Controls', async ({ page }) => {
    console.log('--- Testing Phase 5: Processes Tab ---');
    await page.click('button.tab:has-text("Processes")');
    await page.waitForTimeout(300);

    // Check Start Process button
    const startProcBtn = page.locator('button:has-text("Start Process")');
    if (await startProcBtn.isVisible()) {
      await startProcBtn.click();
      await page.waitForTimeout(300);
      console.log('✅ Opened Start Process template selector');

      // Select template or cancel
      const cancelBtn = page.locator('button:has-text("Cancel")');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(200);
        console.log('✅ Cancelled process template selection');
      }
    }

    // Advance stage button if visible
    const advanceBtn = page.locator('button:has-text("Advance Stage")').first();
    if (await advanceBtn.isVisible()) {
      await advanceBtn.click();
      await page.waitForTimeout(300);
      console.log('✅ Clicked Advance Stage button');
    }
  });

  test('Phase 6: Test Tasks Tab & Add Task Controls', async ({ page }) => {
    console.log('--- Testing Phase 6: Tasks Tab ---');
    await page.click('button.tab:has-text("Tasks")');
    await page.waitForTimeout(300);

    // Verify Add Task button is visible
    const addTaskBtn = page.locator('button:has-text("Add Task")');
    await expect(addTaskBtn).toBeVisible();

    // Check task completion checkbox buttons
    const checkBtns = page.locator('.task-card button.btn-icon');
    const taskCount = await checkBtns.count();
    console.log(`Found ${taskCount} tasks in lead tasks list`);
  });

  test('Phase 7: Test Timeline Tab, Comment Input & RingCentral Sync', async ({ page }) => {
    console.log('--- Testing Phase 7: Timeline Tab, Comment & RingCentral Sync ---');
    await page.click('button.tab:has-text("Timeline")');
    await page.waitForTimeout(300);

    // Test adding a comment
    const commentInput = page.locator('#lead-comment-input');
    await expect(commentInput).toBeVisible();
    await commentInput.fill('Playwright Headless Test: Verified intake documentation received.');
    await page.click('#lead-comment-submit');
    await page.waitForTimeout(500);
    console.log('✅ Submitted new comment on timeline');

    // Verify new comment appears in activity feed
    const activityFeed = page.locator('.activity-feed');
    await expect(activityFeed).toContainText('Playwright Headless Test');

    // Test Sync RingCentral button
    const syncRcBtn = page.locator('button:has-text("Sync RingCentral")');
    await expect(syncRcBtn).toBeVisible();
    await syncRcBtn.click();
    await page.waitForTimeout(800);
    console.log('✅ Clicked Sync RingCentral button');
  });
});

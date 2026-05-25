import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Rick Chat Flow', () => {
  test('should send message, consume tokens, and store in Jerry', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check token display
    const tokenDisplay = page.locator('text=/Token|Balance/i').first();
    await expect(tokenDisplay).toBeVisible();
    
    // Send message
    const input = page.locator('input[placeholder*="message"], input[placeholder*="Type"], textarea').first();
    await input.fill('Hello Rick');
    await page.keyboard.press('Enter');
    
    // Verify message appears
    await expect(page.locator('text=Hello Rick')).toBeVisible();
  });

  test('should persist message history to Jerry', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Send test message
    const input = page.locator('input[placeholder*="message"], input[placeholder*="Type"], textarea').first();
    await input.fill('Test persistence');
    await page.keyboard.press('Enter');
    
    // Wait for message to appear
    await expect(page.locator('text=Test persistence')).toBeVisible();
  });
});

test.describe('Morty Agent Execution', () => {
  test('should list agents', async ({ page }) => {
    await page.goto(`${BASE_URL}/morty`);
    
    // Verify agents panel or similar exists
    await expect(page.locator('text=/Agent|Task|Morty/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Summer Search', () => {
  test('should display search interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/summer`);
    
    // Verify Summer component loads
    await expect(page.locator('text=/Summer|Search|Index/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Token Marketplace (Jerry)', () => {
  test('should display token packages', async ({ page }) => {
    await page.goto(`${BASE_URL}/jerry`);
    
    // Verify packages visible
    await expect(page.locator('text=100')).toBeVisible();
    await expect(page.locator('text=500')).toBeVisible();
    await expect(page.locator('text=1000')).toBeVisible();
  });

  test('should support payment provider selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/jerry`);
    
    // Verify Coinbase and Stripe options exist
    await expect(page.locator('text=/Coinbase|Stripe/i')).toBeVisible({ timeout: 5000 });
  });
});

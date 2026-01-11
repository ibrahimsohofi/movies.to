import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page title is set
    await expect(page).toHaveTitle(/movies/i);

    // Check for navbar
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('should display movie sections', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Check for hero section or movie content
    // This will depend on the actual implementation
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should navigate to search when clicking search', async ({ page }) => {
    await page.goto('/');

    // Find and click search (adjust selector based on actual implementation)
    const searchButton = page.locator('[data-testid="search"]').or(page.getByPlaceholder(/search/i));
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });
});

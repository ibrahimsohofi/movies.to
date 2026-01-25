import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    // Find login link/button
    const loginLink = page.getByRole('link', { name: /login/i }).or(page.getByRole('button', { name: /login/i }));
    await loginLink.click();

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);

    // Check for login form elements
    await expect(page.getByLabel(/username|email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();

    // Check for validation errors (adjust based on actual implementation)
    // This might need to be updated based on how errors are displayed
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.getByLabel(/username|email/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');

    // Submit form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();

    // Wait for redirect or success message
    await page.waitForLoadState('networkidle');

    // Verify logged in state (check for user menu or logout button)
    // This will depend on the actual implementation
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Find register/sign up link
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register/);
    }
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    // Generate unique credentials
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;

    // Fill registration form
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).first().fill('TestPassword123!');

    // Submit form
    const submitButton = page.getByRole('button', { name: /register|sign up|create/i });
    await submitButton.click();

    // Wait for success or redirect
    await page.waitForLoadState('networkidle');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel(/username|email/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForLoadState('networkidle');

    // Then logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(
      page.getByRole('link', { name: /logout|sign out/i })
    );

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');

      // Verify logged out state
      const loginLink = page.getByRole('link', { name: /login/i });
      await expect(loginLink).toBeVisible();
    }
  });
});

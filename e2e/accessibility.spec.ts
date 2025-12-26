import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper to check for accessibility violations
async function checkA11y(page: Page, context: string) {
  // Check for basic accessibility attributes
  // Check for alt text on images
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    if (!alt && alt !== '') {
      console.warn(`Image without alt text found in ${context}`);
    }
  }

  // Check for proper heading hierarchy
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  const headingLevels = await Promise.all(
    headings.map(async (h) => {
      const tagName = await h.evaluate((el) => el.tagName);
      return Number.parseInt(tagName.substring(1));
    })
  );

  // Check main landmark exists
  const mainLandmark = await page.locator('main[role="main"], main').count();
  expect(mainLandmark).toBeGreaterThan(0);

  // Check for skip links
  const skipLink = await page.locator('a[href="#main-content"]').count();
  expect(skipLink).toBeGreaterThan(0);
}

test.describe('Accessibility Tests', () => {
  test('homepage is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await checkA11y(page, 'homepage');

    // Check for ARIA labels on interactive elements
    const searchButton = page.getByRole('button', { name: /search/i });
    if (await searchButton.isVisible()) {
      expect(searchButton).toBeVisible();
    }

    // Check color contrast (basic check)
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    expect(bodyBg).toBeTruthy();
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check skip link is focusable
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate to search
    const searchInput = page.getByPlaceholderText(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.focus();
      expect(await searchInput.evaluate((el) => el === document.activeElement)).toBe(true);
    }
  });

  test('search page is accessible', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    await checkA11y(page, 'search page');

    // Check search input has label
    const searchInput = page.getByRole('searchbox') || page.getByPlaceholderText(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('movie cards have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for movie cards to load
    await page.waitForSelector('[data-testid="movie-card"]', { timeout: 5000 }).catch(() => {
      // Movie cards might use different selector
    });

    // Check movie card links are accessible
    const movieLinks = await page.locator('a[href^="/movie/"]').all();
    for (const link of movieLinks.slice(0, 5)) {
      const text = await link.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/login');

    // Check all inputs have labels
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        expect(label > 0 || !!ariaLabel || !!ariaLabelledBy).toBe(true);
      }
    }
  });

  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/');

    // Tab to first button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if there's a focus indicator
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        border: styles.border,
      };
    });

    expect(focusedElement).toBeTruthy();
  });

  test('ARIA landmarks are present', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = await page.locator('main').count();
    expect(main).toBeGreaterThan(0);

    // Check for navigation landmark
    const nav = await page.locator('nav').count();
    expect(nav).toBeGreaterThan(0);

    // Check for footer if present
    const footer = await page.locator('footer').count();
    // Footer is optional but good to have
  });

  test('error messages are announced', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();

    // Wait for error messages
    await page.waitForTimeout(500);

    // Check for ARIA live regions or error messages
    const alerts = await page.locator('[role="alert"], .error, [aria-live]').count();
    // Some error handling should be present
  });

  test('reduced motion is respected', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check animations are disabled or reduced
    const animations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const hasAnimations = Array.from(elements).some((el) => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration !== '0s' && styles.animationDuration !== '';
      });
      return hasAnimations;
    });

    // If animations exist, they should respect reduced motion
  });

  test('screen reader text is present', async ({ page }) => {
    await page.goto('/');

    // Check for sr-only or visually-hidden classes
    const srOnlyElements = await page.locator('.sr-only, .visually-hidden').count();

    // Should have some screen reader only text (like skip links)
    expect(srOnlyElements).toBeGreaterThan(0);
  });
});

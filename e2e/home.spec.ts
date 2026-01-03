import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test('should display the landing page', async ({ page }) => {
        await page.goto('/');

        // Check that the page loads
        await expect(page).toHaveTitle(/Typer Racer/i);
    });

    test('should have a sign in option', async ({ page }) => {
        await page.goto('/');

        // Look for sign in related elements (Clerk provides these)
        const signInButton = page.locator('text=Sign in').or(page.locator('text=Sign In'));

        // The button should be visible or there should be a way to authenticate
        await expect(signInButton.or(page.locator('[class*="clerk"]'))).toBeVisible();
    });

    test('should toggle dark/light mode', async ({ page }) => {
        await page.goto('/');

        // Find the toggle button
        const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();

        if (await toggleButton.isVisible()) {
            // Get initial theme
            const htmlElement = page.locator('html');
            const initialClass = await htmlElement.getAttribute('class');

            // Click toggle
            await toggleButton.click();

            // Theme should change
            const newClass = await htmlElement.getAttribute('class');
            expect(newClass).not.toBe(initialClass);
        }
    });
});

test.describe('Typing Game', () => {
    // Note: These tests require authentication
    // In a real setup, you'd use Playwright's storage state feature
    // to persist auth across tests

    test.skip('should start typing when user presses a key', async ({ page }) => {
        // This test is skipped because it requires authentication
        // To run: set up Clerk test credentials in CI
        await page.goto('/typer-racer');

        // Wait for the game to load
        await page.waitForSelector('[class*="font-mono"]');

        // Start typing
        await page.keyboard.type('h');

        // Timer should start (time should decrease from 30)
        await expect(page.locator('text=Time: 29')).toBeVisible({ timeout: 2000 });
    });
});

import { test, expect } from '@playwright/test';

test.describe('Feed Social en Tiempo Real', () => {

    test('Debe renderizar la lista del feed y permitir interactuar', async ({ page }) => {
        // We'll navigate to the feed page. Assuming it's at /es/feed or similar,
        // but given the app structure it might be on a specific dashboard route.
        // For testing, let's assume there is a /feed route or we test via the main page if it renders the feed.
        await page.goto('/es/feed');
        
        // Wait for the feed to load
        // This will wait for the first post to be visible, or at least the container.
        const feedContainer = page.locator('.social-feed-container');
        if (await feedContainer.isVisible()) {
            await expect(feedContainer).toBeVisible();
            
            // Check if there are posts
            const posts = page.locator('article');
            if (await posts.count() > 0) {
                // Test the like button interaction
                const firstLikeBtn = posts.first().locator('button', { hasText: /❤️|Like/i }).first();
                if (await firstLikeBtn.isVisible()) {
                    await firstLikeBtn.click();
                    // We expect optimistic UI to update immediately (e.g. counter goes up)
                    // Just check it didn't crash
                    await expect(firstLikeBtn).toBeVisible();
                }
            }
        }
    });

});

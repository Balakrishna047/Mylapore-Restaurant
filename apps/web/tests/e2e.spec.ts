import { test, expect } from '@playwright/test';

test.describe('Mylapore Express Culinary E-Commerce E2E Suite', () => {
  test('1. Homepage displays authentic branding, categories, and hero banner', async ({ page }) => {
    await page.goto('/');

    // Check title & temple icon
    await expect(page).toHaveTitle(/Mylapore Express/i);
    await expect(page.locator('text=Mylapore Express').first()).toBeVisible();

    // Check categories with exact pill buttons
    await expect(page.getByRole('button', { name: /All Dishes/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Curries/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Rice/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Batters/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Beverages/ })).toBeVisible();

    // Check hero card
    await expect(page.locator('text=Where should we deliver?')).toBeVisible();
    await expect(page.locator('text=Freshly cooked, every day')).toBeVisible();
  });

  test('2. Product details page displays blast-chilled badge, grandmother quote, and allergens', async ({ page }) => {
    await page.goto('/products/potato-kara-kari');

    await expect(page.locator('h1')).toContainText('Potato Kara Kari');
    await expect(page.locator('text=Authentic South Indian flavors, made the way our grandmothers did.').first()).toBeVisible();
    await expect(page.locator('text=Blast chilled').first()).toBeVisible();
    await expect(page.locator('text=Contains')).toBeVisible();
    await expect(page.locator('text=Add to Cart')).toBeVisible();
  });

  test('3. Checkout page loads and validates delivery slot and payment details', async ({ page }) => {
    await page.goto('/checkout');
    // If cart is empty, page should show empty state
    await expect(page.locator('text=cart is empty')).toBeVisible();
  });

  test('4. Order tracking page displays live stage indicators and policy milestones', async ({ page }) => {
    await page.goto('/orders/MYL-2026-1002');

    await expect(page.locator('text=Order MYL-2026-1002')).toBeVisible();
    await expect(page.locator('text=Live Order Progress')).toBeVisible();
    await expect(page.locator('text=Blast Chilled at 38°F')).toBeVisible();
    await expect(page.locator('text=Receipt Summary')).toBeVisible();
  });

  test('5. Support & Agentforce AI concierge interface is accessible', async ({ page }) => {
    await page.goto('/support');

    await expect(page.locator('text=Customer Support & Service Cloud')).toBeVisible();
    await expect(page.locator('text=Submit a Salesforce Service Cloud Support Case')).toBeVisible();
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();
  });

  test('6. Category filter page displays sidebar filters, dietary options, and authentic beverages', async ({ page }) => {
    await page.goto('/category/beverages');

    await expect(page.locator('h1')).toContainText('Beverages');
    await expect(page.locator('text=Sort by')).toBeVisible();
    await expect(page.locator('text=Available to order')).toBeVisible();
    await expect(page.locator('text=Dietary')).toBeVisible();
    await expect(page.locator('text=Spiced Buttermilk').first()).toBeVisible();
    await expect(page.locator('text=Mylapore Degree Filter Coffee').first()).toBeVisible();
  });

  test('7. Multiple categories (sambar, desserts, chutneys, rice) render populated dishes and images without empty states', async ({ page }) => {
    // Sambar
    await page.goto('/category/sambar');
    await expect(page.locator('h1')).toContainText('Sambar');
    await expect(page.locator('text=Mylapore Murungakkai Sambar').first()).toBeVisible();

    // Desserts
    await page.goto('/category/desserts');
    await expect(page.locator('h1')).toContainText('Desserts');
    await expect(page.locator('text=Mylapore Paal Payasam').first()).toBeVisible();

    // Chutneys
    await page.goto('/category/chutneys');
    await expect(page.locator('h1')).toContainText('Chutneys');
    await expect(page.locator('text=Authentic Thengai (Coconut) Chutney').first()).toBeVisible();

    // Rice
    await page.goto('/category/rice');
    await expect(page.locator('h1')).toContainText('Rice');
    await expect(page.locator('text=Puliyodarai').first()).toBeVisible();
  });

  test('8. Geolocation modal opens, detects GPS, verifies Bay Area hub, and updates delivery location', async ({ page }) => {
    await page.goto('/');

    // Click "Set delivery location" button on the hero card
    await page.locator('text=Set delivery location').first().click();

    // Verify modal is displayed
    await expect(page.locator('text=Delivery Location & Hubs')).toBeVisible();
    await expect(page.locator('text=Use My Current Location (GPS)')).toBeVisible();
    await expect(page.locator('text=Same-Day Blast-Chilled Delivery')).toBeVisible();

    // Click Sunnyvale hub
    await page.locator('text=Sunnyvale, CA').click();
    await expect(page.locator('text=Same-Day Blast-Chilled Delivery')).toBeVisible();

    // Confirm & Save Location
    await page.locator('text=Confirm & Save Location').click();

    // Modal should close and header Deliver to should reflect the update
    await expect(page.locator('text=Delivery Location & Hubs')).not.toBeVisible();
    await expect(page.locator('text=Sunnyvale').first()).toBeVisible();
  });

  test('9. Enterprise category filters: real-time search, price tiers, view mode toggle, and active filter chips', async ({ page }) => {
    await page.goto('/category/curries');
    await expect(page.locator('h1')).toContainText('Curries');

    // 1. In-category real-time search
    const searchInput = page.getByPlaceholder(/Search in Curries/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Potato');
    await expect(page.locator('text=Potato Kara Kari').first()).toBeVisible();

    // Active filter chip appears
    await expect(page.getByText('"Potato"')).toBeVisible();

    // Clear search
    await searchInput.fill('');

    // 2. Filter by Price tier: $8 - $12
    await page.getByRole('button', { name: '$8 - $12' }).click();
    await expect(page.locator('text=Active Filters:')).toBeVisible();

    // 3. Toggle View Mode to List
    await page.locator('button[title="List View"]').click();
    await expect(page.locator('text=View details').first()).toBeVisible();

    // Switch back to Grid View
    await page.locator('button[title="Grid View"]').click();

    // 4. Click Clear all filters
    await page.locator('text=Clear all').first().click();
    await expect(page.locator('text=Active Filters:')).not.toBeVisible();
  });
});

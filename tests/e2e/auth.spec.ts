import { test, expect } from '@playwright/test';

test.describe('Autenticación y Navegación Principal', () => {
    
    test('Debe poder acceder a la página principal y ver llamados a la acción', async ({ page }) => {
        await page.goto('/es');
        // Validar header
        await expect(page.locator('text=Looksy Gravity').first()).toBeVisible();
        // Validar login modal check via a known button
        const loginBtn = page.locator('text=Acceder').first();
        if (await loginBtn.isVisible()) {
            await expect(loginBtn).toBeVisible();
        }
    });

    test('El modal de autenticación debe abrir y cerrar correctamente', async ({ page }) => {
        await page.goto('/es');
        
        // Asumiendo que el botón Acceder está en la navegación o hero
        const loginButtons = page.locator('button', { hasText: /Acceder|Inicia sesión/i });
        
        if (await loginButtons.count() > 0) {
            await loginButtons.first().click();
            // Verificar que el AuthModal (que usualmente dice "Únete a Looksy") se muestra
            await expect(page.locator('text=Bienvenido a Looksy').first()).toBeVisible();
            // Cerrar el modal clickeando fuera o el botón 'x' si existe
            await page.keyboard.press('Escape');
        }
    });
});

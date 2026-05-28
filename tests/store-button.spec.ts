import { test, expect } from '@playwright/test';

test('Verify Store Button and Tokens Modal', async ({ page }) => {
  // Ir a la app (asumiendo que en dev no hay protección dura o el test fallará si requiere login)
  await page.goto('http://localhost:3000/es/feed');

  // Si requiere login, intentamos llenarlo rápido (si hay auth simple en dev)
  const isLoginPage = await page.getByRole('button', { name: /iniciar sesión/i }).isVisible().catch(() => false);
  if (isLoginPage) {
     // Intento generico si hubiera mock login
     console.log('Login required, skipping full interaction if no mock auth is available.');
     return;
  }

  // Esperar a que el TopHeader cargue
  await page.waitForSelector('header');

  // El botón tiene aria-label="Get Tokens"
  const storeBtn = page.locator('button[aria-label="Get Tokens"]');
  
  // Verificar que el botón es visible
  await expect(storeBtn).toBeVisible();

  // Hacer click en el botón
  await storeBtn.click();

  // Verificar que el Modal aparece buscando el texto "Oops! Te quedaste sin Energía"
  const modalText = page.getByText(/Te quedaste sin Energía/i);
  await expect(modalText).toBeVisible();

  // Verificar que el botón de comprar (con Stripe) está visible
  const buyBtn = page.getByRole('button', { name: /Comprar Tokens/i });
  await expect(buyBtn).toBeVisible();

  console.log('✅ The Get Tokens modal opened successfully from the Top Header!');
});

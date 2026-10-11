import { expect, test } from '@playwright/test';

test.describe('Inversio', () => {
  test('muestra la pantalla de configuración', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Inversio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Empezar partida' })).toBeVisible();
  });

  test('completa una ronda con micrófono simulado', async ({ page }) => {
    await page.goto('/');

    // Configuración → empezar partida
    await page.getByRole('button', { name: 'Empezar partida' }).click();

    // Paso 1: grabar la palabra original
    await expect(
      page.getByRole('heading', { name: /graba la palabra secreta/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Grabar' }).click();
    await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Parar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Pasos 2-3: escucha limitada (3 por defecto)
    await expect(
      page.getByRole('heading', { name: /escucha la palabra al revés/i }),
    ).toBeVisible();
    await expect(page.getByText(/Escuchas restantes: 3 \/ 3/)).toBeVisible();
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Escuchar' }).click();
    }
    await expect(page.getByText(/Ya has usado todas tus escuchas/)).toBeVisible();

    // Paso 4: grabar la imitación (forzado al agotar las escuchas)
    await page.getByRole('button', { name: 'Grabar mi imitación' }).click();
    await expect(
      page.getByRole('heading', { name: /graba tu imitación/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Grabar' }).click();
    await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Parar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Paso 5: revelado del resultado final
    await expect(
      page.getByRole('heading', { name: /resultado final/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Adivinar la palabra' }).click();

    // Paso 6: adivinanza
    await expect(
      page.getByRole('heading', { name: /lo ha adivinado/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: '¡Acertó!' }).click();

    // Resultado + estadísticas
    await expect(page.getByRole('heading', { name: '¡Acierto!' })).toBeVisible();
    await page.getByRole('button', { name: 'Estadísticas' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Historial reciente')).toBeVisible();
    await expect(dialog.getByText('Aciertos')).toBeVisible();
  });
});

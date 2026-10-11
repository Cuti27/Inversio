import { expect, test } from '@playwright/test';

test.describe('Inversio', () => {
  test('muestra la pantalla de configuración', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Inversio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Empezar partida' })).toBeVisible();
  });

  test('completa una ronda, exporta el clip y registra el acierto', async ({ page }) => {
    // En headless no hay Web Share API: forzamos la ruta de descarga.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    });

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

    // Resultado + exportación del clip final
    await expect(page.getByRole('heading', { name: '¡Acierto!' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar el clip' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^inversio-\d{8}-\d{6}\.wav$/);
    await expect(page.getByText('Clip descargado ✅')).toBeVisible();

    // Estadísticas
    await page.getByRole('button', { name: 'Estadísticas' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Historial reciente')).toBeVisible();
    await expect(dialog.getByText('Aciertos')).toBeVisible();
  });
});

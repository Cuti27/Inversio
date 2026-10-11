import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useConfigStore } from '../../src/stores/config';

describe('useConfigStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('arranca con los valores por defecto', () => {
    const config = useConfigStore();
    expect(config.maxListens).toBe(3);
    expect(config.player1Name).toBe('Jugador 1');
    expect(config.player2Name).toBe('Jugador 2');
  });

  it('recorta el nº de escuchas al rango 1..10', () => {
    const config = useConfigStore();
    config.setMaxListens(99);
    expect(config.maxListens).toBe(10);
    config.setMaxListens(0);
    expect(config.maxListens).toBe(1);
    config.setMaxListens(4.6);
    expect(config.maxListens).toBe(5);
  });

  it('persiste los cambios en localStorage', async () => {
    const config = useConfigStore();
    config.setMaxListens(5);
    config.player1Name = 'Ana';
    await nextTick();

    const raw = JSON.parse(localStorage.getItem('inversio:config') ?? '{}');
    expect(raw.maxListens).toBe(5);
    expect(raw.player1Name).toBe('Ana');
  });

  it('relee la configuración guardada', () => {
    localStorage.setItem(
      'inversio:config',
      JSON.stringify({ maxListens: 7, player1Name: 'Luis', player2Name: 'Eva' }),
    );
    setActivePinia(createPinia());

    const config = useConfigStore();
    expect(config.maxListens).toBe(7);
    expect(config.player1Name).toBe('Luis');
    expect(config.player2Name).toBe('Eva');
  });

  it('ignora datos corruptos y vuelve a los valores por defecto', () => {
    localStorage.setItem('inversio:config', '{not-json');
    setActivePinia(createPinia());

    const config = useConfigStore();
    expect(config.maxListens).toBe(3);
    expect(config.player1Name).toBe('Jugador 1');
  });
});

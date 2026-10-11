import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../../src/stores/game';
import { useConfigStore } from '../../src/stores/config';
import { useStatsStore } from '../../src/stores/stats';

// El motor de audio depende de la Web Audio API (no disponible en jsdom): lo
// sustituimos por un doble que devuelve un buffer ficticio. Así probamos toda la
// máquina de estados del juego sin tocar audio real.
vi.mock('../../src/composables/useAudioEngine', () => {
  const fakeBuffer = { fake: 'buffer' } as unknown as AudioBuffer;
  return {
    useAudioEngine: () => ({
      ensureContext: vi.fn(async () => ({}) as unknown as AudioContext),
      getContext: vi.fn(() => ({}) as unknown as AudioContext),
      decode: vi.fn(async () => fakeBuffer),
      reverse: vi.fn(() => fakeBuffer),
      play: vi.fn(),
      playReversed: vi.fn(),
      stop: vi.fn(),
      isPlaying: { value: false },
    }),
  };
});

describe('useGameStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('empieza en la fase de configuración', () => {
    const game = useGameStore();
    expect(game.phase).toBe('setup');
  });

  it('permite escuchar hasta el límite y después bloquea', () => {
    const config = useConfigStore();
    config.setMaxListens(2);
    const game = useGameStore();

    game.startGame();
    expect(game.canListen).toBe(true);
    expect(game.listen()).toBe(true);
    expect(game.listen()).toBe(true);
    expect(game.listen()).toBe(false); // límite alcanzado
    expect(game.listenCount).toBe(2);
    expect(game.remainingListens).toBe(0);
    expect(game.canListen).toBe(false);
  });

  it('al grabar el original avanza a la escucha y resetea el contador', async () => {
    const game = useGameStore();
    game.startGame();
    game.listen();

    await game.setOriginal(new Blob(['original']));

    expect(game.phase).toBe('listenReversed');
    expect(game.originalBuffer).toBeTruthy();
    expect(game.reversedBuffer).toBeTruthy();
    expect(game.listenCount).toBe(0);
    expect(game.error).toBeNull();
  });

  it('al grabar la imitación avanza al revelado', async () => {
    const game = useGameStore();
    game.startGame();

    await game.setImitation(new Blob(['imitacion']));

    expect(game.phase).toBe('reveal');
    expect(game.imitationBuffer).toBeTruthy();
    expect(game.imitationReversed).toBeTruthy();
  });

  it('submitGuess registra en estadísticas y pasa al resultado', () => {
    const stats = useStatsStore();
    const game = useGameStore();

    game.startGame();
    game.submitGuess('hit');

    expect(game.phase).toBe('result');
    expect(game.result).toBe('hit');
    expect(stats.hits).toBe(1);
    expect(stats.total).toBe(1);
  });

  it('nextRound limpia la ronda y vuelve a grabar el original', async () => {
    const game = useGameStore();
    game.startGame();
    await game.setOriginal(new Blob(['original']));
    game.listen();

    game.nextRound();

    expect(game.phase).toBe('recordOriginal');
    expect(game.originalBuffer).toBeNull();
    expect(game.reversedBuffer).toBeNull();
    expect(game.listenCount).toBe(0);
    expect(game.result).toBeNull();
  });

  it('backToSetup limpia la ronda y vuelve a configuración', async () => {
    const game = useGameStore();
    game.startGame();
    await game.setOriginal(new Blob(['original']));

    game.backToSetup();

    expect(game.phase).toBe('setup');
    expect(game.reversedBuffer).toBeNull();
  });
});

import { computed, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import { useAudioEngine } from '../composables/useAudioEngine';
import { useConfigStore } from './config';
import { useStatsStore } from './stats';
import type { RoundResult } from './stats';

/**
 * Máquina de estados del juego (Pinia, setup store).
 *
 * Orquesta el flujo de las 6 fases descrito en el plan. Delega el audio en
 * `useAudioEngine`, la configuración en `config` y el marcador en `stats`.
 *
 * Los `Blob` y `AudioBuffer` se guardan en `shallowRef`: son objetos con
 * métodos nativos (los proxies reactivos de Vue romperían su comportamiento)
 * y no necesitan reactividad profunda.
 */

/** Fases del flujo de juego. */
export type Phase =
  | 'setup'
  | 'recordOriginal'
  | 'listenReversed'
  | 'recordImitation'
  | 'reveal'
  | 'guess'
  | 'result';

function describeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return 'Ha ocurrido un error inesperado con el audio.';
}

export const useGameStore = defineStore('game', () => {
  const config = useConfigStore();
  const stats = useStatsStore();
  const engine = useAudioEngine();

  const phase = ref<Phase>('setup');
  const listenCount = ref<number>(0);

  const originalBlob = shallowRef<Blob | null>(null);
  const imitationBlob = shallowRef<Blob | null>(null);
  const originalBuffer = shallowRef<AudioBuffer | null>(null);
  const reversedBuffer = shallowRef<AudioBuffer | null>(null);
  const imitationBuffer = shallowRef<AudioBuffer | null>(null);
  const imitationReversed = shallowRef<AudioBuffer | null>(null);

  const result = ref<RoundResult | null>(null);
  const busy = ref<boolean>(false);
  const error = ref<string | null>(null);

  /** ¿Quedan escuchas disponibles en esta ronda? */
  const canListen = computed<boolean>(() => listenCount.value < config.maxListens);

  /** Escuchas restantes (nunca negativo). */
  const remainingListens = computed<number>(() =>
    Math.max(0, config.maxListens - listenCount.value),
  );

  /** Limpia los datos de la ronda en curso (blobs, buffers y contadores). */
  function clearRound(): void {
    originalBlob.value = null;
    imitationBlob.value = null;
    originalBuffer.value = null;
    reversedBuffer.value = null;
    imitationBuffer.value = null;
    imitationReversed.value = null;
    listenCount.value = 0;
    result.value = null;
    error.value = null;
  }

  /** Arranca una partida desde cero en la fase de grabación original. */
  function startGame(): void {
    clearRound();
    phase.value = 'recordOriginal';
  }

  /** Decodifica e invierte la grabación del Jugador 1. */
  async function setOriginal(blob: Blob): Promise<void> {
    busy.value = true;
    error.value = null;
    try {
      originalBlob.value = blob;
      const buffer = await engine.decode(blob);
      originalBuffer.value = buffer;
      reversedBuffer.value = engine.reverse(buffer);
      listenCount.value = 0;
      phase.value = 'listenReversed';
    } catch (err) {
      error.value = describeError(err);
    } finally {
      busy.value = false;
    }
  }

  /**
   * Registra una escucha si queda alguna disponible.
   * Devuelve `true` si se contabilizó, `false` si ya se alcanzó el límite.
   */
  function listen(): boolean {
    if (!canListen.value) {
      return false;
    }
    listenCount.value += 1;
    return true;
  }

  /** Pasa a la fase de grabación de la imitación. */
  function goToImitation(): void {
    phase.value = 'recordImitation';
  }

  /** Decodifica e invierte la imitación del Jugador 2. */
  async function setImitation(blob: Blob): Promise<void> {
    busy.value = true;
    error.value = null;
    try {
      imitationBlob.value = blob;
      const buffer = await engine.decode(blob);
      imitationBuffer.value = buffer;
      imitationReversed.value = engine.reverse(buffer);
      phase.value = 'reveal';
    } catch (err) {
      error.value = describeError(err);
    } finally {
      busy.value = false;
    }
  }

  /** Pasa a la fase de adivinanza. */
  function goToGuess(): void {
    phase.value = 'guess';
  }

  /** Guarda el resultado de la ronda y lo registra en las estadísticas. */
  function submitGuess(r: RoundResult): void {
    result.value = r;
    stats.recordResult(r);
    phase.value = 'result';
  }

  /** Prepara una nueva ronda manteniendo la configuración. */
  function nextRound(): void {
    clearRound();
    phase.value = 'recordOriginal';
  }

  /** Vuelve a la pantalla de configuración. */
  function backToSetup(): void {
    clearRound();
    phase.value = 'setup';
  }

  return {
    phase,
    listenCount,
    originalBlob,
    imitationBlob,
    originalBuffer,
    reversedBuffer,
    imitationBuffer,
    imitationReversed,
    result,
    busy,
    error,
    canListen,
    remainingListens,
    startGame,
    setOriginal,
    listen,
    goToImitation,
    setImitation,
    goToGuess,
    submitGuess,
    nextRound,
    backToSetup,
  };
});

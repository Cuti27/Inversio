import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

/**
 * Configuración del juego persistida en `localStorage`.
 *
 * Se guarda bajo la clave `inversio:config` y se relee al arrancar la app.
 * Cualquier contenido inválido se descarta y se vuelve a los valores por
 * defecto, de forma que un `localStorage` corrupto nunca rompa la aplicación.
 */

const STORAGE_KEY = 'inversio:config';

const DEFAULT_MAX_LISTENS = 3;
const MIN_LISTENS = 1;
const MAX_LISTENS = 10;
const DEFAULT_PLAYER_1 = 'Jugador 1';
const DEFAULT_PLAYER_2 = 'Jugador 2';

interface PersistedConfig {
  maxListens: number;
  player1Name: string;
  player2Name: string;
}

/** Ajusta el nº de escuchas al rango permitido (1..10). */
function clampMaxListens(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_LISTENS;
  }
  return Math.min(MAX_LISTENS, Math.max(MIN_LISTENS, Math.round(value)));
}

function defaults(): PersistedConfig {
  return {
    maxListens: DEFAULT_MAX_LISTENS,
    player1Name: DEFAULT_PLAYER_1,
    player2Name: DEFAULT_PLAYER_2,
  };
}

/** Lee y valida la configuración guardada; ante cualquier problema, defaults. */
function loadConfig(): PersistedConfig {
  const fallback = defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return fallback;
    }

    const record = parsed as Partial<Record<keyof PersistedConfig, unknown>>;

    return {
      maxListens:
        typeof record.maxListens === 'number'
          ? clampMaxListens(record.maxListens)
          : fallback.maxListens,
      player1Name:
        typeof record.player1Name === 'string' && record.player1Name.trim() !== ''
          ? record.player1Name
          : fallback.player1Name,
      player2Name:
        typeof record.player2Name === 'string' && record.player2Name.trim() !== ''
          ? record.player2Name
          : fallback.player2Name,
    };
  } catch {
    return fallback;
  }
}

export const useConfigStore = defineStore('config', () => {
  const initial = loadConfig();

  const maxListens = ref<number>(initial.maxListens);
  const player1Name = ref<string>(initial.player1Name);
  const player2Name = ref<string>(initial.player2Name);

  /** Persiste el estado actual, ignorando fallos de almacenamiento. */
  function persist(): void {
    try {
      const data: PersistedConfig = {
        maxListens: maxListens.value,
        player1Name: player1Name.value,
        player2Name: player2Name.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // `localStorage` puede no estar disponible (modo privado, cuota); no es crítico.
    }
  }

  watch([maxListens, player1Name, player2Name], persist);

  /** Fija el nº de escuchas, recortándolo siempre al rango 1..10. */
  function setMaxListens(n: number): void {
    maxListens.value = clampMaxListens(n);
  }

  /** Restaura todos los valores por defecto. */
  function reset(): void {
    maxListens.value = DEFAULT_MAX_LISTENS;
    player1Name.value = DEFAULT_PLAYER_1;
    player2Name.value = DEFAULT_PLAYER_2;
  }

  return {
    maxListens,
    player1Name,
    player2Name,
    setMaxListens,
    reset,
  };
});

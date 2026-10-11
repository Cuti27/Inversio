import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

/**
 * Estadísticas de partidas persistidas en `localStorage` (clave `inversio:stats`).
 *
 * Igual que la configuración, tolera datos corruptos: si el JSON no es válido
 * se parte de cero en lugar de lanzar.
 */

const STORAGE_KEY = 'inversio:stats';

/** Resultado de una ronda: acierto o fallo. */
export type RoundResult = 'hit' | 'miss';

export interface HistoryEntry {
  ts: number;
  result: RoundResult;
}

interface PersistedStats {
  hits: number;
  misses: number;
  history: HistoryEntry[];
}

function emptyStats(): PersistedStats {
  return { hits: 0, misses: 0, history: [] };
}

function isRoundResult(value: unknown): value is RoundResult {
  return value === 'hit' || value === 'miss';
}

/** Normaliza un entero no negativo, o `0` si no es válido. */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function loadStats(): PersistedStats {
  const fallback = emptyStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return fallback;
    }

    const record = parsed as Partial<Record<keyof PersistedStats, unknown>>;

    const history: HistoryEntry[] = Array.isArray(record.history)
      ? record.history.flatMap((entry): HistoryEntry[] => {
          if (typeof entry !== 'object' || entry === null) {
            return [];
          }
          const item = entry as Partial<Record<keyof HistoryEntry, unknown>>;
          if (!isRoundResult(item.result) || typeof item.ts !== 'number') {
            return [];
          }
          return [{ ts: item.ts, result: item.result }];
        })
      : [];

    return {
      hits: toCount(record.hits),
      misses: toCount(record.misses),
      history,
    };
  } catch {
    return fallback;
  }
}

export const useStatsStore = defineStore('stats', () => {
  const initial = loadStats();

  const hits = ref<number>(initial.hits);
  const misses = ref<number>(initial.misses);
  const history = ref<HistoryEntry[]>(initial.history);

  const total = computed<number>(() => hits.value + misses.value);

  /** Tasa de acierto como número entre 0 y 1 (0 si no hay rondas). */
  const accuracy = computed<number>(() => (total.value ? hits.value / total.value : 0));

  function persist(): void {
    try {
      const data: PersistedStats = {
        hits: hits.value,
        misses: misses.value,
        history: history.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Almacenamiento no disponible: se mantiene solo en memoria.
    }
  }

  watch([hits, misses, history], persist, { deep: true });

  /** Registra el resultado de una ronda en el marcador y el historial. */
  function recordResult(result: RoundResult): void {
    if (result === 'hit') {
      hits.value += 1;
    } else {
      misses.value += 1;
    }
    history.value.push({ ts: Date.now(), result });
  }

  /** Vacía el marcador y el historial. */
  function reset(): void {
    hits.value = 0;
    misses.value = 0;
    history.value = [];
  }

  return {
    hits,
    misses,
    history,
    total,
    accuracy,
    recordResult,
    reset,
  };
});

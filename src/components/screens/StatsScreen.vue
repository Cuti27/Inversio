<script setup lang="ts">
import { computed } from 'vue';
import { useStatsStore } from '../../stores/stats';
import type { HistoryEntry } from '../../stores/stats';

const stats = useStatsStore();

const emit = defineEmits<{
  close: [];
}>();

const accuracyPercent = computed<number>(() => Math.round(stats.accuracy * 100));

/** Las 10 rondas más recientes, de la más nueva a la más antigua. */
const recent = computed<HistoryEntry[]>(() =>
  stats.history.slice(-10).reverse(),
);

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('es-ES');
}

function resetStats(): void {
  if (window.confirm('¿Seguro que quieres reiniciar todas las estadísticas?')) {
    stats.reset();
  }
}
</script>

<template>
  <section class="overlay" role="dialog" aria-modal="true" aria-label="Estadísticas">
    <div class="panel card stack">
      <header class="panel-header">
        <h2>Estadísticas</h2>
        <button
          class="btn btn-sm btn-ghost"
          type="button"
          aria-label="Cerrar estadísticas"
          @click="emit('close')"
        >
          Cerrar
        </button>
      </header>

      <div class="score">
        <div class="score-item">
          <span class="score-value">{{ stats.total }}</span>
          <span class="score-label">Partidas</span>
        </div>
        <div class="score-item">
          <span class="score-value">{{ stats.hits }}</span>
          <span class="score-label">Aciertos</span>
        </div>
        <div class="score-item">
          <span class="score-value">{{ stats.misses }}</span>
          <span class="score-label">Fallos</span>
        </div>
        <div class="score-item">
          <span class="score-value">{{ accuracyPercent }}%</span>
          <span class="score-label">Acierto</span>
        </div>
      </div>

      <div class="history">
        <h3>Historial reciente</h3>
        <p v-if="recent.length === 0" class="muted text-center">
          Todavía no hay partidas registradas.
        </p>
        <ul v-else class="history-list">
          <li v-for="entry in recent" :key="entry.ts" class="history-item">
            <span :class="entry.result === 'hit' ? 'tag-hit' : 'tag-miss'">
              {{ entry.result === 'hit' ? 'Acierto' : 'Fallo' }}
            </span>
            <span class="muted history-date">{{ formatDate(entry.ts) }}</span>
          </li>
        </ul>
      </div>

      <button class="btn btn-ghost" type="button" @click="resetStats">
        Reiniciar estadísticas
      </button>
    </div>
  </section>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.panel {
  width: 100%;
  max-width: 520px;
  margin-top: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.panel-header h2 {
  margin: 0;
}

.score {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.score-value {
  font-size: 1.4rem;
  font-weight: 700;
}

.score-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.history h3 {
  margin: 0 0 0.5rem;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 40vh;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.history-date {
  font-size: 0.8rem;
}

.tag-hit,
.tag-miss {
  font-weight: 700;
  font-size: 0.85rem;
}

.tag-hit {
  color: var(--success);
}
.tag-miss {
  color: var(--danger);
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useAudioEngine } from '../../composables/useAudioEngine';
import { useGameStore } from '../../stores/game';
import { useStatsStore } from '../../stores/stats';

const game = useGameStore();
const stats = useStatsStore();
const { play, isPlaying } = useAudioEngine();

const emit = defineEmits<{
  'open-stats': [];
}>();

const isHit = computed<boolean>(() => game.result === 'hit');

const accuracyPercent = computed<number>(() => Math.round(stats.accuracy * 100));

const hasFinal = computed<boolean>(() => game.imitationReversed !== null);

function playFinal(): void {
  const buffer = game.imitationReversed;
  if (buffer) {
    play(buffer);
  }
}
</script>

<template>
  <main class="screen">
    <header class="screen-header">
      <p class="eyebrow">Resultado de la ronda</p>
      <h1 :class="isHit ? 'hit' : 'miss'">{{ isHit ? '¡Acierto!' : 'Fallo' }}</h1>
      <p class="muted">
        {{ isHit ? 'Han desenredado la palabra.' : 'Esta vez no ha salido.' }}
      </p>
    </header>

    <section class="card stack">
      <h3 class="text-center">Marcador acumulado</h3>
      <div class="score" aria-live="polite">
        <div class="score-item">
          <span class="score-value">{{ stats.total }}</span>
          <span class="score-label">Jugadas</span>
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

      <button
        class="btn btn-ghost"
        type="button"
        :disabled="!hasFinal || isPlaying"
        @click="playFinal"
      >
        {{ isPlaying ? 'Reproduciendo…' : 'Reproducir el resultado de nuevo' }}
      </button>
    </section>

    <div class="spacer" />

    <div class="stack">
      <button class="btn btn-primary" type="button" @click="game.nextRound()">Otra ronda</button>
      <div class="row">
        <button class="btn btn-ghost" type="button" @click="emit('open-stats')">
          Estadísticas
        </button>
        <button class="btn btn-ghost" type="button" @click="game.backToSetup()">
          Configuración
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.hit {
  color: var(--success);
}
.miss {
  color: var(--danger);
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
  font-size: 1.5rem;
  font-weight: 700;
}

.score-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>

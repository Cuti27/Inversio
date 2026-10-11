<script setup lang="ts">
import { useConfigStore } from '../../stores/config';
import { useGameStore } from '../../stores/game';

const config = useConfigStore();
const game = useGameStore();

const emit = defineEmits<{
  'open-stats': [];
}>();

/** Ajusta el nº de escuchas dentro del rango permitido (1..5). */
function changeListens(delta: number): void {
  const next = Math.min(5, Math.max(1, config.maxListens + delta));
  config.setMaxListens(next);
}

function startGame(): void {
  game.startGame();
}
</script>

<template>
  <main class="screen">
    <header class="screen-header">
      <p class="eyebrow">Juego de fiesta</p>
      <h1>Inversio</h1>
      <p class="muted">
        Uno graba una palabra en secreto, el otro la escucha al revés y la imita.
        Al dar la vuelta a la imitación… ¡a ver qué sale!
      </p>
    </header>

    <section class="card stack">
      <div class="field">
        <label for="player1">Jugador 1 (graba la palabra)</label>
        <input
          id="player1"
          v-model="config.player1Name"
          type="text"
          maxlength="24"
          autocomplete="off"
          placeholder="Jugador 1"
        />
      </div>

      <div class="field">
        <label for="player2">Jugador 2 (escucha e imita)</label>
        <input
          id="player2"
          v-model="config.player2Name"
          type="text"
          maxlength="24"
          autocomplete="off"
          placeholder="Jugador 2"
        />
      </div>

      <div class="field">
        <label for="listens">Número de escuchas</label>
        <div class="stepper" role="group" aria-label="Número de escuchas">
          <button
            class="btn btn-sm btn-ghost"
            type="button"
            aria-label="Quitar una escucha"
            :disabled="config.maxListens <= 1"
            @click="changeListens(-1)"
          >
            −
          </button>
          <span id="listens" class="stepper-value" aria-live="polite">{{ config.maxListens }}</span>
          <button
            class="btn btn-sm btn-ghost"
            type="button"
            aria-label="Añadir una escucha"
            :disabled="config.maxListens >= 5"
            @click="changeListens(1)"
          >
            +
          </button>
        </div>
        <p class="muted small">Cuántas veces puede escuchar la versión invertida el Jugador 2.</p>
      </div>
    </section>

    <div class="spacer" />

    <div class="stack">
      <button class="btn btn-primary" type="button" @click="startGame">Empezar partida</button>
      <button class="btn btn-ghost" type="button" @click="emit('open-stats')">
        Estadísticas
      </button>
    </div>
  </main>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.stepper-value {
  font-size: 1.4rem;
  font-weight: 700;
  min-width: 2ch;
  text-align: center;
}

.small {
  font-size: 0.8rem;
  margin: 0;
}
</style>

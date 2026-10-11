<script setup lang="ts">
import { computed } from 'vue';
import { useAudioEngine } from '../../composables/useAudioEngine';
import { useGameStore } from '../../stores/game';

const game = useGameStore();
const { play, isPlaying } = useAudioEngine();

const hasFinal = computed<boolean>(() => game.imitationReversed !== null);
const hasOriginal = computed<boolean>(() => game.originalBuffer !== null);
const hasReversedOriginal = computed<boolean>(() => game.reversedBuffer !== null);

function playFinal(): void {
  const buffer = game.imitationReversed;
  if (buffer) {
    play(buffer);
  }
}

function playOriginal(): void {
  const buffer = game.originalBuffer;
  if (buffer) {
    play(buffer);
  }
}

function playReversedOriginal(): void {
  const buffer = game.reversedBuffer;
  if (buffer) {
    play(buffer);
  }
}
</script>

<template>
  <main class="screen">
    <header class="screen-header">
      <p class="eyebrow">Paso 5 de 6</p>
      <h2>El resultado final</h2>
      <p class="muted">Ahora ponemos TU imitación del revés. Escucha el resultado.</p>
    </header>

    <section class="card stack">
      <button
        class="btn btn-primary"
        type="button"
        :disabled="!hasFinal || isPlaying"
        @click="playFinal"
      >
        {{ isPlaying ? 'Reproduciendo…' : 'Reproducir resultado final' }}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        :disabled="!hasOriginal || isPlaying"
        @click="playOriginal"
      >
        Comparar con el original
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        :disabled="!hasReversedOriginal || isPlaying"
        @click="playReversedOriginal"
      >
        Escuchar el original al revés
      </button>
    </section>

    <div class="spacer" />

    <button class="btn btn-primary" type="button" @click="game.goToGuess()">
      Adivinar la palabra
    </button>
  </main>
</template>

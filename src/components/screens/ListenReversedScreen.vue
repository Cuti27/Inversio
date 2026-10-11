<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAudioEngine } from '../../composables/useAudioEngine';
import { useConfigStore } from '../../stores/config';
import { useGameStore } from '../../stores/game';

const config = useConfigStore();
const game = useGameStore();
const { play, isPlaying } = useAudioEngine();

/** ¿Hay audio invertido disponible para reproducir? */
const hasReversed = computed<boolean>(() => game.reversedBuffer !== null);

/** Marca la primera reproducción: el audio del navegador ya está desbloqueado. */
const unlocked = ref(false);

function handleListen(): void {
  if (!game.canListen) {
    return;
  }
  const buffer = game.reversedBuffer;
  if (!buffer) {
    return;
  }
  play(buffer);
  game.listen();
  unlocked.value = true;
}

function goToImitation(): void {
  game.goToImitation();
}
</script>

<template>
  <main class="screen">
    <header class="screen-header">
      <p class="eyebrow">Pasos 2 y 3 de 6</p>
      <h2>Escucha la palabra al revés</h2>
      <p class="muted">
        Turno de <strong>{{ config.player2Name }}</strong>: escucha la palabra al revés. Tienes
        {{ config.maxListens }} escuchas.
      </p>
    </header>

    <section class="card stack">
      <p class="text-center">
        <span class="pill" aria-live="polite">
          Escuchas restantes: {{ game.remainingListens }} / {{ config.maxListens }}
        </span>
      </p>

      <button
        class="btn btn-primary"
        type="button"
        :disabled="!hasReversed || !game.canListen || isPlaying"
        @click="handleListen"
      >
        {{ isPlaying ? 'Reproduciendo…' : 'Escuchar' }}
      </button>

      <p v-if="!unlocked" class="muted text-center note">
        Pulsa «Escuchar» para desbloquear el audio del navegador.
      </p>

      <p v-if="!game.canListen" class="warning text-center" role="status">
        Ya has usado todas tus escuchas.
      </p>

      <button v-if="!game.canListen" class="btn btn-primary" type="button" @click="goToImitation">
        Grabar mi imitación
      </button>

      <button
        v-else
        class="btn btn-ghost"
        type="button"
        @click="goToImitation"
      >
        Ya lo tengo, grabar
      </button>
    </section>
  </main>
</template>

<style scoped>
.note {
  margin: 0;
  font-size: 0.85rem;
}

.warning {
  margin: 0;
  color: var(--warning);
  font-weight: 600;
}
</style>

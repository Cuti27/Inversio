<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Component } from 'vue';
import { useAudioEngine } from './composables/useAudioEngine';
import { useGameStore } from './stores/game';
import type { Phase } from './stores/game';

import InstallPwaButton from './components/InstallPwaButton.vue';
import SetupScreen from './components/screens/SetupScreen.vue';
import RecordOriginalScreen from './components/screens/RecordOriginalScreen.vue';
import ListenReversedScreen from './components/screens/ListenReversedScreen.vue';
import RecordImitationScreen from './components/screens/RecordImitationScreen.vue';
import RevealScreen from './components/screens/RevealScreen.vue';
import GuessScreen from './components/screens/GuessScreen.vue';
import ResultScreen from './components/screens/ResultScreen.vue';
import StatsScreen from './components/screens/StatsScreen.vue';

const game = useGameStore();
const engine = useAudioEngine();

/** Mapeo fase -> componente de pantalla. */
const screens: Record<Phase, Component> = {
  setup: SetupScreen,
  recordOriginal: RecordOriginalScreen,
  listenReversed: ListenReversedScreen,
  recordImitation: RecordImitationScreen,
  reveal: RevealScreen,
  guess: GuessScreen,
  result: ResultScreen,
};

const statsOpen = ref(false);

function showStats(): void {
  statsOpen.value = true;
}

function closeStats(): void {
  statsOpen.value = false;
}

onMounted(() => {
  // "Calienta" el AudioContext en el primer gesto del usuario (política de
  // autoplay). El listener se elimina a sí mismo tras el primer `pointerdown`.
  const unlock = (): void => {
    void engine.ensureContext();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
});
</script>

<template>
  <header class="app-header">
    <span class="brand">Inversio</span>
  </header>

  <Transition name="fade" mode="out-in">
    <component :is="screens[game.phase]" :key="game.phase" @open-stats="showStats" />
  </Transition>

  <Transition name="fade">
    <StatsScreen v-if="statsOpen" @close="closeStats" />
  </Transition>

  <InstallPwaButton />
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0 0;
}

.brand {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-muted);
}
</style>

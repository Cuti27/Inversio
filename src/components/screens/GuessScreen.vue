<script setup lang="ts">
import { useConfigStore } from '../../stores/config';
import { useGameStore } from '../../stores/game';

const config = useConfigStore();
const game = useGameStore();

function answer(result: 'hit' | 'miss'): void {
  game.submitGuess(result);
}
</script>

<template>
  <main class="screen">
    <header class="screen-header">
      <p class="eyebrow">Paso 6 de 6</p>
      <h1>¿Lo ha adivinado?</h1>
      <p class="muted">
        ¿<strong>{{ config.player2Name }}</strong> ha acertado la palabra original que grabó
        <strong>{{ config.player1Name }}</strong>?
      </p>
    </header>

    <div class="spacer" />

    <div class="stack">
      <button class="btn btn-success" type="button" @click="answer('hit')">¡Acertó!</button>
      <button class="btn btn-danger" type="button" @click="answer('miss')">Falló</button>
    </div>
  </main>
</template>

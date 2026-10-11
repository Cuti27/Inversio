<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import AudioLevel from '../AudioLevel.vue';
import { useAudioLevel } from '../../composables/useAudioLevel';
import { useAudioRecorder } from '../../composables/useAudioRecorder';
import { useConfigStore } from '../../stores/config';
import { useGameStore } from '../../stores/game';

const config = useConfigStore();
const game = useGameStore();

const {
  isRecording,
  error: recorderError,
  stream,
  start: startRecording,
  stop: stopRecording,
  cancel: cancelRecording,
} = useAudioRecorder();

const { level, start: startLevel, stop: stopLevel } = useAudioLevel();

const recordedBlob = ref<Blob | null>(null);
const elapsed = ref(0);
let timerId: number | null = null;

const hasRecording = computed<boolean>(() => recordedBlob.value !== null);

const formattedElapsed = computed<string>(() => {
  const minutes = Math.floor(elapsed.value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsed.value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

function stopTimer(): void {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function startTimer(): void {
  stopTimer();
  elapsed.value = 0;
  timerId = window.setInterval(() => {
    elapsed.value += 1;
  }, 1000);
}

async function handleStart(): Promise<void> {
  recordedBlob.value = null;
  elapsed.value = 0;
  await startRecording();
  if (recorderError.value || !stream.value) {
    return;
  }
  startLevel(stream.value);
  startTimer();
}

async function handleStop(): Promise<void> {
  stopLevel();
  stopTimer();
  recordedBlob.value = await stopRecording();
}

function handleRetry(): void {
  stopLevel();
  stopTimer();
  recordedBlob.value = null;
  elapsed.value = 0;
}

async function handleContinue(): Promise<void> {
  const blob = recordedBlob.value;
  if (!blob) {
    return;
  }
  await game.setOriginal(blob);
}

onBeforeUnmount(() => {
  stopTimer();
  stopLevel();
  cancelRecording();
});
</script>

<template>
  <main class="screen">
    <header class="screen-header">
      <p class="eyebrow">Paso 1 de 6</p>
      <h2>Graba la palabra secreta</h2>
      <p class="muted">
        Turno de <strong>{{ config.player1Name }}</strong>: graba una palabra o frase corta.
        Que <strong>{{ config.player2Name }}</strong> NO mire la pantalla.
      </p>
    </header>

    <section class="card stack">
      <template v-if="isRecording">
        <p class="text-center">
          <span class="pill" aria-live="polite">● Grabando… {{ formattedElapsed }}</span>
        </p>
        <AudioLevel :level="level" />
        <button class="btn btn-danger" type="button" @click="handleStop">Parar</button>
      </template>

      <template v-else-if="hasRecording">
        <p class="text-center muted">Grabación lista. ¿La usamos o la repetimos?</p>
        <div class="row">
          <button class="btn btn-ghost" type="button" :disabled="game.busy" @click="handleRetry">
            Repetir
          </button>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="game.busy"
            @click="handleContinue"
          >
            {{ game.busy ? 'Procesando…' : 'Continuar' }}
          </button>
        </div>
      </template>

      <template v-else>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="game.busy"
          aria-label="Empezar a grabar"
          @click="handleStart"
        >
          <span class="record-dot" aria-hidden="true" />
          Grabar
        </button>
      </template>

      <p v-if="recorderError" class="error" role="alert">{{ recorderError }}</p>
      <p v-if="game.error" class="error" role="alert">{{ game.error }}</p>
    </section>
  </main>
</template>

<style scoped>
.record-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: var(--danger);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 0.9rem;
  text-align: center;
}
</style>

<script setup lang="ts">
/**
 * Barra horizontal que visualiza el nivel de entrada del micrófono (0..1).
 * El ancho del relleno crece de forma proporcional al nivel recibido.
 */
defineProps<{
  level: number;
}>();
</script>

<template>
  <div
    class="audio-level"
    role="meter"
    aria-label="Nivel de entrada del micrófono"
    :aria-valuenow="Math.round(level * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="audio-level-fill" :style="{ width: `${Math.round(level * 100)}%` }" />
  </div>
</template>

<style scoped>
.audio-level {
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  overflow: hidden;
}

.audio-level-fill {
  height: 100%;
  min-width: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--success), var(--accent), var(--danger));
  transition: width 0.08s linear;
}
</style>

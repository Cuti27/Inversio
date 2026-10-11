<script setup lang="ts">
import { computed } from 'vue';
import { useInstallPrompt } from '../composables/useInstallPrompt';

const {
  isStandalone,
  isIos,
  canInstallNatively,
  showIosInstructions,
  promptInstall,
  openIosInstructions,
  closeIosInstructions,
} = useInstallPrompt();

/**
 * Solo mostramos el botón si la app NO está instalada y existe una vía real de
 * instalación: prompt nativo (Chromium) o instrucciones manuales (iOS). Así
 * evitamos botones "muertos" en navegadores que no ofrecen ninguna.
 */
const visible = computed<boolean>(
  () => !isStandalone.value && (canInstallNatively.value || isIos),
);

async function handleClick(): Promise<void> {
  if (canInstallNatively.value) {
    await promptInstall();
    return;
  }
  if (isIos) {
    openIosInstructions();
  }
}
</script>

<template>
  <button
    v-if="visible"
    class="install-button"
    type="button"
    aria-label="Instalar aplicación"
    @click="handleClick"
  >
    <svg
      class="install-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 3a1 1 0 0 1 1 1v9.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.586V4a1 1 0 0 1 1-1Z"
      />
      <path
        fill="currentColor"
        d="M5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z"
      />
    </svg>
    <span>Instalar</span>
  </button>

  <div
    v-if="showIosInstructions"
    class="ios-sheet"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ios-install-title"
  >
    <div class="ios-sheet-card card stack">
      <h3 id="ios-install-title">Instalar en iOS</h3>
      <p class="muted">
        Toca el botón <strong>Compartir</strong> y luego
        <strong>«Añadir a pantalla de inicio»</strong>.
      </p>
      <button class="btn btn-primary" type="button" @click="closeIosInstructions">
        Entendido
      </button>
    </div>
  </div>
</template>

<style scoped>
.install-button {
  position: fixed;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-contrast);
  background: linear-gradient(180deg, var(--accent), var(--accent-strong));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: var(--shadow);
}

.install-icon {
  display: block;
}

/* La hoja de ayuda queda por encima del botón (z-index mayor). */
.ios-sheet {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.ios-sheet-card {
  width: 100%;
  max-width: 420px;
  margin: 0;
}
</style>

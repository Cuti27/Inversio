import { getCurrentScope, onScopeDispose, ref } from 'vue';

/**
 * Evento no estándar de instalación de PWA. Solo lo emiten navegadores basados
 * en Chromium (Chrome/Edge/Android). No está en el lib.dom de TypeScript, así
 * que se declara aquí con el mínimo necesario.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/** iOS Safari expone `navigator.standalone` fuera del estándar. */
interface IosNavigator extends Navigator {
  standalone?: boolean;
}

const STANDALONE_QUERY = '(display-mode: standalone)';

// Estado compartido a nivel de módulo: el composable puede instanciarse desde
// varios sitios sin duplicar listeners ni perder el evento capturado.
const isStandalone = ref(false);
const canInstallNatively = ref(false);
const showIosInstructions = ref(false);

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let displayModeQuery: MediaQueryList | null = null;
let initialized = false;
let consumers = 0;

/** Comprueba que estamos en un entorno con `window`/`navigator` (no SSR). */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/** ¿La app corre instalada? Cubre Android/Chrome (display-mode) e iOS Safari. */
function readStandalone(): boolean {
  if (!isBrowser()) {
    return false;
  }
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(STANDALONE_QUERY).matches
  ) {
    return true;
  }
  return (navigator as IosNavigator).standalone === true;
}

/**
 * Detección de iOS/iPadOS. Incluye el iPad moderno, que se identifica como
 * MacIntel pero reporta más de un punto táctil.
 */
function readIsIos(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    return true;
  }
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function handleBeforeInstallPrompt(event: Event): void {
  const promptEvent = event as BeforeInstallPromptEvent;
  // Impide el mini-infobar automático: guardamos el evento para dispararlo
  // nosotros desde el gesto del usuario.
  promptEvent.preventDefault();
  deferredPrompt = promptEvent;
  canInstallNatively.value = true;
}

function handleAppInstalled(): void {
  deferredPrompt = null;
  canInstallNatively.value = false;
  showIosInstructions.value = false;
  isStandalone.value = true;
}

function handleDisplayModeChange(): void {
  isStandalone.value = readStandalone();
}

/** Registra los listeners una sola vez (idempotente y seguro en SSR). */
function init(): void {
  if (initialized || !isBrowser()) {
    return;
  }
  initialized = true;

  isStandalone.value = readStandalone();

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  if (typeof window.matchMedia === 'function') {
    displayModeQuery = window.matchMedia(STANDALONE_QUERY);
    displayModeQuery.addEventListener('change', handleDisplayModeChange);
  }
}

function cleanup(): void {
  if (!isBrowser()) {
    return;
  }
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
  if (displayModeQuery) {
    displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    displayModeQuery = null;
  }
  initialized = false;
}

/**
 * Detección "web vs. PWA instalada" y guía de instalación.
 *
 * - Si la app ya corre instalada (`isStandalone`), no hay que mostrar botón.
 * - En Chromium, `beforeinstallprompt` habilita la instalación nativa.
 * - En iOS no hay API programática: se muestran instrucciones manuales.
 *
 * Los listeners se registran al crear el composable y se limpian cuando el
 * último consumidor se destruye (`onScopeDispose`).
 */
export function useInstallPrompt() {
  init();
  consumers += 1;

  if (getCurrentScope()) {
    onScopeDispose(() => {
      consumers = Math.max(0, consumers - 1);
      if (consumers === 0) {
        cleanup();
      }
    });
  }

  /** Lanza el prompt nativo y limpia el estado (el evento es de un solo uso). */
  async function promptInstall(): Promise<void> {
    const promptEvent = deferredPrompt;
    if (!promptEvent) {
      return;
    }
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        isStandalone.value = true;
      }
    } catch {
      // Algunos navegadores lanzan si el prompt ya no está disponible.
    } finally {
      deferredPrompt = null;
      canInstallNatively.value = false;
    }
  }

  function openIosInstructions(): void {
    showIosInstructions.value = true;
  }

  function closeIosInstructions(): void {
    showIosInstructions.value = false;
  }

  return {
    /** `true` si la app ya corre instalada (standalone). */
    isStandalone,
    /** `true` en iPhone/iPad/iPod (incluye iPadOS moderno). */
    isIos: readIsIos(),
    /** `true` si hay un `beforeinstallprompt` capturado y reutilizable. */
    canInstallNatively,
    /** Estado de la hoja de instrucciones de iOS. */
    showIosInstructions,
    /** Lanza la instalación nativa (Chromium). */
    promptInstall,
    /** Abre las instrucciones manuales de iOS. */
    openIosInstructions,
    /** Cierra las instrucciones manuales de iOS. */
    closeIosInstructions,
  };
}

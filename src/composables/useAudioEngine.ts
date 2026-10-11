import { ref } from 'vue';

/**
 * Motor de audio de Inversio (Web Audio API).
 *
 * El `AudioContext` es un singleton a nivel de módulo: se crea una sola vez y
 * se comparte entre todas las llamadas a `useAudioEngine()`. Recrearlo es caro
 * y delicado (límites del navegador, política de autoplay), así que nunca debe
 * haber más de uno.
 */

let ctx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

/** `true` mientras hay un buffer reproduciéndose. */
const isPlaying = ref(false);

function createContext(): AudioContext {
  // El contexto arranca "suspended" por la política de autoplay; se resume
  // explícitamente tras un gesto del usuario en `ensureContext()`.
  ctx = new AudioContext();
  return ctx;
}

/**
 * Devuelve el contexto compartido, creándolo si aún no existe.
 * Síncrono: pensado para conectar nodos (analyser, etc.) sin await.
 */
function getContext(): AudioContext {
  return ctx ?? createContext();
}

/**
 * Garantiza que el contexto existe y está activo.
 * Si está suspendido, lo reanuda (requiere un gesto previo del usuario).
 */
async function ensureContext(): Promise<AudioContext> {
  const context = getContext();
  if (context.state === 'suspended') {
    await context.resume();
  }
  return context;
}

/**
 * Blob (grabación) -> AudioBuffer (PCM).
 *
 * `decodeAudioData` *detacha* el ArrayBuffer que recibe, por lo que hay que
 * pasarle siempre un buffer nuevo y no reutilizarlo después. `blob.arrayBuffer()`
 * nos devuelve justamente eso: una copia fresca en cada llamada.
 */
async function decode(blob: Blob): Promise<AudioBuffer> {
  const context = await ensureContext();
  const arrayBuffer = await blob.arrayBuffer();
  try {
    return await context.decodeAudioData(arrayBuffer);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`No se pudo decodificar el audio: ${detail}`);
  }
}

/**
 * Invierte las muestras de cada canal del buffer (audio al revés).
 * Trabaja sobre una copia de cada canal para no mutar el buffer original.
 */
function reverse(buffer: AudioBuffer): AudioBuffer {
  const context = getContext();
  const output = context.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate,
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel).slice();
    data.reverse();
    output.copyToChannel(data, channel);
  }

  return output;
}

/** Detiene cualquier reproducción activa y limpia el estado. */
function stop(): void {
  if (currentSource) {
    try {
      // Evita que el `onended` del source interrumpido toque `isPlaying`.
      currentSource.onended = null;
      currentSource.stop();
    } catch {
      // El source ya podía estar detenido; lo ignoramos.
    }
    currentSource = null;
  }
  isPlaying.value = false;
}

/**
 * Reproduce un buffer. Siempre detiene la reproducción anterior para no
 * solapar audios. `isPlaying` refleja el estado, y `onEnded` se invoca al
 * terminar.
 */
function play(buffer: AudioBuffer, onEnded?: () => void): void {
  const context = getContext();
  stop();

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.onended = () => {
    if (currentSource === source) {
      currentSource = null;
      isPlaying.value = false;
    }
    onEnded?.();
  };
  source.start();

  currentSource = source;
  isPlaying.value = true;
}

/** Conveniencia: invierte un buffer y lo reproduce. */
function playReversed(buffer: AudioBuffer, onEnded?: () => void): void {
  play(reverse(buffer), onEnded);
}

export function useAudioEngine() {
  return {
    /** Crea el AudioContext si hace falta y lo reanuda si está suspendido. */
    ensureContext,
    /** Devuelve el contexto compartido (creándolo si hace falta). */
    getContext,
    /** Decodifica un Blob a AudioBuffer. */
    decode,
    /** Invierte las muestras de cada canal. */
    reverse,
    /** Reproduce un buffer, deteniendo cualquier reproducción previa. */
    play,
    /** Invierte y reproduce. */
    playReversed,
    /** Detiene la reproducción activa. */
    stop,
    /** Estado reactivo de reproducción. */
    isPlaying,
  };
}

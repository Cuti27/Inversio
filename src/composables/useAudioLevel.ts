import { onScopeDispose, ref } from 'vue';
import { useAudioEngine } from './useAudioEngine';

/**
 * Nivel de entrada del micrófono (0..1) para visualizaciones (waveform, VU).
 *
 * Reutiliza el `AudioContext` compartido del motor de audio y mide el nivel con
 * un `AnalyserNode` alimentado por el stream. El cálculo del RMS se hace dentro
 * de un `requestAnimationFrame`, así que el bucle se detiene al llamar a `stop()`.
 */
export function useAudioLevel() {
  const level = ref(0);
  const engine = useAudioEngine();

  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let samples: Float32Array<ArrayBuffer> | null = null;
  let rafId: number | null = null;

  function computeLevel(): void {
    if (!analyser || !samples) {
      return;
    }

    analyser.getFloatTimeDomainData(samples);

    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      const value = samples[i] ?? 0;
      sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / samples.length);

    // Se amplifica un poco y se limita a 0..1 para que sea visible.
    level.value = Math.min(1, rms * 3);

    rafId = requestAnimationFrame(computeLevel);
  }

  /** Analiza el stream dado y empieza a actualizar `level`. */
  function start(mediaStream: MediaStream): void {
    stop();

    const context = engine.getContext();
    // Asegura el contexto activo (requiere gesto previo del usuario).
    void context.resume();

    source = context.createMediaStreamSource(mediaStream);
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;

    samples = new Float32Array(analyser.fftSize);

    // No se conecta a `destination` a propósito: evita realimentación (eco).
    source.connect(analyser);

    rafId = requestAnimationFrame(computeLevel);
  }

  /** Detiene el análisis, cancela el rAF y desconecta los nodos. */
  function stop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    source?.disconnect();
    source = null;

    analyser?.disconnect();
    analyser = null;

    samples = null;
    level.value = 0;
  }

  // Limpieza automática cuando el componente/scope se destruye.
  onScopeDispose(stop);

  return { level, start, stop };
}

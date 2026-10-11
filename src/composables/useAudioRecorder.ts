import { ref, shallowRef } from 'vue';

/**
 * Grabación de audio con `MediaRecorder`.
 *
 * No se fuerza `mimeType`: iOS Safari es especialmente quisquilloso con los
 * códecs y el valor por defecto del navegador es el más compatible.
 */

function describeMediaError(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'No tenemos permiso para usar el micrófono. Actívalo en los ajustes del navegador y vuelve a intentarlo.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No se ha encontrado ningún micrófono en este dispositivo.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'El micrófono está siendo usado por otra aplicación.';
      case 'OverconstrainedError':
        return 'El micrófono no cumple los requisitos solicitados.';
      default:
        return `No se pudo acceder al micrófono (${err.name}).`;
    }
  }
  if (err instanceof Error) {
    return `No se pudo acceder al micrófono: ${err.message}`;
  }
  return 'No se pudo acceder al micrófono.';
}

export function useAudioRecorder() {
  const mediaRecorder = shallowRef<MediaRecorder | null>(null);
  const isRecording = ref(false);
  const error = ref<string | null>(null);
  const stream = shallowRef<MediaStream | null>(null);

  let chunks: Blob[] = [];

  /** Libera el stream deteniendo todas sus pistas. */
  function stopTracks(): void {
    const mediaStream = stream.value;
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  }

  /** Pide permiso al micrófono y arranca la grabación. */
  async function start(): Promise<void> {
    error.value = null;

    if (isRecording.value) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = 'Tu navegador no soporta la grabación de audio.';
      isRecording.value = false;
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.value = mediaStream;

      chunks = [];
      const recorder = new MediaRecorder(mediaStream);
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.value = recorder;
      recorder.start();
      isRecording.value = true;
    } catch (err) {
      stopTracks();
      mediaRecorder.value = null;
      stream.value = null;
      chunks = [];
      isRecording.value = false;
      error.value = describeMediaError(err);
    }
  }

  /**
   * Detiene la grabación y resuelve con el Blob resultante.
   * También detiene todas las pistas del stream para liberar el micrófono.
   */
  function stop(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = mediaRecorder.value;

      const finish = (blob: Blob): void => {
        isRecording.value = false;
        mediaRecorder.value = null;
        stopTracks();
        stream.value = null;
        resolve(blob);
      };

      if (!recorder || recorder.state === 'inactive') {
        finish(new Blob(chunks, { type: 'audio/webm' }));
        return;
      }

      recorder.onstop = () => {
        finish(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      };

      try {
        recorder.stop();
      } catch {
        finish(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      }
    });
  }

  /** Cancela la grabación descartando el audio y liberando recursos. */
  function cancel(): void {
    const recorder = mediaRecorder.value;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // El recorder ya podía estar detenido; lo ignoramos.
      }
    }

    stopTracks();
    mediaRecorder.value = null;
    stream.value = null;
    chunks = [];
    isRecording.value = false;
  }

  return {
    mediaRecorder,
    isRecording,
    error,
    stream,
    start,
    stop,
    cancel,
  };
}

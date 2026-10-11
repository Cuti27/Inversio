/**
 * Exportación del clip final de una ronda.
 *
 * El "resultado final" es la imitación del Jugador 2 invertida, que solo existe
 * como `AudioBuffer` (PCM en memoria). Para convertirlo en un archivo lo
 * serializamos a WAV (PCM 16-bit), que no necesita dependencias y se reproduce
 * en cualquier sitio. Después lo compartimos (Web Share API en móvil) o lo
 * descargamos (fallback).
 */

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

/** Serializa un `AudioBuffer` a un archivo WAV (PCM 16-bit little-endian). */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const numFrames = buffer.length;
  const sampleRate = buffer.sampleRate;

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const view = new DataView(new ArrayBuffer(44 + dataSize));

  // Cabecera RIFF/WAVE.
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del bloque fmt
  view.setUint16(20, 1, true); // formato PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits por muestra
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Muestras PCM intercaladas (clamp a [-1, 1]).
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/** ¿El navegador puede compartir archivos (Web Share API nivel 2)? */
export function supportsFileShare(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function'
  );
}

/** Nombre de archivo con marca de tiempo: `inversio-YYYYMMDD-HHMMSS.wav`. */
export function buildClipFilename(date: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `inversio-${stamp}.wav`;
}

/** Descarga un Blob como archivo mediante un enlace temporal. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Liberamos el object URL en el siguiente tick para no cancelar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Comparte el clip si el navegador lo permite (móvil) y, si no, lo descarga.
 * Devuelve cómo terminó para poder dar feedback en la UI.
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: blob.type || 'audio/wav' });

  if (supportsFileShare() && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Inversio',
        text: 'Mi palabra al revés 😜',
      });
      return 'shared';
    } catch {
      // El usuario canceló o falló: caemos a la descarga.
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

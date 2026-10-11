import { describe, expect, it } from 'vitest';
import { audioBufferToWav, buildClipFilename } from '../../src/utils/audioExport';

/** AudioBuffer mínimo sin Web Audio API (no disponible en jsdom). */
function fakeBuffer(channels: number, frames: number, sampleRate = 44100): AudioBuffer {
  const data = Array.from({ length: channels }, () => new Float32Array(frames));
  return {
    numberOfChannels: channels,
    length: frames,
    sampleRate,
    getChannelData: (channel: number) => data[channel],
  } as unknown as AudioBuffer;
}

async function readAscii(blob: Blob, start: number, length: number): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return new TextDecoder().decode(buffer.slice(start, start + length));
}

describe('audioBufferToWav', () => {
  it('genera una cabecera RIFF/WAVE válida', async () => {
    const wav = audioBufferToWav(fakeBuffer(1, 100));

    expect(wav.type).toBe('audio/wav');
    expect(await readAscii(wav, 0, 4)).toBe('RIFF');
    expect(await readAscii(wav, 8, 4)).toBe('WAVE');
    expect(await readAscii(wav, 12, 4)).toBe('fmt ');
    expect(await readAscii(wav, 36, 4)).toBe('data');
  });

  it('calcula el tamaño correcto (44 + frames * canales * 2)', () => {
    const wav = audioBufferToWav(fakeBuffer(2, 500));
    expect(wav.size).toBe(44 + 500 * 2 * 2);
  });

  it('escribe canales, sample rate, bits y tamaño de datos en la cabecera', async () => {
    const wav = audioBufferToWav(fakeBuffer(1, 10, 48000));
    const view = new DataView(await wav.arrayBuffer());

    expect(view.getUint16(22, true)).toBe(1); // canales
    expect(view.getUint32(24, true)).toBe(48000); // sample rate
    expect(view.getUint16(34, true)).toBe(16); // bits por muestra
    expect(view.getUint32(40, true)).toBe(10 * 1 * 2); // tamaño de datos
  });

  it('recorta las muestras fuera de rango [-1, 1]', async () => {
    const buffer = fakeBuffer(1, 2);
    buffer.getChannelData(0)[0] = 2;
    buffer.getChannelData(0)[1] = -2;

    const wav = audioBufferToWav(buffer);
    const view = new DataView(await wav.arrayBuffer());

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });
});

describe('buildClipFilename', () => {
  it('incluye la marca de tiempo y la extensión .wav', () => {
    const name = buildClipFilename(new Date(2026, 0, 5, 9, 8, 7));
    expect(name).toBe('inversio-20260105-090807.wav');
  });
});

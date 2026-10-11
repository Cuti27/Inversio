import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useStatsStore } from '../../src/stores/stats';

describe('useStatsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('empieza vacío', () => {
    const stats = useStatsStore();
    expect(stats.total).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(stats.history).toEqual([]);
  });

  it('registra aciertos y fallos', () => {
    const stats = useStatsStore();
    stats.recordResult('hit');
    stats.recordResult('hit');
    stats.recordResult('miss');

    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.total).toBe(3);
    expect(stats.accuracy).toBeCloseTo(2 / 3);
    expect(stats.history).toHaveLength(3);
    expect(stats.history[0]?.result).toBe('hit');
  });

  it('persiste en localStorage', async () => {
    const stats = useStatsStore();
    stats.recordResult('hit');
    await nextTick();

    const raw = JSON.parse(localStorage.getItem('inversio:stats') ?? '{}');
    expect(raw.hits).toBe(1);
    expect(raw.history).toHaveLength(1);
  });

  it('relee las estadísticas guardadas', () => {
    localStorage.setItem(
      'inversio:stats',
      JSON.stringify({ hits: 3, misses: 1, history: [{ ts: 1, result: 'hit' }] }),
    );
    setActivePinia(createPinia());

    const stats = useStatsStore();
    expect(stats.hits).toBe(3);
    expect(stats.misses).toBe(1);
    expect(stats.total).toBe(4);
    expect(stats.accuracy).toBeCloseTo(0.75);
  });

  it('reset vacía el marcador y el historial', () => {
    const stats = useStatsStore();
    stats.recordResult('miss');
    stats.reset();

    expect(stats.total).toBe(0);
    expect(stats.history).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  isShutdownInProgress,
  registerWorker,
  resetForTests,
  stopAllWorkers,
} from '../../server/bindings/workerLifecycle';

describe('Worker Lifecycle', () => {
  beforeEach(() => {
    resetForTests();
  });

  afterEach(() => {
    resetForTests();
    vi.restoreAllMocks();
  });

  test('should register workers', () => {
    const cleanup = vi.fn();
    registerWorker('test-worker', cleanup);
    expect(isShutdownInProgress()).toBe(false);
  });

  test('should call cleanup functions on stopAllWorkers', async () => {
    const cleanup1 = vi.fn().mockResolvedValue(undefined);
    const cleanup2 = vi.fn().mockResolvedValue(undefined);

    registerWorker('worker-1', cleanup1);
    registerWorker('worker-2', cleanup2);

    await stopAllWorkers();

    expect(cleanup1).toHaveBeenCalledOnce();
    expect(cleanup2).toHaveBeenCalledOnce();
    expect(isShutdownInProgress()).toBe(true);
  });

  test('should set shutdown flag during stop', async () => {
    expect(isShutdownInProgress()).toBe(false);

    const cleanupPromise = stopAllWorkers();
    expect(isShutdownInProgress()).toBe(true);

    await cleanupPromise;
    expect(isShutdownInProgress()).toBe(true);
  });

  test('should handle cleanup errors gracefully', async () => {
    const cleanup1 = vi.fn().mockRejectedValue(new Error('cleanup error'));
    const cleanup2 = vi.fn().mockResolvedValue(undefined);

    registerWorker('worker-1', cleanup1);
    registerWorker('worker-2', cleanup2);

    // Should not throw
    await stopAllWorkers();

    expect(cleanup1).toHaveBeenCalledOnce();
    expect(cleanup2).toHaveBeenCalledOnce();
  });

  test('should only stop workers once', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    registerWorker('worker', cleanup);

    await stopAllWorkers();
    await stopAllWorkers();
    await stopAllWorkers();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  test('should handle synchronous cleanup functions', async () => {
    const cleanup = vi.fn();
    registerWorker('sync-worker', cleanup);

    await stopAllWorkers();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  test('resetForTests should reset all state', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    registerWorker('worker', cleanup);

    await stopAllWorkers();
    expect(isShutdownInProgress()).toBe(true);

    resetForTests();
    expect(isShutdownInProgress()).toBe(false);

    // Cleanup should not be called again after reset
    await stopAllWorkers();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});

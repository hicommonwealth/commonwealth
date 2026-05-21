import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock only the database module - partial mock to avoid breaking transitive imports
vi.mock('@hicommonwealth/model/db', () => ({
  models: {
    sequelize: {
      query: vi.fn(),
    },
  },
}));

// Must import after mocks are set up
import { models } from '@hicommonwealth/model/db';
import { waitForOutboxTable } from '../../server/bindings/relayForever';
import {
  resetForTests,
  stopAllWorkers,
} from '../../server/bindings/workerLifecycle';

const mockQuery = vi.mocked(models.sequelize.query);

describe('waitForOutboxTable', () => {
  beforeEach(() => {
    resetForTests();
    vi.useFakeTimers();
    mockQuery.mockReset();
  });

  afterEach(() => {
    resetForTests();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('should resolve immediately when table is accessible', async () => {
    mockQuery.mockResolvedValueOnce([] as never);

    await waitForOutboxTable();

    expect(mockQuery).toHaveBeenCalledOnce();
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT 1 FROM "Outbox" LIMIT 0',
      expect.objectContaining({ type: 'SELECT' }),
    );
  });

  test('should retry on failure then succeed', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('table not found'))
      .mockRejectedValueOnce(new Error('connection refused'))
      .mockResolvedValueOnce([] as never);

    const promise = waitForOutboxTable();

    // First retry: 1000ms delay
    await vi.advanceTimersByTimeAsync(1_000);
    // Second retry: 2000ms delay (exponential backoff)
    await vi.advanceTimersByTimeAsync(2_000);

    await promise;

    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  test('should use exponential backoff capped at 30s', async () => {
    mockQuery.mockRejectedValue(new Error('table not found'));

    const promise = waitForOutboxTable();

    // Advance through multiple retries: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s
    const expectedDelays = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000];
    for (const delay of expectedDelays) {
      await vi.advanceTimersByTimeAsync(delay);
    }

    // After 7 failures + initial call = 8 calls total
    expect(mockQuery).toHaveBeenCalledTimes(8);

    // Stop the loop by resolving
    mockQuery.mockResolvedValueOnce([] as never);
    await vi.advanceTimersByTimeAsync(30_000);
    await promise;
  });

  test('should abort when shutdown is triggered', async () => {
    mockQuery.mockRejectedValue(new Error('table not found'));

    const promise = waitForOutboxTable();

    // Let the first check fail and start waiting
    await vi.advanceTimersByTimeAsync(1_000);

    // Trigger shutdown
    await stopAllWorkers();

    // Advance past the retry delay so the loop can check shutdown
    await vi.advanceTimersByTimeAsync(2_000);

    await promise;

    // Should have stopped retrying after shutdown
    const callCount = mockQuery.mock.calls.length;
    // Advance more time and verify no new calls
    await vi.advanceTimersByTimeAsync(10_000);
    expect(mockQuery.mock.calls.length).toBe(callCount);
  });
});

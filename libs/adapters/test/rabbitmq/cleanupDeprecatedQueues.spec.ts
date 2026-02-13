import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  RabbitMQAdapter,
  deriveManagementUrl,
} from '../../src/rabbitmq/RabbitMQAdapter';

const MANAGEMENT_URL = 'http://guest:guest@localhost:15672';

function makeAdapter(queueNames: string[]) {
  const queues: Record<string, object> = {};
  for (const name of queueNames) {
    queues[name] = { assert: true };
  }
  const config = {
    vhosts: {
      '/': {
        connection: 'amqp://127.0.0.1',
        queues,
        subscriptions: {},
        publications: {},
      },
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new RabbitMQAdapter(config as any);
  // Simulate initialized state without a real broker
  (adapter as any)._initialized = true;
  (adapter as any).broker = {};
  return adapter;
}

function mockFetchResponses(
  listResponse: { ok: boolean; status: number; json: () => Promise<unknown> },
  deleteResponses?: Map<string, { ok: boolean; status: number }>,
) {
  return vi.fn(async (url: string | URL, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (!init?.method || init.method === 'GET') {
      return listResponse;
    }
    if (init?.method === 'DELETE') {
      const queueName = decodeURIComponent(urlStr.split('/').pop()!);
      const res = deleteResponses?.get(queueName) ?? {
        ok: true,
        status: 204,
      };
      return res;
    }
    return { ok: false, status: 404 };
  });
}

describe('cleanupDeprecatedQueues', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test('should delete empty deprecated queues', async () => {
    const adapter = makeAdapter(['ActiveQueue', 'DeadLetterQueue']);

    global.fetch = mockFetchResponses({
      ok: true,
      status: 200,
      json: async () => [
        { name: 'ActiveQueue', messages: 0 },
        { name: 'DeadLetterQueue', messages: 0 },
        { name: 'OldDeprecatedQueue', messages: 0 },
      ],
    }) as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // First call: list queues
    expect(calls[0][0]).toContain('/api/queues/');
    // Second call: delete OldDeprecatedQueue
    expect(calls[1][0]).toContain('OldDeprecatedQueue');
    expect(calls[1][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
    // No more calls (active queues not touched)
    expect(calls).toHaveLength(2);
  });

  test('should warn and skip non-empty deprecated queues', async () => {
    const adapter = makeAdapter(['ActiveQueue']);

    global.fetch = mockFetchResponses({
      ok: true,
      status: 200,
      json: async () => [
        { name: 'ActiveQueue', messages: 5 },
        { name: 'OldDeprecatedQueue', messages: 3 },
      ],
    }) as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // Only the list call — no DELETE for non-empty queue
    expect(calls).toHaveLength(1);
  });

  test('should not touch active queues', async () => {
    const adapter = makeAdapter([
      'ActiveQueue',
      'AnotherActiveQueue',
      'DeadLetterQueue',
    ]);

    global.fetch = mockFetchResponses({
      ok: true,
      status: 200,
      json: async () => [
        { name: 'ActiveQueue', messages: 0 },
        { name: 'AnotherActiveQueue', messages: 10 },
        { name: 'DeadLetterQueue', messages: 0 },
      ],
    }) as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // Only the list call — no deletes
    expect(calls).toHaveLength(1);
  });

  test('should skip queues not matching *Queue naming convention', async () => {
    const adapter = makeAdapter(['ActiveQueue']);

    global.fetch = mockFetchResponses({
      ok: true,
      status: 200,
      json: async () => [
        { name: 'ActiveQueue', messages: 0 },
        { name: 'amq.gen-abc123', messages: 0 },
        { name: 'some-other-system-queue', messages: 0 },
      ],
    }) as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // Only the list call — system queues not touched
    expect(calls).toHaveLength(1);
  });

  test('should handle Management API failure gracefully', async () => {
    const adapter = makeAdapter(['ActiveQueue']);

    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })) as unknown as unknown as typeof fetch;

    // Should not throw
    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);
  });

  test('should handle delete failure gracefully and continue', async () => {
    const adapter = makeAdapter(['ActiveQueue']);

    const deleteResponses = new Map([
      ['DeprecatedOneQueue', { ok: false, status: 500 }],
      ['DeprecatedTwoQueue', { ok: true, status: 204 }],
    ]);

    global.fetch = mockFetchResponses(
      {
        ok: true,
        status: 200,
        json: async () => [
          { name: 'ActiveQueue', messages: 0 },
          { name: 'DeprecatedOneQueue', messages: 0 },
          { name: 'DeprecatedTwoQueue', messages: 0 },
        ],
      },
      deleteResponses,
    ) as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // list + 2 delete attempts
    expect(calls).toHaveLength(3);
  });

  test('should not run if adapter is not initialized', async () => {
    const config = {
      vhosts: {
        '/': {
          connection: 'amqp://127.0.0.1',
          queues: {},
          subscriptions: {},
          publications: {},
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new RabbitMQAdapter(config as any);

    global.fetch = vi.fn() as unknown as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(MANAGEMENT_URL);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('should handle management URL with trailing slash', async () => {
    const adapter = makeAdapter(['ActiveQueue']);

    global.fetch = mockFetchResponses({
      ok: true,
      status: 200,
      json: async () => [{ name: 'ActiveQueue', messages: 0 }],
    }) as unknown as typeof fetch;

    await adapter.cleanupDeprecatedQueues(
      'http://guest:guest@localhost:15672/',
    );

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // URL should not have double slashes
    expect(calls[0][0]).not.toContain('//api');
  });
});

describe('deriveManagementUrl', () => {
  test('should derive URL for localhost', () => {
    expect(deriveManagementUrl('amqp://localhost')).toBe(
      'http://guest:guest@localhost:15672',
    );
  });

  test('should derive URL for 127.0.0.1', () => {
    expect(deriveManagementUrl('amqp://127.0.0.1')).toBe(
      'http://guest:guest@127.0.0.1:15672',
    );
  });

  test('should use credentials from URI when present', () => {
    expect(deriveManagementUrl('amqp://user:pass@localhost:5672')).toBe(
      'http://user:pass@localhost:15672',
    );
  });

  test('should return undefined for non-local URIs', () => {
    expect(
      deriveManagementUrl('amqps://user:pass@rabbit.cloudamqp.com/vhost'),
    ).toBeUndefined();
  });

  test('should return undefined for invalid URIs', () => {
    expect(deriveManagementUrl('not-a-url')).toBeUndefined();
  });
});

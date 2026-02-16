import { Page, TestInfo } from '@playwright/test';

/**
 * Mock an API route with a custom response.
 */
export async function mockAPIRoute(
  page: Page,
  urlPattern: string,
  response: {
    status?: number;
    body: unknown;
    contentType?: string;
  },
): Promise<void> {
  const { status = 200, body, contentType = 'application/json' } = response;
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status,
      contentType,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  });
}

/**
 * Mock the communities list endpoint.
 */
export async function mockCommunityList(
  page: Page,
  communities: Array<{
    id: string;
    name: string;
    icon_url?: string;
    description?: string;
    thread_count?: number;
    address_count?: number;
  }>,
): Promise<void> {
  await page.route(
    '**/api/internal/trpc/community.getCommunities**',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              results: communities,
              totalResults: communities.length,
            },
          },
        }),
      });
    },
  );
}

/**
 * Mock the threads list endpoint.
 */
export async function mockThreadList(
  page: Page,
  threads: Array<{
    id: number;
    title: string;
    body: string;
    community_id: string;
    topic_id?: number;
  }>,
): Promise<void> {
  await page.route(
    '**/api/internal/trpc/thread.getThreads**',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              results: threads,
              totalResults: threads.length,
            },
          },
        }),
      });
    },
  );
}

// --- Network Logging ---

interface NetworkEntry {
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  duration?: number;
}

const networkLogs = new Map<Page, NetworkEntry[]>();

/**
 * Start logging network requests for debugging.
 * Call writeNetworkLog() to save the log to a file.
 */
export function startNetworkLogging(page: Page): void {
  const entries: NetworkEntry[] = [];
  networkLogs.set(page, entries);

  page.on('request', (request) => {
    entries.push({
      timestamp: Date.now(),
      method: request.method(),
      url: request.url(),
    });
  });

  page.on('response', (response) => {
    const entry = entries.find(
      (e) =>
        e.url === response.url() &&
        e.method === response.request().method() &&
        !e.status,
    );
    if (entry) {
      entry.status = response.status();
      entry.duration = Date.now() - entry.timestamp;
    }
  });
}

/**
 * Write network log to a test artifact file.
 */
export async function writeNetworkLog(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  const entries = networkLogs.get(page);
  if (!entries || entries.length === 0) return;

  const logContent = entries
    .map(
      (e) =>
        `[${new Date(e.timestamp).toISOString()}] ${e.method} ${e.url} → ${e.status ?? 'pending'} (${e.duration ?? '?'}ms)`,
    )
    .join('\n');

  const outputPath = testInfo.outputPath('network.log');
  const fs = await import('fs');
  fs.writeFileSync(outputPath, logContent, 'utf-8');
  await testInfo.attach('network-log', {
    path: outputPath,
    contentType: 'text/plain',
  });

  networkLogs.delete(page);
}

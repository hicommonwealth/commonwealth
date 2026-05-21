import { dispose, logger } from '@hicommonwealth/core';

const log = logger(import.meta);

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30_000;

type CleanupFn = () => Promise<void> | void;

interface WorkerRegistration {
  name: string;
  cleanup: CleanupFn;
}

const workers: WorkerRegistration[] = [];
let isShuttingDown = false;
let shutdownPromise: Promise<void> | null = null;

/**
 * Registers a worker for graceful shutdown.
 * When shutdown is triggered, all registered workers will be cleaned up.
 *
 * @param name - Human-readable name for logging
 * @param cleanup - Async function to stop the worker and release resources
 */
export function registerWorker(name: string, cleanup: CleanupFn): void {
  workers.push({ name, cleanup });
  log.info(`[workerLifecycle] Registered worker: ${name}`);
}

/**
 * Stops all registered workers gracefully.
 * Includes a timeout to force-exit if workers don't stop in time.
 *
 * @returns Promise that resolves when all workers are stopped
 */
export async function stopAllWorkers(): Promise<void> {
  if (isShuttingDown) {
    return shutdownPromise!;
  }

  isShuttingDown = true;
  log.info(`[workerLifecycle] Stopping ${workers.length} workers...`);

  shutdownPromise = new Promise<void>((resolve) => {
    const timeoutId = setTimeout(() => {
      log.warn(
        `[workerLifecycle] Graceful shutdown timeout (${GRACEFUL_SHUTDOWN_TIMEOUT_MS}ms) exceeded, forcing exit`,
      );
      resolve();
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

    Promise.allSettled(
      workers.map(async ({ name, cleanup }) => {
        try {
          log.info(`[workerLifecycle] Stopping worker: ${name}`);
          await cleanup();
          log.info(`[workerLifecycle] Worker stopped: ${name}`);
        } catch (err) {
          log.error(`[workerLifecycle] Error stopping worker: ${name}`, err);
        }
      }),
    )
      .then(() => {
        clearTimeout(timeoutId);
        log.info('[workerLifecycle] All workers stopped');
        resolve();
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve();
      });
  });

  return shutdownPromise;
}

/**
 * Returns whether shutdown has been initiated.
 */
export function isShutdownInProgress(): boolean {
  return isShuttingDown;
}

/**
 * Resets the worker lifecycle state.
 * Only use this in tests.
 */
export function resetForTests(): void {
  workers.length = 0;
  isShuttingDown = false;
  shutdownPromise = null;
}

// Register with core dispose system
dispose(stopAllWorkers);

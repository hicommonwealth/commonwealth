import { logger } from '@hicommonwealth/core';

const log = logger(import.meta);

export type CleanupFn = {
  description: string;
  runOnErrorOnly?: boolean;
  fn: () => Promise<void>;
};

/**
 * Traverses through the cleanup stack and performs each cleanup function from last to first.
 * Some entries are only executed if there's an error.
 *
 * @param {any | null} error - The error object or null if no error occurred.
 * @param {CleanupFn[]} cleanupStack - An array of cleanup functions to be executed.
 * @returns {Promise<void>} - A promise that resolves when all cleanup functions have been executed.
 */
export const runCleanup = async (
  error: any | null,
  cleanupStack: CleanupFn[],
): Promise<void> => {
  while (cleanupStack.length > 0) {
    const { description, runOnErrorOnly, fn } = cleanupStack.pop()!;
    if (runOnErrorOnly && !error) {
      continue;
    }
    try {
      log.debug(`RUNNING CLEANUP: ${description}`);
      await fn();
    } catch (err) {
      log.error('CLEANUP FAILED: ', err as Error);
    }
  }
};

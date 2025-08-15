import { config } from './config';
import { logger } from './logging/logger';

const log = logger(import.meta);

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Disables service execution if DISABLE_SERVICE environment variable is true.
 * If disabled, the function will stall execution forever and log warning messages on an interval.
 * This is useful for gracefully disabling services in certain environments.
 * WARNING: Any promises created/started before this function executes will still execute.
 */
export async function disableService(): Promise<void> {
  if (config.DISABLE_SERVICE) {
    const serviceName = config.SERVICE || 'unknown';
    const startTime = Date.now();

    // Log initial warning
    log.warn(
      `Service '${serviceName}' is disabled. Execution will be stalled.`,
    );

    // Stall execution forever
    // This creates an infinite loop that prevents any code after this function from executing
    while (true) {
      // Sleep for 1 minute
      await delay(60_000);

      // Calculate total stall time
      const totalStallTime = Date.now() - startTime;
      const days = Math.floor(totalStallTime / (24 * 60 * 60 * 1000));
      const hours = Math.floor(
        (totalStallTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
      );
      const minutes = Math.floor((totalStallTime % (60 * 60 * 1000)) / 60000);
      const seconds = Math.floor((totalStallTime % 60000) / 1000);

      // Log warning with total stall time
      log.warn(
        `Service '${serviceName}' is still disabled. Total stall time: ${days}d ${hours}h ${minutes}m ${seconds}s`,
      );
    }
  }
}

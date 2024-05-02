import { logger } from '@hicommonwealth/logging';
import { CacheNamespaces } from '@hicommonwealth/shared';
import { fileURLToPath } from 'url';
import { CacheDecorator, KeyFunction } from './redis';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export class Activity<T extends (...args: any[]) => any> {
  queryWithCache: T;
  queryWithCacheOverride: T;

  constructor(
    private label: string,
    private query: T,
    private cacheKey: KeyFunction<T>,
    private cacheDuration: number,
    private cacheNamespace: CacheNamespaces,
    private cacheDecorator: CacheDecorator,
  ) {
    this.queryWithCache = this.cacheWrapHelper(false);
    this.queryWithCacheOverride = this.cacheWrapHelper(true);
  }

  cacheWrapHelper(override: boolean) {
    return this.cacheDecorator.cacheWrap(
      override,
      this.query,
      this.cacheKey,
      this.cacheDuration,
      this.cacheNamespace,
    ) as unknown as T;
  }

  async startTask(...args: any) {
    try {
      const jobId = daemon.startTask(
        this.label,
        async () => await this.queryWithCacheOverride(...args),
        this.cacheDuration,
      );
      return jobId;
    } catch (err) {
      console.error(err);
      return;
    }
  }
}

type DaemonTask = () => void;
export class Daemons {
  private tasks: Map<string, NodeJS.Timeout>;
  constructor() {
    this.tasks = new Map();
  }

  backgroundJob(
    label: string,
    fn: DaemonTask,
    timeoutMs: number,
  ): NodeJS.Timeout | undefined {
    // don't accept to run jobs more often than 1 minute
    if (timeoutMs < 60 * 1000) return;

    const jobId = setInterval(async () => {
      try {
        log.info(`Running task ${label}`);
        fn();
      } catch (err) {
        log.error(`Error running task ${label}`, err as Error);
        // cancel task
        clearInterval(jobId);
        this.cancelTask(label);
      }
    }, timeoutMs);

    return jobId;
  }

  startTask(label: string, fn: DaemonTask, seconds: number) {
    const ms = seconds * 1000;
    const jobId = this.backgroundJob(label, fn, ms);
    if (!jobId) return;

    log.info(`Setup background task ${label} to run every ${seconds} seconds`);

    // cancel old task if it exists
    if (this.tasks.has(label)) {
      const oldJobId = this.tasks.get(label);
      if (oldJobId) {
        log.info(`Cancelling old task ${label}`);
        clearInterval(oldJobId);
      }
    }

    // add to map
    this.tasks.set(label, jobId);

    // call daemon immediately
    try {
      fn();
    } catch (err) {
      log.error(`Error running task ${label}`, err as Error);
      // cancel task
      clearInterval(jobId);
      this.cancelTask(label);
      return;
    }
    return jobId;
  }

  cancelTask(label: string) {
    log.info(`Cancelling task ${label}`);
    const jobId = this.tasks.get(label);
    if (jobId) {
      try {
        clearInterval(jobId);
      } catch (err) {
        log.warn('Error cancelling task', { err });
        // remove from map
        return this.tasks.delete(label);
      }
    }
    // remove from map
    return this.tasks.delete(label);
  }

  cancelAllTasks() {
    log.info(`Cancelling all tasks`);
    for (const label of this.tasks.keys()) {
      this.cancelTask(label);
    }
  }

  getTask(label: string) {
    return this.tasks.get(label);
  }
}

export const daemon = new Daemons();

export default daemon;

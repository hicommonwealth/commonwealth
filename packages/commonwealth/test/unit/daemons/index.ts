import { logger } from '@hicommonwealth/core';

const log = logger().getLogger(__filename);

type DaemonTask = () => void;
export class Daemons {
  private tasks: Map<string, NodeJS.Timeout>;
  constructor() {
    this.tasks = new Map();
  }

  backgroundJob(label: string, fn: DaemonTask, ms: number): NodeJS.Timeout {
    // don't accept to run jobs more often than 1 minute
    if (ms < 60 * 1000) return;

    const jobId = setInterval(async () => {
      try {
        log.info(`Running task ${label}`);
        fn();
      } catch (err) {
        console.error(`Error running task ${label}`, err);
        // cancel task
        clearInterval(jobId);
        this.cancelTask(label);
      }
    }, ms);

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
      console.error(`Error running task ${label}`, err);
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
        console.warn('Error cancelling task', err);
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

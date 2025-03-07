import { Task } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { archiveOutboxTask } from './tasks/archive-outbox';
import { cleanChainEventXpSourcesTask } from './tasks/cleanChainEventXpSources';
import { cleanSubscriptionsTask } from './tasks/cleanSubscriptions';
import { runDbMaintenanceTask } from './tasks/runDbMaintenance';
import { sitemapTask } from './tasks/sitemap-runner';
import { GraphileTask, GraphileTasks, GraphileTasksObj } from './types';

export function taskFactory<
  Input extends ZodSchema | ZodUndefined = ZodUndefined,
>({ input, fn }: GraphileTask) {
  const task: Task = async (payload, helpers) => {
    const parsedPayload: z.infer<Input> = input.parse(payload);
    await fn(parsedPayload, helpers);
  };
  return task;
}

export const graphileTasks: GraphileTasksObj = {
  [GraphileTasks.ArchiveOutbox]: archiveOutboxTask,
  [GraphileTasks.UpdateSitemap]: sitemapTask,
  [GraphileTasks.CleanSubscriptions]: cleanSubscriptionsTask,
  [GraphileTasks.CleanChainEventXpSources]: cleanChainEventXpSourcesTask,
  [GraphileTasks.RunDbMaintenance]: runDbMaintenanceTask,
};

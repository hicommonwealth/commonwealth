import {
  GraphileTask,
  GraphileTaskNames,
  GraphileTasksObj,
} from '@hicommonwealth/model';
import { Task } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { archiveOutboxTask } from './tasks/archiveOutbox';
import { awardTwitterQuestXpTask } from './tasks/awardTwitterQuestXp';
import { cleanChainEventXpSourcesTask } from './tasks/cleanChainEventXpSources';
import { cleanSubscriptionsTask } from './tasks/cleanSubscriptions';
import { runDbMaintenanceTask } from './tasks/runDbMaintenance';
import { sitemapTask } from './tasks/sitemap-runner';

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
  [GraphileTaskNames.ArchiveOutbox]: archiveOutboxTask,
  [GraphileTaskNames.UpdateSitemap]: sitemapTask,
  [GraphileTaskNames.CleanSubscriptions]: cleanSubscriptionsTask,
  [GraphileTaskNames.CleanChainEventXpSources]: cleanChainEventXpSourcesTask,
  [GraphileTaskNames.RunDbMaintenance]: runDbMaintenanceTask,
  [GraphileTaskNames.AwardTwitterQuestXp]: awardTwitterQuestXpTask,
} as const;

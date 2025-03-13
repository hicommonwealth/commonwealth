import {
  GraphileTask,
  GraphileTaskNames,
  TaskPayloads,
  awardTweetEngagementXpTask,
} from '@hicommonwealth/model';
import { Task } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { archiveOutboxTask } from './tasks/archiveOutbox';
import { cleanChainEventXpSourcesTask } from './tasks/cleanChainEventXpSources';
import { cleanSubscriptionsTask } from './tasks/cleanSubscriptions';
import { runDbMaintenanceTask } from './tasks/runDbMaintenance';
import { sitemapTask } from './tasks/sitemap-runner';

export function taskFactory<Input extends ZodSchema | ZodUndefined>({
  input,
  fn,
}: GraphileTask<Input>) {
  const task: Task = async (payload, helpers) => {
    const parsedPayload: z.infer<Input> = input.parse(payload);
    await fn(parsedPayload, helpers);
  };
  return task;
}

export const graphileTasks: {
  [K in GraphileTaskNames]: GraphileTask<(typeof TaskPayloads)[K]>;
} = {
  [GraphileTaskNames.ArchiveOutbox]: archiveOutboxTask,
  [GraphileTaskNames.UpdateSitemap]: sitemapTask,
  [GraphileTaskNames.CleanSubscriptions]: cleanSubscriptionsTask,
  [GraphileTaskNames.CleanChainEventXpSources]: cleanChainEventXpSourcesTask,
  [GraphileTaskNames.RunDbMaintenance]: runDbMaintenanceTask,
  [GraphileTaskNames.AwardTwitterQuestXp]: awardTweetEngagementXpTask,
} as const;

import {
  GraphileTask,
  GraphileTaskNames,
  TaskPayloads,
  awardTweetEngagementXpTask,
} from '@hicommonwealth/model/services';
import { Task } from 'graphile-worker';
import { ZodType, ZodUndefined, z } from 'zod';
import { archiveOutboxTask } from './tasks/archiveOutbox';
import { cleanChainEventXpSourcesTask } from './tasks/cleanChainEventXpSources';
import { cleanSubscriptionsTask } from './tasks/cleanSubscriptions';
import { countAggregatorTask } from './tasks/countAggregator';
import { magnaSyncTask } from './tasks/magnaSync';
import { runDbMaintenanceTask } from './tasks/runDbMaintenance';
import { sitemapTask } from './tasks/sitemap-runner';

export function taskFactory<Input extends ZodType | ZodUndefined>({
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
  [GraphileTaskNames.CountAggregator]: countAggregatorTask,
  [GraphileTaskNames.MagnaSync]: magnaSyncTask,
} as const;

import {
  GraphileTask,
  GraphileTaskNames,
  TaskPayloads,
  awardTweetEngagementXpTask,
} from '@hicommonwealth/model/services';
import { Task } from 'graphile-worker';
import { z } from 'zod';
import { archiveOutboxTask } from './tasks/archiveOutbox';
import { captureGroupSnapshotTask } from './tasks/captureGroupSnapshot';
import { cleanChainEventXpSourcesTask } from './tasks/cleanChainEventXpSources';
import { cleanSubscriptionsTask } from './tasks/cleanSubscriptions';
import { countAggregatorTask } from './tasks/countAggregator';
import { magnaSyncTask } from './tasks/magnaSync';
import { runDbMaintenanceTask } from './tasks/runDbMaintenance';
import { sitemapTask } from './tasks/sitemap-runner';

export const graphileTasks: {
  [K in GraphileTaskNames]: GraphileTask<K>;
} = {
  [GraphileTaskNames.ArchiveOutbox]: archiveOutboxTask,
  [GraphileTaskNames.UpdateSitemap]: sitemapTask,
  [GraphileTaskNames.CleanSubscriptions]: cleanSubscriptionsTask,
  [GraphileTaskNames.CleanChainEventXpSources]: cleanChainEventXpSourcesTask,
  [GraphileTaskNames.RunDbMaintenance]: runDbMaintenanceTask,
  [GraphileTaskNames.AwardTwitterEngagementXp]: awardTweetEngagementXpTask,
  [GraphileTaskNames.CountAggregator]: countAggregatorTask,
  [GraphileTaskNames.CaptureGroupSnapshot]: captureGroupSnapshotTask,
  [GraphileTaskNames.MagnaSync]: magnaSyncTask,
} as const;

export function taskFactory<K extends keyof typeof TaskPayloads>({
  input,
  fn,
}: GraphileTask<K>) {
  const task: Task = async (payload, helpers) => {
    const parsedPayload = input.parse(payload) as z.infer<
      (typeof TaskPayloads)[K]
    >;
    await fn(parsedPayload, helpers);
  };
  return task;
}

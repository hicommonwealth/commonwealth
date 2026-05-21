import { events } from '@hicommonwealth/schemas';
import { CronItem, JobHelpers, PromiseOrDirect } from 'graphile-worker';
import { z } from 'zod';

export enum GraphileTaskNames {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
  CleanSubscriptions = 'CleanSubscriptions',
  CleanChainEventXpSources = 'CleanChainEventXpSources',
  RunDbMaintenance = 'RunDbMaintenance',
  AwardTwitterEngagementXp = 'AwardTwitterEngagementXp',
  CountAggregator = 'CountAggregator',
  CaptureGroupSnapshot = 'CaptureGroupSnapshot',
  MagnaSync = 'MagnaSync',
  MagnaTxnSync = 'MagnaTxnSync',
  RefreshMaterializedViews = 'RefreshMaterializedViews',
}

export type CustomCronItem = CronItem & {
  task: GraphileTaskNames;
};

export const TaskPayloads = {
  RefreshMaterializedViews: z.object({}),
  ArchiveOutbox: z.object({}),
  UpdateSitemap: z.object({}),
  CleanSubscriptions: z.object({}),
  CleanChainEventXpSources: z.object({}),
  RunDbMaintenance: z.object({}),
  AwardTwitterEngagementXp: events.TweetEngagementCapReached,
  CountAggregator: z.object({}),
  CaptureGroupSnapshot: z.object({ groupId: z.number() }),
  MagnaSync: z.object({}),
  MagnaTxnSync: z.object({}),
};

export type GraphileTaskHandler<K extends keyof typeof TaskPayloads> = (
  payload: z.infer<(typeof TaskPayloads)[K]>,
  helpers?: JobHelpers,
) => PromiseOrDirect<void | unknown[]>;

export type GraphileTask<K extends keyof typeof TaskPayloads> = {
  readonly input: (typeof TaskPayloads)[K];
  readonly fn: GraphileTaskHandler<K>;
};

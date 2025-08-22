import { events } from '@hicommonwealth/schemas';
import { CronItem, JobHelpers, PromiseOrDirect } from 'graphile-worker';
import { z, ZodType, ZodUndefined } from 'zod';

export enum GraphileTaskNames {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
  CleanSubscriptions = 'CleanSubscriptions',
  CleanChainEventXpSources = 'CleanChainEventXpSources',
  RunDbMaintenance = 'RunDbMaintenance',
  AwardTwitterQuestXp = 'AwardTweetEngagementXp',
  CountAggregator = 'CountAggregator',
  CaptureGroupSnapshot = 'CaptureGroupSnapshot',
  MagnaSync = 'MagnaSync',
  RefreshMaterializedViews = 'RefreshMaterializedViews',
}

export type GraphileTask<Input extends ZodType> = {
  readonly input: Input;
  readonly fn: (
    payload: z.infer<Input>,
    helpers: JobHelpers,
  ) => PromiseOrDirect<void | unknown[]>;
};

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
  AwardTweetEngagementXp: events.TweetEngagementCapReached,
  CountAggregator: z.object({}),
  CaptureGroupSnapshot: z.object({
    groupId: z.number(),
  }),
  MagnaSync: z.object({}),
} as const satisfies Record<GraphileTaskNames, ZodType | ZodUndefined>;

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
  MagnaSync = 'MagnaSync',
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
  ArchiveOutbox: z.object({}),
  UpdateSitemap: z.object({}),
  CleanSubscriptions: z.object({}),
  CleanChainEventXpSources: z.object({}),
  RunDbMaintenance: z.object({}),
  AwardTweetEngagementXp: events.TweetEngagementCapReached,
  CountAggregator: z.object({}),
  MagnaSync: z.object({}),
} as const satisfies Record<GraphileTaskNames, ZodType | ZodUndefined>;

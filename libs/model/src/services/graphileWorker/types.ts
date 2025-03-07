import { CronItem, JobHelpers, PromiseOrDirect } from 'graphile-worker';
import { z, ZodSchema, ZodUndefined } from 'zod';

export enum GraphileQueues {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
  CleanSubscriptions = 'CleanSubscriptions',
  CleanChainEventXpSources = 'CleanChainEventXpSources',
  RunDbMaintenance = 'RunDbMaintenance',
}

export type GraphileTask<
  Input extends ZodSchema | ZodUndefined = ZodUndefined,
> = {
  readonly input: Input;
  readonly fn: (
    payload: z.infer<Input>,
    helpers: JobHelpers,
  ) => PromiseOrDirect<void | unknown[]>;
};

export type GraphileTasksObj = Record<GraphileTaskNames, GraphileTask>;

export type CustomCronItem = CronItem & {
  task: GraphileTaskNames;
};

export enum GraphileTaskNames {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
  CleanSubscriptions = 'CleanSubscriptions',
  CleanChainEventXpSources = 'CleanChainEventXpSources',
  RunDbMaintenance = 'RunDbMaintenance',
  AwardTwitterQuestXp = 'AwardTwitterQuestXp',
}

export const TaskPayloads = {
  ArchiveOutbox: z.undefined(),
  UpdateSitemap: z.undefined(),
  CleanSubscriptions: z.undefined(),
  CleanChainEventXpSources: z.undefined(),
  RunDbMaintenance: z.undefined(),
  AwardTwitterQuestXp: z.object({
    quest_id: z.number(),
    quest_end_date: z.coerce.date(),
  }),
} as const satisfies Record<GraphileTaskNames, ZodSchema | ZodUndefined>;

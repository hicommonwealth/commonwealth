import { CronItem, JobHelpers, PromiseOrDirect } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';

export enum GraphileTaskNames {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
  CleanSubscriptions = 'CleanSubscriptions',
  CleanChainEventXpSources = 'CleanChainEventXpSources',
  RunDbMaintenance = 'RunDbMaintenance',
  AwardTwitterQuestXp = 'AwardTwitterQuestXp',
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

export type CustomCronItem = CronItem & {
  task: GraphileTaskNames;
};

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

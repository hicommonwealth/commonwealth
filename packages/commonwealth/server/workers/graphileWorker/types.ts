import { CronItem, JobHelpers, PromiseOrDirect } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';

export enum GraphileTasks {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
}

export enum GraphileQueues {
  ArchiveOutbox = 'ArchiveOutbox',
  UpdateSitemap = 'UpdateSitemap',
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

export type GraphileTasksObj = Record<GraphileTasks, GraphileTask>;

export type CustomCronItem = CronItem & {
  task: GraphileTasks;
};

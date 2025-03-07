import { JobHelpers, PromiseOrDirect } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';

export enum GraphileTasks {
  ArchiveOutbox = 'ArchiveOutbox',
}

export enum GraphileQueues {
  ArchiveOutbox = 'ArchiveOutbox',
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

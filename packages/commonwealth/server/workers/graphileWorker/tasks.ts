import { Task } from 'graphile-worker';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { archiveOutboxTask } from './tasks/archive-outbox';
import { GraphileTask, GraphileTasks, GraphileTasksObj } from './types';

export function taskFactory<
  Input extends ZodSchema | ZodUndefined = ZodUndefined,
>({ input, fn }: GraphileTask) {
  const task: Task = async (payload, helpers) => {
    const parsedPayload: z.infer<Input> = input.parse(payload);
    await fn(parsedPayload, helpers);
  };
  return task;
}

export const graphileTasks: GraphileTasksObj = {
  [GraphileTasks.ArchiveOutbox]: archiveOutboxTask,
};

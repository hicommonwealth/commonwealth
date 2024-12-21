import { trpc } from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { ZodSchema } from 'zod';

const log = logger(import.meta);

export function incrementThreadViewCount<
  Input extends ZodSchema<{ thread_id: number } | { thread_ids: string }>,
  Output extends ZodSchema,
>() {
  return trpc.fireAndForget<Input, Output>(async (input) => {
    try {
      let id: number | Array<number> = [];
      if ('thread_ids' in input) {
        const parsedThreadIds = input.thread_ids
          .split(',')
          .map((x) => parseInt(x, 10));
        id =
          parsedThreadIds.length === 1 ? parsedThreadIds[0] : parsedThreadIds;
      } else {
        id = input.thread_id;
      }
      await models.Thread.increment({ view_count: 1 }, { where: { id } });
    } catch (err) {
      log.error(err);
    }
  });
}

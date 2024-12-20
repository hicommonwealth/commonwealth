import { trpc } from '@hicommonwealth/adapters';
import { models } from '@hicommonwealth/model';

export const incrementThreadViewCount = trpc.fireAndForget(
  async (input: { thread_id: number } | { thread_ids: string }) => {
    let id: number | Array<number> = [];
    if ('thread_ids' in input) {
      const parsedThreadIds = input.thread_ids
        .split(',')
        .map((x) => parseInt(x, 10));
      id = parsedThreadIds.length === 1 ? parsedThreadIds[0] : parsedThreadIds;
    } else {
      id = input.thread_id;
    }
    await models.Thread.increment({ view_count: 1 }, { where: { id } });
  },
);

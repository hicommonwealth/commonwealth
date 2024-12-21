import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';

const log = logger(import.meta);

export function incrementThreadViewCount() {
  return (input: { thread_id: number } | { thread_ids: string }) => {
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
      void models.Thread.increment({ view_count: 1 }, { where: { id } }).catch(
        log.error,
      );
    } catch (err) {
      log.error(err);
    }
  };
}

import { AppError, query } from '@hicommonwealth/core';
import { Community, Thread } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  GetThreads,
  GetThreadsOrderBy,
  GetThreadsStatus,
} from '@hicommonwealth/schemas';
import { getDecodedString, slugify } from '@hicommonwealth/shared';
import { Feed } from 'feed';
import moment from 'moment';
import { z } from 'zod';
import { formatErrorPretty } from '../util/errorFormat';

type SortByDate = {
  last_edited?: string | Date | null;
  created_at?: string | Date | null;
};

function toDate(t: SortByDate): Date {
  return moment(t.last_edited ?? t.created_at!).toDate();
}

function sortByDateDesc(a: SortByDate, b: SortByDate) {
  return toDate(b).getTime() - toDate(a).getTime();
}

function computeUpdated(bulkThreads: z.infer<typeof GetThreads.output>) {
  if (bulkThreads.results.length === 0) {
    // there are no threads
    return new Date();
  }

  const sortedByDateDesc = [...bulkThreads.results].sort(sortByDateDesc);

  // return the most recent thread and get its date
  return toDate(sortedByDateDesc[0]);
}

export const get_feed_router = async (req, res) => {
  const queryValidationResult = schemas.DEPRECATED_GetThreads.safeParse(
    req.query,
  );

  if (queryValidationResult.success === false) {
    throw new AppError(formatErrorPretty(queryValidationResult));
  }

  const { thread_ids, bulk, active, search, community_id } =
    queryValidationResult.data;

  if (active || search || thread_ids) {
    throw new AppError('Not implemented');
  }

  // get bulk threads
  if (bulk) {
    const bulkQueryValidationResult =
      schemas.DEPRECATED_GetBulkThreads.safeParse(req.query);

    if (bulkQueryValidationResult.success === false) {
      throw new AppError(formatErrorPretty(bulkQueryValidationResult));
    }

    const {
      stage,
      topic_id,
      includePinnedThreads,
      limit,
      page,
      orderBy,
      from_date,
      to_date,
      archived,
      contestAddress,
      status,
    } = bulkQueryValidationResult.data;

    const community = await query(Community.GetCommunity(), {
      actor: { user: { email: '' } },
      payload: { id: community_id },
    });
    if (!community) throw new AppError('Community not found');

    const bulkThreads = await query(Thread.GetThreads(), {
      actor: { user: { email: '' } },
      payload: {
        cursor: page || 1,
        limit: limit || 20,
        community_id,
        stage,
        topic_id,
        includePinnedThreads,
        order_by: orderBy as z.infer<typeof GetThreadsOrderBy>,
        from_date,
        to_date,
        archived,
        contestAddress,
        status: status as z.infer<typeof GetThreadsStatus>,
      },
    });

    const updated = computeUpdated(bulkThreads!);
    // const self = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const feed = new Feed({
      title: community.name,
      description: community.description!,
      id: `https://common.xyz/${community_id}/discussions`,
      link: `https://common.xyz/${community_id}/discussions`,
      image: community.icon_url!,
      copyright: 'All rights Reserved 2024, common.xyz',
      updated,
      generator: 'common.xyz',
      feedLinks: {
        // atom: self
      },
    });

    bulkThreads!.results.forEach((thread) => {
      const title = getDecodedString(thread.title);
      const slug = slugify(title);
      feed.addItem({
        title: title,
        id: thread.url!,
        link: `https://common.xyz/${community_id}/discussions/${thread.id}-${slug}`,
        date: toDate(thread),
        content: thread.body || '',
        author: [{ name: thread.profile_name! }],
      });
    });

    // set the content type in the response header.
    // res.setHeader('content-type', 'text/xml.');
    res.setHeader('content-type', 'application/atom+xml.');

    res.write(feed.atom1());
  }
  res.end();
};

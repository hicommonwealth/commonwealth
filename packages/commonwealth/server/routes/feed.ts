import { AppError, query } from '@hicommonwealth/core';
import { Thread, type DB } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  GetThreads,
  GetThreadsOrderBy,
  GetThreadsStatus,
} from '@hicommonwealth/schemas';
import { getDecodedString, slugify } from '@hicommonwealth/shared';
import { ThreadView } from 'client/scripts/models/Thread';
import { Feed } from 'feed';
import moment from 'moment';
import { z } from 'zod';
import { ServerControllers } from '../routing/router';
import { TypedRequestQuery, TypedResponse } from '../types';
import { formatErrorPretty } from '../util/errorFormat';
import {
  ActiveThreadsRequestQuery,
  BulkThreadsRequestQuery,
  GetThreadsRequestQuery,
  GetThreadsResponse,
  SearchThreadsRequestQuery,
} from './threads/get_threads_handler';

function toDate(t: ThreadView): Date {
  return moment(t.last_edited ?? t.created_at!).toDate();
}

function sortByDateDesc(a: ThreadView, b: ThreadView) {
  return toDate(b).getTime() - toDate(a).getTime();
}

function computeUpdated(bulkThreads: z.infer<typeof GetThreads.output>) {
  if (bulkThreads.threads.length === 0) {
    // there are no threads
    return new Date();
  }

  const sortedByDateDesc = [...bulkThreads.threads].sort(sortByDateDesc);

  // return the most recent thread and get its date
  return toDate(sortedByDateDesc[0]);
}

export const getFeedHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestQuery<
    GetThreadsRequestQuery &
      (
        | ActiveThreadsRequestQuery
        | SearchThreadsRequestQuery
        | BulkThreadsRequestQuery
      )
  >,
  res: TypedResponse<GetThreadsResponse>,
) => {
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

    const bulkThreads = await query(Thread.GetThreads(), {
      actor: { user: { email: '' } },
      payload: {
        page,
        limit,
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

    const community = await models.Community.findOne({
      where: {
        id: community_id,
      },
    });
    const updated = computeUpdated(bulkThreads!);
    // const self = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const feed = new Feed({
      // @ts-expect-error StrictNullChecks
      title: community.name,
      // @ts-expect-error StrictNullChecks
      description: community.description,
      id: `https://common.xyz/${community_id}/discussions`,
      link: `https://common.xyz/${community_id}/discussions`,
      // @ts-expect-error StrictNullChecks
      image: community.icon_url,
      copyright: 'All rights Reserved 2024, common.xyz',
      updated,
      generator: 'common.xyz',
      feedLinks: {
        // atom: self
      },
    });

    bulkThreads!.threads.forEach((thread) => {
      const title = getDecodedString(thread.title);
      const slug = slugify(title);
      feed.addItem({
        title: title,
        // @ts-expect-error StrictNullChecks
        id: thread.url,
        link: `https://common.xyz/${community_id}/discussions/${thread.id}-${slug}`,
        date: toDate(thread),
        content: thread.body || '',
        author: [
          {
            // @ts-expect-error StrictNullChecks
            name: thread.profile_name,
          },
        ],
      });
    });

    // set the content type in the response header.
    // res.setHeader('content-type', 'text/xml.');
    res.setHeader('content-type', 'application/atom+xml.');

    res.write(feed.atom1());
  }
  res.end();
};

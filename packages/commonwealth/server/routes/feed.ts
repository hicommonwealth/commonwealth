import { AppError } from '@hicommonwealth/core';
import { Thread, ThreadAttributes, type DB } from '@hicommonwealth/model';
import { Feed } from 'feed';
import { slugify } from '../../shared/utils';
import { GetBulkThreadsResult } from '../controllers/server_threads_methods/get_bulk_threads';
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

function toDate(t: ThreadAttributes): Date {
  return t.last_edited ?? t.created_at;
}

function sortByDateDesc(a: ThreadAttributes, b: ThreadAttributes) {
  return toDate(b).getTime() - toDate(a).getTime();
}

function computeUpdated(bulkThreads: GetBulkThreadsResult): Date {
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
  const queryValidationResult = Thread.GetThreadsParamsSchema.safeParse(
    req.query,
  );

  if (queryValidationResult.success === false) {
    throw new AppError(formatErrorPretty(queryValidationResult));
  }

  const { thread_ids, bulk, active, search, community_id } =
    queryValidationResult.data;

  if (active || search || thread_ids) {
    throw new Error('Not implemented');
  }

  // get bulk threads
  if (bulk) {
    const bulkQueryValidationResult =
      Thread.GetBulkThreadsParamsSchema.safeParse(req.query);

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
    } = bulkQueryValidationResult.data;

    const bulkThreads = await controllers.threads.getBulkThreads({
      communityId: community_id,
      stage,
      topicId: topic_id,
      includePinnedThreads,
      page,
      limit,
      orderBy,
      fromDate: from_date,
      toDate: to_date,
      archived: archived,
    });

    const community = await models.Community.findOne({
      where: {
        id: community_id,
      },
    });
    const updated = computeUpdated(bulkThreads);
    // const self = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const feed = new Feed({
      title: community.name,
      description: community.description,
      id: `https://common.xyz/${community_id}/discussions`,
      link: `https://common.xyz/${community_id}/discussions`,
      image: community.icon_url,
      copyright: 'All rights Reserved 2024, common.xyz',
      updated,
      generator: 'common.xyz',
      feedLinks: {
        // atom: self
      },
    });

    bulkThreads.threads.forEach((thread) => {
      const title = decodeURIComponent(thread.title);
      const slug = slugify(title);
      feed.addItem({
        title: title,
        id: thread.url,
        link: `https://common.xyz/${community_id}/discussions/${thread.id}-${slug}`,
        date: toDate(thread),
        content: thread.body,
        description: thread.plaintext,
        author: [
          {
            name: thread.profile_name,
          },
        ],
      });
    });

    // set the content type in the response header.
    // res.setHeader('content-type', 'text/xml.');
    res.setHeader('content-type', 'application/atom+xml.');

    res.write(feed.atom1());
    res.end();
  }
};

import { AppError, query } from '@hicommonwealth/core';
import { Community, Thread } from '@hicommonwealth/model';
import { GetThreads } from '@hicommonwealth/schemas';
import { getDecodedString, slugify } from '@hicommonwealth/shared';
import { Feed } from 'feed';
import moment from 'moment';
import { z } from 'zod';

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

export const get_atom_feed_router = async (req, res) => {
  const {
    stage,
    community_id,
    topic_id,
    includePinnedThreads,
    limit,
    cursor,
    order_by,
    from_date,
    to_date,
    archived,
    contestAddress,
    status,
  } = req.query as z.infer<typeof GetThreads.input>;

  const community = await query(Community.GetCommunity(), {
    actor: { user: { email: '' } },
    payload: { id: community_id },
  });
  if (!community) throw new AppError('Community not found');

  const threads = await query(Thread.GetThreads(), {
    actor: { user: { email: '' } },
    context: undefined, // no auth context to exclude private topics
    payload: {
      cursor: cursor || 1,
      limit: limit || 20,
      community_id,
      stage,
      topic_id,
      includePinnedThreads,
      order_by,
      from_date,
      to_date,
      archived,
      contestAddress,
      status,
    },
  });

  // return the most recent thread and get its date
  const updated =
    threads && threads.results.length > 0
      ? toDate([...threads.results].sort(sortByDateDesc).at(0)!)
      : // there are no threads
        new Date();

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

  threads!.results.forEach((thread) => {
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
  res.end();
};

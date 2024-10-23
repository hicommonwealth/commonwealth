import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { getDecodedString, safeTruncateBody } from '@hicommonwealth/shared';
import z from 'zod';
import { getThreadUrl } from '../util';

const log = logger(import.meta);
const output = z.boolean();

export const processThreadUpvoted: EventHandler<
  'ThreadUpvoted',
  typeof output
> = async ({ payload }) => {
  const threadAndAuthor = await models.Thread.findOne({
    where: {
      id: payload.thread_id,
    },
    include: [
      {
        model: models.Address,
        as: 'Address',
        required: true,
        attributes: ['id'],
        include: [
          {
            model: models.User,
            required: true,
          },
        ],
      },
    ],
  });

  if (!threadAndAuthor) {
    log.error('Thread not found!', undefined, payload);
    return false;
  }

  if (!threadAndAuthor.Address) {
    log.error('Thread author not found!', undefined, payload);
    return false;
  }

  const threadAuthorSubscription = await models.ThreadSubscription.findOne({
    where: {
      user_id: threadAndAuthor.Address.User!.id,
      thread_id: payload.thread_id,
    },
  });
  if (!threadAuthorSubscription) {
    log.debug('Thread author is not subscribed to their thread');
    return true;
  }

  const community = await models.Community.findByPk(payload.community_id, {
    attributes: ['name', 'custom_domain'],
  });
  if (!community) {
    log.error('Community not found!', undefined, payload);
    return false;
  }

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.NewUpvotes,
    users: [{ id: String(threadAuthorSubscription.user_id) }],
    data: {
      community_id: payload.community_id,
      community_name: community.name,
      reaction: payload.reaction,
      thread_id: payload.thread_id,
      thread_title: safeTruncateBody(getDecodedString(threadAndAuthor.title)),
      created_at: payload.created_at!.toISOString(),
      object_url: getThreadUrl(
        payload.community_id,
        payload.thread_id,
        community.custom_domain,
      ),
    },
  });

  return !res.some((r) => r.status === 'rejected');
};

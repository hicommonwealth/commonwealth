import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import z from 'zod';

const log = logger(import.meta);
const output = z.boolean();

export const processThreadUpvoted: EventHandler<
  'ThreadUpvoted',
  typeof output
> = async ({ payload }) => {
  const threadAndAuthor = await models.Thread.findOne({
    where: {
      id: payload.thread_id!,
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
      thread_id: payload.thread_id!,
    },
  });
  if (!threadAuthorSubscription) {
    log.debug('Thread author is not subscribed to their thread');
    return true;
  }

  const provider = notificationsProvider();
  return await provider.triggerWorkflow({
    key: WorkflowKeys.NewUpvotes,
    users: [{ id: String(threadAuthorSubscription.user_id) }],
    data: {},
  });
};

import { command, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { CreateComment } from '../aggregates/comment/CreateComment.command';
import { models } from '../database';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
};

async function sendAutoReply(
  community_id: string,
  address_id: number,
  thread_id: number,
  comment_id?: number,
) {
  // find creator address, ignore if admin
  const address = await models.Address.findOne({
    where: {
      community_id,
      id: address_id,
    },
    attributes: ['role'],
  });
  if (!address || address.role === 'admin') return;

  // create reply comment when spam detected
  const admin = await models.Address.findOne({
    where: {
      community_id,
      role: 'admin',
    },
    attributes: ['address', 'user_id'],
  });
  if (admin)
    await command(CreateComment(), {
      actor: {
        address: admin.address,
        user: {
          id: admin.user_id!,
          email: '',
        },
      },
      payload: {
        thread_id,
        parent_id: comment_id,
        body: "Your post has been marked as spam because you do not meet the community's minimum trust level required",
      },
    });
}

export function AutoReplyToSpam(): Policy<typeof inputs, ZodUndefined> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const { community_id, address_id, id, marked_as_spam_at } = payload;
        if (marked_as_spam_at)
          await sendAutoReply(community_id, address_id, id!);
      },
      CommentCreated: async ({ payload }) => {
        const { community_id, address_id, thread_id, id, marked_as_spam_at } =
          payload;
        if (marked_as_spam_at)
          await sendAutoReply(community_id, address_id, thread_id, id!);
      },
    },
  };
}

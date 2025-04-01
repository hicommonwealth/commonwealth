import { command, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { CreateComment } from '../aggregates/comment/CreateComment.command';
import { systemActor } from '../middleware';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
};

async function sendAutoReply(thread_id: number, comment_id?: number) {
  // create reply comment when spam detected
  await command(CreateComment(), {
    actor: systemActor({}),
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
        const { id, marked_as_spam_at } = payload;
        if (marked_as_spam_at) await sendAutoReply(id!);
      },
      CommentCreated: async ({ payload }) => {
        const { thread_id, id, marked_as_spam_at } = payload;
        if (marked_as_spam_at) await sendAutoReply(thread_id, id!);
      },
    },
  };
}

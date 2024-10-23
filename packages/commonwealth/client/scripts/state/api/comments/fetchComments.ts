import { ViewComments } from '@hicommonwealth/schemas';
import Comment from 'models/Comment';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const COMMENTS_STALE_TIME = 30 * 1_000; // 30 s

/**
 * @Deprecated
 */
const mapToLegacyCommentsModel = async (
  comments: z.infer<typeof ViewComments.output>,
) => {
  return comments.map(
    (c) =>
      new Comment({
        id: c.id,
        text: c.text,
        author: c.Address.address,
        community_id: c.community_id,
        Address: c.Address,
        thread_id: c.thread_id,
        parent_id: c.parent_id,
        // TODO: why is this not plural
        reactions: c.Reaction,
        reaction_weights_sum: c.reaction_weights_sum,
        created_at: c.created_at,
        deleted_at: c.deleted_at,
        authorChain: c.Thread.community_id,
        last_edited: c.last_edited,
        canvas_signed_data: c.canvas_signed_data,
        canvas_msg_id: c.canvas_msg_id,
        CommentVersionHistories: c.CommentVersionHistories,
        marked_as_spam_at: c.marked_as_spam_at,
        discord_meta: c.discord_meta,
      }),
  );
};

type useViewCommentsProps = z.infer<typeof ViewComments.input> & {
  apiEnabled?: boolean;
};

const useFetchCommentsQuery = ({
  thread_id,
  apiEnabled = true,
}: useViewCommentsProps) => {
  return trpc.comment.viewComments.useQuery(
    { thread_id },
    {
      enabled: apiEnabled,
      staleTime: COMMENTS_STALE_TIME,
    },
  );
};

export default useFetchCommentsQuery;

import {
  CWAddressWithDiscourseId,
  CWCommentWithDiscourseId,
  CWThreadWithDiscourseId,
  models,
  ReactionAttributes,
} from '@hicommonwealth/model';
import { Reaction } from '@hicommonwealth/schemas';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

type CWReactionWithDiscourseId = z.infer<typeof Reaction> & {
  discoursePostActionId: number | null;
  discourseTopicId: number | null;
  created: boolean;
};

class DiscourseQueries {
  static fetchThreadsReactions = async (session: Sequelize) => {
    return session.query<{
      user_id: number;
      topic_id: number;
      liked: boolean;
      email: string;
    }>(
      `
    SELECT topic_users.user_id, topic_id, liked, email
    FROM public.topic_users
    inner join topics on topics.id = topic_users.topic_id
    inner join user_emails on user_emails.user_id=topic_users.user_id
    where liked = true
    and topics.deleted_at is null
    and topics.category_id is not null
    and topic_users.user_id > 0
    and email != 'no_email'
    and email != 'discobot_email';
    `,
      { type: QueryTypes.SELECT },
    );
  };

  static fetchCommentsReactions = async (session: Sequelize) => {
    return session.query<{
      id: number;
      post_id: number;
      user_id: number;
      post_action_type_id: number;
      deleted_at: Date | null;
      name_key: string;
    }>(
      `
        SELECT post_actions.id, post_id, user_id, post_action_type_id, deleted_at, name_key
        FROM public.post_actions inner join post_action_types
        on post_actions.post_action_type_id = post_action_types.id
        where name_key = 'like'
        and deleted_at is null
        and user_id > 0
        order by user_id
        `,
      { type: QueryTypes.SELECT },
    );
  };
}

class CWQueries {
  static createOrFindReaction = async (
    {
      discoursePostActionId,
      discourseTopicId,
      communityId,
      addressId,
      threadId,
      commentId,
    }: {
      discoursePostActionId: number | null | undefined;
      discourseTopicId: number | null | undefined;
      communityId: string;
      addressId: number;
      threadId: number | null | undefined;
      commentId: number | null | undefined;
    },
    { transaction }: { transaction: Transaction | null },
  ): Promise<CWReactionWithDiscourseId> => {
    const options: ReactionAttributes = {
      community_id: communityId,
      address_id: addressId,
      reaction: 'like',
      canvas_signed_data: '',
      canvas_hash: '',
      calculated_voting_weight: 0,
    };
    if (threadId) {
      options.thread_id = threadId;
    }
    if (commentId) {
      options.comment_id = commentId;
    }
    const [reaction, created] = await models.Reaction.findOrCreate({
      where: options,
      defaults: options,
      transaction,
    });
    return {
      ...reaction.get({ plain: true }),
      discoursePostActionId: discoursePostActionId || null,
      discourseTopicId: discourseTopicId || null,
      created,
    };
  };
}

export const createAllReactionsInCW = async (
  discourseConnection: Sequelize,
  {
    communityId,
    addresses,
    threads,
    comments,
  }: {
    communityId: string;
    addresses: Array<CWAddressWithDiscourseId>;
    threads: Array<CWThreadWithDiscourseId>;
    comments: Array<CWCommentWithDiscourseId>;
  },
  { transaction }: { transaction: Transaction | null },
): Promise<Array<CWReactionWithDiscourseId>> => {
  const [threadReactions, commentReactions] = await Promise.all([
    DiscourseQueries.fetchThreadsReactions(discourseConnection),
    DiscourseQueries.fetchCommentsReactions(discourseConnection),
  ]);

  const reactionPromises: Array<Promise<CWReactionWithDiscourseId | null>> = [
    ...threadReactions.map(
      ({
        user_id: discourseReactionUserId,
        topic_id: discourseReactionTopicId,
      }) => {
        const addressId = addresses.find(
          ({ discourseUserId }) => discourseUserId === discourseReactionUserId,
        )?.id;
        const threadId = threads.find(
          ({ discourseTopicId }) =>
            discourseTopicId === discourseReactionTopicId,
        )?.id;
        if (addressId && threadId) {
          return CWQueries.createOrFindReaction(
            {
              discourseTopicId: discourseReactionTopicId,
              discoursePostActionId: null,
              communityId,
              addressId,
              threadId,
              commentId: null,
            },
            { transaction },
          );
        }
        return Promise.resolve(null);
      },
    ),
    ...commentReactions.map(
      ({
        id: discoursePostActionId,
        user_id: discourseReactionUserId,
        post_id: discourseReactionPostId,
      }) => {
        const addressId = addresses.find(
          ({ discourseUserId }) => discourseUserId === discourseReactionUserId,
        )?.id;
        const commentId = comments.find(
          ({ discoursePostId }) => discoursePostId === discourseReactionPostId,
        )?.id;
        if (addressId && commentId) {
          return CWQueries.createOrFindReaction(
            {
              discourseTopicId: null,
              discoursePostActionId,
              communityId,
              addressId,
              threadId: null,
              commentId,
            },
            { transaction },
          );
        }
        return Promise.resolve(null);
      },
    ),
  ];

  const createdReactions = await Promise.all(reactionPromises);
  return createdReactions.filter(Boolean) as Array<CWReactionWithDiscourseId>;
};

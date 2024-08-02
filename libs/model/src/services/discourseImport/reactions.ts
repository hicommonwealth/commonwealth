import {
  CWAddressWithDiscourseId,
  CWCommentWithDiscourseId,
  CWThreadWithDiscourseId,
  models,
  ReactionAttributes,
} from '@hicommonwealth/model';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

class DiscourseQueries {
  static fetchThreadsReactions = async (session: Sequelize) => {
    return session.query<{
      user_id: any;
      topic_id: any;
      liked: any;
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
      id: any;
      post_id: any;
      user_id: any;
      post_action_type_id: any;
      deleted_at: any;
      name_key: any;
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
      communityId,
      addressId,
      threadId,
      commentId,
    }: {
      communityId: string;
      addressId: number;
      threadId: number | null | undefined;
      commentId: number | null | undefined;
    },
    { transaction }: { transaction: Transaction },
  ) => {
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
    const [createdReaction] = await models.Reaction.findOrCreate({
      where: options,
      defaults: options,
      transaction,
    });
    return createdReaction.get({ plain: true });
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
  { transaction }: { transaction: Transaction },
) => {
  const [threadReactions, commentReactions] = await Promise.all([
    DiscourseQueries.fetchThreadsReactions(discourseConnection),
    DiscourseQueries.fetchCommentsReactions(discourseConnection),
  ]);

  const allReactions = [...threadReactions, ...commentReactions];
  const reactionPromises = allReactions.map(
    ({
      user_id: discourseReactionUserId,
      topic_id: discourseReactionTopicId,
      post_id: discourseReactionPostId,
    }: any) => {
      const { id: addressId } =
        addresses.find(
          ({ discourseUserId }) => discourseUserId === discourseReactionUserId,
        ) || {};
      const { id: threadId } =
        threads.find(
          ({ discourseTopicId }) =>
            discourseTopicId === discourseReactionTopicId,
        ) || {};
      const { id: commentId } =
        comments.find(
          ({ discoursePostId }) => discoursePostId === discourseReactionPostId,
        ) || {};
      if (addressId && (threadId || commentId)) {
        return CWQueries.createOrFindReaction(
          {
            communityId,
            addressId,
            threadId,
            commentId,
          },
          { transaction },
        );
      }
      return null;
    },
  );
  const createdReactions = await Promise.all(reactionPromises);
  return createdReactions.filter(Boolean).map((reaction) => reaction!.id);
};

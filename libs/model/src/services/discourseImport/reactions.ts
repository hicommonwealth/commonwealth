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

type CreateReactionOptions = {
  discoursePostActionId: number | null | undefined;
  discourseTopicId: number | null | undefined;
  communityId: string;
  addressId: number;
  threadId: number | null | undefined;
  commentId: number | null | undefined;
};

class CWQueries {
  static bulkCreateReactions = async (
    entries: CreateReactionOptions[],
    { transaction }: { transaction: Transaction | null },
  ): Promise<CWReactionWithDiscourseId> => {
    const reactionsToCreate = entries.map(
      ({ communityId, addressId, threadId, commentId }) => {
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
        return options;
      },
    );

    const reactions = await models.Reaction.bulkCreate(reactionsToCreate, {
      transaction,
    });

    return reactions.map((reaction, i) => ({
      ...reaction.get({ plain: true }),
      discoursePostActionId: entries[i].discoursePostActionId || null,
      discourseTopicId: entries[i].discourseTopicId || null,
      created: true,
    }));
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

  const reactionsToCreate: Array<CreateReactionOptions> = [
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
          return {
            discourseTopicId: discourseReactionTopicId,
            discoursePostActionId: null,
            communityId,
            addressId,
            threadId,
            commentId: null,
          };
        }
        return null;
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
          return {
            discourseTopicId: null,
            discoursePostActionId,
            communityId,
            addressId,
            threadId: null,
            commentId,
          };
        }
        return null;
      },
    ),
  ].filter((entry) => !!entry);

  return CWQueries.bulkCreateReactions(reactionsToCreate, { transaction });
};

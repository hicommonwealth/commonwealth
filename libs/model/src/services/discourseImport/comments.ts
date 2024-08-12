import {
  CWAddressWithDiscourseId,
  CWThreadWithDiscourseId,
  models,
} from '@hicommonwealth/model';
import { Comment, Thread } from '@hicommonwealth/schemas';
import lo from 'lodash';
import moment from 'moment';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { threadId } from 'worker_threads';
import { z } from 'zod';

export type CWCommentWithDiscourseId = z.infer<typeof Comment> & {
  discoursePostId: number;
  discoursePostNumber: number;
  created: boolean;
};

// Discourse Post == CW Comment
type DiscoursePost = {
  id: number;
  post_number: number;
  user_id: any;
  reply_to_post_number: number;
  cooked: any;
  reply_count: number;
  topic_id: number;
  like_count: number;
  created_at: string;
  updated_at: string;
};

class DiscourseQueries {
  static fetchPosts = async (session: Sequelize) => {
    return session.query<DiscoursePost>(
      `
        select posts.id, post_number, posts.user_id, reply_to_post_number, cooked, posts.reply_count,
        posts.topic_id, posts.like_count, posts.created_at, posts.updated_at
        from posts
        inner join topics on topics.id = posts.topic_id
        where posts.deleted_at is null
        and topics.deleted_at is null
        and category_id is not null
        and posts.user_id > 0
        and topics.user_id > 0
        order by posts.created_at
    `,
      { raw: true, type: QueryTypes.SELECT },
    );
  };
}

type CommentEntry = {
  discoursePost: DiscoursePost;
  parentCommentId: number | null;
  communityId: string;
  threadId: number;
  addressId: number;
};

class CWQueries {
  static bulkCreateComments = async (
    entries: CommentEntry[],
    { transaction }: { transaction: Transaction | null },
  ): Promise<Array<CWCommentWithDiscourseId>> => {
    const commentsToCreate: Array<z.infer<typeof Comment>> = entries.map(
      ({
        discoursePost,
        parentCommentId,
        communityId,
        threadId,
        addressId,
      }) => ({
        community_id: communityId,
        parent_id: `${parentCommentId}`,
        address_id: addressId,
        plaintext: discoursePost.cooked.replace(/'/g, "''"),
        canvas_signed_data: '',
        canvas_hash: '',
        reaction_count: discoursePost.like_count,
        thread_id: threadId,
        text: encodeURIComponent(discoursePost.cooked.replace(/'/g, "''")),
        created_at: moment(discoursePost.created_at).toDate(),
        updated_at: moment(discoursePost.updated_at).toDate(),
      }),
    );

    const existingComments = await models.Comment.findAll({
      where: {
        [Op.or]: commentsToCreate.map((c) => ({
          community_id: c.community_id,
          thread_id: threadId,
          created_at: c.created_at,
        })),
      },
    });

    const filteredAddressesToCreate = commentsToCreate.filter(
      (c) =>
        !existingComments.find(
          (ec) =>
            c.community_id === ec.community_id &&
            c.thread_id === ec.thread_id &&
            c.created_at === ec.created_at,
        ),
    );

    const createdAddresses = await models.Comment.bulkCreate(
      filteredAddressesToCreate,
      {
        transaction,
      },
    );

    return [
      ...existingComments.map((a) => ({
        ...a.get({ plain: true }),
        created: false,
      })),
      ...createdAddresses.map((a) => ({
        ...a.get({ plain: true }),
        created: true,
      })),
    ].map((comment) => ({
      ...comment,
      discoursePostId: entries.find((c) =>
        moment(c.discoursePost.created_at).isSame(comment.created_at),
      )!.discoursePost.id,
      discoursePostNumber: entries.find((c) =>
        moment(c.discoursePost.created_at).isSame(comment.created_at),
      )!.discoursePost.post_number,
    }));
  };

  static setThreadCommentCounts = async (
    threads: Array<z.infer<typeof Thread>>,
    comments: Array<z.infer<typeof Comment>>,
    { transaction }: { transaction: Transaction | null },
  ): Promise<void> => {
    for (const thread of threads) {
      const numThreadComments = comments.filter(
        (c) => c.thread_id === thread.id,
      ).length;
      await models.Thread.update(
        {
          comment_count: numThreadComments,
        },
        {
          where: {
            id: thread.id,
          },
          transaction,
        },
      );
    }
  };
}

export const createAllCommentsInCW = async (
  discourseConnection: Sequelize,
  {
    communityId,
    addresses,
    threads,
  }: {
    communityId: string;
    addresses: Array<CWAddressWithDiscourseId>;
    threads: Array<CWThreadWithDiscourseId>;
  },
  { transaction }: { transaction: Transaction | null },
): Promise<Array<CWCommentWithDiscourseId>> => {
  const discoursePosts = await DiscourseQueries.fetchPosts(discourseConnection);
  const postsGroupedByTopic: Record<number, Array<DiscoursePost>> = lo.groupBy(
    discoursePosts,
    ({ topic_id: discourseTopicId }) => discourseTopicId,
  );
  const entries: CommentEntry[] = [];

  // iterate over each topic (CW thread)
  for (const [discourseTopicId, posts] of Object.entries(postsGroupedByTopic)) {
    const sortedPosts = lo.sortBy(posts, ({ post_number }) => post_number);
    const { id: cwThreadId } =
      threads.find(
        (thread) => `${thread.discourseTopicId}` === `${discourseTopicId}`,
      ) || {};

    if (!cwThreadId) {
      throw new Error(
        `Error: Thread ID not found for discourse topic ID ${discourseTopicId}`,
      );
    }

    // iterate over each post (CW comment)
    for (const post of sortedPosts) {
      const {
        topic_id: discourseTopicId,
        post_number: discoursePostNumber,
        user_id: discoursePostUserId,
        reply_to_post_number: discoursePostReplyToPostNumber,
      } = post;

      if (discoursePostNumber <= 0) {
        continue;
      }

      const { id: addressId } =
        addresses.find(
          ({ discourseUserId }) => discourseUserId === discoursePostUserId,
        ) || {};
      if (!addressId) {
        throw new Error(
          `Error: Address not found for user ${discoursePostUserId}`,
        );
      }

      const parentCommentId: number | null = discoursePostReplyToPostNumber
        ? entries.find(
            (otherComment) =>
              otherComment.discoursePost.topic_id === discourseTopicId &&
              otherComment.discoursePost.post_number ===
                discoursePostReplyToPostNumber,
          )?.discoursePost.id || null
        : null;

      entries.push({
        discoursePost: post,
        parentCommentId,
        communityId,
        threadId: cwThreadId,
        addressId,
      });
    }
  }

  const comments = await CWQueries.bulkCreateComments(entries, { transaction });

  await CWQueries.setThreadCommentCounts(threads, comments, { transaction });

  return comments;
};

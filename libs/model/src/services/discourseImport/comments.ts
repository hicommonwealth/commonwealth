import {
  CWAddressWithDiscourseId,
  CWThreadWithDiscourseId,
  models,
} from '@hicommonwealth/model';
import { Comment } from '@hicommonwealth/schemas';
import lo from 'lodash';
import moment from 'moment';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';

export type CWCommentWithDiscourseId = z.infer<typeof Comment> & {
  discoursePostId: number;
};

// Discourse Post == CW Comment
type DiscoursePost = {
  id: any;
  post_number: number;
  user_id: any;
  reply_to_post_number: number;
  cooked: any;
  reply_count: number;
  topic_id: any;
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

class CWQueries {
  static createComment = async (
    discoursePost: DiscoursePost,
    parentCommentId: number,
    communityId: string,
    threadId: number,
    addressId: number,
    { transaction }: { transaction: Transaction },
  ): Promise<CWCommentWithDiscourseId> => {
    const options: z.infer<typeof Comment> = {
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
    };
    const [comment] = await models.Comment.findOrCreate({
      where: options,
      defaults: options,
      transaction,
    });
    return {
      ...comment.get({ plain: true }),
      discoursePostId: discoursePost.id,
    };
    // const [createdComment] = await models.sequelize.query<{
    //   id: number;
    //   communityId: string;
    //   parent_id: number;
    //   address_id: string;
    //   text: string;
    //   created_at: string;
    //   updated_at: string;
    //   deleted_at: string;
    //   version_history: any[];
    //   root_id: any;
    //   plaintext: string;
    //   _search: string;
    // }>(
    //   `
    //     INSERT INTO "Comments"(
    //     id, community_id, parent_id, address_id, text, created_at, updated_at, deleted_at,
    //     version_history, plaintext, _search, thread_id)
    //     VALUES (
    //     default,
    //     '${communityId}',
    //     ${parentId || null},
    //     ${addressId},
    //     '${encodeURIComponent(text.replace(/'/g, "''"))}',
    //    '${moment(created_at).format('YYYY-MM-DD HH:mm:ss')}',
    //    '${moment(updated_at).format('YYYY-MM-DD HH:mm:ss')}',
    //     null,
    //     '{}',
    //     '${text.replace(/'/g, "''")}',
    //     null, '${cwThreadId}') RETURNING id;
    // `,
    //   { type: QueryTypes.SELECT, transaction },
    // );
    // return {
    //   createdComment,
    //   discoursePostId,
    //   post_number,
    //   cwThreadId,
    //   like_count,
    // };
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
  { transaction }: { transaction: Transaction },
) => {
  const parentComments: Record<any, any> = {};
  const discoursePosts = await DiscourseQueries.fetchPosts(discourseConnection);
  const postsByTopic = lo.groupBy(discoursePosts, ({ topic_id }) => topic_id);
  const postIds = Object.keys(postsByTopic);
  const createdComments: any[] = [];
  for (let i = 0; i < postIds.length; i++) {
    const discoursePostId = parseInt(postIds[i]);
    const posts = lo.sortBy(
      postsByTopic[discoursePostId],
      ({ post_number }) => post_number,
    );
    const { id: cwThreadId } =
      threads.find((thread) => thread.discourseTopicId === discoursePostId) ||
      {};
    for (let j = 0; j < posts.length; j++) {
      const {
        id: discoursePostId,
        post_number,
        user_id,
        cooked,
        reply_to_post_number,
        like_count,
        created_at,
        updated_at,
      } = posts[j];
      if (post_number > 1) {
        const { id: addressId } =
          addresses.find(
            ({ discourseUserId }) => discourseUserId === user_id,
          ) || {};
        const { id: parentCommentId } =
          createdComments.find(
            (createdComment) =>
              discoursePostId === createdComment.discoursePostId &&
              reply_to_post_number === createdComment.post_number,
          ) || {};
        const parentId =
          parentCommentId &&
          reply_to_post_number > 1 &&
          post_number - 1 > reply_to_post_number
            ? parentCommentId
            : null;
        if (addressId) {
          if (!cwThreadId) {
            throw new Error(
              `Error: Thread ID not found for discourse post ${discoursePostId}`,
            );
          }
          const createdComment = await CWQueries.createComment(
            {
              post_number,
              cwThreadId,
              addressId,
              text: cooked,
              like_count,
              created_at,
              updated_at,
            },
            parentId,
            communityId,
            cwThreadId,
            addressId,
            { transaction },
          );
          createdComments.push({
            id: createdComment.id,
            discourseCommentId: discoursePostId,
            discoursePostId,
            post_number,
            cwThreadId,
            like_count,
          });
          // record child comments
          if (parentId) {
            if (parentComments[parentId]) {
              parentComments[
                parentId
              ] = `${parentComments[parentId]},${createdComment.id}`;
            } else {
              parentComments[parentId] = createdComment.id;
            }
          }
        } else {
          throw new Error(`Error: Address not found for user ${user_id}`);
        }
      }
    }
  }
  return createdComments;
};

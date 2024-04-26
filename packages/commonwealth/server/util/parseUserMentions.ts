import { ServerError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import { EmitOptions } from '../controllers/server_notifications_methods/emit';

export type UserMention = {
  profileId: string;
  profileName: string;
};

export type UserMentionQuery = {
  address: string;
  user_id: number;
}[];

export const uniqueMentions = (mentions: UserMention[]): UserMention[] => {
  const hash = (mention) =>
    `name:${mention.profileName}id:${mention.profileId}`;
  const uniqueIds: Set<string> = new Set();
  return mentions.filter((mention) => {
    if (uniqueIds.has(hash(mention))) {
      return false;
    }
    uniqueIds.add(mention.profileId);
    return true;
  });
};

export const parseUserMentions = (text: string): UserMention[] => {
  // Extract links to Commonwealth profiles, so they can be processed by the server as mentions
  if (!text) return [];
  try {
    const parsedText = JSON.parse(text);
    return (parsedText.ops || [])
      .filter((op) => {
        return (
          op.attributes?.link?.length > 0 &&
          typeof op.insert === 'string' &&
          op.insert?.slice(0, 1) === '@'
        );
      })
      .map((op) => {
        const chunks = op.attributes.link.split('/');
        const refIdx = chunks.indexOf('account');
        return {
          profileName: chunks[refIdx - 1],
          profileId: chunks[refIdx + 1],
        };
      });
  } catch (e) {
    // matches profileName and number in [@${profileName}](/profile/id/${number})
    const regex = /\[@([^[]+)]\(\/profile\/id\/(\d+)\)/g;
    const matches = [...text.matchAll(regex)];
    return matches.map(([, profileName, profileId]) => {
      return { profileName, profileId };
    });
  }
};

export const queryMentionedUsers = async (
  mentions: UserMention[],
  models: DB,
): Promise<UserMentionQuery> => {
  if (mentions.length === 0) {
    return [];
  }

  try {
    const mentionQueries = mentions.map(async ({ profileId, profileName }) => {
      const result = await models.sequelize.query(
        `
        SELECT a.address, a.user_id
        FROM "Addresses" as a
        INNER JOIN "Profiles" as p ON a.profile_id = p.id
        WHERE a.user_id IS NOT NULL AND p.id = :profileId AND p.profile_name = :profileName
      `,
        {
          replacements: {
            profileId,
            profileName,
          },
        },
      );

      return result[0][0];
    });
    return (await Promise.all(mentionQueries)).filter(
      (u) => !!u,
    ) as UserMentionQuery;
  } catch (e) {
    throw new ServerError('Failed to parse mentions', e);
  }
};

export const createCommentMentionNotifications = (
  mentions: UserMentionQuery,
  comment,
  address,
): EmitOptions[] => {
  return mentions.map(({ user_id }) => {
    return {
      notification: {
        categoryId: NotificationCategories.NewMention,
        data: {
          mentioned_user_id: user_id,
          created_at: new Date(),
          thread_id: +comment.thread_id,
          root_title: comment.root_title,
          root_type: ProposalType.Thread,
          comment_id: +comment.id,
          comment_text: comment.text,
          community_id: comment.community_id,
          author_address: address.address,
          author_community_id: address.community_id,
        },
      },
      excludeAddresses: [address.address],
    };
  }) as EmitOptions[];
};

export const createThreadMentionNotifications = (
  mentions: UserMentionQuery,
  finalThread,
): EmitOptions[] => {
  return mentions.map(({ user_id }) => {
    return {
      notification: {
        categoryId: NotificationCategories.NewMention,
        data: {
          mentioned_user_id: user_id,
          created_at: new Date(),
          thread_id: finalThread.id,
          root_type: ProposalType.Thread,
          root_title: finalThread.title,
          comment_text: finalThread.body,
          community_id: finalThread.community_id,
          author_address: finalThread.Address.address,
          author_community_id: finalThread.Address.community_id,
        },
      },
      excludeAddresses: [finalThread.Address.address],
    };
  }) as EmitOptions[];
};

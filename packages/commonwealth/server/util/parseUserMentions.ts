import { AppError } from '@hicommonwealth/core';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import { EmitOptions } from '../controllers/server_notifications_methods/emit';

export type UserMention = {
  profileId: string;
  profileName: string;
};

export type UserMentionQuery = {
  address: string;
  user_id: string;
}[];

export const uniqueMentions = (mentions: UserMention[]): UserMention[] => {
  const uniqueIds: Set<string> = new Set();
  return mentions.filter((mention) => {
    if (uniqueIds.has(mention.profileId)) {
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
  communityId: string,
): Promise<UserMentionQuery> => {
  const profileIds = mentions.map((m) => `'${m.profileId}'`).join(', ');
  const profileNames = mentions.map((m) => `'${m.profileName}'`).join(', ');
  if (profileIds.length === 0 || profileNames.length === 0) {
    return [];
  }

  try {
    return await this.models.sequelize.query(
      `
        SELECT a.address, a.user_id
        FROM "Addresses" as a
        INNER JOIN "Profiles" as p ON a.profile_id = p.profile_id
        WHERE a.community_id = :communityId AND a.user_id IS NOT NULL
        AND p.profile_id IN (:profileIds) AND p.profile_name IN (:profileNames)
        LIMIT 1;
      `,
      {
        replacements: {
          communityId,
          profileIds,
          profileNames,
        },
      },
    );
  } catch (e) {
    throw new AppError('Failed to parse mentions');
  }
};

export const createCommentMentionNotifications = (
  mentions: UserMentionQuery,
  comment,
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
          author_address: comment.Address.address,
          author_community_id: comment.Address.community_id,
        },
      },
      excludeAddresses: [comment.Address.address],
    };
  });
};

export const createThreadMentionNotifications = (
  mentions: UserMentionQuery,
  finalThread,
): EmitOptions[] => {
  return mentions.map(({ user_id }) => {
    return {
      notification: {
        categoryId: NotificationCategories.NewThread,
        data: {
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
  });
};

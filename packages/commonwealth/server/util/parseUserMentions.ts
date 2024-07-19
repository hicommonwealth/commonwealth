import { EventNames, events, ServerError } from '@hicommonwealth/core';
import { DB, emitEvent } from '@hicommonwealth/model';
import { Comment, Thread } from '@hicommonwealth/schemas';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import { QueryTypes, Transaction } from 'sequelize';
import z from 'zod';
import { EmitOptions } from '../controllers/server_notifications_methods/emit';

export type UserMention = {
  profileId: string;
  profileName: string;
};

export type UserMentionQuery = {
  address_id: number;
  address: string;
  user_id: number;
  profile_id: number;
  profile_name: string;
}[];

const hash = (mention: UserMention) =>
  `name:${mention.profileName}id:${mention.profileId}`;

// Will return unique mentions of the diff between current and previous mentions
export const findMentionDiff = (
  previousMentions: UserMention[],
  currentMentions: UserMention[],
) => {
  const previousMentionHashes = new Set(previousMentions.map(hash));

  return currentMentions.filter((mention) => {
    const hashedMention = hash(mention);

    // If it exists in previous hash set, it is not a new mention
    if (previousMentionHashes.has(hashedMention)) {
      return false;
    }

    // otherwise add it to the previous hash set so that we don't re-include duplicates
    previousMentionHashes.add(hashedMention);

    return true;
  });
};

export const uniqueMentions = (mentions: UserMention[]) =>
  findMentionDiff([], mentions);

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
    // Create an array of tuples for the replacements
    const tuples = mentions.map(({ profileId, profileName }) => [
      profileId,
      profileName,
    ]);

    return await models.sequelize.query<{
      address_id: number;
      address: string;
      user_id: number;
      profile_id: number;
      profile_name: string;
    }>(
      `
          SELECT a.id as address_id, a.address, a.user_id, p.id as profile_id, p.profile_name
          FROM "Addresses" as a
                   INNER JOIN "Profiles" as p ON a.profile_id = p.id
          WHERE a.user_id IS NOT NULL
            AND (p.id, p.profile_name) IN (:tuples)
      `,
      {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: { tuples },
      },
    );
  } catch (e) {
    throw new ServerError('Failed to query mentioned users', e);
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

type EmitMentionsData = {
  authorAddressId: number;
  authorUserId: number;
  authorAddress: string;
  mentions: UserMentionQuery;
} & (
  | {
      thread: z.infer<typeof Thread>;
    }
  | {
      comment: z.infer<typeof Comment>;
    }
);

export const emitMentions = async (
  models: DB,
  transaction: Transaction,
  data: EmitMentionsData,
) => {
  if (data.mentions.length) {
    const values: {
      event_name: EventNames.UserMentioned;
      event_payload: z.infer<typeof events.UserMentioned>;
    }[] = data.mentions.map(({ user_id }) => ({
      event_name: EventNames.UserMentioned,
      event_payload: {
        authorAddressId: data.authorAddressId,
        authorUserId: data.authorUserId,
        authorAddress: data.authorAddress,
        mentionedUserId: user_id,
        communityId:
          'comment' in data
            ? data.comment.community_id
            : data.thread.community_id,
        comment: 'comment' in data ? data.comment : undefined,
        thread: 'thread' in data ? data.thread : undefined,
      },
    }));

    await emitEvent(models.Outbox, values, transaction);
  }
};

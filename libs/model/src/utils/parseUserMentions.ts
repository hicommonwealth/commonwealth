import { EventNames, events } from '@hicommonwealth/core';
import { Comment, Thread } from '@hicommonwealth/schemas';
import { Transaction } from 'sequelize';
import z from 'zod';
import { DB } from '../models';
import { emitEvent } from './utils';

export type UserMention = {
  userId: string;
  profileName: string;
};

export type UserMentionQuery = {
  address_id: number;
  address: string;
  user_id: number;
  profile_name: string;
}[];

const hash = (mention: UserMention) =>
  `name:${mention.profileName}id:${mention.userId}`;

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

export const parseUserMentions = (text?: string): UserMention[] => {
  // Extract links to Commonwealth profiles, so they can be processed by the server as mentions
  if (!text) return [];
  try {
    const parsedText = JSON.parse(text);
    return (
      (parsedText.ops || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((op: any) => {
          return (
            op.attributes?.link?.length > 0 &&
            typeof op.insert === 'string' &&
            op.insert?.slice(0, 1) === '@'
          );
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((op: any) => {
          const chunks = op.attributes.link.split('/');
          const refIdx = chunks.indexOf('account');
          return {
            profileName: chunks[refIdx - 1],
            userId: chunks[refIdx + 1],
          };
        })
    );
  } catch (e) {
    // matches profileName and number in [@${profileName}](/profile/id/${number})
    const regex = /\[@([^[]+)]\(\/profile\/id\/(\d+)\)/g;
    const matches = [...text.matchAll(regex)];
    return matches.map(([, profileName, userId]) => {
      return { profileName, userId };
    });
  }
};

type EmitMentionsData = {
  authorAddressId: number;
  authorUserId: number;
  authorAddress: string;
  mentions: UserMention[];
  community_id: string;
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
    }[] = data.mentions.map(({ userId }) => ({
      event_name: EventNames.UserMentioned,
      event_payload: {
        authorAddressId: data.authorAddressId,
        authorUserId: data.authorUserId,
        authorAddress: data.authorAddress,
        mentionedUserId: Number(userId),
        communityId: data.community_id,
        comment: 'comment' in data ? data.comment : undefined,
        thread: 'thread' in data ? data.thread : undefined,
      },
    }));

    await emitEvent(models.Outbox, values, transaction);
  }
};

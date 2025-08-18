import { Comment, Thread, events } from '@hicommonwealth/schemas';
import { MCP_MENTION_SYMBOL } from '@hicommonwealth/shared';
import { Transaction } from 'sequelize';
import z from 'zod';
import { models } from '../database';
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

export type MCPMention = {
  handle: string;
  id: string;
  name: string;
};

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
  transaction: Transaction,
  data: EmitMentionsData,
) => {
  if (data.mentions.length) {
    const values: {
      event_name: 'UserMentioned';
      event_payload: z.infer<typeof events.UserMentioned>;
    }[] = data.mentions.map(({ userId }) => ({
      event_name: 'UserMentioned',
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

/**
 * Extracts MCP server mentions from comment text using regex
 * @param commentBody The comment text to parse
 * @returns Array of objects containing handle and id for each mentioned MCP server
 */
export const extractMCPMentions = (commentBody: string): MCPMention[] => {
  // Regex pattern matches: [/MCPServerName](/mcp-server/handle/id)
  const mcpMentionPattern = new RegExp(
    `\\[\\${MCP_MENTION_SYMBOL}([^\\]]+)\\]\\(\\/mcp-server\\/([^/]+\\/[^)]+)\\)`,
    'g',
  );
  const mentions: MCPMention[] = [];
  let match;

  while ((match = mcpMentionPattern.exec(commentBody)) !== null) {
    const handleAndId = match[2]; // This will be "handle/id"
    const [handle, id] = handleAndId.split('/');

    if (handle && id) {
      mentions.push({
        name: match[1], // Display name
        handle: handle, // Server handle
        id: id, // Server ID
      });
    }
  }

  return mentions;
};

import { DeltaStatic } from 'quill';
import { useCallback } from 'react';
import {
  MENTION_CONFIG,
  MentionEntityType,
} from '../views/components/react_quill_editor/mention-config';

// Define the structure for extracted mentions
export interface ExtractedMention {
  id: string;
  type: MentionEntityType;
  name: string;
  link: string;
}

// Regular expressions to match different mention formats
const MENTION_PATTERNS = {
  // [@UserName](/profile/id/userId)
  user: /\[@([^\]]+)\]\(\/profile\/id\/([^)]+)\)/g,
  // [#TopicName](/discussion/topic/topicId)
  topic: /\[#([^\]]+)\]\(\/discussion\/topic\/([^)]+)\)/g,
  // [!ThreadTitle](/discussion/threadId)
  thread: /\[!([^\]]+)\]\(\/discussion\/([^)]+)\)/g,
  // [~CommunityName](/communityId)
  community: /\[~([^\]]+)\]\(\/([^)]+)\)/g,
  // [ProposalTitle](/proposal/proposalId)
  proposal: /\[([^\]]+)\]\(\/proposal\/([^)]+)\)/g,
};

export const useMentionExtractor = () => {
  const extractMentionsFromText = useCallback(
    (text: string): ExtractedMention[] => {
      const mentions: ExtractedMention[] = [];

      // Extract user mentions
      let match;
      const userPattern = new RegExp(MENTION_PATTERNS.user);
      while ((match = userPattern.exec(text)) !== null) {
        mentions.push({
          id: match[2],
          type: MentionEntityType.USER,
          name: match[1],
          link: `/profile/id/${match[2]}`,
        });
      }

      // Extract topic mentions
      const topicPattern = new RegExp(MENTION_PATTERNS.topic);
      while ((match = topicPattern.exec(text)) !== null) {
        mentions.push({
          id: match[2],
          type: MentionEntityType.TOPIC,
          name: match[1],
          link: `/discussion/topic/${match[2]}`,
        });
      }

      // Extract thread mentions
      const threadPattern = new RegExp(MENTION_PATTERNS.thread);
      while ((match = threadPattern.exec(text)) !== null) {
        mentions.push({
          id: match[2],
          type: MentionEntityType.THREAD,
          name: match[1],
          link: `/discussion/${match[2]}`,
        });
      }

      // Extract community mentions
      const communityPattern = new RegExp(MENTION_PATTERNS.community);
      while ((match = communityPattern.exec(text)) !== null) {
        mentions.push({
          id: match[2],
          type: MentionEntityType.COMMUNITY,
          name: match[1],
          link: `/${match[2]}`,
        });
      }

      // Extract proposal mentions
      const proposalPattern = new RegExp(MENTION_PATTERNS.proposal);
      while ((match = proposalPattern.exec(text)) !== null) {
        mentions.push({
          id: match[2],
          type: MentionEntityType.PROPOSAL,
          name: match[1],
          link: `/proposal/${match[2]}`,
        });
      }

      return mentions;
    },
    [],
  );

  const extractMentionsFromDelta = useCallback(
    (delta: DeltaStatic): ExtractedMention[] => {
      if (!delta || !delta.ops) {
        return [];
      }

      let fullText = '';

      // Extract text from delta operations
      delta.ops.forEach((op) => {
        if (typeof op.insert === 'string') {
          fullText += op.insert;
        }
      });

      return extractMentionsFromText(fullText);
    },
    [extractMentionsFromText],
  );

  const extractMentionsFromMarkdown = useCallback(
    (markdown: string): ExtractedMention[] => {
      if (!markdown || typeof markdown !== 'string') {
        return [];
      }

      return extractMentionsFromText(markdown);
    },
    [extractMentionsFromText],
  );

  const validateMentionLimits = useCallback(
    (
      mentions: ExtractedMention[],
    ): {
      validMentions: ExtractedMention[];
      hasExceededLimit: boolean;
      limitExceeded: number;
    } => {
      const uniqueMentions = mentions.filter(
        (mention, index, self) =>
          index ===
          self.findIndex((m) => m.id === mention.id && m.type === mention.type),
      );

      const validMentions = uniqueMentions.slice(
        0,
        MENTION_CONFIG.MAX_MENTIONS_PER_POST,
      );
      const hasExceededLimit =
        uniqueMentions.length > MENTION_CONFIG.MAX_MENTIONS_PER_POST;
      const limitExceeded = Math.max(
        0,
        uniqueMentions.length - MENTION_CONFIG.MAX_MENTIONS_PER_POST,
      );

      return {
        validMentions,
        hasExceededLimit,
        limitExceeded,
      };
    },
    [],
  );

  const groupMentionsByType = useCallback(
    (
      mentions: ExtractedMention[],
    ): Record<MentionEntityType, ExtractedMention[]> => {
      const grouped: Record<MentionEntityType, ExtractedMention[]> = {
        [MentionEntityType.USER]: [],
        [MentionEntityType.TOPIC]: [],
        [MentionEntityType.THREAD]: [],
        [MentionEntityType.COMMUNITY]: [],
        [MentionEntityType.PROPOSAL]: [],
      };

      mentions.forEach((mention) => {
        if (grouped[mention.type]) {
          grouped[mention.type].push(mention);
        }
      });

      return grouped;
    },
    [],
  );

  const getMentionSummary = useCallback(
    (
      mentions: ExtractedMention[],
    ): {
      total: number;
      byType: Record<MentionEntityType, number>;
      withinLimits: boolean;
    } => {
      const grouped = groupMentionsByType(mentions);
      const byType: Record<MentionEntityType, number> = {} as Record<
        MentionEntityType,
        number
      >;

      Object.entries(grouped).forEach(([type, mentionArray]) => {
        byType[type as MentionEntityType] = mentionArray.length;
      });

      return {
        total: mentions.length,
        byType,
        withinLimits: mentions.length <= MENTION_CONFIG.MAX_MENTIONS_PER_POST,
      };
    },
    [groupMentionsByType],
  );

  return {
    extractMentionsFromText,
    extractMentionsFromDelta,
    extractMentionsFromMarkdown,
    validateMentionLimits,
    groupMentionsByType,
    getMentionSummary,
  };
};

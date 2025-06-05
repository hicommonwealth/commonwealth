import { DeltaStatic } from 'quill';
import { useCallback } from 'react';
import {
  MENTION_CONFIG,
  MentionEntityType,
} from '../views/components/react_quill_editor/mention-config';

export interface ExtractedMention {
  id: string;
  type: MentionEntityType;
  name: string;
  link: string;
}

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

const mentionConfigs = [
  {
    pattern: MENTION_PATTERNS.user,
    type: MentionEntityType.USER,
    getLinkPath: (id: string) => `/profile/id/${id}`,
  },
  {
    pattern: MENTION_PATTERNS.topic,
    type: MentionEntityType.TOPIC,
    getLinkPath: (id: string) => `/discussion/topic/${id}`,
  },
  {
    pattern: MENTION_PATTERNS.thread,
    type: MentionEntityType.THREAD,
    getLinkPath: (id: string) => `/discussion/${id}`,
  },
  {
    pattern: MENTION_PATTERNS.community,
    type: MentionEntityType.COMMUNITY,
    getLinkPath: (id: string) => `/${id}`,
  },
  {
    pattern: MENTION_PATTERNS.proposal,
    type: MentionEntityType.PROPOSAL,
    getLinkPath: (id: string) => `/proposal/${id}`,
  },
];

export const useMentionExtractor = () => {
  const extractMentionsFromText = useCallback(
    (text: string): ExtractedMention[] => {
      const mentions: ExtractedMention[] = [];

      mentionConfigs.forEach(({ pattern, type, getLinkPath }) => {
        const regex = new RegExp(pattern);
        let match;

        while ((match = regex.exec(text)) !== null) {
          mentions.push({
            id: match[2],
            type,
            name: match[1],
            link: getLinkPath(match[2]),
          });
        }
      });

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

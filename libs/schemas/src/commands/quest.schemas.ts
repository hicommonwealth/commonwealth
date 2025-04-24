import { z } from 'zod';
import { AuthContext } from '../context';
import { Quest, QuestActionMeta } from '../entities';

const QuestView = Quest.omit({ scheduled_job_id: true });

export const CreateQuest = {
  input: z.object({
    name: z.string(),
    description: z.string(),
    image_url: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    max_xp_to_end: z.number().default(0),
    community_id: z.string().nullish(),
    quest_type: z.enum(['channel', 'common']),
  }),
  output: QuestView,
  context: AuthContext,
};

export const ActionMetaInput = QuestActionMeta.omit({ quest_id: true })
  .extend({
    tweet_engagement_caps: z
      .object({
        likes: z.number().gte(0).max(100),
        retweets: z.number().gte(0).max(100),
        replies: z.number().gte(0).max(100),
      })
      .optional()
      .refine(
        (data) => !(data && !data.likes && !data.retweets && !data.replies),
      ),
    external_api_verification: z
      .object({
        kyo_finance_swap: z
          .object({
            outputToken: z
              .string()
              .optional()
              .describe('Address of token swapped from'),
            inputToken: z
              .string()
              .optional()
              .describe('Address of token to swap to'),
            minOutputAmount: z
              .string()
              .optional()
              .describe('Minimum amount of output token swapped'),
            minTimestamp: z
              .string()
              .optional()
              .describe('Minimum timestamp of swap'),
            minVolumeUSD: z
              .string()
              .optional()
              .describe('Minimum volume of swap'),
          })
          .describe(
            'https://docs.kyo.finance/technical-docs/swap-lp-quest-verification-api#id-1.-swap-quest',
          ),
      })
      .optional(),
  })
  .refine(
    (data) =>
      !(data.content_id?.includes('discord_server_id') && !data.start_link),
  );

export const UpdateQuest = {
  input: z.object({
    quest_id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    community_id: z.string().optional().nullable(),
    image_url: z.string().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    max_xp_to_end: z.number().optional(),
    action_metas: z.array(ActionMetaInput).optional(),
  }),
  output: QuestView,
  context: AuthContext,
};

export const DeleteQuest = {
  input: z.object({ quest_id: z.number() }),
  output: z.boolean(),
  context: AuthContext,
};

export const CancelQuest = {
  input: z.object({ quest_id: z.number() }),
  output: z.boolean(),
  context: AuthContext,
};

export const VerifyQuestAction = {
  input: z.object({
    quest_action_meta_id: z.number(),
  }),
  output: z.boolean(),
  context: AuthContext,
};

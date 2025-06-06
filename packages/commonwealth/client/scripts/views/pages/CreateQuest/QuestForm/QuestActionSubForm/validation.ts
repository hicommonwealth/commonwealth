import {
  EVM_ADDRESS_STRICT_REGEX,
  EVM_EVENT_SIGNATURE_STRICT_REGEX,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import {
  linkValidationSchema,
  numberDecimalValidationSchema,
  numberNonDecimalGTZeroValidationSchema,
  numberNonDecimalValidationSchema,
  numberValidationSchema,
  stringHasNumbersOnlyValidationSchema,
} from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { parseAbiItem } from 'viem';
import { z } from 'zod/v4';
import { QuestActionSubFormConfig } from './types';

const questSubFormValidationSchema = z.object({
  action: z.string().nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  instructionsLink: linkValidationSchema.optional,
  participationLimit: z.nativeEnum(QuestParticipationLimit, {}),
  // these 2 below are only used for initial values validation and not for
  // internal state validation, that is handled by a custom function
  participationPeriod: z.nativeEnum(QuestParticipationPeriod).optional(),
  participationTimesPerPeriod: z.number().or(z.string()).optional(),
});

export const buildQuestSubFormValidationSchema = (
  config?: QuestActionSubFormConfig,
) => {
  const allowsOptionalContentId =
    config?.with_optional_comment_id ||
    config?.with_optional_thread_id ||
    config?.with_optional_topic_id ||
    config?.with_optional_chain_id ||
    config?.with_optional_token_trade_threshold;
  const requiresTwitterEngagement = config?.requires_twitter_tweet_link;
  const requiresDiscordServerId = config?.requires_discord_server_id;
  const requiresGoalConfig = config?.requires_goal_config;
  const requiresChainEvent = config?.requires_chain_event;
  const requiresGroupId = config?.requires_group_id;
  const requiresStartLink = config?.requires_start_link;
  const requiresAmountMultipler = config?.requires_amount_multipler;
  const requiresBasicRewardPoints = config?.requires_basic_points;
  const requiresCreatorPoints = config?.requires_creator_points;
  const allowsChainIdAsContentId = config?.with_optional_chain_id;
  const allowsTokenThresholdAmountAsContentId =
    config?.with_optional_token_trade_threshold;

  const needsExtension =
    requiresCreatorPoints ||
    allowsOptionalContentId ||
    requiresTwitterEngagement ||
    requiresDiscordServerId ||
    requiresGoalConfig ||
    requiresGroupId ||
    requiresStartLink ||
    allowsChainIdAsContentId ||
    allowsTokenThresholdAmountAsContentId ||
    requiresChainEvent;

  if (!needsExtension) return questSubFormValidationSchema;

  let baseSchema = questSubFormValidationSchema;

  if (allowsOptionalContentId) {
    if (allowsChainIdAsContentId) {
      baseSchema = baseSchema.extend({
        contentIdentifier: numberValidationSchema.optional,
      }) as unknown as typeof baseSchema;
    } else if (allowsTokenThresholdAmountAsContentId) {
      baseSchema = baseSchema.extend({
        contentIdentifier: numberDecimalValidationSchema.optional,
      }) as unknown as typeof baseSchema;
    } else {
      baseSchema = baseSchema.extend({
        contentIdentifier: linkValidationSchema.optional,
      }) as unknown as typeof baseSchema;
    }
  }
  if (requiresGroupId) {
    baseSchema = baseSchema.extend({
      contentIdentifier: linkValidationSchema.required,
    }) as unknown as typeof baseSchema;
  }
  if (requiresStartLink) {
    if (requiresDiscordServerId) {
      baseSchema = baseSchema.extend({
        startLink: linkValidationSchema.required.refine(
          (url) => {
            // validate discord server URL
            const discordRegex = /https:\/\/discord\.(com\/invite\/|gg\/?)\w+/;
            return discordRegex.test(url);
          },
          {
            message: VALIDATION_MESSAGES.DISCORD_SERVER_FORMAT,
          },
        ),
      }) as unknown as typeof baseSchema;
    } else {
      baseSchema = baseSchema.extend({
        startLink: linkValidationSchema.required,
      }) as unknown as typeof baseSchema;
    }
  }
  if (requiresAmountMultipler) {
    baseSchema = baseSchema.extend({
      amountMultipler: numberNonDecimalGTZeroValidationSchema,
    }) as unknown as typeof baseSchema;
  }
  if (requiresBasicRewardPoints) {
    if (!requiresCreatorPoints) {
      baseSchema = baseSchema.extend({
        rewardAmount: numberNonDecimalGTZeroValidationSchema,
      }) as unknown as typeof baseSchema;
    }

    if (requiresCreatorPoints) {
      baseSchema = baseSchema
        .extend({
          rewardAmount: numberNonDecimalGTZeroValidationSchema,
          creatorRewardAmount: numberNonDecimalValidationSchema.required,
        })
        .refine(
          (data) => {
            try {
              const creatorRewardAmount = numberValidationSchema.required.parse(
                data.creatorRewardAmount,
              );
              const rewardAmount = numberValidationSchema.required.parse(
                data.rewardAmount,
              );
              // verify creatorRewardAmount is less or equal to rewardAmount
              return (
                parseInt(creatorRewardAmount, 10) <= parseInt(rewardAmount, 10)
              );
            } catch {
              return false;
            }
          },
          {
            message: VALIDATION_MESSAGES.MUST_BE_LESS_OR_EQUAL('reward points'),
            path: ['creatorRewardAmount'],
          },
        ) as unknown as typeof baseSchema;
    }
  }
  if (requiresTwitterEngagement) {
    baseSchema = baseSchema
      .extend({
        contentIdentifier: linkValidationSchema.required.refine(
          (url) => {
            // validate twitter tweet URL
            const twitterRegex = /https:\/\/x\.com\/\w+\/status\/\d+/;
            return twitterRegex.test(url);
          },
          {
            message: VALIDATION_MESSAGES.TWITTER_TWEET_FORMAT,
          },
        ),
        noOfLikes: numberNonDecimalValidationSchema.optional,
        noOfRetweets: numberNonDecimalValidationSchema.optional,
        noOfReplies: numberNonDecimalValidationSchema.optional,
      })
      .refine(
        (data) => {
          const likes = parseInt(data.noOfLikes || '0', 10);
          const retweets = parseInt(data.noOfRetweets || '0', 10);
          const replies = parseInt(data.noOfReplies || '0', 10);
          return likes > 0 || retweets > 0 || replies > 0;
        },
        {
          message:
            'One of Likes, Retweets, or Replies count must be greater than 0.',
          path: ['noOfLikes'],
        },
      )
      .refine(
        (data) => {
          const likes = parseInt(data.noOfLikes || '0', 10);
          const retweets = parseInt(data.noOfRetweets || '0', 10);
          const replies = parseInt(data.noOfReplies || '0', 10);
          return likes > 0 || retweets > 0 || replies > 0;
        },
        {
          message:
            'One of Likes, Retweets, or Replies count must be greater than 0.',
          path: ['noOfReplies'],
        },
      )
      .refine(
        (data) => {
          const likes = parseInt(data.noOfLikes || '0', 10);
          const retweets = parseInt(data.noOfRetweets || '0', 10);
          const replies = parseInt(data.noOfReplies || '0', 10);
          return likes > 0 || retweets > 0 || replies > 0;
        },
        {
          message:
            'One of Likes, Retweets, or Replies count must be greater than 0.',
          path: ['noOfRetweets'],
        },
      ) as unknown as typeof baseSchema;
  }
  if (requiresDiscordServerId || requiresGoalConfig) {
    baseSchema = baseSchema.extend({
      contentIdentifier: stringHasNumbersOnlyValidationSchema,
    }) as unknown as typeof baseSchema;
  }
  if (requiresChainEvent) {
    baseSchema = baseSchema.extend({
      ethChainId: z
        .string()
        .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
      contractAddress: z
        .string()
        .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
        .refine((val) => EVM_ADDRESS_STRICT_REGEX.test(val), {
          message: VALIDATION_MESSAGES.MUST_BE_FORMAT(
            `0x0000000000000000000000000000000000000000`,
          ),
        }),
      eventSignature: z
        .string()
        .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
        .refine(
          (val) => {
            try {
              parseAbiItem(val);
              return true;
            } catch (e) {
              return false;
            }
          },
          {
            message: 'Invalid event signature: failed to parse ABI',
          },
        ),
      transactionHash: z
        .string()
        .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
        .refine((val) => EVM_EVENT_SIGNATURE_STRICT_REGEX.test(val), {
          message: VALIDATION_MESSAGES.MUST_BE_FORMAT(
            `0x0000000000000000000000000000000000000000000000000000000000000000`,
          ),
        }),
    }) as unknown as typeof baseSchema;
  }

  return baseSchema;
};

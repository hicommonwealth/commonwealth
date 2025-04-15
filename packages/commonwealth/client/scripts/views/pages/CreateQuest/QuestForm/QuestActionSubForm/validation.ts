import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import {
  linkValidationSchema,
  numberNonDecimalGTZeroValidationSchema,
  numberNonDecimalValidationSchema,
  numberValidationSchema,
} from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';
import { QuestActionSubFormConfig } from './types';

const questSubFormValidationSchema = z.object({
  action: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  rewardAmount: numberNonDecimalGTZeroValidationSchema,
  instructionsLink: linkValidationSchema.optional,
  participationLimit: z.nativeEnum(QuestParticipationLimit, {
    invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
  }),
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
    config?.with_optional_chain_id;
  const requiresTwitterEngagement = config?.requires_twitter_tweet_link;
  const requiresDiscordServerURL = config?.requires_discord_server_url;
  const requiresCreatorPoints = config?.requires_creator_points;

  const needsExtension =
    requiresCreatorPoints ||
    allowsOptionalContentId ||
    requiresTwitterEngagement ||
    requiresDiscordServerURL;

  if (!needsExtension) return questSubFormValidationSchema;

  let baseSchema = questSubFormValidationSchema;

  // TODO: 11580 fix these schema validations they dont work correctly when multiple if blocks are involved
  if (requiresCreatorPoints) {
    baseSchema = baseSchema
      .extend({
        creatorRewardAmount: numberNonDecimalValidationSchema.required,
        // TODO: 11580 rename it to contentIdentifier which can be anything i.e string(?link) number or others
        // TODO: 11580 move it to if (allowsOptionalContentId) { below
        contentIdentifier: numberValidationSchema.optional,
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
  if (allowsOptionalContentId) {
    // TODO: 11580 do something for this? like waht? and add this back
    // baseSchema = baseSchema.extend({
    //   contentIdentifier: linkValidationSchema.optional,
    // }) as unknown as typeof baseSchema;
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
  if (requiresDiscordServerURL) {
    baseSchema = baseSchema.extend({
      contentIdentifier: linkValidationSchema.required.refine(
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
  }

  return baseSchema;
};

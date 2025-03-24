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
  const allowsContentId =
    config?.with_optional_comment_id ||
    config?.with_optional_thread_id ||
    config?.with_optional_topic_id;
  const requiresCreatorPoints = config?.requires_creator_points;

  const needsExtension = requiresCreatorPoints || allowsContentId;

  if (!needsExtension) return questSubFormValidationSchema;

  const baseSchema = questSubFormValidationSchema.extend({
    ...(requiresCreatorPoints && {
      creatorRewardAmount: numberNonDecimalValidationSchema,
    }),
    ...(allowsContentId && {
      contentLink: linkValidationSchema.optional,
    }),
  });

  if (requiresCreatorPoints) {
    baseSchema.refine(
      (data) => {
        try {
          const creatorRewardAmount = numberValidationSchema.parse(
            data.creatorRewardAmount,
          );
          const rewardAmount = numberValidationSchema.parse(data.rewardAmount);
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
    );
  }

  return baseSchema;
};

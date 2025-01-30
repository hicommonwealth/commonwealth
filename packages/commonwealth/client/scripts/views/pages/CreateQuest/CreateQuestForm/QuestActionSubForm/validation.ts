import {
  linkValidationSchema,
  numberGTZeroValidationSchema,
  numberValidationSchema,
} from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const questSubFormValidationSchema = z.object({
  action: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  rewardAmount: numberGTZeroValidationSchema,
  questLink: linkValidationSchema.optional,
});

export const questSubFormValidationSchemaWithCreatorPoints =
  questSubFormValidationSchema
    .extend({
      creatorRewardAmount: numberValidationSchema,
    })
    .refine(
      (data) => {
        try {
          const creatorRewardAmount = numberValidationSchema.parse(
            data.creatorRewardAmount,
          );
          const rewardAmount = numberGTZeroValidationSchema.parse(
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
    );

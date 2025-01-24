import {
  linkValidationSchema,
  numberValidationSchema,
} from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const questSubFormValidationSchema = z.object({
  action: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  rewardAmount: numberValidationSchema,
  questLink: linkValidationSchema.optional,
});

export const questSubFormValidationSchemaWithCreatorPoints =
  questSubFormValidationSchema.extend({
    creatorRewardAmount: numberValidationSchema,
  });

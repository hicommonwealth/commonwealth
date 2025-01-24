import { linkValidationSchema } from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const questSubFormValidationSchema = z.object({
  action: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  rewardAmount: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        const intVal = parseInt(value, 10);
        return !isNaN(intVal) && intVal.toString() === value.trim();
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
  questLink: linkValidationSchema.optional,
});

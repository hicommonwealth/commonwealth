import { communityNameSchema } from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod';

export const tokenInformationFormValidationSchema = z.object({
  chain: z
    .string({ error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(100, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  name: communityNameSchema,
  symbol: z
    .string({ error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .min(3, { message: VALIDATION_MESSAGES.MIN_CHAR_LIMIT_REQUIRED(3) })
    .max(6, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  description: z
    .string({ error: VALIDATION_MESSAGES.NO_INPUT })
    .max(180, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
    .optional(),
  imageURL: z.string({ error: VALIDATION_MESSAGES.NO_INPUT }),
});

import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod/v4';

export const tokenInformationFormValidationSchema = z.object({
  chain: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(100, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  name: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(100, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  symbol: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .min(3, { message: VALIDATION_MESSAGES.MIN_CHAR_LIMIT_REQUIRED(3) })
    .max(6, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  description: z
    .string()
    .max(180, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
    .optional(),
  imageURL: z.string(),
});

import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod';

export const tokenInformationFormValidationSchema = z.object({
  tokenChain: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(100, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  tokenName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(100, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  tokenTicker: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .min(3, { message: VALIDATION_MESSAGES.MIN_CHAR_LIMIT_REQUIRED(3) })
    .max(6, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  tokenDescription: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .max(180, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
    .optional(),
  tokenImageURL: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .optional(),
});

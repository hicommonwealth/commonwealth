import { VALIDATION_MESSAGES } from 'helpers/formValidationMessages';
import z from 'zod';

export const socialLinkValidation = z
  .string()
  .url({ message: VALIDATION_MESSAGES.INVALID_INPUT });

export const basicInformationFormValidationSchema = z.object({
  communityName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  communityDescription: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  communityProfileImageURL: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  chain: z.object(
    {
      value: z.any().default(-1).optional(),
      label: z.string().default('').optional(),
    },
    {
      invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
      required_error: VALIDATION_MESSAGES.NO_INPUT,
    },
  ),
});

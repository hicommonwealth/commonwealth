import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const connectTokenFormValidationSchema = z.object({
  chainNodeId: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.INVALID_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  tokenAddress: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.INVALID_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
});

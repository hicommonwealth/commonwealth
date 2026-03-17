import { VALIDATION_MESSAGES } from 'shared/utils/formValidations/messages';
import { z } from 'zod';

export const connectTokenFormValidationSchema = z.object({
  chainNodeId: z
    .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  tokenAddress: z
    .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
});

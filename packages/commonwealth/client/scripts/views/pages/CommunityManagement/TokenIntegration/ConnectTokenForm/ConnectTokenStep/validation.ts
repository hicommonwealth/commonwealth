import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const connectTokenFormValidationSchema = z.object({
  chainNodeId: z.string().nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  tokenAddress: z.string().nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
});

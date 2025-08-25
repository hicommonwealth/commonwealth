import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

const emailValidationSchema = z.object({
  email: z
    .string({ error: VALIDATION_MESSAGES.NO_INPUT })
    .email({ message: VALIDATION_MESSAGES.INVALID_INPUT }),
});

export { emailValidationSchema };

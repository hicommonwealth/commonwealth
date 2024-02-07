import { VALIDATION_MESSAGES } from 'helpers/formValidationMessages';
import { z } from 'zod';

const emailValidationSchema = z.object({
  email: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .email({ message: VALIDATION_MESSAGES.INVALID_INPUT }),
});

export { emailValidationSchema };

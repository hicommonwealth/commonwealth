import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

const emailValidationSchema = z.object({
  email: z.string().email({ message: VALIDATION_MESSAGES.INVALID_INPUT }),
});

export { emailValidationSchema };

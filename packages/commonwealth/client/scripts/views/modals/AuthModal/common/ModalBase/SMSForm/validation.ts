import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

const smsValidationSchema = z.object({
  phoneNumber: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: VALIDATION_MESSAGES.INVALID_INPUT,
    }),
});

export { smsValidationSchema };

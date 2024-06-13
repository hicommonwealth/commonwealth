import { emailValidationSchema } from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod';

export const personalInformationFormValidation = z.object({
  username: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  email: emailValidationSchema,
  enableAccountNotifications: z.boolean(),
  enableProductUpdates: z.boolean(),
});

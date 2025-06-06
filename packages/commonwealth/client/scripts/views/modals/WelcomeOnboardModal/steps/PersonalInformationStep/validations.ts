import { emailValidationSchema } from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod/v4';

export const personalInformationFormValidation = z.object({
  username: z.string().nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  email: emailValidationSchema,
  enableAccountNotifications: z.boolean(),
  enableProductUpdates: z.boolean(),
});

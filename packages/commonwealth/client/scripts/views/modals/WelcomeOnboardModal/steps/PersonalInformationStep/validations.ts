import {
  emailValidationSchema,
  usernameSchema,
} from 'helpers/formValidations/common';
import z from 'zod';

export const personalInformationFormValidation = z.object({
  username: usernameSchema,
  email: emailValidationSchema,
  enableAccountNotifications: z.boolean(),
  enableProductUpdates: z.boolean(),
});

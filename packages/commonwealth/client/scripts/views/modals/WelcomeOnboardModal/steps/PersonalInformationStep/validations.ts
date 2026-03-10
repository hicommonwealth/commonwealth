import {
  emailValidationSchema,
  usernameSchema,
} from 'shared/utils/formValidations/common';
import z from 'zod';

export const personalInformationFormValidation = z.object({
  username: usernameSchema,
  email: emailValidationSchema,
  enableAccountNotifications: z.boolean(),
  enableProductUpdates: z.boolean(),
});

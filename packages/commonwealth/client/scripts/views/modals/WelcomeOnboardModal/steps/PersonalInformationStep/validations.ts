import { VALIDATION_MESSAGES } from 'client/scripts/helpers/formValidationMessages';
import z from 'zod';

export const personalInformationFormValidation = z.object({
  username: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  email: z.union([
    z.literal(''),
    z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }).email(),
  ]),
  enableAccountNotifications: z.boolean(),
  enableProductUpdates: z.boolean(),
});

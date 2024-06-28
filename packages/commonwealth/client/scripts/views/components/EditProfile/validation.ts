import {
  emailValidationSchema,
  quillValidationSchema,
} from 'client/scripts/helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const editProfileValidation = z.object({
  username: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  email: emailValidationSchema,
  backgroundImg: z.union([
    z.literal(''),
    z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }),
  ]),
  bio: quillValidationSchema,
});

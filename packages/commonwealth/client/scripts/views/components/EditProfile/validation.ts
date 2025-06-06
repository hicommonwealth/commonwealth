import {
  emailValidationSchema,
  quillValidationSchema,
} from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod/v4';

export const editProfileValidation = z.object({
  username: z.string().nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  email: emailValidationSchema,
  backgroundImg: z.union([z.literal(''), z.string()]),
  bio: quillValidationSchema,
});

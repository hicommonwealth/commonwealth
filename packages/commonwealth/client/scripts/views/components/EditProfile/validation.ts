import {
  emailValidationSchema,
  quillValidationSchema,
  usernameSchema,
} from 'shared/utils/formValidations/common';
import { VALIDATION_MESSAGES } from 'shared/utils/formValidations/messages';
import { z } from 'zod';

export const editProfileValidation = z.object({
  username: usernameSchema,
  email: emailValidationSchema,
  backgroundImg: z.union([
    z.literal(''),
    z.string({ error: VALIDATION_MESSAGES.NO_INPUT }),
  ]),
  bio: quillValidationSchema,
});

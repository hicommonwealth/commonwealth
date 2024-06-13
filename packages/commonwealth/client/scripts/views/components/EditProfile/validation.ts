import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const editProfileValidation = z.object({
  username: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  email: z.union([
    z.literal(''),
    z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }).email(),
  ]),
  backgroundImg: z.union([
    z.literal(''),
    z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }),
  ]),
  bio: z.object({
    ops: z
      .array(
        z.object({
          insert: z
            .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
            .default(''),
        }),
      )
      .length(1),
    ___isMarkdown: z.boolean(),
  }),
});

import { z } from 'zod';
import { VALIDATION_MESSAGES } from './messages';

export const linkValidationSchema = {
  required: z.string().url({
    message: VALIDATION_MESSAGES.INVALID_INPUT,
  }),
  optional: z.union([
    z.literal(''),
    z.string().url({
      message: VALIDATION_MESSAGES.INVALID_INPUT,
    }),
  ]),
};

export const emailValidationSchema = z.union([
  z.literal(''),
  z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }).email(),
]);

export const quillValidationSchema = z.object({
  ops: z
    .array(
      z.object(
        {
          insert: z
            .string({
              invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
              required_error: VALIDATION_MESSAGES.NO_INPUT,
            })
            .default(''),
        },
        {
          invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
          required_error: VALIDATION_MESSAGES.NO_INPUT,
        },
      ),
      {
        invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
        required_error: VALIDATION_MESSAGES.NO_INPUT,
      },
    )
    .length(1, { message: VALIDATION_MESSAGES.NO_INPUT }),
  ___isMarkdown: z.boolean(),
});

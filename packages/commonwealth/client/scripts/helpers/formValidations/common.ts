import { z } from 'zod';
import { VALIDATION_MESSAGES } from './messages';

export const linkValidationSchema = {
  required: z.string().url({
    message: VALIDATION_MESSAGES.INVALID_INPUT,
  }),
  optional: z
    .union([
      z.literal(''),
      z.string().url({
        message: VALIDATION_MESSAGES.INVALID_INPUT,
      }),
    ])
    .nullish(),
};

export const emailValidationSchema = z.union([
  z.literal(''),
  z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }).email(),
]);

export const quillValidationSchema = z.object({
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
});

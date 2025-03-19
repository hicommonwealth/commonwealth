import { z } from 'zod';
import { VALIDATION_MESSAGES } from './messages';

export const linkValidationSchema = {
  required: z
    .string()
    .url({
      message: VALIDATION_MESSAGES.INVALID_INPUT,
    })
    .refine(
      (url) => {
        if (url.includes('github.com')) {
          const parts = url.split('/').filter(Boolean);
          return parts.length === 3;
        }
        return true;
      },
      {
        message: VALIDATION_MESSAGES.GITHUB_FORMAT,
      },
    ),
  optional: z
    .union([
      z.literal(''),
      z
        .string()
        .url({
          message: VALIDATION_MESSAGES.INVALID_INPUT,
        })
        .refine(
          (url) => {
            if (url.includes('github.com')) {
              const parts = url.split('/').filter(Boolean);
              return parts.length === 3;
            }
            return true;
          },
          {
            message: VALIDATION_MESSAGES.GITHUB_FORMAT,
          },
        ),
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

export const numberValidationSchema = z
  .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
  .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
  .refine(
    (value) => {
      const intVal = parseInt(value, 10);
      return !isNaN(intVal) && intVal.toString() === value.trim();
    },
    { message: VALIDATION_MESSAGES.INVALID_INPUT },
  );

// non decimal number
export const numberNonDecimalValidationSchema = numberValidationSchema.refine(
  (value) => {
    return !Number.isInteger(value);
  },
  { message: VALIDATION_MESSAGES.MUST_BE_TYPE('integer') },
);

// non decimal number greater than 0
export const numberNonDecimalGTZeroValidationSchema =
  numberNonDecimalValidationSchema.refine(
    (value) => {
      const intVal = parseInt(value, 10);
      return intVal > 0;
    },
    { message: VALIDATION_MESSAGES.MUST_BE_GREATER(0) },
  );

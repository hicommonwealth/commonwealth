import {
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
} from '@hicommonwealth/shared';
import emojiRegex from 'emoji-regex';
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
  z.string({ error: VALIDATION_MESSAGES.NO_INPUT }).email(),
]);

export const quillValidationSchema = z.object({
  ops: z
    .array(
      z.object({
        insert: z.string({ error: VALIDATION_MESSAGES.NO_INPUT }).default(''),
      }),
    )
    .length(1),
  ___isMarkdown: z.boolean(),
});

export const numberValidationSchema = {
  required: z
    .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        const intVal = parseInt(value, 10);
        return !isNaN(intVal) && intVal.toString() === value.trim();
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
  optional: z
    .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
    .optional()
    .refine(
      (value) => {
        if (!value || value.toString().trim() === '') return true;
        const intVal = parseInt(value, 10);
        return !isNaN(intVal) && intVal.toString() === value.trim();
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
};

export const numberDecimalValidationSchema = {
  required: z
    .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        const intVal = parseFloat(value);
        return !isNaN(intVal) && intVal.toString() === value.trim();
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
  optional: z
    .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
    .optional()
    .refine(
      (value) => {
        if (!value || value.toString().trim() === '') return true;
        const intVal = parseFloat(value);
        return !isNaN(intVal) && intVal.toString() === value.trim();
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
};

// non decimal number
export const numberNonDecimalValidationSchema = {
  required: numberValidationSchema.required.refine(
    (value) => {
      return !Number.isInteger(value);
    },
    { message: VALIDATION_MESSAGES.MUST_BE_TYPE('integer') },
  ),
  optional: numberValidationSchema.optional.refine(
    (value) => {
      if (!value || value?.trim() === '') return true;
      return !Number.isInteger(value);
    },
    { message: VALIDATION_MESSAGES.MUST_BE_TYPE('integer') },
  ),
};

// non decimal number greater than 0
export const numberNonDecimalGTZeroValidationSchema =
  numberNonDecimalValidationSchema.required.refine(
    (value) => {
      const intVal = parseInt(value, 10);
      return intVal > 0;
    },
    { message: VALIDATION_MESSAGES.MUST_BE_GREATER(0) },
  );

export const stringHasNumbersOnlyValidationSchema = z
  .string({ error: VALIDATION_MESSAGES.INVALID_INPUT })
  .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
  .refine(
    (value) => /^\d+$/.test(`${value}`), // checks for digits only
    { message: VALIDATION_MESSAGES.INVALID_INPUT },
  );

export const communityNameSchema = z
  .string({ error: VALIDATION_MESSAGES.NO_INPUT })
  .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
  .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
  .regex(COMMUNITY_NAME_REGEX, {
    message: COMMUNITY_NAME_ERROR,
  })
  .refine((val) => !emojiRegex().test(val), {
    message: 'Name must not contain emojis',
  })
  .refine((val) => !/common/i.test(val), {
    message: 'Name must not contain the word "Common"',
  });

export const usernameSchema = z
  .string({ error: VALIDATION_MESSAGES.NO_INPUT })
  .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
  .refine((val) => !emojiRegex().test(val), {
    message: 'Username must not contain emojis',
  })
  .refine((val) => !/common/i.test(val), {
    message: 'Username must not contain the word "Common"',
  });

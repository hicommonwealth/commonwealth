import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import { linkValidationSchema } from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const questFormValidationSchema = z
  .object({
    participation_limit: z.nativeEnum(QuestParticipationLimit, {
      invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
    }),
    start_date: z
      .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
      .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
    end_date: z
      .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
      .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
    name: z
      .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
      .min(5, { message: VALIDATION_MESSAGES.MIN_CHAR_LIMIT_REQUIRED(5) })
      .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
    description: z
      .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
      .min(10, { message: VALIDATION_MESSAGES.MIN_CHAR_LIMIT_REQUIRED(10) })
      .max(250, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
      .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
    image: linkValidationSchema.optional,
    community: z
      .object(
        {
          value: z.string(),
          label: z.object({
            name: z.string(),
            imageURL: z.string(),
          }),
        },
        {
          invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
        },
      )
      .optional(),
  })
  .refine(
    (data) => {
      try {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        // ensure end date is greater than start date
        return endDate.getTime() > startDate.getTime();
      } catch {
        return false;
      }
    },
    {
      message: VALIDATION_MESSAGES.MUST_BE_GREATER('start date'),
      path: ['end_date'],
    },
  )
  .refine(
    (data) => {
      try {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        // ensure diff b/w start/end date is at least 1 day
        return endDate.getTime() - startDate.getTime() >= 86400000; // 86400000 ms = 1 day
      } catch {
        return false;
      }
    },
    {
      message: VALIDATION_MESSAGES.MUST_BE_APART('start date', '1 day'),
      path: ['end_date'],
    },
  );

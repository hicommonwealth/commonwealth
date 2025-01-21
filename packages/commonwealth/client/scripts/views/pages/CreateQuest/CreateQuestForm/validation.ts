import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

export const questFormValidationSchema = z.object({
  participation_limit: z.nativeEnum(QuestParticipationLimit, {
    invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
  }),
  // TODO: start/end dates must be a string
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
  reward_amount: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        const intVal = parseInt(value, 10);
        return !isNaN(intVal) && intVal.toString() === value.trim();
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
});

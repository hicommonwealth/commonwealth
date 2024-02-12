import z from 'zod';
import { VALIDATION_MESSAGES } from '../../../../../helpers/formValidationMessages';
VALIDATION_MESSAGES;

export const topicCreationValidationSchema = z.object({
  topicName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .min(1, { message: VALIDATION_MESSAGES.NO_INPUT }),
  topicDescription: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .min(1, { message: VALIDATION_MESSAGES.NO_INPUT }),
});

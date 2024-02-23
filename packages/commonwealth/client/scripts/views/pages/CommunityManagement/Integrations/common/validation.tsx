import { VALIDATION_MESSAGES } from 'helpers/formValidationMessages';
import z from 'zod';

const linkValidationSchema = z.string().url({
  message: VALIDATION_MESSAGES.INVALID_INPUT,
});

export { linkValidationSchema };

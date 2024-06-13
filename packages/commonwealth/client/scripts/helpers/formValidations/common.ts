import { z } from 'zod';
import { VALIDATION_MESSAGES } from './messages';

export const linkValidationSchema = z.string().url({
  message: VALIDATION_MESSAGES.INVALID_INPUT,
});

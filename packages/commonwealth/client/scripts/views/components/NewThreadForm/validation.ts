import { quillValidationSchema } from 'client/scripts/helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { z } from 'zod';

const createThreadValidationSchema = z.object({
  title: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  topic: z.union([
    z.object(
      {
        value: z.any().default(-1).optional(),
        label: z.string().default('').optional(),
      },
      {
        invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
        required_error: VALIDATION_MESSAGES.NO_INPUT,
      },
    ),
    z.literal('').transform(() => {}),
  ]),
  body: quillValidationSchema,
});

export { createThreadValidationSchema };

import { pluralizeWithoutNumberPrefix } from 'helpers';
import z from 'zod';
import { VALIDATION_MESSAGES } from '../../../../../helpers/formValidations/messages';

export const topicCreationValidationSchema = z.object({
  topicName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .min(1, { message: VALIDATION_MESSAGES.NO_INPUT })
    .superRefine((value, ctx) => {
      const disallowedCharMatches = value.match(/["<>%{}|\\/^`]/g);

      if (disallowedCharMatches) {
        const errMsg = `The ${pluralizeWithoutNumberPrefix(
          disallowedCharMatches.length,
          'char',
        )} ${disallowedCharMatches.join(', ')} are not permitted`;

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errMsg,
        });
      }
    }),
  topicDescription: z.string({
    invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
  }),
});

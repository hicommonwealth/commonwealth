import { pluralizeWithoutNumberPrefix } from 'helpers';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod';

export const topicCreationValidationSchema = z.object({
  topicName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .min(1, { message: VALIDATION_MESSAGES.NO_INPUT })
    .superRefine((value, ctx) => {
      const disallowedCharMatches = value.match(/["<>%{}|\\/^`?]/g);

      if (disallowedCharMatches) {
        const errMsg = `These ${pluralizeWithoutNumberPrefix(
          disallowedCharMatches.length,
          'char',
        )} are not permitted: ${disallowedCharMatches.join(', ')}`;

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errMsg,
        });
      }
    }),
});

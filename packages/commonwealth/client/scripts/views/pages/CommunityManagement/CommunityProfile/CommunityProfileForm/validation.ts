import { VALIDATION_MESSAGES } from 'helpers/formValidationMessages';
import z from 'zod';

export const linkValidationSchema = z.string().url({
  message: VALIDATION_MESSAGES.INVALID_INPUT,
});

export const communityProfileValidationSchema = z.object({
  communityName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  communityDescription: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  communityProfileImageURL: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  defaultPage: z.string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT }),
  hasStagesEnabled: z.boolean({
    invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
  }),
  customStages: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (data) => {
        if (data) {
          try {
            const validJSONStringArray = data.replace(/'/g, '"');
            const parsedArray = JSON.parse(validJSONStringArray);
            if (
              !Array.isArray(parsedArray) ||
              !parsedArray.every((value) => typeof value === 'string')
            ) {
              return false;
            }
            return true;
          } catch {
            return false;
          }
        }
        return true;
      },
      {
        message: `${VALIDATION_MESSAGES.INVALID_INPUT}: must follow this pattern [“Stage 1”, “Stage 2”]`,
      },
    ),
  communityBanner: z.string({
    invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
  }),
});

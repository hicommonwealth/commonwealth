import z from 'zod';

export const VALIDATION_MESSAGES = {
  NO_INPUT: 'No input',
  MAX_CHAR_LIMIT_REACHED: 'Max character limit reached',
  INVALID_VALUE: 'Invalid value',
};

export const requirementSubFormValidationSchema = z.object({
  requirementType: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementChain: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementContractAddress: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementCondition: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementAmount: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: VALIDATION_MESSAGES.INVALID_VALUE }
    ),
  requirementTokenId: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: VALIDATION_MESSAGES.INVALID_VALUE }
    ),
});

export const groupValidationSchema = z.object({
  groupName: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(40, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  groupDescription: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .max(250, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
    .optional()
    .default(''),
  requirementsToFulfill: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  topics: z
    .array(
      z.object({
        value: z.any().default(-1),
        label: z.string().nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
      }),
      {
        invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
        required_error: VALIDATION_MESSAGES.NO_INPUT,
      }
    )
    .min(1, { message: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
});

import z from 'zod/v4';

export const VALIDATION_MESSAGES = {
  NO_INPUT: 'No input',
  MAX_CHAR_LIMIT_REACHED: 'Max character limit reached',
  INVALID_INPUT: 'Invalid input',
  INVALID_URL: 'Invalid Url',
};

export const requirementSubFormValidationSchema = z.object({
  requirementType: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementChain: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementContractAddress: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementCondition: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  requirementAmount: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
  requirementTokenId: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
});

export const groupValidationSchema = z.object({
  groupName: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(40, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  groupDescription: z
    .string()
    .max(250, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
    .optional()
    .default(''),
  groupImageUrl: z
    .union([
      z.string().url({ message: VALIDATION_MESSAGES.INVALID_URL }),
      z.string().optional().default(''),
      z.null(), // Allows null
    ])
    .optional(),
  requirementsToFulfill: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  topics: z.union([
    z
      .array(
        z.object({
          value: z.any().default(-1).optional(),
          label: z.string().default('').optional(),
        }),
      )
      .optional(),
    z.literal('').transform(() => []),
  ]),
});

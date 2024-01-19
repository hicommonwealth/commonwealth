import z from 'zod';

export const VALIDATION_MESSAGES = {
  NO_INPUT: 'No input',
  MAX_CHAR_LIMIT_REACHED: 'Max character limit reached',
  INVALID_INPUT: 'Invalid input',
  INVALID_REQUIREMENTS: 'Invalid requirements',
  INVALID_ADDRESS: 'Invalid address',
  CONTRACT_NOT_FOUND: 'Contract not found',
  INVALID_CONTRACT_TYPE: 'Invalid contract type',
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
      { message: VALIDATION_MESSAGES.INVALID_INPUT },
    ),
  requirementTokenId: z
    .string({ invalid_type_error: VALIDATION_MESSAGES.NO_INPUT })
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
  topics: z.union([
    z
      .array(
        z.object({
          value: z.any().default(-1).optional(),
          label: z.string().default('').optional(),
        }),
        {
          invalid_type_error: VALIDATION_MESSAGES.NO_INPUT,
          required_error: VALIDATION_MESSAGES.NO_INPUT,
        },
      )
      .optional(),
    z.literal('').transform(() => []),
  ]),
});

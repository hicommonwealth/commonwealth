import z from 'zod';

const NO_INPUT = 'No input';
const MAX_CHAR_LIMIT_REACHED = 'Max character limit reached';
const INVALID_VALUE = 'Invalid value';

export const requirementSubFormValidationSchema = z.object({
  requirementType: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT }),
  requirementChain: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT }),
  requirementContractAddress: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT }),
  requirementCondition: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT }),
  requirementAmount: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: INVALID_VALUE }
    ),
});

export const groupValidationSchema = z.object({
  groupName: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT })
    .max(40, { message: MAX_CHAR_LIMIT_REACHED }),
  groupDescription: z
    .string({ invalid_type_error: NO_INPUT })
    .max(250, { message: MAX_CHAR_LIMIT_REACHED }),
  numberOfRequirements: z
    .string({ invalid_type_error: NO_INPUT })
    .nonempty({ message: NO_INPUT }),
  topics: z
    .array(
      z.object({
        value: z.any().default(-1),
        label: z.string().nonempty({ message: NO_INPUT }),
      }),
      {
        invalid_type_error: NO_INPUT,
        required_error: NO_INPUT,
      }
    )
    .min(1, { message: NO_INPUT })
    .nonempty({ message: NO_INPUT }),
});

import z from 'zod';

export const requirementSubFormValidationSchema = z.object({
  requirementType: z
    .string({ invalid_type_error: 'Type is required!' })
    .nonempty({ message: 'Type is required!' }),
  requirementChain: z
    .string({ invalid_type_error: 'Chain is required!' })
    .nonempty({ message: 'Chain is required!' }),
  requirementContractAddress: z
    .string({ invalid_type_error: 'Address is required!' })
    .nonempty({ message: 'Address is required!' })
    .min(10, { message: 'Address must be min 10 characters!' }),
  requirementCondition: z
    .string({ invalid_type_error: 'Condition is required!' })
    .nonempty({ message: 'Condition is required!' }),
  requirementAmount: z
    .string({ invalid_type_error: 'Amount is required!' })
    .nonempty({ message: 'Amount is required!' })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: 'Amount must be a valid number!' }
    ),
});

export const groupValidationSchema = z.object({
  groupName: z
    .string({ invalid_type_error: 'Group name is required!' })
    .nonempty({ message: 'Group name is required!' })
    .max(3, { message: 'Max character limit reached!' }),
  groupDescription: z
    .string({ invalid_type_error: 'Invalid value!' })
    .max(250, { message: 'Max character limit reached!' }),
  topics: z
    .array(
      z.object({
        value: z.number().default(-1),
        label: z.string().nonempty({ message: 'Invalid value' }),
      }),
      {
        invalid_type_error: 'Invalid value',
        required_error: 'Topic(s) are required',
      }
    )
    .min(1, { message: 'At least 1 topic is required' })
    .nonempty({ message: 'Topic(s) are required' }),
});

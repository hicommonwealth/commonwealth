import { communityNameSchema } from 'helpers/formValidations/common';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod';

export const baseCommunityInformationFormValidationSchema = z.object({
  communityName: communityNameSchema,
  communityDescription: z
    .string({ error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(250, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  communityProfileImageURL: z
    .string({ error: VALIDATION_MESSAGES.NO_INPUT })
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  tokenizeCommunity: z.boolean().default(true),
});

export const communityChainValidation = z.object({
  chain: z.object(
    {
      value: z.any().default(-1).optional(),
      label: z.string().default('').optional(),
    },
    {
      error: VALIDATION_MESSAGES.NO_INPUT,
    },
  ),
});

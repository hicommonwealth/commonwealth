import {
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
} from '@hicommonwealth/shared';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import z from 'zod/v4';

export const baseCommunityInformationFormValidationSchema = z.object({
  communityName: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED })
    .regex(COMMUNITY_NAME_REGEX, {
      message: COMMUNITY_NAME_ERROR,
    }),
  communityDescription: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT })
    .max(250, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  communityProfileImageURL: z
    .string()
    .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
  tokenizeCommunity: z.boolean().default(true),
});

export const communityChainValidation = z.object({
  chain: z.object(
    {
      value: z.any().default(-1).optional(),
      label: z.string().default('').optional(),
    },
    {},
  ),
});

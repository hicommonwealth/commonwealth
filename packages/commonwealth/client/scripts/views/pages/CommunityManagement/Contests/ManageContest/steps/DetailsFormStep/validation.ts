import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { ContestFeeType } from 'views/pages/CommunityManagement/Contests/ManageContest/types';
import z from 'zod';

export const detailsFormValidationSchema = z.object({
  contestName: z
    .string()
    .min(1, { message: 'You must name your contest' })
    .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  contestImage: z.string().optional(),
  feeType: z.enum([
    ContestFeeType.CommunityStake,
    ContestFeeType.DirectDeposit,
  ]),
  contestRecurring: z.string(),
  fundingTokenAddress: z.string().optional().nullable(),
});

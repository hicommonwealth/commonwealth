import { VALIDATION_MESSAGES } from 'helpers/formValidationMessages';
import z from 'zod';
import { ContestFeeType } from './DetailsFormStep';

export const detailsFormValidationSchema = z
  .object({
    contestName: z
      .string()
      .min(1, { message: 'You must name your contest' })
      .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
    contestImage: z.string().optional(),
    feeType: z.string(),
    contestRecurring: z.string(),
    fundingTokenAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      return (
        data.feeType === ContestFeeType.CommunityStake ||
        data.fundingTokenAddress
      );
    },
    {
      message: 'You must enter a token address',
      path: ['fundingTokenAddress'],
    },
  );

import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { OpenFeature } from '@openfeature/web-sdk';
import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import { ContestFeeType } from 'views/pages/CommunityManagement/Contests/ManageContest/types';
import z from 'zod';

const client = OpenFeature.getClient();
const weightedTopicsEnabled = client.getBooleanValue('weightedTopics', false);

export const detailsFormValidationSchema = z.object({
  contestName: z
    .string()
    .min(1, { message: 'You must name your contest' })
    .max(255, { message: VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED }),
  contestDescription: z.string().optional(),
  contestImage: z.string().optional(),
  contestTopic: z
    .object({
      value: z.number().optional(),
      label: z.string(),
      helpText: z.string().optional(),
      weightedVoting: z.nativeEnum(TopicWeightedVoting).optional().nullish(),
    })
    .optional()
    .refine((value) => (weightedTopicsEnabled ? !!value : true), {
      message: 'You must select a topic',
    }),
  feeType: z.enum([
    ContestFeeType.CommunityStake,
    ContestFeeType.DirectDeposit,
  ]),
  contestRecurring: z.string(),
  fundingTokenAddress: z.string().optional().nullable(),
});

import z from 'zod';
import { detailsFormValidationSchema } from './steps/DetailsFormStep/validation';

export type LaunchContestStep =
  | 'DetailsForm'
  | 'SignTransactions'
  | 'ContestLive';

export enum ContestFeeType {
  CommunityStake = 'community-stake',
  DirectDeposit = 'direct-deposit',
}

export enum ContestRecurringType {
  Yes = 'yes',
  No = 'no',
}

export type ContestFormValidationSubmitValues = z.infer<
  ReturnType<typeof detailsFormValidationSchema>
>;

export type ContestFormData = ContestFormValidationSubmitValues & {
  prizePercentage: number;
  payoutStructure: number[];
  contestDuration?: number;
  topicsData?: {
    id?: number;
    token_symbol?: string | null;
    eth_chain_id?: number | null;
    vote_weight_multiplier?: number | null;
    community_id: string;
    token_address?: string | null;
    name?: string;
    weighted_voting?: any;
  }[];
};

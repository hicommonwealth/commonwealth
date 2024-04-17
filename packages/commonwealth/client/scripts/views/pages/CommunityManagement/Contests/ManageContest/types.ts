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

export type ContestFormSubmitValues = z.infer<
  typeof detailsFormValidationSchema
>;

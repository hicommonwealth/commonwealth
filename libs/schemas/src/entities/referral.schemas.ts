import z from 'zod';
import { EVM_ADDRESS, PG_INT } from '../utils';

export const REFERRAL_EVENTS = [
  'CommunityCreated',
  'SignUpFlowCompleted',
] as const;

export const Referral = z
  .object({
    eth_chain_id: PG_INT.describe(
      'The ID of the EVM chain on which the referral exists',
    ),
    transaction_hash: z
      .string()
      .describe('The hash of the transaction in which the referral is created'),
    namespace_address: EVM_ADDRESS.describe(
      'The address of the namespace the referee created with the referral',
    ),
    referrer_address: EVM_ADDRESS.describe(
      'The address of the user who referred',
    ),
    referee_address: EVM_ADDRESS.describe(
      'The address of the user who was referred',
    ),
    referrer_received_eth_amount: z
      .number()
      .describe(
        'The amount of ETH received by the referrer from fees generated by the referee',
      ),
    referral_created_timestamp: z
      .number()
      .describe('The timestamp of the referral creation'),
    updated_at: z.coerce
      .date()
      .optional()
      .describe(
        'The date at which the referrer received eth amount was last updated',
      ),
  })
  .describe(
    'Projects ReferralSet events and aggregates fees generated by each referee',
  );

export const ReferralFees = z.object({
  eth_chain_id: PG_INT.describe('The ID of the EVM chain'),
  transaction_hash: z.string().describe('The hash of the transaction'),
  namespace_address: z.string().describe('The address of the namespace'),
  distributed_token_address: z
    .string()
    .describe('The address of the distributed token'),
  referrer_recipient_address: z
    .string()
    .describe('The address of the referrer recipient'),
  referrer_received_amount: z
    .number()
    .describe('The amount of ETH received by the referrer'),
  transaction_timestamp: z
    .number()
    .describe('The timestamp when the referral fee was distributed'),
});

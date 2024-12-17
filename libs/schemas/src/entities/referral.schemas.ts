import z from 'zod';
import { PG_INT } from '../utils';
import { UserProfile } from './user.schemas';

export const REFERRAL_EVENTS = [
  'CommunityCreated',
  'SignUpFlowCompleted',
] as const;

export const Referral = z
  .object({
    referrer_id: PG_INT.describe('The user who referred'),
    referee_id: PG_INT.describe('The user who was referred'),
    event_name: z.enum(REFERRAL_EVENTS).describe('The name of the event'),
    event_payload: z.any().describe('The payload of the event'),
    created_at: z.coerce.date().optional(),
    // TODO: add other metrics

    // associations
    referrer: z
      .object({
        id: PG_INT,
        profile: UserProfile,
      })
      .optional(),
    referee: z
      .object({
        id: PG_INT,
        profile: UserProfile,
      })
      .optional(),
  })
  .describe('Projects referral events');

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
  referrer_received_eth_amount: z
    .number()
    .describe('The amount of ETH received by the referrer'),
});

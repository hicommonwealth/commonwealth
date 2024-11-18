import z from 'zod';
import { PG_INT } from '../utils';

export const REFERRAL_EVENTS = ['CommunityCreated'] as const;

export const Referral = z
  .object({
    referrer_id: PG_INT.describe('The user who referred'),
    referee_id: PG_INT.describe('The user who was referred'),
    event_name: z.enum(REFERRAL_EVENTS).describe('The name of the event'),
    event_payload: z.any().describe('The payload of the event'),
    created_at: z.coerce.date().optional(),
    // TODO: add other metrics
  })
  .describe('Projects referral events');

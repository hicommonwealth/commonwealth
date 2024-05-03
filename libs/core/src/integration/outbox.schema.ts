import { PG_INT } from '@hicommonwealth/shared';
import z from 'zod';
import { EventNames } from './events';
import * as events from './events.schemas';

const BaseOutboxProperties = z.object({
  event_id: PG_INT.optional(),
  relayed: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const Outbox = z.union([
  z
    .object({
      event_name: z.literal(EventNames.ThreadCreated),
      event_payload: events.ThreadCreated,
    })
    .merge(BaseOutboxProperties),
  z
    .object({
      event_name: z.literal(EventNames.CommentCreated),
      event_payload: events.CommentCreated,
    })
    .merge(BaseOutboxProperties),
  z
    .object({
      event_name: z.literal(EventNames.GroupCreated),
      event_payload: events.GroupCreated,
    })
    .merge(BaseOutboxProperties),
  z
    .object({
      event_name: z.literal(EventNames.CommunityCreated),
      event_payload: events.CommunityCreated,
    })
    .merge(BaseOutboxProperties),
  z
    .object({
      event_name: z.literal(EventNames.SnapshotProposalCreated),
      event_payload: events.SnapshotProposalCreated,
    })
    .merge(BaseOutboxProperties),
  z
    .object({
      event_name: z.literal(EventNames.DiscordMessageCreated),
      event_payload: events.DiscordMessageCreated,
    })
    .merge(BaseOutboxProperties),
  z
    .object({
      event_name: z.literal(EventNames.ChainEventCreated),
      event_payload: events.ChainEventCreated,
    })
    .merge(BaseOutboxProperties),
]);

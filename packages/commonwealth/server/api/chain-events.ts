import { trpc } from '@hicommonwealth/adapters';
import { ChainEvents } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  chainEventCreated: trpc.command(
    ChainEvents.ChainEventCreated,
    trpc.Tag.ChainEvent,
  ),
});

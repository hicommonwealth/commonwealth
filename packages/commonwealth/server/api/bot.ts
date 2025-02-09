import { trpc } from '@hicommonwealth/adapters';
import { Bot } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  launchTokenBot: trpc.command(Bot.LaunchTokenBot, trpc.Tag.Bot),
});

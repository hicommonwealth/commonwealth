import { trpc } from '@hicommonwealth/adapters';
import { DiscordBot } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  removeDiscordBotConfig: trpc.command(
    DiscordBot.RemoveDiscordBotConfig,
    trpc.Tag.DiscordBot,
  ),
  createDiscordBotConfig: trpc.command(
    DiscordBot.CreateDiscordBotConfig,
    trpc.Tag.DiscordBot,
  ),
  setDiscordBotConfig: trpc.command(
    DiscordBot.SetDiscordBotConfig,
    trpc.Tag.DiscordBot,
  ),
});

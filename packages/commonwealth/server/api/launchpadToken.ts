import { trpc } from '@hicommonwealth/adapters';
import { Token } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createTrade: trpc.command(Token.CreateLaunchpadTrade, trpc.Tag.Token),
  createToken: trpc.command(Token.CreateLaunchpadToken, trpc.Tag.Token),
  getTokens: trpc.query(Token.GetLaunchpadTokens, trpc.Tag.Token),
  getToken: trpc.query(Token.GetLaunchpadToken, trpc.Tag.Token),
});

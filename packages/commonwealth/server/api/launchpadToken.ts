import { trpc } from '@hicommonwealth/adapters';
import { Token } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createTrade: trpc.command(Token.CreateLaunchpadTrade, trpc.Tag.Token),
  createToken: trpc.command(Token.CreateToken, trpc.Tag.Token),
  getTokens: trpc.query(Token.GetLaunchpadTokens, trpc.Tag.Token),
  getToken: trpc.query(Token.GetLaunchpadToken, trpc.Tag.Token),
  getLaunchpadTrades: trpc.query(Token.GetLaunchpadTrades, trpc.Tag.Token),
  // Not really part of the LaunchpadToken, but no better place to put it
  distributeSkale: trpc.command(Token.DistributeSkale, trpc.Tag.Token),
});

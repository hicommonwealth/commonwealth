import { trpc } from '@hicommonwealth/adapters';
import { Token } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createTrade: trpc.command(Token.CreateLaunchpadTrade, trpc.Tag.Token),
  createToken: trpc.command(Token.CreateToken, trpc.Tag.Token),
  getTokens: trpc.query(Token.GetLaunchpadTokens, trpc.Tag.Token),
  getToken: trpc.query(Token.GetLaunchpadToken, trpc.Tag.Token),
  getThreadToken: trpc.query(Token.GetThreadToken, trpc.Tag.Token),
  getLaunchpadTrades: trpc.query(Token.GetLaunchpadTrades, trpc.Tag.Token),
  geTokenizedThreadsAllowed: trpc.query(
    Token.GetTokenizedThreadsAllowed,
    trpc.Tag.Token,
  ),
  getTokenInfoAlchemy: trpc.query(Token.GetTokenInfoAlchemy, trpc.Tag.Token),
  getTokenStats: trpc.query(Token.GetTokenStats, trpc.Tag.Token),
});

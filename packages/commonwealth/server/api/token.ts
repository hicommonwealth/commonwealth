import { trpc } from '@hicommonwealth/adapters';
import { Token } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createLaunchpadTrade: trpc.command(
    Token.CreateLaunchpadTrade,
    trpc.Tag.Token,
  ),
  createToken: trpc.command(Token.CreateToken, trpc.Tag.Token),
  getTokens: trpc.query(Token.GetTokens, trpc.Tag.Token),
});

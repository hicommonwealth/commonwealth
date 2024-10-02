import { trpc } from '@hicommonwealth/adapters';
import { Token } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createToken: trpc.command(Token.CreateToken, trpc.Tag.Token),
});

import { trpc } from '@hicommonwealth/adapters';
import { LoadTest } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createJWTs: trpc.command(LoadTest.CreateJWTs, trpc.Tag.LoadTest),
});

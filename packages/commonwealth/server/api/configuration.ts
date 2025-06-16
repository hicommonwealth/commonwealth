import { trpc } from '@hicommonwealth/adapters';
import { Configuration } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getPublicEnvVar: trpc.query(
    Configuration.GetPublicEnvVar,
    trpc.Tag.Configuration,
  ),
});

import { trpc } from '@hicommonwealth/adapters';
import { Email } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getRecapEmailData: trpc.query(Email.GetRecapEmailDataQuery),
  getDigestEmailData: trpc.query(Email.GetDigestEmailDataQuery),
});

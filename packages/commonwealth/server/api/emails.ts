import { trpc } from '@hicommonwealth/adapters';
import { Email } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getRecapEmailData: trpc.query(Email.GetRecapEmailDataQuery, trpc.Tag.User),
  getDigestEmailData: trpc.query(Email.GetDigestEmailDataQuery, trpc.Tag.User),
  getWeeklyReferralFeesEarnedQuery: trpc.query(
    Email.GetWeeklyReferralFeesEarnedQuery,
    trpc.Tag.User,
  ),
});

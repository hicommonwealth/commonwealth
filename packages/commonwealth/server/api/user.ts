import { trpc } from '@hicommonwealth/adapters';
import { User } from '@hicommonwealth/model';
import { MixpanelUserSignupEvent } from 'shared/analytics/types';

export const trpcRouter = trpc.router({
  signIn: trpc.command(User.SignIn, trpc.Tag.User, (_, output) =>
    Promise.resolve(
      output.joined_community
        ? [
            MixpanelUserSignupEvent.NEW_USER_SIGNUP,
            { community_id: output.community_id },
          ]
        : undefined,
    ),
  ),
  updateUser: trpc.command(User.UpdateUser, trpc.Tag.User),
  getNewContent: trpc.query(User.GetNewContent, trpc.Tag.User),
  createApiKey: trpc.command(User.CreateApiKey, trpc.Tag.User),
  getApiKey: trpc.query(User.GetApiKey, trpc.Tag.User),
  deleteApiKey: trpc.command(User.DeleteApiKey, trpc.Tag.User),
  getUserProfile: trpc.query(User.GetUserProfile, trpc.Tag.User),
  getUserAddresses: trpc.query(User.GetUserAddresses, trpc.Tag.User),
  searchUserProfiles: trpc.query(User.SearchUserProfiles, trpc.Tag.User),
  createReferralLink: trpc.command(User.CreateReferralLink, trpc.Tag.User),
  getReferralLink: trpc.query(User.GetReferralLink, trpc.Tag.User),
  getUserReferrals: trpc.query(User.GetUserReferrals, trpc.Tag.User),
  getXps: trpc.query(User.GetXps, trpc.Tag.User),
});

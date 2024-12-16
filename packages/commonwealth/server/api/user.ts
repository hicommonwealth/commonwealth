import { trpc } from '@hicommonwealth/adapters';
import { User, incrementProfileCount } from '@hicommonwealth/model';
import {
  MixpanelLoginEvent,
  MixpanelUserSignupEvent,
} from 'shared/analytics/types';

export const trpcRouter = trpc.router({
  signIn: trpc.command(
    User.SignIn,
    trpc.Tag.User,
    (_, output) =>
      Promise.resolve(
        output.user_created
          ? [
              MixpanelUserSignupEvent.NEW_USER_SIGNUP,
              { community_id: output.community_id },
            ]
          : [
              MixpanelLoginEvent.LOGIN_COMPLETED,
              {
                community_id: output.community_id,
                userId: output.user_id,
              },
            ],
      ),
    (_, output) => incrementProfileCount(output.community_id, output.user_id!),
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

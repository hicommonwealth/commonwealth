import { trpc } from '@hicommonwealth/adapters';
import { analytics } from '@hicommonwealth/core';
import { refreshProfileCount, User } from '@hicommonwealth/model';
import {
  MixpanelLoginEvent,
  MixpanelUserSignupEvent,
} from 'shared/analytics/types';

export const trpcRouter = trpc.router({
  signIn: trpc.command(User.SignIn, trpc.Tag.User, [
    async (input, output, ctx) => {
      await new Promise((resolve, reject) => {
        // no need to login if we're already signed in
        if (output.was_signed_in) return resolve(true);

        // complete passport login
        ctx.req.login(output.User as Express.User, (err) => {
          if (err) {
            analytics().track(
              'Login Failed',
              trpc.getAnalyticsPayload(ctx, {
                community_id: input.community_id,
                address: input.address,
              }),
            );
            reject(err);
          }
          resolve(true);
        });
      });
    },
    trpc.trackAnalytics((_, output) =>
      Promise.resolve(
        output.user_created
          ? [
              MixpanelUserSignupEvent.NEW_USER_SIGNUP,
              { community_id: output.community_id },
            ]
          : !output.was_signed_in
            ? [
                MixpanelLoginEvent.LOGIN_COMPLETED,
                {
                  community_id: output.community_id,
                  userId: output.user_id,
                },
              ]
            : undefined,
      ),
    ),
    trpc.fireAndForget(async (_, output) => {
      if (output.user_created) await refreshProfileCount(output.community_id);
    }),
  ]),
  updateUser: trpc.command(User.UpdateUser, trpc.Tag.User),
  getNewContent: trpc.query(User.GetNewContent, trpc.Tag.User),
  createApiKey: trpc.command(User.CreateApiKey, trpc.Tag.User),
  getApiKey: trpc.query(User.GetApiKey, trpc.Tag.User),
  deleteApiKey: trpc.command(User.DeleteApiKey, trpc.Tag.User),
  getUserProfile: trpc.query(User.GetUserProfile, trpc.Tag.User),
  getUserAddresses: trpc.query(User.GetUserAddresses, trpc.Tag.User),
  searchUserProfiles: trpc.query(User.SearchUserProfiles, trpc.Tag.User),
  getUserReferrals: trpc.query(User.GetUserReferrals, trpc.Tag.User),
  getUserReferralFees: trpc.query(User.GetUserReferralFees, trpc.Tag.User),
  getXps: trpc.query(User.GetXps, trpc.Tag.User),
  getXpsRanked: trpc.query(User.GetXpsRanked, trpc.Tag.User),
  updateSettings: trpc.command(User.UpdateSettings, trpc.Tag.User),
  getAddressStatus: trpc.query(User.GetAddressStatus, trpc.Tag.User),
  getStatus: trpc.query(User.GetStatus, trpc.Tag.User),
  updateEmail: trpc.command(User.UpdateEmail, trpc.Tag.User),
  getMutualConnections: trpc.query(User.GetMutualConnections, trpc.Tag.User),
  // Not really part of the user, but no better place to put it
  distributeSkale: trpc.command(User.DistributeSkale, trpc.Tag.Token),
});

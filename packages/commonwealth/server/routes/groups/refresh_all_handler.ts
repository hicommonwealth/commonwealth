import Bluebird from 'bluebird';
import { AppError } from '../../../../common-common/src/errors';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

export const refreshAllHandler = async (
  controllers: ServerControllers,
  req: TypedRequest,
  res: TypedResponse<any>,
) => {
  if (!req.user.isAdmin) {
    throw new AppError('must be super admin');
  }

  const communitiesResult = await controllers.communities.getCommunities({
    hasGroups: true,
  });

  // refresh in background
  Bluebird.map(
    communitiesResult,
    async ({ community }) => {
      await controllers.groups.refreshCommunityMemberships({
        community,
      });
    },
    { concurrency: 10 }, // limit concurrency
  ).then(() => {
    console.log(`done- refreshed ${communitiesResult.length} communities`);
  });

  return success(res, null);
};

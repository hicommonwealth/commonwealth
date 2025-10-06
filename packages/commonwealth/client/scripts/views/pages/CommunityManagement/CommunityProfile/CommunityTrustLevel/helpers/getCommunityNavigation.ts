import { CommunityVerificationItemType } from '@hicommonwealth/shared';

export const getCommunityNavigation = (
  action: CommunityVerificationItemType,
  communityId: string | null,
) => {
  switch (action) {
    case 'LAUNCH_COIN':
      return `/${communityId}/manage/integrations/token`;
    default:
      return '/';
  }
};

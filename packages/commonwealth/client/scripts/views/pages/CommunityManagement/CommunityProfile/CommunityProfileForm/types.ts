import { DefaultPage } from '@hicommonwealth/core';

export type CommunityTags = 'DeFi' | 'DAO';

export type FormSubmitValues = {
  communityName: string;
  communityDescription: string;
  communityProfileImageURL: string;
  defaultPage: DefaultPage;
  hasStagesEnabled?: boolean;
  customStages?: string;
  communityBanner?: string;
};

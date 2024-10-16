/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface GetCommunityResponseAddressesAddressesItemUser {
  id?: number;
  email?: string;
  isAdmin?: boolean;
  disableRichText?: boolean;
  emailVerified?: boolean;
  selectedCommunityId?: string;
  emailNotificationInterval?: CommonApi.GetCommunityResponseAddressesAddressesItemUserEmailNotificationInterval;
  promotionalEmailsEnabled?: boolean;
  isWelcomeOnboardFlowComplete?: boolean;
  profile: CommonApi.GetCommunityResponseAddressesAddressesItemUserProfile;
  xpPoints?: number;
  profileTags?: CommonApi.GetCommunityResponseAddressesAddressesItemUserProfileTagsItem[];
  apiKey?: CommonApi.GetCommunityResponseAddressesAddressesItemUserApiKey;
  createdAt?: Date;
  updatedAt?: Date;
}

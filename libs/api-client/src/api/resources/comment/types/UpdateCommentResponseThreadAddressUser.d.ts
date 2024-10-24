/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export interface UpdateCommentResponseThreadAddressUser {
  id?: number;
  email?: string;
  isAdmin?: boolean;
  disableRichText?: boolean;
  emailVerified?: boolean;
  selectedCommunityId?: string;
  emailNotificationInterval?: CommonApi.UpdateCommentResponseThreadAddressUserEmailNotificationInterval;
  promotionalEmailsEnabled?: boolean;
  isWelcomeOnboardFlowComplete?: boolean;
  profile: CommonApi.UpdateCommentResponseThreadAddressUserProfile;
  xpPoints?: number;
  profileTags?: CommonApi.UpdateCommentResponseThreadAddressUserProfileTagsItem[];
  apiKey?: CommonApi.UpdateCommentResponseThreadAddressUserApiKey;
  createdAt?: Date;
  updatedAt?: Date;
}

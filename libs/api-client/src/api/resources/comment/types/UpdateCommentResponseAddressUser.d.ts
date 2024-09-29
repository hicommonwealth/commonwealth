/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface UpdateCommentResponseAddressUser {
    id?: number;
    email?: string;
    isAdmin?: boolean;
    disableRichText?: boolean;
    emailVerified?: boolean;
    selectedCommunityId?: string;
    emailNotificationInterval?: CommonApi.UpdateCommentResponseAddressUserEmailNotificationInterval;
    promotionalEmailsEnabled?: boolean;
    isWelcomeOnboardFlowComplete?: boolean;
    profile: CommonApi.UpdateCommentResponseAddressUserProfile;
    profileTags?: CommonApi.UpdateCommentResponseAddressUserProfileTagsItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

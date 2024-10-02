/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface UpdateThreadResponseCollaboratorsItemUser {
    id?: number;
    email?: string;
    isAdmin?: boolean;
    disableRichText?: boolean;
    emailVerified?: boolean;
    selectedCommunityId?: string;
    emailNotificationInterval?: CommonApi.UpdateThreadResponseCollaboratorsItemUserEmailNotificationInterval;
    promotionalEmailsEnabled?: boolean;
    isWelcomeOnboardFlowComplete?: boolean;
    profile: CommonApi.UpdateThreadResponseCollaboratorsItemUserProfile;
    profileTags?: CommonApi.UpdateThreadResponseCollaboratorsItemUserProfileTagsItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

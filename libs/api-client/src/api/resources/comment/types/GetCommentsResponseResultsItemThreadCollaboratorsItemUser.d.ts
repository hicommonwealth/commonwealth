/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface GetCommentsResponseResultsItemThreadCollaboratorsItemUser {
    id?: number;
    email?: string;
    isAdmin?: boolean;
    disableRichText?: boolean;
    emailVerified?: boolean;
    selectedCommunityId?: string;
    emailNotificationInterval?: CommonApi.GetCommentsResponseResultsItemThreadCollaboratorsItemUserEmailNotificationInterval;
    promotionalEmailsEnabled?: boolean;
    isWelcomeOnboardFlowComplete?: boolean;
    profile: CommonApi.GetCommentsResponseResultsItemThreadCollaboratorsItemUserProfile;
    profileTags?: CommonApi.GetCommentsResponseResultsItemThreadCollaboratorsItemUserProfileTagsItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

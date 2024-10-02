/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface UpdateCommunityRequestGroupsItem {
    id?: number;
    communityId: string;
    metadata: CommonApi.UpdateCommunityRequestGroupsItemMetadata;
    requirements: CommonApi.UpdateCommunityRequestGroupsItemRequirementsItem[];
    isSystemManaged?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

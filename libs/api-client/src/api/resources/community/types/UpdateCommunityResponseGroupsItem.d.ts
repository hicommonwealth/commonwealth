/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface UpdateCommunityResponseGroupsItem {
  id?: number;
  communityId: string;
  metadata: CommonApi.UpdateCommunityResponseGroupsItemMetadata;
  requirements: CommonApi.UpdateCommunityResponseGroupsItemRequirementsItem[];
  isSystemManaged?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

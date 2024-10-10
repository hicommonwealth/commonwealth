/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../index';

/**
 * @example
 *     {
 *         communityId: "community_id",
 *         groupId: 1
 *     }
 */
export interface UpdateGroupRequest {
  communityId: string;
  groupId: number;
  metadata?: CommonApi.UpdateGroupRequestMetadata;
  requirements?: CommonApi.UpdateGroupRequestRequirementsItem[];
  topics?: number[];
}

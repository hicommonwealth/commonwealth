/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../../core';
export const UpdateTopicRequest = core.serialization.object({
  topicId: core.serialization.property('topic_id', core.serialization.number()),
  communityId: core.serialization.property(
    'community_id',
    core.serialization.string(),
  ),
  name: core.serialization.string().optional(),
  description: core.serialization.string().optional(),
  groupIds: core.serialization.property(
    'group_ids',
    core.serialization.list(core.serialization.number()).optional(),
  ),
  telegram: core.serialization.string().optional(),
  featuredInSidebar: core.serialization.property(
    'featured_in_sidebar',
    core.serialization.boolean().optional(),
  ),
  featuredInNewPost: core.serialization.property(
    'featured_in_new_post',
    core.serialization.boolean().optional(),
  ),
  defaultOffchainTemplate: core.serialization.property(
    'default_offchain_template',
    core.serialization.string().optional(),
  ),
});

import { InvalidState, type Command } from '@hicommonwealth/core';

import * as schemas from '@hicommonwealth/schemas';
import { models } from '..';
import { AuthContext, isAuthorized } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';
import { decodeContent, sanitizeQuillText } from '../utils';

const Errors = {
  DefaultTemplateRequired: 'Default Template required',
};

export function UpdateTopic(): Command<
  typeof schemas.UpdateTopic,
  AuthContext
> {
  return {
    ...schemas.UpdateTopic,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ actor, payload, auth }) => {
      const { topic_id } = mustBeAuthorized(actor, auth);

      const topic = await models.Topic.findByPk(topic_id!);
      mustExist('Topic', topic);

      if (topic.archived_at) {
        throw new InvalidState('Cannot update archived topic');
      }

      const {
        name,
        description,
        telegram,
        group_ids,
        featured_in_sidebar,
        featured_in_new_post,
      } = payload;

      const decodedDescription = decodeContent(description ?? '');

      let default_community_template =
        payload.default_offchain_template?.trim();
      if (featured_in_new_post && !default_community_template) {
        throw new InvalidState(Errors.DefaultTemplateRequired);
      }
      // sanitize text
      default_community_template = sanitizeQuillText(
        default_community_template!,
      );

      if (typeof name !== 'undefined') {
        topic.name = name;
      }
      if (typeof decodedDescription !== 'undefined') {
        topic.description = decodedDescription;
      }
      if (typeof telegram !== 'undefined') {
        topic.telegram = telegram || '';
      }
      if (Array.isArray(group_ids)) {
        topic.group_ids = group_ids;
      }
      if (typeof featured_in_sidebar !== 'undefined') {
        topic.featured_in_sidebar = featured_in_sidebar || false;
      }
      if (typeof featured_in_new_post !== 'undefined') {
        topic.featured_in_new_post = featured_in_new_post || false;
      }
      if (typeof default_community_template !== 'undefined') {
        topic.default_offchain_template = default_community_template || '';
      }
      await topic.save();

      return {
        topic: topic.toJSON(),
        user_id: actor.user.id!,
      };
    },
  };
}

import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authTopic } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { decodeContent, sanitizeQuillText } from '../../utils';

const Errors = {
  DefaultTemplateRequired: 'Default Template required',
};

export function UpdateTopic(): Command<typeof schemas.UpdateTopic> {
  return {
    ...schemas.UpdateTopic,
    auth: [authTopic({ roles: ['admin'] })],
    body: async ({ actor, payload }) => {
      const { topic_id } = payload;

      // TODO: can use topic in auth
      const topic = await models.Topic.findByPk(topic_id!);
      mustExist('Topic', topic);

      if (topic.archived_at) {
        throw new InvalidState('Cannot update archived topic');
      }

      const {
        name,
        description,
        telegram,
        featured_in_sidebar,
        featured_in_new_post,
        allow_tokenized_threads,
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
      if (typeof featured_in_sidebar !== 'undefined') {
        topic.featured_in_sidebar = featured_in_sidebar || false;
      }
      if (typeof featured_in_new_post !== 'undefined') {
        topic.featured_in_new_post = featured_in_new_post || false;
      }
      if (typeof default_community_template !== 'undefined') {
        topic.default_offchain_template = default_community_template || '';
      }
      if (typeof allow_tokenized_threads !== 'undefined') {
        topic.allow_tokenized_threads = allow_tokenized_threads || false;
      }
      await topic.save();

      return {
        topic: topic.toJSON(),
        user_id: actor.user.id!,
      };
    },
  };
}

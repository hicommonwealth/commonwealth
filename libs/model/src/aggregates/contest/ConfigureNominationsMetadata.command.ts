import type { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function ConfigureNominationsMetadata(): Command<
  typeof schemas.ConfigureNominationsMetadata
> {
  return {
    ...schemas.ConfigureNominationsMetadata,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, judge_token_id } = payload;

      await models.Community.update(
        { pending_namespace_judge_token_id: judge_token_id },
        { where: { id: community_id } },
      );

      return {
        community_id,
        judge_token_id,
        success: true,
      };
    },
  };
}

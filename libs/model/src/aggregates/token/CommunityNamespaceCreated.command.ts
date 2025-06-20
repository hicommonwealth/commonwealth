import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function CommunityNamespaceCreated(): Command<
  typeof schemas.CommunityNamespaceCreated
> {
  return {
    ...schemas.CommunityNamespaceCreated,
    auth: [],
    body: async ({ payload }) => {
      const { namespaceAddress, governanceAddress } = payload;

      await models.Community.update(
        { namespace_governance_address: governanceAddress },
        { where: { namespace_address: namespaceAddress } },
      );

      return {};
    },
  };
}

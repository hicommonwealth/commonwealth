import { AppError, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function LinkGovernanceAddress(): Command<
  typeof schemas.LinkGovernanceAddress
> {
  return {
    ...schemas.LinkGovernanceAddress,
    auth: [],
    body: async ({ payload }) => {
      const { namespaceAddress, governanceAddress } = payload;

      const community = await models.Community.findOne({
        where: { namespace_address: namespaceAddress },
        attributes: ['id', 'namespace_governance_address'],
      });
      if (!community) return {}; // do nothing if community does not exist...the user will have to link it manually

      if (community.namespace_governance_address) {
        if (community.namespace_governance_address === governanceAddress)
          return {}; // do nothing once governance address is linked (idempotency)
        throw new AppError(
          `Community ${community.id} is linked to governance address ${community.namespace_governance_address}.`,
        );
      }

      await models.Community.update(
        { namespace_governance_address: governanceAddress },
        { where: { id: community.id } },
      );
      return {};
    },
  };
}

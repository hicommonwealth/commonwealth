import { AppError, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';

export function LinkGovernanceAddress(): Command<
  typeof schemas.LinkGovernanceAddress
> {
  return {
    ...schemas.LinkGovernanceAddress,
    auth: [],
    body: async ({ payload }) => {
      const { namespaceAddress, governanceAddress } = payload;

      const [updated] = await models.Community.update(
        { namespace_governance_address: governanceAddress },
        {
          where: {
            namespace_address: namespaceAddress,
            namespace_governance_address: {
              [Op.is]: null,
            },
          },
        },
      );

      if (updated === 0) {
        throw new AppError(
          'Failed to link governance address. Namespace not yet connected to community',
        );
      }

      return {};
    },
  };
}

import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { GroupAttributes } from '../models';

export function CreateNamespaceAdminGroup(): Command<
  typeof schemas.CreateNamespaceAdminGroup
> {
  return {
    ...schemas.CreateNamespaceAdminGroup,
    auth: [],
    body: async ({ payload }) => {
      const { namespace_address } = payload;

      const community = await models.Community.findOne({
        where: { namespace_address },
        include: [
          {
            model: models.ChainNode,
            required: true,
          },
        ],
      });
      mustExist('Community', community);

      const group = await models.Group.create({
        community_id: community.id,
        metadata: {
          name: 'Namespace Admins',
          description: 'Users with onchain namespace admin privileges',
          groupImageUrl: '',
          required_requirements: 1,
        },
        requirements: [
          {
            rule: 'threshold',
            data: {
              threshold: '0',
              source: {
                source_type: 'erc1155',
                evm_chain_id: community.ChainNode!.eth_chain_id,
                contract_address: namespace_address,
                token_id: '0',
              },
            },
          },
        ],
        is_system_managed: true,
      } as GroupAttributes);

      return group;
    },
  };
}

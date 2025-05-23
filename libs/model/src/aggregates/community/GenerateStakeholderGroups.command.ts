import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  BalanceSourceType,
  ContractSource,
  ThresholdData,
} from '@hicommonwealth/shared';
import { models } from '../../database';
import { GroupAttributes } from '../../models';

const Errors = {
  CommunityNotFound: 'Community not found',
  StakesNotFound: 'Stakes not found',
  StakeholderGroup: 'Stakeholder group not found',
  ChainNodeNotFound: 'Chain node not found',
  NamespaceNotFound: 'Namespace not found for this name',
};

export function GenerateStakeholderGroups(): Command<
  typeof schemas.GenerateStakeholderGroups
> {
  return {
    ...schemas.GenerateStakeholderGroups,
    auth: [],
    body: async ({ payload }) => {
      const community = await models.Community.findByPk(payload.id, {
        include: [
          {
            model: models.Group,
            as: 'groups',
            where: {
              community_id: payload.id,
              is_system_managed: true,
            },
            required: false,
          },
          {
            model: models.CommunityStake,
            as: 'CommunityStakes',
            where: {
              community_id: payload.id,
            },
            required: false,
          },
          {
            model: models.ChainNode,
            as: 'ChainNode',
            required: false,
          },
        ],
      });

      if (!community) {
        throw new InvalidState(Errors.CommunityNotFound);
      }

      if (community.CommunityStakes?.length === 0) {
        throw new InvalidState(Errors.StakesNotFound);
      }

      // check which stakes need a stakeholder group
      const stakesWithoutGroup = community.CommunityStakes!.filter((stake) => {
        return !community.groups!.find(
          (g) =>
            (
              (g.requirements?.[0]?.data as ThresholdData)
                ?.source as ContractSource
            )?.token_id === stake.stake_id!.toString(),
        );
      });

      if (stakesWithoutGroup.length === 0) {
        return {
          groups: community.groups,
          created: false,
        };
      }

      // get contract address
      if (!community.ChainNode) {
        throw new InvalidState(Errors.ChainNodeNotFound);
      }
      const contractAddress = community.namespace_address;
      if (!contractAddress) {
        throw new InvalidState(Errors.NamespaceNotFound);
      }

      const groups = await models.sequelize.transaction(async (transaction) => {
        return Promise.all(
          stakesWithoutGroup.map(async (stake) => {
            // create group
            const group = await models.Group.create(
              {
                community_id: payload.id,
                metadata: {
                  name: `Stakeholder`,
                  description:
                    // eslint-disable-next-line max-len
                    'Any member who acquires your community stake is a stakeholder of your community, and therefore a member of this group.',
                  required_requirements: 1,
                },
                requirements: [
                  {
                    rule: 'threshold',
                    data: {
                      threshold: '0',
                      source: {
                        source_type: BalanceSourceType.ERC1155,
                        evm_chain_id: community.ChainNode!.eth_chain_id!,
                        contract_address: contractAddress,
                        token_id: stake.stake_id!.toString(),
                      },
                    },
                  },
                ],
                is_system_managed: true,
              } as GroupAttributes,
              { transaction },
            );

            return group.get({ plain: true });
          }),
        );
      });

      return {
        groups,
        created: true,
      };
    },
  };
}

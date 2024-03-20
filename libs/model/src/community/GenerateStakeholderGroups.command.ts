import {
  BalanceSourceType,
  ContractSource,
  InvalidState,
  ThresholdData,
  commonProtocol,
  schemas,
  type Command,
} from '@hicommonwealth/core';
import Web3 from 'web3';
import { models } from '../database';
import { GroupAttributes } from '../models';
import { getNamespace } from '../services/commonProtocol/contractHelpers';

const Errors = {
  CommunityNotFound: 'Community not found',
  StakesNotFound: 'Stakes not found',
  StakeholderGroup: 'Stakeholder group not found',
  ChainNodeNotFound: 'Chain node not found',
  NamespaceNotFound: 'Namespace not found for this name',
};

export const GenerateStakeholderGroups: Command<
  typeof schemas.commands.GenerateStakeholderGroups
> = () => ({
  ...schemas.commands.GenerateStakeholderGroups,
  auth: [],
  body: async ({ id }) => {
    const community = await models.Community.findByPk(id, {
      include: [
        {
          model: models.Group,
          as: 'groups',
          where: {
            community_id: id!,
            is_system_managed: true,
          },
          required: false,
        },
        {
          model: models.CommunityStake,
          as: 'CommunityStakes',
          where: {
            community_id: id!,
          },
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
    const node = await models.ChainNode.findByPk(community.chain_node_id);
    if (!node) {
      throw new InvalidState(Errors.ChainNodeNotFound);
    }
    const factoryData =
      commonProtocol.factoryContracts[
        node.eth_chain_id! as commonProtocol.ValidChains
      ];
    const contractAddress = await getNamespace(
      new Web3(node.url),
      community.namespace!,
      factoryData.factory,
    );
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new InvalidState(Errors.NamespaceNotFound);
    }

    const groups = await models.sequelize.transaction(async (transaction) => {
      return Promise.all(
        stakesWithoutGroup.map(async (stake) => {
          // create group
          const group = await models.Group.create(
            {
              community_id: id!,
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
                      evm_chain_id: node.eth_chain_id!,
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
});

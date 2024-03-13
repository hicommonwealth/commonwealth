import {
  BalanceSourceType,
  ContractSource,
  InvalidState,
  ThresholdData,
  commonProtocol,
  community,
  type Command,
} from '@hicommonwealth/core';
import { ValidChains } from 'core/src/commonProtocol';
import Web3 from 'web3';
import { models } from '../database';
import { getNamespace } from '../services/commonProtocol/contractHelpers';

const Errors = {
  CommunityNotFound: 'Community not found',
  StakesNotFound: 'Stakes not found',
  StakeholderGroup: 'Stakeholder group not found',
  ChainNodeNotFound: 'Chain node not found',
  NamespaceNotFound: 'Namespace not found for this name',
};

export const GenerateStakeholderGroups = (Command<
  typeof community.GenerateStakeholderGroups
> = () => ({
  ...community.GenerateStakeholderGroups,
  auth: [],
  body: async ({ id, payload }) => {
    const community = await models.Community.findByPk(id);
    if (!community) {
      throw new InvalidState(Errors.CommunityNotFound);
    }

    // get existing stakeholder groups
    const existingStakeholderGroups = await models.Group.findAll({
      where: {
        community_id: id!,
        is_system_managed: true,
      },
    });

    // get stakes
    const stakes = await models.CommunityStake.findAll({
      where: { community_id: id },
    });
    if (stakes.length === 0) {
      throw new InvalidState(Errors.StakesNotFound);
    }

    // check which stakes need a stakeholder group
    const stakesWithoutGroup = stakes.filter((stake) => {
      return !existingStakeholderGroups.find(
        (g) =>
          (
            (g.requirements?.[0]?.data as ThresholdData)
              ?.source as ContractSource
          )?.token_id === stake.stake_id!.toString(),
      );
    });

    if (stakesWithoutGroup.length === 0) {
      return {
        ...community.get({ plain: true }),
        groups: existingStakeholderGroups,
      };
    }

    // get contract address
    const node = await models.ChainNode.findByPk(community.chain_node_id);
    if (!node) {
      throw new InvalidState(Errors.ChainNodeNotFound);
    }
    const factoryData =
      commonProtocol.factoryContracts[node.eth_chain_id! as ValidChains];
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
            },
            { transaction },
          );

          return group.toJSON();
        }),
      );
    });

    return {
      ...community.get({ plain: true }),
      groups,
    };
  },
}));

import {
  AppError,
  BalanceSourceType,
  ContractSource,
  ThresholdData,
  commonProtocol,
} from '@hicommonwealth/core';
import {
  CommunityAttributes,
  GroupAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import Web3 from 'web3';
import { getNamespace } from '../../../../../libs/model/src/services/commonProtocol/contractHelpers';
import { ServerGroupsController } from '../server_groups_controller';

const Errors = {
  StakeNotFound: 'Stake not found',
  StakeholderGroup: 'Stakeholder group not found',
  ChainNodeNotFound: 'Chain node not found',
  NamespaceNotFound: 'Namespace not found for this name',
};

export type GenerateStakeholderGroupsOptions = {
  user: UserInstance;
  community: CommunityAttributes;
};

export type GenerateStakeholderGroupsResult = [
  groups: GroupAttributes[],
  created: boolean,
];

export async function __generateStakeholderGroups(
  this: ServerGroupsController,
  { user, community }: GenerateStakeholderGroupsOptions,
): Promise<GenerateStakeholderGroupsResult> {
  // get existing stakeholder groups
  const existingStakeholderGroups = await this.models.Group.findAll({
    where: {
      community_id: community.id,
      is_system_managed: true,
    },
  });

  // get stakes
  const stakes = await this.models.CommunityStake.findAll({
    where: { community_id: community.id },
  });
  if (stakes.length === 0) {
    throw new AppError(Errors.StakeNotFound);
  }

  // check which stakes need a stakeholder group
  const stakesWithoutGroup = stakes.filter((stake) => {
    return !existingStakeholderGroups.find(
      (g) =>
        ((g.requirements?.[0]?.data as ThresholdData)?.source as ContractSource)
          ?.token_id === stake.stake_id.toString(),
    );
  });

  if (stakesWithoutGroup.length === 0) {
    return [existingStakeholderGroups, false];
  }

  // get contract address
  const node = await this.models.ChainNode.findByPk(community.chain_node_id);
  if (!node) {
    throw new AppError(Errors.ChainNodeNotFound);
  }
  const factoryData = commonProtocol.factoryContracts[node.eth_chain_id];
  const contractAddress = await getNamespace(
    new Web3(node.url),
    community.namespace,
    factoryData.factory,
  );
  if (contractAddress === '0x0000000000000000000000000000000000000000') {
    throw new AppError(Errors.NamespaceNotFound);
  }

  const result = await this.models.sequelize.transaction(
    async (transaction) => {
      return Promise.all(
        stakesWithoutGroup.map((stake) =>
          this.createGroup({
            user,
            community,
            metadata: {
              name: `Stakeholder`,
              description:
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
                    evm_chain_id: node.eth_chain_id,
                    contract_address: contractAddress,
                    token_id: stake.stake_id.toString(),
                  },
                },
              },
            ],
            systemManaged: true,
            transaction,
          }),
        ),
      );
    },
  );

  const groups = result.map((r) => r[0]);

  return [groups, true];
}

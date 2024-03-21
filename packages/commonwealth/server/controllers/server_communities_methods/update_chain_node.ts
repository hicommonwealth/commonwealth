import { AppError, BalanceType } from '@hicommonwealth/core';
import { UserInstance } from '@hicommonwealth/model';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  ChainNodeExists: 'Chain Node already exists',
  NotAdmin: 'Not an admin',
  ChainIdNaN: 'eth_chain_id is required on ethereum Chain Nodes',
  NeedCosmosChainId:
    'cosmos_chain_id is a string, required on Cosmos Chain Nodes',
};

export type UpdateChainNodeOptions = {
  id: number;
  user: UserInstance;
  url: string;
  name?: string;
  bech32?: string;
  slip44?: number;
  balanceType?: string;
  eth_chain_id?: number;
  cosmos_chain_id?: string;
};
export type UpdateChainNodeResult = { updated_node_id: number };

export async function __updateChainNode(
  this: ServerCommunitiesController,
  {
    id,
    user,
    url,
    name,
    bech32,
    slip44,
    balanceType,
    eth_chain_id,
    cosmos_chain_id,
  }: UpdateChainNodeOptions,
): Promise<UpdateChainNodeResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  if (balanceType === 'ethereum' && typeof eth_chain_id !== 'number') {
    throw new AppError(Errors.ChainIdNaN);
  }
  if (
    balanceType === BalanceType.Cosmos &&
    typeof cosmos_chain_id !== 'string'
  ) {
    throw new AppError(Errors.NeedCosmosChainId);
  }

  let where;
  if (eth_chain_id) {
    where = { eth_chain_id };
  } else if (cosmos_chain_id) {
    where = { cosmos_chain_id };
  } else {
    where = { id };
  }

  const chainNode = await this.models.ChainNode.findOne({ where });

  const updatedChainNode = await chainNode.update({
    url,
    name,
    bech32,
    slip44,
  });

  await chainNode.save();

  return { updated_node_id: updatedChainNode.id };
}

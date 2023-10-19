import { AppError } from 'common-common/src/errors';
import { BalanceType } from 'common-common/src/types';
import { UserInstance } from 'server/models/user';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  ChainExists: 'Chain Node already exists',
  NotAdmin: 'Not an admin',
};

export type CreateChainNodeOptions = {
  user: UserInstance;
  url: string;
  name?: string;
  bech32?: string;
  balanceType?: string;
};
export type CreateChainNodeResult = { node_id: number };

export async function __createChainNode(
  this: ServerCommunitiesController,
  { user, url, name, bech32, balanceType }: CreateChainNodeOptions
): Promise<CreateChainNodeResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const chainNode = await this.models.ChainNode.findOne({
    where: { url },
  });

  if (chainNode) {
    throw new AppError(Errors.ChainExists);
  }

  const newChainNode = await this.models.ChainNode.create({
    url,
    name,
    balance_type: balanceType as BalanceType,
    bech32,
  });

  return { node_id: newChainNode.id };
}

import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function CreateChainNode(): Command<typeof schemas.CreateChainNode> {
  return {
    ...schemas.CreateChainNode,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { search, limit, page, orderBy, orderDirection } = payload;
    },
  };
}

/*
import { CreateChainNodeResult } from '../../controllers/server_communities_methods/create_chain_node';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateChainNodeRequestBody = {
  url: string;
  name?: string;
  balance_type?: string;
  eth_chain_id?: number;
};
type CreateChainNodeResponse = CreateChainNodeResult;

export const createChainNodeHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateChainNodeRequestBody>,
  res: TypedResponse<CreateChainNodeResponse>,
) => {
  const results = await controllers.communities.createChainNode({
    // @ts-expect-error StrictNullChecks
    user: req.user,
    url: req.body.url,
    name: req.body.name,
    balanceType: req.body.balance_type,
    eth_chain_id: req.body.eth_chain_id,
  });
  return success(res, results);
};

 */

/*
import { AppError } from '@hicommonwealth/core';
import { UserInstance } from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  ChainNodeExists: 'Chain Node already exists',
  NotAdmin: 'Not an admin',
  ChainIdNaN: 'eth_chain_id is required on ethereum Chain Nodes',
  MissingChainArguments: 'Missing chain arguments',
  BalanceTypeNotSupported: 'Balance type not supported',
};

export type CreateChainNodeOptions = {
  user: UserInstance;
  url: string;
  name?: string;
  balanceType?: string;
  eth_chain_id?: number;
};
export type CreateChainNodeResult = { node_id: number };

export async function __createChainNode(
  this: ServerCommunitiesController,
  { user, url, name, balanceType, eth_chain_id }: CreateChainNodeOptions,
): Promise<CreateChainNodeResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  if (typeof eth_chain_id !== 'number') {
    throw new AppError(Errors.ChainIdNaN);
  }

  if (balanceType != 'ethereum') {
    throw new AppError(Errors.BalanceTypeNotSupported);
  }

  if (!url || !name) {
    throw new AppError(Errors.MissingChainArguments);
  }

  const chainNode = await this.models.ChainNode.findOne({
    where: { eth_chain_id },
  });

  if (chainNode) {
    throw new AppError(Errors.ChainNodeExists);
  }

  const newChainNode = await this.models.ChainNode.create({
    url,
    name,
    balance_type: balanceType as BalanceType,
    alt_wallet_url: url,
    eth_chain_id,
  });

  return { node_id: newChainNode.id! };
}

 */

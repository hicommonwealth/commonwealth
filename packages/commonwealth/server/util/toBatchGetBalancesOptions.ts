import { GetBalancesOptions } from 'server/controllers/server_token_balance_controller';
import { AddressAttributes } from 'server/models/address';
import { GroupAttributes } from 'server/models/group';
import { BalanceSourceType } from './requirementsModule/requirementsTypes';

type Result = {
  key: {
    balanceSourceType: string;
    cosmosChainId?: string;
    evmChainId?: number;
    contractAddress?: string;
    tokenId?: string;
  };
};

export async function toBatchGetBalancesOptions(
  groups: GroupAttributes[],
  addresses: AddressAttributes[],
): Promise<GetBalancesOptions[]> {
  const key =
  return [
    {
      addresses: [],
      sourceOptions: {
        evmChainId: 0,
      },
      balanceSourceType: BalanceSourceType.ETHNative,
    },
  ];
}

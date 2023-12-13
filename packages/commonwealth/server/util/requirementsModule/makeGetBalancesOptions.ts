import { AddressAttributes } from 'server/models/address';
import { GroupAttributes } from 'server/models/group';
import {
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetErc1155BalanceOptions,
  GetErcBalanceOptions,
  GetEthNativeBalanceOptions,
} from '../tokenBalanceCache/types';
import {
  BalanceSourceType,
  ContractSource,
  CosmosSource,
  NativeSource,
} from './requirementsTypes';

export function makeGetBalancesOptions(
  groups: GroupAttributes[],
  addresses: AddressAttributes[],
): GetBalancesOptions[] {
  const allOptions: Exclude<GetBalancesOptions, GetErc1155BalanceOptions>[] =
    [];

  const addressStrings = addresses.map((a) => a.address);

  for (const group of groups) {
    for (const requirement of group.requirements) {
      if (requirement.rule === 'threshold') {
        // for each requirement, upsert the appropriate option
        switch (requirement.data.source.source_type) {
          // ContractSource
          case BalanceSourceType.ERC20:
          case BalanceSourceType.ERC721: {
            const castedSource = requirement.data.source as ContractSource;
            const existingOptions = allOptions.find((opt) => {
              const castedOpt = opt as GetErcBalanceOptions;
              return (
                castedOpt.balanceSourceType === castedSource.source_type &&
                castedOpt.sourceOptions.evmChainId ===
                  castedSource.evm_chain_id &&
                castedOpt.sourceOptions.contractAddress ===
                  castedSource.contract_address
              );
            });
            if (!existingOptions) {
              allOptions.push({
                balanceSourceType: castedSource.source_type as any,
                sourceOptions: {
                  contractAddress: castedSource.contract_address,
                  evmChainId: castedSource.evm_chain_id,
                },
                addresses: addressStrings,
              });
            }
            break;
          }
          // NativeSource
          case BalanceSourceType.ETHNative: {
            const castedSource = requirement.data.source as NativeSource;
            const existingOptions = allOptions.find((opt) => {
              const castedOpt = opt as GetEthNativeBalanceOptions;
              return (
                castedOpt.balanceSourceType === BalanceSourceType.ETHNative &&
                castedOpt.sourceOptions.evmChainId === castedSource.evm_chain_id
              );
            });
            if (!existingOptions) {
              allOptions.push({
                balanceSourceType: BalanceSourceType.ETHNative,
                sourceOptions: {
                  evmChainId: castedSource.evm_chain_id,
                },
                addresses: addressStrings,
              });
            }
            break;
          }
          // CosmosSource
          case BalanceSourceType.CosmosNative: {
            const castedSource = requirement.data.source as CosmosSource;
            const existingOptions = allOptions.find((opt) => {
              const castedOpt = opt as GetCosmosBalancesOptions;
              return (
                castedOpt.balanceSourceType ===
                  BalanceSourceType.CosmosNative &&
                castedOpt.sourceOptions.cosmosChainId ===
                  castedSource.cosmos_chain_id
              );
            });
            if (!existingOptions) {
              allOptions.push({
                balanceSourceType: BalanceSourceType.CosmosNative,
                sourceOptions: {
                  cosmosChainId: castedSource.cosmos_chain_id,
                },
                addresses: addressStrings,
              });
            }
            break;
          }
        }
      }
    }
  }

  return allOptions;
}

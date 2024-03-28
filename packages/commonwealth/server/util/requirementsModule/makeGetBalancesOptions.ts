import {
  BalanceSourceType,
  ContractSource,
  CosmosContractSource,
  CosmosSource,
  NativeSource,
} from '@hicommonwealth/core';
import {
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetCwBalancesOptions,
  GetErc1155BalanceOptions,
  GetErcBalanceOptions,
  GetEthNativeBalanceOptions,
  GroupAttributes,
} from '@hicommonwealth/model';

export function makeGetBalancesOptions(
  groups: GroupAttributes[],
  addresses: string[],
): GetBalancesOptions[] {
  const allOptions: GetBalancesOptions[] = [];

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
                addresses,
              });
            }
            break;
          }
          case BalanceSourceType.ERC1155: {
            const castedSource = requirement.data.source as ContractSource;
            const existingOptions = allOptions.find((opt) => {
              const castedOpt = opt as GetErc1155BalanceOptions;
              return (
                castedOpt.balanceSourceType === BalanceSourceType.ERC1155 &&
                castedOpt.sourceOptions.evmChainId ===
                  castedSource.evm_chain_id &&
                castedOpt.sourceOptions.contractAddress ===
                  castedSource.contract_address &&
                castedOpt.sourceOptions.tokenId ===
                  parseInt(castedSource.token_id, 10)
              );
            });

            if (!existingOptions) {
              allOptions.push({
                balanceSourceType: BalanceSourceType.ERC1155,
                sourceOptions: {
                  evmChainId: castedSource.evm_chain_id,
                  contractAddress: castedSource.contract_address,
                  tokenId: parseInt(castedSource.token_id, 10),
                },
                addresses,
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
                addresses,
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
                addresses,
              });
            }
            break;
          }
          // CosmosContractSource
          case BalanceSourceType.CW20:
          case BalanceSourceType.CW721: {
            const castedSource = requirement.data
              .source as CosmosContractSource;
            const existingOptions = allOptions.find((opt) => {
              const castedOpt = opt as GetCwBalancesOptions;
              return (
                castedOpt.balanceSourceType === castedSource.source_type &&
                castedOpt.sourceOptions.cosmosChainId ===
                  castedSource.cosmos_chain_id &&
                castedOpt.sourceOptions.contractAddress ===
                  castedSource.contract_address
              );
            });
            if (!existingOptions) {
              allOptions.push({
                balanceSourceType: castedSource.source_type as any,
                sourceOptions: {
                  contractAddress: castedSource.contract_address,
                  cosmosChainId: castedSource.cosmos_chain_id,
                },
                addresses,
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

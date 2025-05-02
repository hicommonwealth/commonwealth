import { MembershipRejectReason } from '@hicommonwealth/schemas';
import {
  AllowlistData,
  BalanceSourceType,
  Requirement,
  ThresholdData,
} from '@hicommonwealth/shared';
import { toBigInt } from 'web3-utils';
import { z } from 'zod';
import type { OptionsWithBalances } from '../services';

export type ValidateGroupMembershipResponse = {
  isValid: boolean;
  messages?: z.infer<typeof MembershipRejectReason>;
  numRequirementsMet?: number;
};

/**
 * Validates if a given user address passes a set of requirements and grants access to group
 * @param userAddress address of user
 * @param requirements An array of requirement types to be validated against
 * @param balances address balances
 * @param numRequiredRequirements
 * @returns ValidateGroupMembershipResponse validity and messages on requirements that failed
 */
export function validateGroupMembership(
  userAddress: string,
  requirements: Requirement[],
  balances: OptionsWithBalances[],
  numRequiredRequirements: number = 0,
): ValidateGroupMembershipResponse {
  const response: ValidateGroupMembershipResponse = {
    isValid: true,
    messages: [],
  };
  let allowListOverride = false;
  let numRequirementsMet = 0;

  requirements.forEach((requirement) => {
    let checkResult: { result: boolean; message: string };
    switch (requirement.rule) {
      case 'threshold': {
        checkResult = _thresholdCheck(userAddress, requirement.data, balances);
        break;
      }
      case 'allow': {
        checkResult = _allowlistCheck(
          userAddress,
          requirement.data as AllowlistData,
        );
        if (checkResult.result) {
          allowListOverride = true;
        }
        break;
      }
      default:
        checkResult = {
          result: false,
          message: 'Invalid Requirement',
        };
        break;
    }

    if (checkResult.result) {
      numRequirementsMet++;
    } else {
      response.isValid = false;
      // @ts-expect-error StrictNullChecks
      response.messages.push({
        requirement,
        message: checkResult.message,
      });
    }
  });

  if (allowListOverride) {
    // allow if address is whitelisted
    return { isValid: true, messages: undefined };
  }

  if (numRequiredRequirements) {
    if (numRequirementsMet >= numRequiredRequirements) {
      // allow if minimum number of requirements met
      return { ...response, isValid: true, numRequirementsMet };
    } else {
      return { ...response, isValid: false, numRequirementsMet };
    }
  }
  return response;
}

function _thresholdCheck(
  userAddress: string,
  thresholdData: ThresholdData,
  balances: OptionsWithBalances[],
): { result: boolean; message: string } {
  try {
    let balanceSourceType: BalanceSourceType;
    let contractAddress: string;
    let chainId: string;
    let tokenId: string;
    let objectId: string;

    switch (thresholdData.source.source_type) {
      case 'spl': {
        balanceSourceType = BalanceSourceType.SPL;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.solana_network.toString();
        break;
      }
      case 'metaplex': {
        balanceSourceType = BalanceSourceType.SOLNFT;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.solana_network.toString();
        break;
      }
      case 'sui_native': {
        balanceSourceType = BalanceSourceType.SuiNative;
        chainId = thresholdData.source.sui_network.toString();
        objectId = thresholdData.source.object_id!;
        break;
      }
      case 'sui_token': {
        balanceSourceType = BalanceSourceType.SuiToken;
        chainId = thresholdData.source.sui_network.toString();
        contractAddress = thresholdData.source.coin_type;
        break;
      }
      case 'erc20': {
        balanceSourceType = BalanceSourceType.ERC20;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.evm_chain_id.toString();
        break;
      }
      case 'erc721': {
        balanceSourceType = BalanceSourceType.ERC721;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.evm_chain_id.toString();
        break;
      }
      case 'erc1155': {
        balanceSourceType = BalanceSourceType.ERC1155;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.evm_chain_id.toString();
        // @ts-expect-error StrictNullChecks
        tokenId = thresholdData.source.token_id.toString();
        break;
      }
      case 'eth_native': {
        balanceSourceType = BalanceSourceType.ETHNative;
        chainId = thresholdData.source.evm_chain_id.toString();
        break;
      }
      case 'cosmos_native': {
        //balanceSourceType not used downstream by tbc other than EVM contracts, Osmosis works for all cosmos chains
        balanceSourceType = BalanceSourceType.CosmosNative;
        chainId = thresholdData.source.cosmos_chain_id;
        break;
      }
      case 'cw20': {
        balanceSourceType = BalanceSourceType.CW20;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.cosmos_chain_id;
        break;
      }
      case 'cw721': {
        balanceSourceType = BalanceSourceType.CW721;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.cosmos_chain_id;
        break;
      }
      default:
        break;
    }

    const balance = balances
      .filter((b) => b.options.balanceSourceType === balanceSourceType)
      .find((b) => {
        switch (b.options.balanceSourceType) {
          case BalanceSourceType.ERC20:
          case BalanceSourceType.ERC721:
            return (
              b.options.sourceOptions.contractAddress == contractAddress &&
              b.options.sourceOptions.evmChainId.toString() === chainId
            );
          case BalanceSourceType.ERC1155:
            return (
              b.options.sourceOptions.contractAddress == contractAddress &&
              b.options.sourceOptions.evmChainId.toString() === chainId &&
              b.options.sourceOptions.tokenId.toString() === tokenId
            );
          case BalanceSourceType.ETHNative:
            return b.options.sourceOptions.evmChainId.toString() === chainId;
          case BalanceSourceType.CosmosNative:
            return b.options.sourceOptions.cosmosChainId.toString() === chainId;
          case BalanceSourceType.CW20:
          case BalanceSourceType.CW721:
            return (
              b.options.sourceOptions.contractAddress == contractAddress &&
              b.options.sourceOptions.cosmosChainId.toString() === chainId
            );
          case BalanceSourceType.SOLNFT:
          case BalanceSourceType.SPL:
            return b.options.mintAddress == contractAddress;
          case BalanceSourceType.SuiNative:
            if (objectId) {
              return (
                b.options.sourceOptions.suiNetwork === chainId &&
                b.options.sourceOptions.objectId === objectId
              );
            }
            return b.options.sourceOptions.suiNetwork === chainId;
          case BalanceSourceType.SuiToken:
            return (
              b.options.sourceOptions.suiNetwork === chainId &&
              b.options.sourceOptions.coinType === contractAddress
            );
          default:
            return null;
        }
      })?.balances[userAddress];

    if (typeof balance !== 'string') {
      throw new Error(`Failed to get balance for address`);
    }

    const result = toBigInt(balance) > toBigInt(thresholdData.threshold);
    return {
      result,
      message: !result
        ? `User Balance of ${balance} below threshold ${thresholdData.threshold}`
        : 'pass',
    };
  } catch (error) {
    return {
      result: false,
      message: `Error: ${error instanceof Error ? error.message : error}`,
    };
  }
}

function _allowlistCheck(
  userAddress: string,
  allowlistData: AllowlistData,
): { result: boolean; message: string } {
  try {
    const result = allowlistData.allow.includes(userAddress);
    return {
      result,
      message: !result ? 'User Address not in Allowlist' : 'pass',
    };
  } catch (error) {
    return {
      result: false,
      message: `Error: ${error instanceof Error ? error.message : error}`,
    };
  }
}

import { toBN } from 'web3-utils';
import { OptionsWithBalances } from '../tokenBalanceCache/types';
import {
  AllowlistData,
  BalanceSourceType,
  Requirement,
  ThresholdData,
} from './requirementsTypes';

export type ValidateGroupMembershipResponse = {
  isValid: boolean;
  messages?: {
    requirement: Requirement;
    message: string;
  }[];
  numRequirementsMet?: number;
};

/**
 * Validates if a given user address passes a set of requirements and grants access to group
 * @param userAddress address of user
 * @param requirements An array of requirement types to be validated against
 * @param balances address balances
 * @returns ValidateGroupMembershipResponse validity and messages on requirements that failed
 */
export default async function validateGroupMembership(
  userAddress: string,
  requirements: Requirement[],
  balances: OptionsWithBalances[],
  numRequiredRequirements: number = 0,
): Promise<ValidateGroupMembershipResponse> {
  const response: ValidateGroupMembershipResponse = {
    isValid: true,
    messages: [],
  };
  let allowListOverride = false;
  let numRequirementsMet = 0;

  const checks = requirements.map(async (requirement) => {
    let checkResult: { result: boolean; message: string };
    switch (requirement.rule) {
      case 'threshold': {
        checkResult = await _thresholdCheck(
          userAddress,
          requirement.data,
          balances,
        );
        break;
      }
      case 'allow': {
        checkResult = await _allowlistCheck(
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
      response.messages.push({
        requirement,
        message: checkResult.message,
      });
    }
  });

  await Promise.all(checks);

  if (allowListOverride) {
    // allow if address is whitelisted
    return { isValid: true };
  }

  if (numRequiredRequirements) {
    if (numRequirementsMet >= numRequiredRequirements) {
      // allow if minimum number of requirements met
      return { isValid: true, numRequirementsMet };
    } else {
      return { isValid: false, numRequirementsMet };
    }
  }
  return response;
}

async function _thresholdCheck(
  userAddress: string,
  thresholdData: ThresholdData,
  balances: OptionsWithBalances[],
): Promise<{ result: boolean; message: string }> {
  try {
    let balanceSourceType: BalanceSourceType;
    let contractAddress: string;
    let chainId: string;
    let tokenId: string;
    switch (thresholdData.source.source_type) {
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
          default:
            return null;
        }
      })?.balances[userAddress];

    if (typeof balance !== 'string') {
      throw new Error(`Failed to get balance for address`);
    }

    const result = toBN(balance).gt(toBN(thresholdData.threshold));
    return {
      result,
      message: !result
        ? `User Balance of ${balance} below threshold ${thresholdData.threshold}`
        : 'pass',
    };
  } catch (error) {
    return {
      result: false,
      message: `Error: ${error.message}`,
    };
  }
}

async function _allowlistCheck(
  userAddress: string,
  allowlistData: AllowlistData,
): Promise<{ result: boolean; message: string }> {
  try {
    const result = allowlistData.allow.includes(userAddress);
    return {
      result,
      message: !result ? 'User Address not in Allowlist' : 'pass',
    };
  } catch (error) {
    return {
      result: false,
      message: `Error: ${error.message}`,
    };
  }
}

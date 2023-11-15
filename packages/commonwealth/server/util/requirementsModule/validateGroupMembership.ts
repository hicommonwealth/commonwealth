import { ChainNetwork } from 'common-common/src/types';
import { toBN } from 'web3-utils';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import { AllowlistData, Requirement, ThresholdData } from './requirementsTypes';

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
 * @param tbc initialized Token Balance Cache instance
 * @returns ValidateGroupMembershipResponse validity and messages on requirements that failed
 */
export default async function validateGroupMembership(
  userAddress: string,
  requirements: Requirement[],
  tbc?: TokenBalanceCache,
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
        checkResult = await _thresholdCheck(userAddress, requirement.data, tbc);
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
  tbc: TokenBalanceCache,
): Promise<{ result: boolean; message: string }> {
  try {
    let chainNetwork: ChainNetwork;
    let contractAddress: string;
    let chainId: string;
    switch (thresholdData.source.source_type) {
      case 'erc20': {
        chainNetwork = ChainNetwork.ERC20;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.evm_chain_id.toString();
        break;
      }
      case 'erc721': {
        chainNetwork = ChainNetwork.ERC721;
        contractAddress = thresholdData.source.contract_address;
        chainId = thresholdData.source.evm_chain_id.toString();
        break;
      }
      case 'eth_native': {
        chainNetwork = ChainNetwork.Ethereum;
        chainId = thresholdData.source.evm_chain_id.toString();
        break;
      }
      case 'cosmos_native': {
        //chainNetwork not used downstream by tbc other than EVM contracts, Osmosis works for all cosmos chains
        chainNetwork = ChainNetwork.Osmosis;
        chainId = thresholdData.source.cosmos_chain_id;
        break;
      }
      default:
        break;
    }
    const balance = await tbc.fetchUserBalanceWithChain(
      chainNetwork,
      userAddress,
      chainId,
      contractAddress,
    );

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

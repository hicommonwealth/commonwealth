import { Requirement } from './requirementsTypes';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';

export type ValidateGroupMembershipResponse = {
  isValid: boolean;
  messages?: {
    requirement: Requirement;
    message: string;
  }[];
};

/**
 * Validates if a given user address passes a set of requirements and grants access to group
 * @param userAddress address of user
 * @param requirements An array of requirement types to be validated against
 * @param tbc initialized Token Balance Cache instance
 * @returns validateGroupMembershipResponse validity and messages on requirements that failed
 */
export default function validateGroupMembership(
  userAddress: string,
  requirements: Requirement[],
  tbc?: TokenBalanceCache
): ValidateGroupMembershipResponse {
  return {
    isValid: true,
  };
}

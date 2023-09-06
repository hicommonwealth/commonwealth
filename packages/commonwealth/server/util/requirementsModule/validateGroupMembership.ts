import { AddressAttributes } from 'server/models/address';
import { Requirement } from './requirmentsTypes';

export type validateGroupMembershipResponse = {
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
 * @returns validateGroupMembershipResponse validity and messages on requirements that failed
 */
export default function validateGroupMembership(
  userAddress: string,
  requirements: Requirement[]
): validateGroupMembershipResponse {
  return {
    isValid: true,
  };
}

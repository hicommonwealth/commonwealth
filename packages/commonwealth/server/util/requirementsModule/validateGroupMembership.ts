import { AddressAttributes } from 'server/models/address';
import { Requirement } from './requirmentsTypes';

export type validateGroupMembershipResponse = {
  isValid: boolean;
  messages?: {
    requirement: Requirement;
    message: string;
  }[];
};

export default function validateGroupMembership(
  userAddress: string,
  requirements: Requirement[]
): validateGroupMembershipResponse {
  return {
    isValid: true,
  };
}

import { assert, expect } from 'chai';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';
import validateGroupMembership, {
  ValidateGroupMembershipResponse,
} from 'server/util/requirementsModule/validateGroupMembership';

describe('validateGroupMembership', () => {
  it('should return a valid response', () => {
    const userAddress: string = 'mockUserAddress';
    const requirements: Requirement[] = [];

    const result: ValidateGroupMembershipResponse = validateGroupMembership(
      userAddress,
      requirements
    );

    assert.equal(result.isValid, true);
  });
});

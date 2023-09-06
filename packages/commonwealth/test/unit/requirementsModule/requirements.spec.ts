import { Requirement } from 'server/util/requirementsModule/requirmentsTypes';
import validateGroupMembership, {
  validateGroupMembershipResponse,
} from 'server/util/requirementsModule/validateGroupMembership';

describe('validateGroupMembership', () => {
  it('should return a valid response', () => {
    const userAddress: string = 'mockUserAddress';
    const requirements: Requirement[] = [];

    const result: validateGroupMembershipResponse = validateGroupMembership(
      userAddress,
      requirements
    );

    expect(result.isValid).toBe(true);
  });
});

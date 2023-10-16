import { assert } from 'chai';
import { Requirement } from '../../../server/util/requirementsModule/requirementsTypes';
import validateGroupMembership, {
  validateGroupMembershipResponse,
} from '../../../server/util/requirementsModule/validateGroupMembership';

describe('validateGroupMembership', () => {
  it('should return a valid response', async () => {
    const userAddress: string = 'mockUserAddress';
    const requirements: Requirement[] = [];

    const result: validateGroupMembershipResponse =
      await validateGroupMembership(userAddress, requirements);

    assert.equal(result.isValid, true);
  });
});

import { assert } from 'chai';
import type { MemberClassAttributes } from '../../../server/models/member_class';
import { getHighestRoleFromMemberClasses } from '../../../server/util/roles';

describe('getHighestRoleFromMemberClasses() unit tests', () => {
  it('should return highest role', async () => {
    const roles: MemberClassAttributes[] = [
      {
        name: 'member',
        chain_id: 'ethereum',
        allow: BigInt(0),
        deny: BigInt(0),
      },
      {
        name: 'admin',
        chain_id: 'ethereum',
        allow: BigInt(0),
        deny: BigInt(0),
      },
      {
        name: 'moderator',
        chain_id: 'ethereum',
        allow: BigInt(0),
        deny: BigInt(0),
      },
    ];
    const role = await getHighestRoleFromMemberClasses(roles);
    assert.equal(role.name, 'admin');
  });
});

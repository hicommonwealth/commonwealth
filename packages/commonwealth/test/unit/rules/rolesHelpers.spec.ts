import { assert } from 'chai';
import type { MemberClassAttributes } from '../../../server/models/member_class';
import { getHighestRoleFromMemberClasss } from '../../../server/util/roles';

describe('getHighestRoleFromMemberClasss() unit tests', () => {
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
    const role = await getHighestRoleFromMemberClasss(roles);
    assert.equal(role.name, 'admin');
  });
});

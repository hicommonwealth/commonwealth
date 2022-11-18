import { assert } from 'chai';
import { getHighestRoleFromCommunityRoles } from '../../../server/util/roles';
import { CommunityRoleAttributes } from '../../../server/models/community_role';

describe('getHighestRoleFromCommunityRoles() unit tests', () => {
  it('should return highest role', async () => {
    const roles: CommunityRoleAttributes[] = [
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
    const role = await getHighestRoleFromCommunityRoles(roles);
    assert.equal(role.name, 'admin');
  });
});

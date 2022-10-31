import { assert } from 'chai';
import { getHighestRole } from '../../../server/util/roles';
import { CommunityRoleAttributes } from '../../../server/models/community_role';

describe('getHighestRole() unit tests', () => {
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
    const role = await getHighestRole(roles);
    assert.equal(role.name, 'admin');
  });
});

describe('getHighestRole() unit tests', () => {
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
      const role = await getHighestRole(roles);
      assert.equal(role.name, 'admin');
    });
  });

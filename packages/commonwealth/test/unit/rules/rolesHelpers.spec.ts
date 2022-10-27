import { assert } from 'chai';
import {
  findAllCommunityRolesWithRoleAssignments,
  getHighestRole,
} from 'commonwealth/server/util/roles';
import { CommunityRoleAttributes } from 'commonwealth/server/models/community_role';
import { validateRule } from 'commonwealth/server/util/rules/ruleParser';

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

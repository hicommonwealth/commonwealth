import {
  AddressInstance,
  CommunityInstance,
  GroupAttributes,
  MembershipAttributes,
  TopicAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ServerGroupsController } from 'server/controllers/server_groups_controller';
import { describe, test } from 'vitest';

chai.use(chaiAsPromised);

const INVALID_REQUIREMENTS_NOT_ARRAY = 'no an array' as unknown as [];

const createMockedGroupsController = () => {
  const groups: GroupAttributes[] = [
    {
      id: 1,
      community_id: 'ethereum',
      metadata: {
        name: 'hello',
        description: '123',
      },
      requirements: [],
    },
  ];
  const topics: TopicAttributes[] = [
    {
      id: 1,
      community_id: 'ethereum',
      name: 'hello',
      featured_in_sidebar: false,
      featured_in_new_post: false,
    },
  ];
  const memberships: MembershipAttributes[] = [
    {
      group_id: 1,
      address_id: 1,
      reject_reason: null,
      last_checked: new Date(),
    },
    {
      group_id: 1,
      address_id: 1,
      reject_reason: null,
      last_checked: new Date(),
    },
    {
      group_id: 1,
      address_id: 1,
      reject_reason: null,
      last_checked: new Date(),
    },
  ];
  const db: any = {
    Topic: {
      findAll: async (): Promise<TopicAttributes[]> => {
        return topics;
      },
      findByPk: async (id: number) => topics.find((t) => t.id === id),
      update: async () => {},
    },
    Group: {
      findAll: async (): Promise<(GroupAttributes & { toJSON: any })[]> => {
        return groups.map((group) => ({
          ...group,
          memberships,
          toJSON: () => group,
        }));
      },
      create: async (): Promise<GroupAttributes & { toJSON: any }> => ({
        ...groups[0],
        toJSON: () => groups[0],
      }),
      update: async (): Promise<GroupAttributes> => groups[0],
      destroy: async () => {},
      findOne: async () => ({
        ...groups[0],
        update: async (): Promise<GroupAttributes> => groups[0],
        toJSON: () => groups[0],
      }),
      findByPk: async () => ({
        ...groups[0],
        update: async (): Promise<GroupAttributes> => groups[0],
        toJSON: () => groups[0],
      }),
      count: async () => groups.length,
    },
    Membership: {
      findAll: async () => {
        return memberships.map((membership) => ({
          ...membership,
          toJSON: () => membership,
          update: async () => membership,
        }));
      },
      findOne: async () => {
        const membership = {
          ...memberships[0],
          toJSON: () => memberships[0],
          update: async () => membership,
        };
        return membership;
      },
      count: async () => memberships.length,
      destroy: async () => {},
      bulkCreate: async () => {},
    },
    CommunityRole: {
      findAll: async () => [
        {
          toJSON: () => ({
            community_id: 'ethereum',
            name: 'member',
            allow: '0',
            deny: '0',
            RoleAssignments: [{}],
          }),
        },
      ],
    },
    Address: {
      findAll: async () => [{}],
    },
    sequelize: {
      transaction: async (callback) => callback(),
    },
  };
  const banCache: any = {};
  const controller = new ServerGroupsController(db, banCache);
  return controller;
};

const createMockParams = () => {
  // @ts-expect-error StrictNullChecks
  const user = {
    getAddresses: async () => {
      return [];
    },
    isAdmin: true,
  } as UserInstance;
  const chain = {} as CommunityInstance;
  const address = {} as AddressInstance;
  const topicId = 1;
  return { user, chain, address, topicId };
};

describe('ServerGroupsController', () => {
  test('#refreshMembership', async () => {
    const controller = createMockedGroupsController();
    const { topicId, address } = createMockParams();
    const results = await controller.refreshMembership({
      topicId,
      address,
    });
    expect(results[0]).to.have.property('groupId');
    expect(results[0]).to.have.property('topicIds');
    expect(results[0]).to.have.property('allowed');
    expect(results[0]).to.have.property('rejectReason', null);
  });

  test('#getGroups', async () => {
    const controller = createMockedGroupsController();
    const { chain } = createMockParams();
    const result = await controller.getGroups({
      // @ts-expect-error StrictNullChecks
      communityId: chain.id,
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('community_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
  });

  test('#createGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, chain } = createMockParams();
    const [result, analytics] = await controller.createGroup({
      user,
      community: chain,
      metadata: {
        name: 'blah',
        description: 'blah',
      },
      requirements: [],
      topics: [],
    });
    expect(result).to.have.property('id');
    expect(result).to.have.property('community_id');
    expect(result).to.have.property('metadata');
    expect(result).to.have.property('requirements');

    expect(analytics).to.eql({
      event: 'Create New Group',
      community: chain.id,
      userId: user.id,
    });
  });

  test('#createGroup (invalid requirements)', () => {
    const controller = createMockedGroupsController();
    const { user, chain } = createMockParams();
    expect(
      controller.createGroup({
        user,
        community: chain,
        metadata: {
          name: 'blah',
          description: 'blah',
        },
        requirements: INVALID_REQUIREMENTS_NOT_ARRAY,
        topics: [],
      }),
    ).to.eventually.be.rejectedWith('Invalid requirements');
  });

  test('#updateGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, address } = createMockParams();
    const [result, analytics] = await controller.updateGroup({
      user,
      address,
      groupId: 1,
      metadata: {
        name: 'blah',
        description: 'blah',
      },
      requirements: [],
    });
    expect(result).to.have.property('id');
    expect(result).to.have.property('community_id');
    expect(result).to.have.property('metadata');
    expect(result).to.have.property('requirements');

    expect(analytics).to.eql({
      event: 'Update Group',
      community: result.community_id,
      userId: user.id,
    });
  });

  test('#updateGroup (invalid requirements)', () => {
    const controller = createMockedGroupsController();
    const { user, address } = createMockParams();
    expect(
      controller.updateGroup({
        user,
        address,
        groupId: 1,
        metadata: {
          name: 'blah',
          description: 'blah',
        },
        requirements: INVALID_REQUIREMENTS_NOT_ARRAY,
      }),
    ).to.eventually.be.rejectedWith('Invalid requirements');
  });

  test('#deleteGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, address } = createMockParams();
    const result = await controller.deleteGroup({
      user,
      address,
      groupId: 1,
    });
    expect(result).to.be.undefined;
  });
});

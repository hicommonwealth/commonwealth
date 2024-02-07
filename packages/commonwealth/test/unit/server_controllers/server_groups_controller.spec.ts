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
      group_ids: [1],
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
  const tokenBalanceCache: any = {};
  const banCache: any = {};
  const controller = new ServerGroupsController(
    db,
    tokenBalanceCache,
    banCache,
  );
  return controller;
};

const createMockParams = () => {
  const user = {
    getAddresses: async () => {
      return [];
    },
    isAdmin: true,
  } as UserInstance;
  const chain = {} as CommunityInstance;
  const address = {} as AddressInstance;
  return { user, chain, address };
};

describe('ServerGroupsController', () => {
  describe('#refreshMembership', async () => {
    const controller = createMockedGroupsController();
    const { user, address } = createMockParams();
    const results = await controller.refreshMembership({
      user,
      address,
      topicId: 1,
    });
    expect(results[0]).to.have.property('groupId');
    expect(results[0]).to.have.property('topicIds');
    expect(results[0]).to.have.property('allowed');
    expect(results[0]).to.have.property('rejectReason', null);
  });

  describe('#getGroups', async () => {
    const controller = createMockedGroupsController();
    const { chain } = createMockParams();
    const result = await controller.getGroups({
      communityId: chain.id,
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('community_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
  });

  describe('#createGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, chain, address } = createMockParams();
    const [result, analytics] = await controller.createGroup({
      user,
      community: chain,
      address,
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

  describe('#createGroup (invalid requirements)', async () => {
    const controller = createMockedGroupsController();
    const { user, chain, address } = createMockParams();
    expect(
      controller.createGroup({
        user,
        community: chain,
        address,
        metadata: {
          name: 'blah',
          description: 'blah',
        },
        requirements: INVALID_REQUIREMENTS_NOT_ARRAY,
        topics: [],
      }),
    ).to.eventually.be.rejectedWith('Invalid requirements');
  });

  describe('#updateGroup', async () => {
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

  describe('#updateGroup (invalid requirements)', async () => {
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

  describe('#deleteGroup', async () => {
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

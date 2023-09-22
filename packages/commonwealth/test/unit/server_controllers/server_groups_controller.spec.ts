import { expect } from 'chai';
import { ServerGroupsController } from 'server/controllers/server_groups_controller';
import { AddressInstance } from 'server/models/address';
import { ChainInstance } from 'server/models/chain';
import { GroupAttributes } from 'server/models/group';
import { TopicAttributes } from 'server/models/topic';
import { UserInstance } from 'server/models/user';

const createMockedGroupsController = () => {
  const db: any = {
    Topic: {
      findAll: async (): Promise<TopicAttributes[]> => {
        return [
          {
            id: 1,
            chain_id: 'ethereum',
            token_threshold: '1000',
            name: 'hello',
            featured_in_sidebar: false,
            featured_in_new_post: false,
            group_ids: [7],
          },
        ];
      },
    },
    Group: {
      findAll: async (): Promise<(GroupAttributes & { toJSON: any })[]> => {
        const obj: GroupAttributes = {
          id: 7,
          chain_id: 'ethereum',
          metadata: {
            name: 'hello',
            description: '123',
          },
          requirements: [],
        };
        return [
          {
            ...obj,
            toJSON: () => obj,
          },
        ];
      },
    },
    Membership: {
      findAll: async () => {
        return [{}];
      },
    },
  };
  const tokenBalanceCache: any = {};
  const banCache: any = {};
  const controller = new ServerGroupsController(
    db,
    tokenBalanceCache,
    banCache
  );
  return controller;
};

const createMockParams = () => {
  const user = {
    getAddresses: async () => {
      return [];
    },
  } as UserInstance;
  const chain = {} as ChainInstance;
  const address = {} as AddressInstance;
  return { user, chain, address };
};

describe('ServerGroupsController', () => {
  describe('#refreshMembership', async () => {
    const controller = createMockedGroupsController();
    const { user, chain, address } = createMockParams();
    const result = await controller.refreshMembership({
      user,
      chain,
      address,
      topicId: 1,
    });
    expect(result).to.have.property('topicId');
    expect(result).to.have.property('allowed');
    expect(result).to.not.have.property('rejectReason');
  });

  describe('#getGroups', async () => {
    const controller = createMockedGroupsController();
    const { chain } = createMockParams();
    const result = await controller.getGroups({
      chain,
      includeMembers: true,
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('chain_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
    expect(result[0]).to.have.property('memberships');
    expect(result[0].memberships).to.have.length(1);
    expect(result[0].memberships[0]).to.have.property('group_id');
    expect(result[0].memberships[0]).to.have.property('address_id');
    expect(result[0].memberships[0]).to.have.property('allowed');
    expect(result[0].memberships[0]).to.have.property('last_checked');
  });

  describe('#createGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, chain, address } = createMockParams();
    const result = await controller.createGroup({
      user,
      chain,
      address,
      metadata: {
        name: 'blah',
        description: 'blah',
      },
      requirements: [],
      topics: [],
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('chain_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
  });

  describe('#updateGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, chain, address } = createMockParams();
    const result = await controller.updateGroup({
      user,
      chain,
      address,
      groupId: 1,
      metadata: {
        name: 'blah',
        description: 'blah',
      },
      requirements: [],
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('chain_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
  });

  describe('#deleteGroup', async () => {
    const controller = createMockedGroupsController();
    const { user, chain, address } = createMockParams();
    const result = await controller.deleteGroup({
      user,
      chain,
      address,
      groupId: 1,
    });
    expect(result).to.be.undefined;
  });
});

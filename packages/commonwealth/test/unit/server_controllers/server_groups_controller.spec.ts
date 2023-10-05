import { expect } from 'chai';
import { ServerGroupsController } from 'server/controllers/server_groups_controller';
import { AddressInstance } from 'server/models/address';
import { CommunityInstance } from '../../../server/models/community';
import { UserInstance } from 'server/models/user';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';

const VALID_REQUIREMENTS: Requirement[] = [
  {
    rule: 'threshold',
    data: {
      threshold: '1000',
      source: {
        source_type: 'erc20',
        evm_chain_id: 1,
        contract_address: '0x0000000000000000000000000000000000000000',
      },
    },
  },
  {
    rule: 'allow',
    data: {
      allow: ['0x0000000000000000000000000000000000000000'],
    },
  },
];
const INVALID_REQUIREMENTS_NOT_ARRAY = 'no an array' as unknown as [];

const createMockedGroupsController = () => {
  const db: any = {};
  const tokenBalanceCache: any = {};
  const banCache: any = {};
  const controller = new ServerGroupsController(
    db,
    tokenBalanceCache,
    banCache
  );
  return controller;
};

describe('ServerGroupsController', () => {
  describe('#refreshMembership', async () => {
    const controller = createMockedGroupsController();
    const result = await controller.refreshMembership({
      user: {} as UserInstance,
      chain: {} as CommunityInstance,
      address: {} as AddressInstance,
      topicId: 1,
    });
    expect(result).to.have.property('topicId');
    expect(result).to.have.property('allowed');
    expect(result).to.not.have.property('rejectReason');
  });

  describe('#getGroups', async () => {
    const controller = createMockedGroupsController();
    const result = await controller.getGroups({
      withMembers: true,
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('chain_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
    expect(result[0]).to.have.property('members');
    expect(result[0].members).to.have.length(1);
    expect(result[0].members[0]).to.have.property('group_id');
    expect(result[0].members[0]).to.have.property('address_id');
    expect(result[0].members[0]).to.have.property('allowed');
    expect(result[0].members[0]).to.have.property('last_checked');
  });

  describe('#createGroup', async () => {
    const controller = createMockedGroupsController();
    const result = await controller.createGroup({
      user: {} as UserInstance,
      chain: {} as CommunityInstance,
      address: {} as AddressInstance,
      metadata: {},
      requirements: VALID_REQUIREMENTS,
      topics: [],
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('chain_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
  });

  describe('#createGroup (invalid requirements)', async () => {
    const controller = createMockedGroupsController();
    expect(
      controller.createGroup({
        user: {} as UserInstance,
        chain: {} as CommunityInstance,
        address: {} as AddressInstance,
        metadata: {},
        requirements: INVALID_REQUIREMENTS_NOT_ARRAY,
        topics: [],
      })
    ).to.eventually.be.rejectedWith('Invalid requirements');
  });

  describe('#updateGroup', async () => {
    const controller = createMockedGroupsController();
    const result = await controller.updateGroup({
      user: {} as UserInstance,
      chain: {} as CommunityInstance,
      address: {} as AddressInstance,
      metadata: {},
      requirements: VALID_REQUIREMENTS,
    });
    expect(result).to.have.length(1);
    expect(result[0]).to.have.property('id');
    expect(result[0]).to.have.property('chain_id');
    expect(result[0]).to.have.property('metadata');
    expect(result[0]).to.have.property('requirements');
  });

  describe('#updateGroup (invalid requirements)', async () => {
    const controller = createMockedGroupsController();
    expect(
      controller.updateGroup({
        user: {} as UserInstance,
        chain: {} as CommunityInstance,
        address: {} as AddressInstance,
        metadata: {},
        requirements: INVALID_REQUIREMENTS_NOT_ARRAY,
      })
    ).to.eventually.be.rejectedWith('Invalid requirements');
  });

  describe('#deleteGroup', async () => {
    const controller = createMockedGroupsController();
    const result = await controller.deleteGroup({
      user: {} as UserInstance,
      chain: {} as CommunityInstance,
      address: {} as AddressInstance,
      groupId: 1,
    });
    expect(result).to.be.undefined;
  });
});

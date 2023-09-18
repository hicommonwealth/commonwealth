import { expect } from 'chai';
import { ServerGroupsController } from 'server/controllers/server_groups_controller';
import { AddressInstance } from 'server/models/address';
import { ChainInstance } from 'server/models/chain';
import { UserInstance } from 'server/models/user';

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
      chain: {} as ChainInstance,
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
      chain: {} as ChainInstance,
      address: {} as AddressInstance,
      metadata: {},
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
    const result = await controller.updateGroup({
      user: {} as UserInstance,
      chain: {} as ChainInstance,
      address: {} as AddressInstance,
      metadata: {},
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
    const result = await controller.deleteGroup({
      user: {} as UserInstance,
      chain: {} as ChainInstance,
      address: {} as AddressInstance,
      groupId: 1,
    });
    expect(result).to.be.undefined;
  });
});

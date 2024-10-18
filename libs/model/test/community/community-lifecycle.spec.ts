import {
  Actor,
  InvalidActor,
  InvalidInput,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import { PermissionEnum, TopicWeightedVoting } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { CreateTopic } from 'model/src/community/CreateTopic.command';
import { UpdateTopic } from 'model/src/community/UpdateTopic.command';
import { afterAll, assert, beforeAll, describe, expect, test } from 'vitest';
import {
  BanAddress,
  BanAddressErrors,
  CreateCommunity,
  CreateGroup,
  CreateGroupErrors,
  DeleteGroup,
  DeleteGroupErrors,
  DeleteTopic,
  GetCommunities,
  GetMembers,
  GetTopics,
  JoinCommunity,
  JoinCommunityErrors,
  MAX_GROUPS_PER_COMMUNITY,
  UpdateCommunity,
  UpdateCommunityErrors,
} from '../../src/community';
import { models } from '../../src/database';
import type {
  ChainNodeAttributes,
  CommunityAttributes,
  TopicAttributes,
} from '../../src/models';
import { seed } from '../../src/tester';

const chance = Chance();

function buildCreateGroupPayload(
  community_id: string,
  topics: { id: number; permissions: PermissionEnum[] }[] = [],
) {
  return {
    community_id,
    metadata: {
      name: chance.name(),
      description: chance.sentence(),
      required_requirements: 1,
      membership_ttl: 100,
    },
    requirements: [],
    topics,
  };
}

describe('Community lifecycle', () => {
  let ethNode: ChainNodeAttributes,
    edgewareNode: ChainNodeAttributes,
    cosmosNode: ChainNodeAttributes,
    substrateNode: ChainNodeAttributes;
  let community: CommunityAttributes,
    cosmos_community: CommunityAttributes,
    substrate_community: CommunityAttributes;
  let superAdminActor: Actor,
    ethAdminActor: Actor,
    cosmosAdminActor: Actor,
    substrateAdminActor: Actor,
    ethActor: Actor,
    cosmosActor: Actor,
    substrateActor: Actor;
  const custom_domain = 'custom';

  beforeAll(async () => {
    const [_ethNode] = await seed('ChainNode', { eth_chain_id: 1 });
    const [_edgewareNode] = await seed('ChainNode', {
      name: 'Edgeware Mainnet',
      eth_chain_id: null,
    });

    const [_cosmosNode] = await seed('ChainNode', {
      name: 'Cosmos Mainnet',
      eth_chain_id: null,
      cosmos_chain_id: '1',
    });

    const [_substrateNode] = await seed('ChainNode', {
      name: 'Substrate Mainnet',
      eth_chain_id: null,
      cosmos_chain_id: null,
    });

    ethNode = _ethNode!;
    edgewareNode = _edgewareNode!;
    cosmosNode = _cosmosNode!;
    substrateNode = _substrateNode!;

    const [superadmin] = await seed('User', { isAdmin: true });
    const [admin] = await seed('User', { isAdmin: false });
    const [member] = await seed('User', { isAdmin: false });
    const [cosmosMember] = await seed('User', { isAdmin: false });
    const [substrateMember] = await seed('User', { isAdmin: false });

    const [ethBase] = await seed('Community', {
      chain_node_id: _ethNode!.id!,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: superadmin!.id,
          verified: new Date(),
        },
        {
          role: 'admin',
          user_id: admin!.id,
          verified: new Date(),
        },
        {
          role: 'member',
          user_id: member!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000000', // base evm address
        },
      ],
      custom_domain,
    });

    const [cosmosBase] = await seed('Community', {
      chain_node_id: _cosmosNode!.id!,
      base: ChainBase.CosmosSDK,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: admin!.id,
          verified: new Date(),
        },
        {
          role: 'member',
          user_id: cosmosMember!.id,
          verified: new Date(),
          address: 'osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6', // base cosmos address
        },
        {
          role: 'member',
          user_id: member!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000000', // base evm address
        },
      ],
    });

    const [substrateBase] = await seed('Community', {
      chain_node_id: _substrateNode!.id!,
      base: ChainBase.Substrate,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: admin!.id,
          verified: new Date(),
        },
        {
          role: 'member',
          user_id: substrateMember!.id,
          verified: new Date(),
          address: 'base-substrate-address', // base substrate address
        },
      ],
    });

    superAdminActor = {
      user: {
        id: superadmin!.id!,
        email: superadmin!.email!,
        isAdmin: superadmin!.isAdmin!,
      },
      address: ethBase?.Addresses?.at(0)?.address,
    };
    ethAdminActor = {
      user: { id: admin!.id!, email: admin!.email!, isAdmin: admin!.isAdmin! },
      address: ethBase?.Addresses?.at(1)?.address,
    };
    cosmosAdminActor = {
      user: {
        id: admin!.id!,
        email: admin!.email!,
        isAdmin: admin!.isAdmin!,
      },
      address: cosmosBase?.Addresses?.at(0)?.address,
    };
    substrateAdminActor = {
      user: {
        id: admin!.id!,
        email: admin!.email!,
        isAdmin: admin!.isAdmin!,
      },
      address: substrateBase?.Addresses?.at(0)?.address,
    };
    ethActor = {
      user: {
        id: member!.id!,
        email: member!.email!,
        isAdmin: member!.isAdmin!,
      },
      address: ethBase?.Addresses?.at(2)?.address,
    };
    cosmosActor = {
      user: {
        id: cosmosMember!.id!,
        email: cosmosMember!.email!,
        isAdmin: cosmosMember!.isAdmin!,
      },
      address: cosmosBase?.Addresses?.at(1)?.address,
    };
    substrateActor = {
      user: {
        id: substrateMember!.id!,
        email: substrateMember!.email!,
        isAdmin: substrateMember!.isAdmin!,
      },
      address: substrateBase?.Addresses?.at(1)?.address,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('create', () => {
    test('should create ethereum community', async () => {
      const eth_name = chance.name();
      const eth_result = await command(CreateCommunity(), {
        actor: ethAdminActor,
        payload: {
          id: eth_name,
          type: ChainType.Offchain,
          name: eth_name,
          default_symbol: eth_name.substring(0, 8).replace(' ', ''),
          base: ChainBase.Ethereum,
          social_links: [],
          directory_page_enabled: false,
          tags: [],
          chain_node_id: ethNode.id!,
        },
      });
      expect(eth_result?.community?.id).toBe(eth_name);
      expect(eth_result?.admin_address).toBe(ethAdminActor.address);
      community = eth_result!.community! as CommunityAttributes;
    });

    test('should create cosmos community', async () => {
      const cosmos_name = chance.name() + '-' + chance.natural();
      const cosmos_result = await command(CreateCommunity(), {
        actor: cosmosAdminActor,
        payload: {
          id: cosmos_name,
          type: ChainType.Offchain,
          name: cosmos_name,
          default_symbol: cosmos_name.substring(0, 8).replace(' ', ''),
          base: ChainBase.CosmosSDK,
          social_links: [],
          directory_page_enabled: false,
          tags: [],
          chain_node_id: cosmosNode.id!,
        },
      });
      expect(cosmos_result?.community?.id).toBe(cosmos_name);
      expect(cosmos_result?.admin_address).toBe(cosmosAdminActor.address);
      cosmos_community = cosmos_result!.community! as CommunityAttributes;
    });

    test('should create substrate community', async () => {
      const substrate_name = chance.name() + '-' + chance.natural();
      const substrate_result = await command(CreateCommunity(), {
        actor: substrateAdminActor,
        payload: {
          id: substrate_name,
          type: ChainType.Offchain,
          name: substrate_name,
          default_symbol: substrate_name.substring(0, 8).replace(' ', ''),
          base: ChainBase.Substrate,
          social_links: [],
          directory_page_enabled: false,
          tags: [],
          chain_node_id: substrateNode.id!,
        },
      });
      expect(substrate_result?.community?.id).toBe(substrate_name);
      expect(substrate_result?.admin_address).toBe(substrateAdminActor.address);
      substrate_community = substrate_result!.community! as CommunityAttributes;
    });

    test('should create super admin address', async () => {
      await models.Address.create({
        user_id: superAdminActor.user.id,
        address: superAdminActor.address!,
        community_id: community.id,
        is_user_default: true,
        role: 'admin',
        last_active: new Date(),
        ghost_address: false,
        is_banned: false,
        verification_token: '123',
      });
    });
  });

  describe('groups', () => {
    test('should fail to query community via has_groups when none exists', async () => {
      const communityResults = await query(GetCommunities(), {
        actor: superAdminActor,
        payload: { has_groups: true } as any,
      });
      expect(communityResults?.results).to.have.length(0);
    });

    test('should create group when none exists', async () => {
      const payload = buildCreateGroupPayload(community.id);
      const results = await command(CreateGroup(), {
        actor: ethAdminActor,
        payload,
      });
      expect(results?.groups?.at(0)?.metadata).to.includes(payload.metadata);

      const communityResults = await query(GetCommunities(), {
        actor: superAdminActor,
        payload: { has_groups: true } as any,
      });
      expect(communityResults?.results?.at(0)?.id).to.equal(
        payload.community_id,
      );
    });

    test('should fail group creation when group with same id found', async () => {
      const payload = buildCreateGroupPayload(community.id);
      await command(CreateGroup(), {
        actor: ethAdminActor,
        payload,
      });
      await expect(() =>
        command(CreateGroup(), {
          actor: ethAdminActor,
          payload,
        }),
      ).rejects.toThrow(InvalidState);
    });

    test('should fail group creation when sending invalid topics', async () => {
      await expect(
        command(CreateGroup(), {
          actor: ethAdminActor,
          payload: buildCreateGroupPayload(community.id, [
            {
              id: 1,
              permissions: [
                PermissionEnum.CREATE_COMMENT,
                PermissionEnum.CREATE_THREAD,
                PermissionEnum.CREATE_COMMENT_REACTION,
                PermissionEnum.CREATE_THREAD_REACTION,
              ],
            },
            {
              id: 2,
              permissions: [
                PermissionEnum.CREATE_COMMENT,
                PermissionEnum.CREATE_THREAD,
                PermissionEnum.CREATE_COMMENT_REACTION,
                PermissionEnum.CREATE_THREAD_REACTION,
              ],
            },
            {
              id: 3,
              permissions: [
                PermissionEnum.CREATE_COMMENT,
                PermissionEnum.CREATE_THREAD,
                PermissionEnum.CREATE_COMMENT_REACTION,
                PermissionEnum.CREATE_THREAD_REACTION,
              ],
            },
          ]),
        }),
      ).rejects.toThrow(CreateGroupErrors.InvalidTopics);
    });

    test('should delete group', async () => {
      const created = await command(CreateGroup(), {
        actor: ethAdminActor,
        payload: buildCreateGroupPayload(community.id),
      });
      const group_id = created!.groups!.at(0)!.id!;
      const deleted = await command(DeleteGroup(), {
        actor: ethAdminActor,
        payload: { community_id: community.id, group_id },
      });
      expect(deleted?.community_id).toBe(community.id);
      expect(deleted?.group_id).toBe(group_id);
    });

    test('should delete group as super admin', async () => {
      const created = await command(CreateGroup(), {
        actor: superAdminActor,
        payload: buildCreateGroupPayload(community.id),
      });
      const group_id = created!.groups!.at(0)!.id!;
      const deleted = await command(DeleteGroup(), {
        actor: superAdminActor,
        payload: { community_id: community.id, group_id },
      });
      expect(deleted?.community_id).toBe(community.id);
      expect(deleted?.group_id).toBe(group_id);
    });

    test('should throw when trying to delete group that is system managed', async () => {
      const created = await command(CreateGroup(), {
        actor: ethAdminActor,
        payload: {
          ...buildCreateGroupPayload(community.id),
        },
      });
      const group_id = created!.groups!.at(0)!.id!;
      await models.Group.update(
        { is_system_managed: true },
        { where: { id: group_id } },
      );
      await expect(() =>
        command(DeleteGroup(), {
          actor: ethAdminActor,
          payload: { community_id: community.id, group_id },
        }),
      ).rejects.toThrow(DeleteGroupErrors.SystemManaged);
    });

    test('should fail group creation when community reached max number of groups allowed', async () => {
      await expect(async () => {
        for (let i = 0; i <= MAX_GROUPS_PER_COMMUNITY; i++) {
          await command(CreateGroup(), {
            actor: ethAdminActor,
            payload: buildCreateGroupPayload(community.id),
          });
        }
      }).rejects.toThrow(CreateGroupErrors.MaxGroups);
    });
  });

  describe('topics', () => {
    test('should throw when creating a topic as a non-admin', async () => {
      await expect(() =>
        command(CreateTopic(), {
          actor: ethActor,
          payload: {
            community_id: community.id,
            name: 'abc',
            description: 'abc',
            featured_in_sidebar: false,
            featured_in_new_post: false,
          },
        }),
      ).rejects.toThrow('User is not admin in the community');
    });

    let createdTopic: Partial<TopicAttributes>;

    test('should create topic (non-weighted)', async () => {
      const result = await command(CreateTopic(), {
        actor: superAdminActor,
        payload: {
          community_id: community.id,
          name: 'abc',
          description: 'bbb',
          featured_in_sidebar: false,
          featured_in_new_post: false,
        },
      });
      expect(result).to.haveOwnProperty('topic');
      expect(result).to.haveOwnProperty('user_id');
      const { topic } = result!;
      expect(topic!.community_id).to.equal(community.id);
      expect(topic!.name).to.equal('abc');
      expect(topic!.description).to.equal('bbb');
      expect(topic!.weighted_voting).toBeFalsy();
      createdTopic = topic!;
    });

    test('should create topic (stake weighted)', async () => {
      await models.CommunityStake.create({
        community_id: community.id,
        stake_id: 1,
        stake_token: 'ABC',
        vote_weight: 1,
        stake_enabled: true,
      });
      const result = await command(CreateTopic(), {
        actor: superAdminActor,
        payload: {
          community_id: community.id,
          name: 'haha',
          description: 'boohoo',
          featured_in_sidebar: false,
          featured_in_new_post: false,
          weighted_voting: TopicWeightedVoting.Stake,
        },
      });
      const { topic } = result!;
      expect(topic!.weighted_voting).to.equal(TopicWeightedVoting.Stake);
    });

    test('should throw when updating topic as non-admin', async () => {
      await expect(() =>
        command(UpdateTopic(), {
          actor: ethActor,
          payload: {
            topic_id: createdTopic.id!,
            community_id: community.id,
            name: 'aaa',
            description: 'bbb',
          },
        }),
      ).rejects.toThrow('User is not admin in the community');
    });

    test('should update topic', async () => {
      const { topic: updatedTopic } = (await command(UpdateTopic(), {
        actor: superAdminActor,
        payload: {
          topic_id: createdTopic.id!,
          community_id: community.id,
          name: 'newName',
          description: 'newDesc',
        },
      }))!;
      expect(updatedTopic.name).to.eq('newName');
      expect(updatedTopic.description).to.eq('newDesc');
    });

    test('should delete a topic', async () => {
      const { topic } = (await command(CreateTopic(), {
        actor: superAdminActor,
        payload: {
          community_id: community.id,
          name: 'hhh',
          featured_in_new_post: false,
          featured_in_sidebar: false,
          description: '',
        },
      }))!;
      const response = await command(DeleteTopic(), {
        actor: ethAdminActor,
        payload: { community_id: community.id, topic_id: topic!.id! },
      });
      expect(response?.topic_id).to.equal(topic.id);
    });

    test('should throw if not authorized', async () => {
      const { topic } = (await command(CreateTopic(), {
        actor: superAdminActor,
        payload: {
          community_id: community.id,
          name: 'hhh',
          featured_in_new_post: false,
          featured_in_sidebar: false,
          description: '',
        },
      }))!;

      await expect(
        command(DeleteTopic(), {
          actor: ethActor,
          payload: { community_id: community.id, topic_id: topic!.id! },
        }),
      ).rejects.toThrow(InvalidActor);
    });

    test('should get topics', async () => {
      const topics = await query(GetTopics(), {
        actor: superAdminActor,
        payload: { community_id: community.id, with_contest_managers: false },
      });
      expect(topics?.length).toBe(4);
    });
  });

  describe('updates', () => {
    const baseRequest = {
      default_symbol: 'EDG',
      base: ChainBase.Substrate,
      icon_url: 'assets/img/protocols/edg.png',
      active: true,
      type: ChainType.Chain,
      social_links: [],
    };

    test('should update community', async () => {
      const updated = await command(UpdateCommunity(), {
        actor: ethAdminActor,
        payload: {
          ...baseRequest,
          id: community.id,
          chain_node_id: ethNode.id,
          directory_page_enabled: true,
          directory_page_chain_node_id: ethNode.id,
          type: ChainType.Offchain,
        },
      });

      assert.equal(updated?.directory_page_enabled, true);
      assert.equal(updated?.directory_page_chain_node_id, ethNode.id);
      assert.equal(updated?.type, 'offchain');
    });

    test('should remove directory', async () => {
      const updated = await command(UpdateCommunity(), {
        actor: ethAdminActor,
        payload: {
          ...baseRequest,
          id: community.id,
          chain_node_id: ethNode.id,
          directory_page_enabled: false,
          directory_page_chain_node_id: null,
          type: ChainType.Chain,
        },
      });

      assert.equal(updated?.directory_page_enabled, false);
      assert.equal(updated?.directory_page_chain_node_id, null);
      assert.equal(updated?.type, 'chain');
    });

    test('should throw if snapshot not found', async () => {
      await expect(() =>
        command(UpdateCommunity(), {
          actor: ethAdminActor,
          payload: {
            ...baseRequest,
            id: community.id,
            snapshot: ['not-found'],
          },
        }),
      ).rejects.toThrow(InvalidInput);
    });

    test('should throw if namespace present but no transaction hash', async () => {
      await expect(() =>
        command(UpdateCommunity(), {
          actor: ethAdminActor,
          payload: {
            ...baseRequest,
            id: community.id,
            namespace: 'tempNamespace',
            chain_node_id: 1263,
          },
        }),
      ).rejects.toThrow(UpdateCommunityErrors.InvalidTransactionHash);
    });

    test('should throw if actor is not admin', async () => {
      await expect(() =>
        command(UpdateCommunity(), {
          actor: ethActor,
          payload: {
            ...baseRequest,
            id: community.id,
            namespace: 'tempNamespace',
            transactionHash: '0x1234',
            chain_node_id: edgewareNode!.id!,
          },
        }),
      ).rejects.toThrow(InvalidActor);
    });

    test('should throw if chain node of community does not match supported chain', async () => {
      await command(UpdateCommunity(), {
        actor: superAdminActor,
        payload: {
          ...baseRequest,
          id: community.id,
          chain_node_id: edgewareNode!.id!,
        },
      });
      await expect(() =>
        command(UpdateCommunity(), {
          actor: superAdminActor,
          payload: {
            ...baseRequest,
            id: community.id,
            namespace: 'tempNamespace',
            transactionHash: '0x1234',
          },
        }),
      ).rejects.toThrow('Namespace not supported on selected chain');
    });
  });

  describe('joining', () => {
    test('should throw when not verified', async () => {
      const [member] = await seed('User', { isAdmin: false });
      const actor = {
        user: {
          id: member!.id,
          email: member!.profile.email!,
          isAdmin: member!.isAdmin!,
        },
        address: '0x1234',
      };
      await expect(
        command(JoinCommunity(), {
          actor,
          payload: {
            community_id: community.id,
          },
        }),
      ).rejects.toThrow(JoinCommunityErrors.NotVerifiedAddressOrUser);
    });

    test('should join Ethereum community with evm compatible address', async () => {
      const address = await command(JoinCommunity(), {
        actor: ethActor,
        payload: {
          community_id: community.id,
        },
      });
      expect(address?.address).toBe(ethActor.address);
      const members = await query(GetMembers(), {
        actor: superAdminActor,
        payload: { community_id: community.id, limit: 10, cursor: 1 },
      });
      expect(members?.results.length).toBe(3);
    });

    test('should throw when joining Ethereum community with cosmos address', async () => {
      await expect(
        command(JoinCommunity(), {
          actor: cosmosActor,
          payload: { community_id: community.id },
        }),
      ).rejects.toThrow(JoinCommunityErrors.NotVerifiedAddressOrUser);
    });

    test('should throw when joining Ethereum community with substrate address', async () => {
      await expect(
        command(JoinCommunity(), {
          actor: substrateActor,
          payload: { community_id: community.id },
        }),
      ).rejects.toThrow(JoinCommunityErrors.NotVerifiedAddressOrUser);
    });

    test('should join CosmosSDK community with cosmos address', async () => {
      const cosmos_address = await command(JoinCommunity(), {
        actor: cosmosActor,
        payload: { community_id: cosmos_community.id },
      });
      expect(cosmos_address?.address).toBe(cosmosActor.address);
    });

    test('should join CosmosSDK community with evm address', async () => {
      const evm_address = await command(JoinCommunity(), {
        actor: ethActor,
        payload: { community_id: cosmos_community.id },
      });
      expect(evm_address?.address).toBe(ethActor.address);
    });

    test('should throw when joining CosmosSDK community with substrate address', async () => {
      await expect(
        command(JoinCommunity(), {
          actor: substrateActor,
          payload: { community_id: cosmos_community.id },
        }),
      ).rejects.toThrow(JoinCommunityErrors.NotVerifiedAddressOrUser);
    });

    test('should join Substrate community with substrate address', async () => {
      const address = await command(JoinCommunity(), {
        actor: substrateActor,
        payload: { community_id: substrate_community.id },
      });
      expect(address?.address).toBe(substrateActor.address);
    });

    test('should throw when joining Substrate community with evm address', async () => {
      await expect(
        command(JoinCommunity(), {
          actor: ethActor,
          payload: { community_id: substrate_community.id },
        }),
      ).rejects.toThrow(JoinCommunityErrors.NotVerifiedAddressOrUser);
    });

    test('should throw when joining Substrate community with cosmos address', async () => {
      await expect(
        command(JoinCommunity(), {
          actor: cosmosActor,
          payload: { community_id: substrate_community.id },
        }),
      ).rejects.toThrow(JoinCommunityErrors.NotVerifiedAddressOrUser);
    });
  });

  describe('ban address', () => {
    test('should fail if actor is not admin', async () => {
      await expect(() =>
        command(BanAddress(), {
          actor: ethActor,
          payload: {
            community_id: community.id!,
            address: '',
          },
        }),
      ).rejects.toThrow(InvalidActor);
    });
    test('should fail to ban an address of a different community', async () => {
      await expect(() =>
        command(BanAddress(), {
          actor: ethAdminActor,
          payload: {
            address: substrateActor.address!,
            community_id: substrate_community.id!,
          },
        }),
      ).rejects.toThrow(InvalidActor);
    });
    test('should fail if address is not found in community', async () => {
      await expect(() =>
        command(BanAddress(), {
          actor: ethAdminActor,
          payload: { address: '0xrandom', community_id: community.id! },
        }),
      ).rejects.toThrow(BanAddressErrors.NotFound);
    });
    test('should allow an admin to ban an address', async () => {
      await command(BanAddress(), {
        actor: ethAdminActor,
        payload: { address: ethActor.address!, community_id: community.id! },
      });
    });
    test('should fail if address is already banned', async () => {
      await expect(() =>
        command(BanAddress(), {
          actor: ethAdminActor,
          payload: { address: ethActor.address!, community_id: community.id! },
        }),
      ).rejects.toThrow(BanAddressErrors.AlreadyExists);
    });
  });
});

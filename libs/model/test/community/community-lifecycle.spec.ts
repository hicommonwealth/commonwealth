import {
  Actor,
  InvalidActor,
  InvalidInput,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainType,
  CommunityTierMap,
  GatedActionEnum,
  UserTierMap,
} from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { afterAll, assert, beforeAll, describe, expect, test } from 'vitest';
import {
  BanAddress,
  BanAddressErrors,
  CreateCommunity,
  CreateGroup,
  CreateGroupErrors,
  DeleteGroup,
  DeleteGroupErrors,
  GetCommunities,
  GetCommunity,
  GetMembers,
  GetTopics,
  JoinCommunity,
  JoinCommunityErrors,
  MAX_GROUPS_PER_COMMUNITY,
  SetCommunityMCPServers,
  ToggleArchiveTopic,
  UpdateCommunity,
  UpdateCommunityErrors,
} from '../../src/aggregates/community';
import { CreateTopic } from '../../src/aggregates/community/CreateTopic.command';
import { UpdateTopic } from '../../src/aggregates/community/UpdateTopic.command';
import { models } from '../../src/database';
import { systemActor } from '../../src/middleware';
import type {
  ChainNodeAttributes,
  CommunityAttributes,
  MCPServerAttributes,
  TopicAttributes,
} from '../../src/models';
import { ChainEventPolicy } from '../../src/policies/ChainEventCreated.policy';
import { seed } from '../../src/tester';
import { emitEvent } from '../../src/utils/utils';
import { drainOutbox } from '../utils';

const chance = Chance();

function buildCreateGroupPayload(
  community_id: string,
  topics: { id: number; permissions: GatedActionEnum[] }[] = [],
) {
  return {
    community_id,
    metadata: {
      name: chance.name(),
      description: chance.sentence(),
      groupImageUrl: chance.url(),
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
  let mcpServer: MCPServerAttributes;

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

    const [superadmin] = await seed('User', {
      isAdmin: true,
      tier: UserTierMap.ManuallyVerified,
    });
    const [admin] = await seed('User', {
      isAdmin: false,
      tier: UserTierMap.ManuallyVerified,
    });
    const [member] = await seed('User', {
      isAdmin: false,
      tier: UserTierMap.ManuallyVerified,
    });
    const [cosmosMember] = await seed('User', {
      isAdmin: false,
      tier: UserTierMap.ManuallyVerified,
    });
    const [substrateMember] = await seed('User', {
      isAdmin: false,
      tier: UserTierMap.ManuallyVerified,
    });

    const [ethBase] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      chain_node_id: _ethNode!.id!,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      allow_tokenized_threads: true,
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
      tier: CommunityTierMap.ChainVerified,
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
      tier: CommunityTierMap.ChainVerified,
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

    const [server] = await seed('MCPServer', {
      id: 1,
      name: 'mcp-server',
      description: 'A test MCP server',
      handle: 'mcp',
      source: 'test',
      server_url: 'https://mcp.example.com',
    });
    mcpServer = server!;
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
          allow_tokenized_threads: true,
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
        role: 'admin',
        last_active: new Date(),
        ghost_address: false,
        is_banned: false,
        verification_token: '123',
      });
    });
  });

  describe('mcp servers', () => {
    test('should set mcp servers', async () => {
      const result = await command(SetCommunityMCPServers(), {
        actor: superAdminActor,
        payload: {
          community_id: community.id,
          mcp_server_ids: [mcpServer.id!],
        },
      });
      expect(result).to.have.length(1);
      expect(result?.[0]).to.toMatchObject(mcpServer);

      const communityResult = await query(GetCommunity(), {
        actor: superAdminActor,
        payload: { id: community.id, include_mcp_servers: true },
      });
      expect(communityResult?.MCPServerCommunities).to.have.length(1);
      expect(communityResult?.MCPServerCommunities?.[0]).to.toMatchObject({
        mcp_server_id: mcpServer.id,
        community_id: community.id,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
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
                GatedActionEnum.CREATE_COMMENT,
                GatedActionEnum.CREATE_THREAD,
                GatedActionEnum.CREATE_COMMENT_REACTION,
                GatedActionEnum.CREATE_THREAD_REACTION,
              ],
            },
            {
              id: 2,
              permissions: [
                GatedActionEnum.CREATE_COMMENT,
                GatedActionEnum.CREATE_THREAD,
                GatedActionEnum.CREATE_COMMENT_REACTION,
                GatedActionEnum.CREATE_THREAD_REACTION,
              ],
            },
            {
              id: 3,
              permissions: [
                GatedActionEnum.CREATE_COMMENT,
                GatedActionEnum.CREATE_THREAD,
                GatedActionEnum.CREATE_COMMENT_REACTION,
                GatedActionEnum.CREATE_THREAD_REACTION,
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
            allow_tokenized_threads: true,
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
          allow_tokenized_threads: true,
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
          allow_tokenized_threads: true,
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

    test('should update a topic as a system actor', async () => {
      const { topic: updatedTopic } = (await command(UpdateTopic(), {
        actor: systemActor({}),
        payload: {
          topic_id: createdTopic.id!,
          community_id: community.id,
          description: 'newDesc by system actor',
        },
      }))!;
      expect(updatedTopic.description).to.eq('newDesc by system actor');
    });

    test('Ensure not supplying allow_tokenized_threads does not override old value', async () => {
      const { topic: updatedTopic } = (await command(UpdateTopic(), {
        actor: systemActor({}),
        payload: {
          topic_id: createdTopic.id!,
          community_id: community.id,
          description: 'newDesc by system actor',
        },
      }))!;
      expect(updatedTopic.allow_tokenized_threads).to.eq(true);
    });

    test('should archive a topic', async () => {
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
      const response = await command(ToggleArchiveTopic(), {
        actor: ethAdminActor,
        payload: {
          community_id: community.id,
          topic_id: topic!.id!,
          archive: true,
        },
      });
      expect(response?.topic_id).to.equal(topic.id);
      const archivedTopic = await models.Topic.findOne({
        where: {
          id: topic!.id!,
        },
      });
      expect(archivedTopic?.archived_at).toBeTruthy();
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
        command(ToggleArchiveTopic(), {
          actor: ethActor,
          payload: {
            community_id: community.id,
            topic_id: topic!.id!,
            archive: true,
          },
        }),
      ).rejects.toThrow(InvalidActor);
    });

    test("should throw error when topic doesn't exist", async () => {
      await expect(
        command(ToggleArchiveTopic(), {
          actor: ethAdminActor,
          payload: {
            community_id: community.id,
            topic_id: 123456789,
            archive: false,
          },
        }),
      ).rejects.toThrow(InvalidInput);
    });

    test("should get topics that aren't archived", async () => {
      const topics = await query(GetTopics(), {
        actor: superAdminActor,
        payload: { community_id: community.id, with_contest_managers: false },
      });
      expect(topics?.length).toBe(3);
    });

    test('should get all topics', async () => {
      const topics = await query(GetTopics(), {
        actor: superAdminActor,
        payload: {
          community_id: community.id,
          with_contest_managers: false,
          with_archived_topics: true,
        },
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
          community_id: community.id,
          chain_node_id: ethNode.id,
          directory_page_enabled: true,
          directory_page_chain_node_id: ethNode.id,
          type: ChainType.Offchain,
          name: `${new Date().getTime()}`,
          description: `${new Date().getTime()}`,
          social_links: ['http://discord.gg', 'https://t.me/'],
        },
      });

      assert.equal(updated?.directory_page_enabled, true);
      assert.equal(updated?.directory_page_chain_node_id, ethNode.id);
      assert.equal(updated?.type, 'offchain');
      assert.equal(updated?.default_symbol, 'EDG');
      // don't allow updating base
      assert.equal(updated?.base, 'ethereum');
      assert.equal(updated?.icon_url, 'assets/img/protocols/edg.png');
      assert.equal(updated?.active, true);
      expect(updated?.social_links).toContain('http://discord.gg');
      expect(updated?.social_links).toContain('https://t.me/');
    });

    test('ensure update community does not override allow_tokenized_threads', async () => {
      const updated = await command(UpdateCommunity(), {
        actor: ethAdminActor,
        payload: {
          ...baseRequest,
          community_id: community.id,
          chain_node_id: ethNode.id,
          directory_page_enabled: true,
          directory_page_chain_node_id: ethNode.id,
          type: ChainType.Offchain,
        },
      });

      assert.equal(updated?.allow_tokenized_threads, true);
    });

    test('should remove directory', async () => {
      const updated = await command(UpdateCommunity(), {
        actor: ethAdminActor,
        payload: {
          ...baseRequest,
          community_id: community.id,
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
            community_id: community.id,
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
            community_id: community.id,
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
            community_id: community.id,
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
          community_id: community.id,
          chain_node_id: edgewareNode!.id!,
        },
      });
      await expect(() =>
        command(UpdateCommunity(), {
          actor: superAdminActor,
          payload: {
            ...baseRequest,
            community_id: community.id,
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
      ).rejects.toThrow();
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
        payload: {
          community_id: community.id,
          limit: 10,
          cursor: 1,
          searchByNameAndAddress: false,
        },
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
  describe('namespace', () => {
    test('should set namespace creator address on NamespaceDeployed event', async () => {
      const namespaceAddress =
        '0x1235761A3770DdceED4156E2Fb603072a34044d9' as `0x${string}`;

      const namespaceCreatorAddress =
        '0x2345761A3770DdceED4156E2Fb603072a34044d9' as `0x${string}`;

      await models.Community.update(
        {
          namespace_address: namespaceAddress,
        },
        {
          where: {
            id: community.id,
          },
        },
      );

      const namespaceDeployedPayload = {
        block: {
          hash: '0xf26c4aeb50fb6350e280c2443b086ef8034a8c81ea49f7483862c928541468dc',
          miner: '0x4200000000000000000000000000000000000011',
          nonce: '0x0000000000000000',
          number: '27208156',
          gasLimit: '112000000',
          logsBloom:
            '0xeb31f7dabdd3d8b9ceebf798ee0bfb46f7f5febf3dfbdfcf62c706aeabff9f57df7afbee17b8fdbe3e5afe5ffec77ffe63fddebfd5bf72ceeeebf6fff7bca7dee56feebee7ffce5ed3cddfeff76efbbc85dffdeddefdcaff37fafdd0bff9ff6ff7ec7ef5bedcb7e2f1e6dfeeff6eddbff76fff63acffdfec77feda5ef7bfb6fa76976be7ddf97e5b47afcfbfb74f0edf6dfbd76bedfdeca8f0ffdf7e74f5f53e9fcbfff7eab5bcdaeff0d3773fedd4cf7d97fd7b22df7d7f9dff67dffdfec9d7cc777d7fefcb6d6fbdebdeffaffb15da5ebaf35ef77cff3efb79dfdeeefcefe7c77699f94dfffbf7f9f76feedf87eff4fbf6defe7f726edaff57cf54eeefee7f',
          timestamp: '1741205659',
          parentHash:
            '0x3ae6e694f44c7827c498abdb8bbfbcd75ef88dc7fb382681aa87da2cbc2b2708',
        },
        rawLog: {
          data: '0x00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000007485761a3770ddceed4156e2fb603072a34044d900000000000000000000000000000000000000000000000000000000000000e00000000000000000000000007485761a3770ddceed4156e2fb603072a34044d90000000000000000000000009e091d81053af8f6dce46d42e5c04a4a8f0f0cba000000000000000000000000000000000000000000000000000000000000000561737261660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          topics: [
            '0xc8451dcd95e7ca3d8608dfc9d43e7bf4187f43cf5e07d5143b6c2be3cf73d175',
          ],
          address: '0xedf43c919f59900c82d963e99d822da3f95575ea',
          removed: false,
          logIndex: 701,
          blockHash:
            '0xf26c4aeb50fb6350e280c2443b086ef8034a8c81ea49f7483862c928541468dc',
          blockNumber: '27208156',
          transactionHash:
            '0x1b4523eddb2ad5904b8b0b5b9ae4cf3d5b6d4853c6dccf1c9a0d118f2c3abc38',
          transactionIndex: 357,
        },
        parsedArgs: {
          name: 'asraf',
          _signature: '0x' as `0x${string}`,
          _feeManager:
            '0x7485761A3770DdceED4156E2Fb603072a34044d9' as `0x${string}`,
          nameSpaceAddress: namespaceAddress as `0x${string}`,
          _namespaceDeployer: namespaceCreatorAddress as `0x${string}`,
        },
        eventSource: {
          ethChainId: 8453,
          eventSignature:
            '0xc8451dcd95e7ca3d8608dfc9d43e7bf4187f43cf5e07d5143b6c2be3cf73d175',
        },
      };

      await emitEvent(models.Outbox, [
        {
          event_name: 'NamespaceDeployed',
          event_payload: namespaceDeployedPayload as any,
        },
      ]);
      await drainOutbox(['NamespaceDeployed'], ChainEventPolicy);

      const communityAfterNamespaceDeployed = await models.Community.findOne({
        where: {
          id: community.id,
        },
      });
      expect(communityAfterNamespaceDeployed?.namespace_address).toBe(
        namespaceAddress,
      );
      expect(communityAfterNamespaceDeployed?.namespace_creator_address).toBe(
        namespaceCreatorAddress,
      );
    });
  });
});

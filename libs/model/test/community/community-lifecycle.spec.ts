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
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { CreateTopic } from 'model/src/community/CreateTopic.command';
import { UpdateTopic } from 'model/src/community/UpdateTopic.command';
import { afterAll, assert, beforeAll, describe, expect, test } from 'vitest';
import {
  CreateCommunity,
  CreateGroup,
  DeleteTopic,
  Errors,
  GetCommunities,
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

describe('Community lifecycle', () => {
  let ethNode: ChainNodeAttributes, edgewareNode: ChainNodeAttributes;
  let community: CommunityAttributes;
  let superAdminActor: Actor, adminActor: Actor, memberActor: Actor;
  const custom_domain = 'custom';
  const group_payload = {
    id: '',
    metadata: {
      name: chance.name(),
      description: chance.sentence(),
      required_requirements: 1,
      membership_ttl: 100,
    },
    requirements: [],
    topics: [],
  };

  beforeAll(async () => {
    const [_ethNode] = await seed('ChainNode', { eth_chain_id: 1 });
    const [_edgewareNode] = await seed('ChainNode', {
      name: 'Edgeware Mainnet',
    });
    const [superadmin] = await seed('User', { isAdmin: true });
    const [admin] = await seed('User', { isAdmin: false });
    const [member] = await seed('User', { isAdmin: false });
    const [base] = await seed('Community', {
      chain_node_id: _ethNode!.id!,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: superadmin!.id,
        },
        {
          role: 'admin',
          user_id: admin!.id,
        },
        {
          role: 'member',
          user_id: member!.id,
        },
      ],
      custom_domain,
    });

    ethNode = _ethNode!;
    edgewareNode = _edgewareNode!;
    superAdminActor = {
      user: {
        id: superadmin!.id!,
        email: superadmin!.email!,
        isAdmin: superadmin!.isAdmin!,
      },
      address: base?.Addresses?.at(0)?.address,
    };
    adminActor = {
      user: { id: admin!.id!, email: admin!.email!, isAdmin: admin!.isAdmin! },
      address: base?.Addresses?.at(1)?.address,
    };
    memberActor = {
      user: {
        id: member!.id!,
        email: member!.email!,
        isAdmin: member!.isAdmin!,
      },
      address: base?.Addresses?.at(2)?.address,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create community', async () => {
    const name = chance.name();
    const result = await command(CreateCommunity(), {
      actor: superAdminActor,
      payload: {
        id: name,
        type: ChainType.Offchain,
        name,
        default_symbol: name.substring(0, 8).replace(' ', ''),
        base: ChainBase.Ethereum,
        social_links: [],
        user_address: superAdminActor.address!,
        directory_page_enabled: false,
        tags: [],
        chain_node_id: ethNode.id!,
      },
    });
    expect(result?.community?.id).toBe(name);
    expect(result?.admin_address).toBe(superAdminActor.address);
    // connect results
    community = result!.community! as CommunityAttributes;
    group_payload.id = result!.community!.id;
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
      const results = await command(CreateGroup(), {
        actor: superAdminActor,
        payload: group_payload,
      });
      expect(results?.groups?.at(0)?.metadata).to.includes(
        group_payload.metadata,
      );

      const communityResults = await query(GetCommunities(), {
        actor: superAdminActor,
        payload: { has_groups: true } as any,
      });
      expect(communityResults?.results?.at(0)?.id).to.equal(group_payload.id);
    });

    test('should fail group creation when group with same id found', async () => {
      await expect(() =>
        command(CreateGroup(), {
          actor: superAdminActor,
          payload: group_payload,
        }),
      ).rejects.toThrow(InvalidState);
    });

    test('should fail group creation when sending invalid topics', async () => {
      await expect(
        command(CreateGroup(), {
          actor: superAdminActor,
          payload: {
            id: group_payload.id,
            metadata: {
              name: chance.name(),
              description: chance.sentence(),
              required_requirements: 1,
            },
            requirements: [],
            topics: [1, 2, 3],
          },
        }),
      ).rejects.toThrow(Errors.InvalidTopics);
    });

    test('should fail group creation when community reached max number of groups allowed', async () => {
      // create max groups
      for (let i = 1; i < MAX_GROUPS_PER_COMMUNITY; i++) {
        await command(CreateGroup(), {
          actor: superAdminActor,
          payload: {
            id: group_payload.id,
            metadata: { name: chance.name(), description: chance.sentence() },
            requirements: [],
            topics: [],
          },
        });
      }

      await expect(() =>
        command(CreateGroup(), {
          actor: superAdminActor,
          payload: {
            id: group_payload.id,
            metadata: { name: chance.name(), description: chance.sentence() },
            requirements: [],
            topics: [],
          },
        }),
      ).rejects.toThrow(Errors.MaxGroups);
    });
  });

  describe('topics', () => {
    test('should throw when creating a topic as a non-admin', async () => {
      await expect(() =>
        command(CreateTopic(), {
          actor: memberActor,
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
      // when community is staked, topic will automatically be staked
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
        },
      });
      const { topic } = result!;
      expect(topic!.weighted_voting).to.equal(TopicWeightedVoting.Stake);
    });

    test('should throw when updating topic as non-admin', async () => {
      await expect(() =>
        command(UpdateTopic(), {
          actor: memberActor,
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
        actor: superAdminActor,
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
          actor: memberActor,
          payload: { community_id: community.id, topic_id: topic!.id! },
        }),
      ).rejects.toThrow(InvalidActor);
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
        actor: superAdminActor,
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
        actor: superAdminActor,
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
          actor: adminActor,
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
          actor: superAdminActor,
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
          actor: memberActor,
          payload: {
            ...baseRequest,
            id: community.id,
            namespace: 'tempNamespace',
            transactionHash: '0x1234',
            chain_node_id: edgewareNode!.id!,
          },
        }),
      ).rejects.toThrow('User is not admin in the community');
    });

    // TODO: implement when we can add members via commands
    test.skip('should throw if chain node of community does not match supported chain', async () => {
      await expect(() =>
        command(UpdateCommunity(), {
          actor: superAdminActor,
          payload: {
            ...baseRequest,
            id: community.id,
            namespace: 'tempNamespace',
            transactionHash: '0x1234',
            chain_node_id: edgewareNode!.id!,
          },
        }),
      ).rejects.toThrow('Namespace not supported on selected chain');
    });
  });
});

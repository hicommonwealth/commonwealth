import { Actor } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { seed, seedRecord } from '../../src/tester';
import { getSignersInfo } from './canvas-signers';

export type CommunitySeedOptions = {
  roles: Array<'admin' | 'member' | 'nonmember' | 'banned' | 'rejected'>;
  chain_node?: Partial<z.infer<typeof schemas.ChainNode>>;
  groups?: {
    id: number;
    permissions: schemas.PermissionEnum[];
  }[];
  custom_stages?: string[];
  namespace_address?: string;
  stakes?: z.infer<typeof schemas.CommunityStake>[];
  weighted_voting?: schemas.TopicWeightedVoting;
};

/**
 * Seeds a test community with a set of roles and one topic
 *
 * @param roles - array of user roles to seed
 * @param chain_node - chain node to seed, defaults to ethereum mainnet
 * @param groups - array of group ids and permissions to be assigned to the topic
 */
export async function seedCommunity({
  roles,
  chain_node = { eth_chain_id: 1 },
  groups = [],
  custom_stages,
  namespace_address,
  stakes,
  weighted_voting,
}: CommunitySeedOptions) {
  const actors = {} as Record<(typeof roles)[number], Actor>;
  const addresses = {} as Record<
    (typeof roles)[number],
    z.infer<typeof schemas.Address>
  >;

  const signerInfo = await getSignersInfo(roles);

  const [node] = await seed('ChainNode', chain_node);

  const users = await seedRecord('User', roles, (role) => ({
    profile: { name: role },
    isAdmin: role === 'admin',
  }));

  const [community] = await seed('Community', {
    chain_node_id: node!.id!,
    namespace_address,
    active: true,
    profile_count: 1,
    Addresses: roles.map((role, index) => {
      return {
        address: signerInfo[index].address,
        user_id: users[role].id,
        role: role === 'admin' ? 'admin' : 'member',
        is_banned: role === 'banned',
        verified: new Date(),
      };
    }),
    groups: groups.map(({ id }) => ({ id })),
    topics: [
      {
        group_ids: groups.map(({ id }) => id),
        weighted_voting,
      },
    ],
    CommunityStakes: stakes ?? [],
    custom_stages,
  });

  await Promise.all(
    groups.map((g) =>
      seed('GroupPermission', {
        group_id: g.id,
        topic_id: community?.topics?.[0]?.id || 0,
        allowed_actions: g.permissions,
      }),
    ),
  );

  roles.forEach((role) => {
    const user = users[role];
    const address = community!.Addresses!.find((a) => a.user_id === user.id);
    actors[role] = {
      user: {
        id: user.id,
        email: user.profile.email!,
      },
      address: address!.address,
    };
    addresses[role] = address!;
  });

  return { community, node, actors, addresses, users, roles };
}

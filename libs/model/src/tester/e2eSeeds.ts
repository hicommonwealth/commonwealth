import { config } from '@hicommonwealth/core';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  CommunityTierMap,
  DisabledCommunitySpamTier,
  UserTierMap,
} from '@hicommonwealth/shared';
import { models } from '../database';
import type {
  AddressInstance,
  ChainNodeAttributes,
  CollaborationAttributes,
  CommentInstance,
  CommunityInstance,
  ReactionAttributes,
  ThreadInstance,
  TopicAttributes,
  UserInstance,
} from '../models';
import { getCommentSearchVector, getThreadSearchVector } from '../models';

export type E2E_TestEntities = {
  testThreads: ThreadInstance[];
  testComments: CommentInstance[];
  testUsers: UserInstance[];
  testAddresses: AddressInstance[];
  testChains: CommunityInstance[];
  testCollaborations: CollaborationAttributes[];
  testReactions: ReactionAttributes[];
  testChainNodes: ChainNodeAttributes[];
  testTopics: TopicAttributes[];
};

export const e2eTestEntities = async function (): Promise<E2E_TestEntities> {
  const testThreads: ThreadInstance[] = [];
  const testComments: CommentInstance[] = [];
  const testUsers: UserInstance[] = [];
  const testAddresses: AddressInstance[] = [];
  const testChains: CommunityInstance[] = [];
  const testCollaborations: CollaborationAttributes[] = [];
  const testReactions: ReactionAttributes[] = [];
  const testChainNodes: ChainNodeAttributes[] = [];
  const testTopics: TopicAttributes[] = [];

  try {
    testUsers.push(
      ...(await Promise.all(
        [...Array(4).keys()].map(
          async (i) =>
            (
              await models.User.findOrCreate({
                where: {
                  id: -i - 1,
                  email: `test${i - 1}@gmail.com`,
                  emailVerified: true,
                  isAdmin: true,
                  profile: {
                    name: `testName${-i - 1}`,
                    avatar_url: `testAvatarUrl${-i - 1}`,
                    email: `test${-i - 1}@gmail.com`,
                  },
                  tier: UserTierMap.ManuallyVerified,
                },
              })
            )[0],
        ),
      )),
    );

    testChainNodes.push(
      ...(await Promise.all([
        (
          await models.ChainNode.findOrCreate({
            where: {
              id: 9999,
              eth_chain_id: 9999,
              url: 'test1',
              balance_type: 'ethereum',
              name: 'TestName1',
            },
          })
        )[0],
        (
          await models.ChainNode.findOrCreate({
            where: {
              id: 99999,
              eth_chain_id: 99999,
              url: 'test2',
              balance_type: 'ethereum',
              name: 'TestName2',
            },
          })
        )[0],
      ])),
    );

    testChains.push(
      ...(await models.Community.bulkCreate(
        [
          {
            id: 'cmntest',
            tier: CommunityTierMap.Unverified,
            spam_tier_level: DisabledCommunitySpamTier,
            chain_node_id: 9999,
            name: 'cmntest',
            network: ChainNetwork.Ethereum,
            type: ChainType.Offchain,
            base: ChainBase.Ethereum,
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmn',
            custom_domain: 'customdomain.com',
            allow_tokenized_threads: false,
          },
          {
            id: 'cmntest2',
            tier: CommunityTierMap.Unverified,
            spam_tier_level: DisabledCommunitySpamTier,
            chain_node_id: 99999,
            name: 'cmntest2',
            network: ChainNetwork.Ethereum,
            type: ChainType.Offchain,
            base: ChainBase.Ethereum,
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmntest2',
            custom_domain: 'customdomain.com',
            allow_tokenized_threads: false,
          },
        ].map((x) => ({
          ...x,
          social_links: [],
          custom_stages: [],
          snapshot_spaces: [],
          stages_enabled: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          has_homepage: 'false' as any,
          collapsed_on_homepage: false,
          directory_page_enabled: false,
          namespace_verified: false,
          environment: config.APP_ENV,
          ai_features_enabled: true,
        })),
      )),
    );

    testTopics.push(
      ...(await Promise.all([
        (
          await models.Topic.findOrCreate({
            where: {
              id: -1,
              name: 'testTopic',
              community_id: 'cmntest',
            },
          })
        )[0],
        (
          await models.Topic.findOrCreate({
            where: {
              id: -2,
              name: 'testTopic2',
              community_id: 'cmntest',
            },
          })
        )[0],
      ])),
    );

    const addresses = [
      '0x834731c87A7a6f8B57F4aa42c205265EAcbFCCD7',
      '0x7EcA9278094511486506bb34B31087df7C25Db6f',
      '0xd65FA09DE724f0D68EcbF5e0e186d3d59080172C',
      '0x89F40750d76D646c2f822E4Dd6Ea1558A83eDb82',
    ];

    testAddresses.push(
      ...(await Promise.all(
        [...Array(4).keys()].map(
          async (i) =>
            (
              await models.Address.findOrCreate({
                where: {
                  id: -i - 1,
                  user_id: i < 2 ? -1 : -2,
                  address: addresses[i],
                  community_id: 'cmntest',
                  verification_token: '',
                  verified: new Date(),
                },
              })
            )[0],
        ),
      )),
    );

    testThreads.push(
      ...(await Promise.all(
        [...Array(2).keys()].map(
          async (i) =>
            (
              await models.Thread.findOrCreate({
                where: {
                  id: -i - 1,
                },
                defaults: {
                  address_id: -1,
                  title: `testThread Title ${-i - 1}`,
                  body: `testThread Body ${-i - 1}`,
                  community_id: 'cmntest',
                  topic_id: -1,
                  kind: 'discussion',
                  stage: 'discussion',
                  view_count: 0,
                  reaction_count: 0,
                  reaction_weights_sum: '0',
                  comment_count: 0,
                  search: getThreadSearchVector(
                    `testThread Title ${-i - 1}`,
                    `testThread Body ${-i - 1}`,
                  ),
                },
              })
            )[0],
        ),
      )),
    );

    testThreads.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Thread.findOrCreate({
                where: {
                  id: -i - 1 - 2,
                },
                defaults: {
                  address_id: -2,
                  title: `testThread Title ${-i - 1 - 2}`,
                  body: `testThread Body ${-i - 1 - 2}`,
                  community_id: 'cmntest',
                  topic_id: -2,
                  kind: 'discussion',
                  stage: 'discussion',
                  view_count: 0,
                  reaction_count: 0,
                  reaction_weights_sum: '0',
                  comment_count: 0,
                  search: getThreadSearchVector(
                    `testThread Title ${-i - 1 - 2}`,
                    `testThread Body ${-i - 1 - 2}`,
                  ),
                },
              })
            )[0],
        ),
      )),
    );

    testCollaborations.push(
      ...(await Promise.all(
        [...Array(2).keys()].map(
          async (i) =>
            (
              await models.Collaboration.findOrCreate({
                where: {
                  thread_id: -1,
                  address_id: -i - 1,
                },
              })
            )[0],
        ),
      )),
    );

    testComments.push(
      ...(await Promise.all(
        [...Array(2).keys()].map(
          async (i) =>
            (
              await models.Comment.findOrCreate({
                where: {
                  id: -i - 1,
                },
                defaults: {
                  address_id: -1,
                  body: '',
                  thread_id: -1,
                  reaction_count: 0,
                  reaction_weights_sum: '0',
                  comment_level: 0,
                  reply_count: 0,
                  search: getCommentSearchVector(''),
                },
              })
            )[0],
        ),
      )),
    );

    testComments.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Comment.findOrCreate({
                where: {
                  id: -i - 1 - 2,
                },
                defaults: {
                  address_id: -2,
                  body: '',
                  thread_id: -2,
                  reaction_count: 0,
                  reaction_weights_sum: '0',
                  comment_level: 0,
                  reply_count: 0,
                  search: getCommentSearchVector(''),
                },
              })
            )[0],
        ),
      )),
    );

    testReactions.push(
      ...(await Promise.all(
        [...Array(2).keys()].map(
          async (i) =>
            (
              await models.Reaction.findOrCreate({
                where: {
                  id: -i - 1,
                  reaction: 'like',
                  address_id: -1,
                  thread_id: -1,
                },
              })
            )[0],
        ),
      )),
    );

    testReactions.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Reaction.findOrCreate({
                where: {
                  id: -i - 1 - 2,
                  reaction: 'like',
                  address_id: -2,
                  comment_id: -2,
                },
              })
            )[0],
        ),
      )),
    );

    return {
      testThreads,
      testComments,
      testUsers,
      testAddresses,
      testChains,
      testCollaborations,
      testReactions,
      testChainNodes,
      testTopics,
    };
  } catch (e) {
    console.error('Error creating E2E test entities:', e);
    throw e;
  }
};

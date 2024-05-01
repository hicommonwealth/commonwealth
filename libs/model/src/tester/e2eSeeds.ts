import { ChainBase, ChainNetwork, ChainType } from '@hicommonwealth/shared';
import type {
  AddressInstance,
  ChainNodeAttributes,
  CollaborationAttributes,
  CommentInstance,
  CommunityInstance,
  DB,
  ProfileAttributes,
  ReactionAttributes,
  ThreadInstance,
  TopicAttributes,
  UserInstance,
} from '../../src';

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
  testProfiles: ProfileAttributes[];
};

export const e2eTestEntities = async function (
  testDb: DB,
): Promise<E2E_TestEntities> {
  const testThreads: ThreadInstance[] = [];
  const testComments: CommentInstance[] = [];
  const testUsers: UserInstance[] = [];
  const testAddresses: AddressInstance[] = [];
  const testChains: CommunityInstance[] = [];
  const testCollaborations: CollaborationAttributes[] = [];
  const testReactions: ReactionAttributes[] = [];
  const testChainNodes: ChainNodeAttributes[] = [];
  const testTopics: TopicAttributes[] = [];
  const testProfiles: ProfileAttributes[] = [];

  try {
    testUsers.push(
      ...(await Promise.all(
        [...Array(4).keys()].map(
          async (i) =>
            (
              await testDb.User.findOrCreate({
                where: {
                  id: -i - 1,
                  email: `test${i - 1}@gmail.com`,
                  emailVerified: true,
                  isAdmin: true,
                },
              })
            )[0],
        ),
      )),
    );

    testProfiles.push(
      ...(await Promise.all(
        [...Array(2).keys()].map(
          async (i) =>
            (
              await testDb.Profile.findOrCreate({
                where: {
                  id: -i - 1,
                  profile_name: `testName${-i - 1}`,
                  avatar_url: `testAvatarUrl${-i - 1}`,
                  email: `test${i - 1}@gmail.com`,
                  user_id: -i - 1,
                },
              })
            )[0],
        ),
      )),
    );

    testChainNodes.push(
      ...(await Promise.all([
        (
          await testDb.ChainNode.findOrCreate({
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
          await testDb.ChainNode.findOrCreate({
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
      ...(await testDb.Community.bulkCreate([
        {
          id: 'cmntest',
          chain_node_id: 9999,
          name: 'cmntest',
          network: ChainNetwork.Ethereum,
          type: ChainType.Offchain,
          base: ChainBase.Ethereum,
          custom_stages: [],
          icon_url:
            'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
          active: true,
          default_symbol: 'cmn',
          custom_domain: 'customdomain.com',
        },
        {
          id: 'cmntest2',
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
        },
      ])),
    );

    testTopics.push(
      ...(await Promise.all([
        (
          await testDb.Topic.findOrCreate({
            where: {
              id: -1,
              name: 'testTopic',
              community_id: 'cmntest',
            },
          })
        )[0],
        (
          await testDb.Topic.findOrCreate({
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
              await testDb.Address.findOrCreate({
                where: {
                  id: -i - 1,
                  user_id: -i - 1,
                  address: addresses[i],
                  community_id: 'cmntest',
                  verification_token: '',
                  profile_id: i < 2 ? -1 : -2,
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
              await testDb.Thread.findOrCreate({
                where: {
                  id: -i - 1,
                  address_id: -1,
                  title: `testThread Title ${-i - 1}`,
                  body: `testThread Body ${-i - 1}`,
                  community_id: 'cmntest',
                  topic_id: -1,
                  kind: 'discussion',
                  plaintext: 'text',
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
              await testDb.Thread.findOrCreate({
                where: {
                  id: -i - 1 - 2,
                  address_id: -2,
                  title: `testThread Title ${-i - 1 - 2}`,
                  body: `testThread Body ${-i - 1 - 2}`,
                  community_id: 'cmntest',
                  topic_id: -2,
                  kind: 'discussion',
                  plaintext: 'text',
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
              await testDb.Collaboration.findOrCreate({
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
              await testDb.Comment.findOrCreate({
                where: {
                  id: -i - 1,
                  community_id: 'cmntest',
                  address_id: -1,
                  text: '',
                  thread_id: -1,
                  plaintext: '',
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
              await testDb.Comment.findOrCreate({
                where: {
                  id: -i - 1 - 2,
                  community_id: 'cmntest',
                  address_id: -2,
                  text: '',
                  thread_id: -2,
                  plaintext: '',
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
              await testDb.Reaction.findOrCreate({
                where: {
                  id: -i - 1,
                  reaction: 'like',
                  address_id: -1,
                  thread_id: -1,
                  community_id: 'cmntest',
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
              await testDb.Reaction.findOrCreate({
                where: {
                  id: -i - 1 - 2,
                  reaction: 'like',
                  address_id: -2,
                  comment_id: -2,
                  community_id: 'cmntest',
                },
              })
            )[0],
        ),
      )),
    );

    const notificationCategories: string[] = [
      'new-thread-creation',
      'new-comment-creation',
      'new-mention',
      'new-reaction',
      'chain-event',
      'new-collaboration',
      'thread-edit',
      'comment-edit',
      'snapshot-proposal',
    ];

    await Promise.all(
      notificationCategories.map(async (name) => {
        await testDb.NotificationCategory.findOrCreate({
          where: {
            name,
            description: '',
          },
        });
      }),
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
      testProfiles,
    };
  } catch (e) {
    console.error('Error creating E2E test entities:', e);
    throw e;
  }
};

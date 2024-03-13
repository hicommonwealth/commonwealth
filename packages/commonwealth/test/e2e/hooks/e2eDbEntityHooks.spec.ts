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
} from '@hicommonwealth/model';
import { ProfileAttributes, models } from '@hicommonwealth/model';
import Sequelize from 'sequelize';
import { testAddress } from '../utils/e2eUtils';

const Op = Sequelize.Op;

export let testThreads: ThreadInstance[];
export let testComments: CommentInstance[];
export let testUsers: UserInstance[];
export let testAddresses: AddressInstance[];
export let testChains: CommunityInstance[];
export let testCollaborations: CollaborationAttributes[];
export let testReactions: ReactionAttributes[];
export let testChainNodes: ChainNodeAttributes[];
export let testTopics: TopicAttributes[];
export let testProfiles: ProfileAttributes[];

export async function clearTestEntities() {
  try {
    const testAddressInfo = await models.Address.findAll({
      where: { address: testAddress },
    });

    const testAddressId: number = testAddressInfo[0]['id'];

    const threadsToDelete = await models.Thread.findAll({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 0 } },
          { address_id: { [Op.lt]: 0 } },
          { address_id: testAddressId },
        ],
      },
    });

    const usersToDelete = await models.User.findAll({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 0 } },
          { selected_community_id: { [Op.in]: ['cmntest', 'cmntest2'] } },
        ],
      },
    });

    const commentsToDelete = await models.Comment.findAll({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 0 } },
          { thread_id: { [Op.in]: threadsToDelete.map((t) => t['id']) } },
          { address_id: { [Op.lt]: 0 } },
          { address_id: testAddressId },
        ],
      },
    });

    const chainsToDelete = await models.Community.findAll({
      where: { chain_node_id: { [Op.lt]: 0 } },
    });

    await models.Topic.destroy({ where: { id: { [Op.lt]: 0 } }, force: true });
    await models.Reaction.destroy({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 0 } },
          { thread_id: { [Op.in]: threadsToDelete.map((t) => t['id']) } },
          { comment_id: { [Op.in]: commentsToDelete.map((t) => t['id']) } },
          { address_id: { [Op.lt]: 0 } },
          { address_id: testAddressId },
        ],
      },
      force: true,
    });
    await models.Collaboration.destroy({
      where: { thread_id: { [Op.lt]: 0 } },
      force: true,
    });
    await models.Comment.destroy({
      where: {
        [Op.or]: [
          { id: { [Op.in]: commentsToDelete.map((c) => c['id']) } },
          { thread_id: { [Op.in]: threadsToDelete.map((t) => t['id']) } },
          { address_id: { [Op.lt]: 0 } },
          { address_id: testAddressId },
        ],
      },
      force: true,
    });
    await models.Thread.destroy({
      where: {
        id: { [Op.in]: threadsToDelete.map((t) => t['id']) },
      },
      force: true,
    });
    await models.Address.destroy({
      where: {
        [Op.or]: [
          { id: { [Op.lt]: 0 } },
          { user_id: { [Op.in]: usersToDelete.map((u) => u['id']) } },
          { community_id: { [Op.in]: ['cmntest', 'cmntest2'] } },
        ],
      },
      force: true,
    });
    await models.Subscription.destroy({
      where: {
        subscriber_id: { [Op.in]: usersToDelete.map((u) => u['id']) },
      },
      force: true,
    });
    await models.User.destroy({
      where: {
        id: { [Op.in]: usersToDelete.map((u) => u['id']) },
      },
      force: true,
    });
    await models.Notification.destroy({
      where: {
        [Op.or]: [
          { thread_id: { [Op.lt]: 0 } },
          { community_id: { [Op.in]: chainsToDelete.map((c) => c['id']) } },
        ],
      },
      force: true,
    });
    await models.Community.destroy({
      where: { id: { [Op.in]: chainsToDelete.map((c) => c['id']) } },
      force: true,
    });
    await models.ChainNode.destroy({
      where: { id: { [Op.lt]: 0 } },
      force: true,
    });
    await models.Profile.destroy({
      where: { id: { [Op.lt]: 0 } },
      force: true,
    });
  } catch (e) {
    console.log(e);
  }
}

export async function createTestEntities() {
  try {
    testUsers = await Promise.all(
      [...Array(4).keys()].map(
        async (i) =>
          (
            await models.User.findOrCreate({
              where: {
                id: -i - 1,
                email: `test${i - 1}@gmail.com`,
                emailVerified: true,
                isAdmin: true,
              },
            })
          )[0],
      ),
    );

    testProfiles = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Profile.findOrCreate({
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
    );

    testChainNodes = [
      (
        await models.ChainNode.findOrCreate({
          where: {
            id: -1,
            eth_chain_id: -1,
            url: 'test1',
            balance_type: 'ethereum',
            name: 'TestName1',
          },
        })
      )[0],
      (
        await models.ChainNode.findOrCreate({
          where: {
            id: -2,
            eth_chain_id: -2,
            url: 'test2',
            balance_type: 'ethereum',
            name: 'TestName2',
          },
        })
      )[0],
    ];

    testChains = [
      (
        await models.Community.findOrCreate({
          where: {
            id: 'cmntest',
            chain_node_id: -1,
            name: 'cmntest',
            network: 'ethereum',
            type: 'offchain',
            base: 'ethereum',
            // collapsed_on_homepage: true,
            custom_stages: [],
            // stages_enabled: true,
            // has_chain_events_listener: false,
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmn',
            custom_domain: 'customdomain.com',
          },
        })
      )[0],
      (
        await models.Community.findOrCreate({
          where: {
            id: 'cmntest2',
            chain_node_id: -2,
            name: 'cmntest2',
            network: 'cmntest',
            type: 'offchain',
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmntest2',
            custom_domain: 'customdomain.com',
          },
        }).catch((e) => console.log(e))
      )[0],
    ];

    testTopics = [
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
    ];

    const addresses = [
      '0x834731c87A7a6f8B57F4aa42c205265EAcbFCCD7',
      '0x7EcA9278094511486506bb34B31087df7C25Db6f',
      '0xd65FA09DE724f0D68EcbF5e0e186d3d59080172C',
      '0x89F40750d76D646c2f822E4Dd6Ea1558A83eDb82',
    ];

    testAddresses = await Promise.all(
      [...Array(4).keys()].map(
        async (i) =>
          (
            await models.Address.findOrCreate({
              where: {
                id: -i - 1,
                user_id: -i - 1,
                address: addresses[i],
                community_id: 'cmntest',
                verification_token: '',
                profile_id: i < 2 ? -1 : -2,
              },
            })
          )[0],
      ),
    );

    testThreads = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Thread.findOrCreate({
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
    );

    testThreads.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Thread.findOrCreate({
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

    testCollaborations = await Promise.all(
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
    );

    testComments = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Comment.findOrCreate({
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
    );

    testComments.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Comment.findOrCreate({
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

    testReactions = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Reaction.findOrCreate({
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
                  community_id: 'cmntest',
                },
              })
            )[0],
        ),
      )),
    );
  } catch (e) {
    console.log(e);
  }
}

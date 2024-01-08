import jwt from 'jsonwebtoken';
import moment from 'moment';
import * as process from 'process';
import Sequelize from 'sequelize';
import models from 'server/database';
import type { AddressInstance } from 'server/models/address';
import type { ChainNodeAttributes } from 'server/models/chain_node';
import type { CollaborationAttributes } from 'server/models/collaboration';
import type { CommentInstance } from 'server/models/comment';
import type { ReactionAttributes } from 'server/models/reaction';
import type { ThreadInstance } from 'server/models/thread';
import type { TopicAttributes } from 'server/models/topic';
import type { UserInstance } from 'server/models/user';
import { JWT_SECRET } from '../../../../server/config';
import type { CommunityInstance } from '../../../../server/models/community';
import type { ProfileAttributes } from '../../../../server/models/profile';

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
export let testJwtToken: string;

export async function clearTestEntities() {
  await models.Topic.destroy({ where: { id: { [Op.lt]: 0 } }, force: true });
  await models.Reaction.destroy({
    where: {
      [Op.or]: [{ id: { [Op.lt]: 0 } }, { address_id: { [Op.lt]: 0 } }],
    },
    force: true,
  });
  await models.Collaboration.destroy({
    where: { thread_id: { [Op.lt]: 0 } },
    force: true,
  });
  await models.Comment.destroy({
    where: { [Op.or]: [{ id: { [Op.lt]: 0 } }, { thread_id: { [Op.lt]: 0 } }] },
    force: true,
  });
  await models.Thread.destroy({ where: { id: { [Op.lt]: 0 } }, force: true });
  await models.Address.destroy({ where: { id: { [Op.lt]: 0 } }, force: true });
  await models.Subscription.destroy({
    where: { subscriber_id: { [Op.lt]: 0 } },
    force: true,
  });
  await models.User.destroy({ where: { id: { [Op.lt]: 0 } }, force: true });
  await models.Notification.destroy({
    where: { thread_id: { [Op.lt]: 0 } },
    force: true,
  });
  await models.Community.destroy({
    where: { chain_node_id: { [Op.lt]: 0 } },
    force: true,
  });
  await models.ChainNode.destroy({
    where: { id: { [Op.lt]: 0 } },
    force: true,
  });
  await models.Profile.destroy({ where: { id: { [Op.lt]: 0 } }, force: true });
}

export async function createTestEntities() {
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
          url: 'test1',
          balance_type: 'cmntest',
          name: 'TestName1',
        },
      })
    )[0],
    (
      await models.ChainNode.findOrCreate({
        where: {
          id: -2,
          url: 'test2',
          balance_type: 'cmntest',
          name: 'TestName2',
        },
      })
    )[0],
  ];

  try {
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
            custom_stages: 'true',
            // stages_enabled: true,
            // has_chain_events_listener: false,
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmn',
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
          },
        }).catch((e) => console.log(e))
      )[0],
    ];
  } catch (e) {
    console.log(e);
  }

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

  testAddresses = await Promise.all(
    [...Array(4).keys()].map(
      async (i) =>
        (
          await models.Address.findOrCreate({
            where: {
              id: -i - 1,
              user_id: -i - 1,
              address: `testAddress${-i - 1}`,
              community_id: 'cmntest',
              verification_token: '',
              profile_id: i < 2 ? -1 : -2,
              verified: moment.now(),
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
              title: '',
              body: '',
              community_id: 'cmntest',
              topic_id: -1,
              kind: 'discussion',
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
                title: '',
                body: '',
                community_id: 'cmntest',
                topic_id: -2,
                kind: 'discussion',
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
              chain: 'cmntest',
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
                chain: 'cmntest',
              },
            })
          )[0],
      ),
    )),
  );

  testJwtToken = jwt.sign(
    { id: testUsers[0].id, email: testUsers[0].email },
    JWT_SECRET,
  );
}

if (process.env.TEST_ENV !== 'playwright') {
  beforeEach(async () => {
    await clearTestEntities();

    await createTestEntities();
  });

  afterEach(async () => {
    await clearTestEntities();
  });
}

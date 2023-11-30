import { expect } from 'chai';
import { ServerTopicsController } from 'server/controllers/server_topics_controller';
import { UserInstance } from 'server/models/user';
import { CommunityInstance } from '../../../server/models/community';

const createMockedTopicsController = (isAdmin: boolean = false) => {
  const db: any = {
    Topic: {
      findOrCreate: async ({ defaults }) => {
        return [
          {
            toJSON: async () => defaults,
          },
        ];
      },
      findOne: async () => {
        return {
          id: 1,
          destroy: async () => {},
          save: async () => {},
          toJSON: () => {},
        };
      },
    },
    CommunityRole: {
      findAll: async () => [
        {
          toJSON: () => ({
            chain_id: 'ethereum',
            name: 'member',
            allow: '0',
            deny: '0',
            RoleAssignments: [{}],
          }),
        },
      ],
    },
    Address: {
      findAll: async () => [{}], // used in findOneRole
    },
    Thread: {
      findAll: async () => [
        {
          update: async () => {},
        },
      ],
      update: async () => {},
    },
    sequelize: {
      transaction: async (callback) => {
        return callback({ transaction: {} });
      },
      query: async (sql) => {
        if (sql.includes(`FROM "Topics"`)) {
          return [{ id: 1 }];
        }
      },
    },
  };
  const tokenBalanceCache: any = {};
  const banCache: any = {};
  const controller = new ServerTopicsController(
    db,
    tokenBalanceCache,
    banCache,
  );
  const user = {
    getAddresses: async () => [],
    isAdmin,
  } as UserInstance;
  const chain = {} as CommunityInstance;
  return { controller, user, chain };
};

describe('ServerTopicsController', () => {
  describe('#createTopic', async () => {
    const { controller, user, chain } = createMockedTopicsController();
    const [topic] = await Promise.all(
      await controller.createTopic({
        user,
        community: chain,
        body: {
          name: 'hhh',
          description: 'ddd',
          featured_in_new_post: false,
          featured_in_sidebar: false,
          token_threshold: '0',
        },
      }),
    );

    expect(topic.name).to.equal('hhh');
    expect(topic.description).to.equal('ddd');
    expect(topic.featured_in_new_post).to.equal(false);
    expect(topic.featured_in_sidebar).to.equal(false);
    expect(topic.token_threshold).to.equal('0');
  });
  describe('#deleteTopic', async () => {
    const { controller, user, chain } = createMockedTopicsController();
    await controller.deleteTopic({
      user,
      community: chain,
      topicId: 1,
    });
  });
  describe('#getTopics', async () => {
    const { controller, chain } = createMockedTopicsController();
    const topics = await controller.getTopics({
      community: chain,
    });
    expect(topics).to.have.length(1);
  });
  describe('#updateTopicChannel', async () => {
    const { controller, user, chain } = createMockedTopicsController(true);
    await controller.updateTopicChannel({
      user,
      community: chain,
      topicId: 1,
      channelId: 'ccc',
    });
  });
  describe('#updateTopic', async () => {
    const { controller, user, chain } = createMockedTopicsController(true);
    await controller.updateTopic({
      user,
      community: chain,
      body: {
        id: 1,
        name: 'ddd',
      },
    });
  });
  describe('#updateTopicsOrder', async () => {
    const { controller, user, chain } = createMockedTopicsController(true);
    await controller.updateTopicsOrder({
      user,
      community: chain,
      body: {
        orderedIds: ['1', '2'],
      },
    });
  });
});

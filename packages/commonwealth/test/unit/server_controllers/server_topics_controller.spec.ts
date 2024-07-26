import { CommunityInstance, UserInstance } from '@hicommonwealth/model';
import { expect } from 'chai';
import { ServerTopicsController } from 'server/controllers/server_topics_controller';
import { describe, test } from 'vitest';

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
      findByPk: async () => {
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
  const banCache: any = {};
  const controller = new ServerTopicsController(db, banCache);
  // @ts-expect-error StrictNullChecks
  const user = {
    getAddresses: async () => [],
    isAdmin,
  } as UserInstance;
  const chain = {} as CommunityInstance;
  return { controller, user, chain };
};

describe('ServerTopicsController', () => {
  test('#createTopic', async () => {
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
        },
      }),
    );

    expect(topic.name).to.equal('hhh');
    expect(topic.description).to.equal('ddd');
    expect(topic.featured_in_new_post).to.equal(false);
    expect(topic.featured_in_sidebar).to.equal(false);
  });

  test('#deleteTopic', async () => {
    const { controller, user } = createMockedTopicsController();
    await controller.deleteTopic({
      user,
      topicId: 1,
    });
  });

  test('#getTopics', async () => {
    const { controller, chain } = createMockedTopicsController();
    const topics = await controller.getTopics({
      community: chain,
      with_contest_managers: false,
    });
    expect(topics).to.have.length(1);
  });

  test('#updateTopicChannel', async () => {
    const { controller, user } = createMockedTopicsController(true);
    await controller.updateTopicChannel({
      user,
      topicId: 1,
      channelId: 'ccc',
    });
  });

  test('#updateTopic', async () => {
    const { controller, user } = createMockedTopicsController(true);
    await controller.updateTopic({
      user,
      body: {
        id: 1,
        name: 'ddd',
      },
    });
  });

  test('#updateTopicsOrder', async () => {
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

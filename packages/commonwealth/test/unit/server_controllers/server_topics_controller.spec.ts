import { CommunityInstance, UserInstance } from '@hicommonwealth/model';
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
    CommunityStake: {
      findOne: async () => {},
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
  const controller = new ServerTopicsController(db);
  // @ts-expect-error StrictNullChecks
  const user = {
    getAddresses: async () => [],
    isAdmin,
  } as UserInstance;
  const chain = {} as CommunityInstance;
  return { controller, user, chain };
};

describe('ServerTopicsController', () => {
  test('#updateTopicChannel', async () => {
    const { controller, user } = createMockedTopicsController(true);
    await controller.updateTopicChannel({
      user,
      topicId: 1,
      channelId: 'ccc',
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

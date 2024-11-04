import { Actor, command, dispose } from '@hicommonwealth/core';
import { Chance } from 'chance';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateQuest, GetQuest } from '../../src/quest';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

describe('Quest lifecycle', () => {
  let admin: Actor;
  let community_id: string;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    admin = actors.admin;
    community_id = community!.id;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('create', () => {
    it('should create a quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          community_id,
          name: 'test quest',
          description: 'test description',
          start_date: new Date(),
          end_date: new Date(),
        },
      });
      expect(quest?.name).toBe('test quest');
    });

    it('should not create a quest with the same name', async () => {
      await expect(
        command(CreateQuest(), {
          actor: admin,
          payload: {
            community_id,
            name: 'test quest',
            description: 'test description',
            start_date: new Date(),
            end_date: new Date(),
          },
        }),
      ).rejects.toThrowError(
        `Quest named "test quest" in community "${community_id}"`,
      );
    });
  });

  describe('query', () => {
    it('should get a quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          community_id,
          name: chance.name(),
          description: chance.sentence(),
          start_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24),
          end_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 2),
        },
      });
      const retrieved = await command(GetQuest(), {
        actor: admin,
        payload: {
          community_id,
          quest_id: quest!.id!,
        },
      });
      expect(retrieved).toMatchObject(quest!);
    });
  });
});

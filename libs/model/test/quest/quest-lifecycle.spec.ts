import { Actor, command, dispose } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateQuest } from '../../src/quest';
import { seedCommunity } from '../utils/community-seeder';

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
});

import { Actor, command, dispose } from '@hicommonwealth/core';
import {
  QuestActionMeta,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { Chance } from 'chance';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CreateQuest, GetQuest, UpdateQuest } from '../../src/quest';
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

  describe('update', () => {
    it('should update a quest', async () => {
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
      const action_metas: Omit<z.infer<typeof QuestActionMeta>, 'quest_id'>[] =
        [
          {
            event_name: 'CommentCreated',
            reward_amount: 100,
            participation_limit: QuestParticipationLimit.OncePerPeriod,
            participation_period: QuestParticipationPeriod.Daily,
            participation_times_per_period: 3,
            creator_reward_weight: 0,
          },
          {
            event_name: 'CommentUpvoted',
            reward_amount: 200,
            participation_limit: QuestParticipationLimit.OncePerPeriod,
            participation_period: QuestParticipationPeriod.Monthly,
            participation_times_per_period: 3,
            creator_reward_weight: 0.1,
          },
        ];
      const patch = {
        description: 'updated description',
        end_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 8),
      };
      const updated = await command(UpdateQuest(), {
        actor: admin,
        payload: {
          community_id,
          quest_id: quest!.id!,
          action_metas,
          ...patch,
        },
      });
      expect(updated).toMatchObject({
        ...quest,
        ...patch,
        updated_at: updated?.updated_at,
      });
      expect(updated?.action_metas?.length).toBe(action_metas.length);
      updated?.action_metas?.forEach((meta, index) =>
        expect(meta).toMatchObject(action_metas[index]),
      );
    });

    it('should not update a quest with the same name', async () => {
      const name = chance.name() + Math.random();
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          community_id,
          name,
          description: 'test description',
          start_date: new Date(),
          end_date: new Date(),
        },
      });
      await expect(
        command(UpdateQuest(), {
          actor: admin,
          payload: {
            community_id,
            quest_id: quest!.id!,
            name,
            description: 'updated description',
          },
        }),
      ).rejects.toThrowError(
        `Quest named "${name}" in community "${community_id}"`,
      );
    });

    it('should not update a quest that has ended', async () => {
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          community_id,
          name: chance.name() + Math.random(),
          description: 'test description',
          start_date: new Date(),
          end_date: new Date(),
        },
      });
      await expect(
        command(UpdateQuest(), {
          actor: admin,
          payload: {
            community_id,
            quest_id: quest!.id!,
          },
        }),
      ).rejects.toThrowError(
        `Cannot update quest "${quest!.name}" because it has already ended`,
      );
    });

    it('should not update a quest that has started', async () => {
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          community_id,
          name: chance.name() + Math.random(),
          description: 'test description',
          start_date: new Date(),
          end_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24),
        },
      });
      await expect(
        command(UpdateQuest(), {
          actor: admin,
          payload: {
            community_id,
            quest_id: quest!.id!,
          },
        }),
      ).rejects.toThrowError(
        `Cannot update quest "${quest!.name}" because it has already started`,
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

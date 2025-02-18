import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import {
  QuestActionMeta,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { Chance } from 'chance';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  CancelQuest,
  CreateQuest,
  DeleteQuest,
  GetQuest,
  GetQuests,
  UpdateQuest,
} from '../../src/quest';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

describe('Quest lifecycle', () => {
  let superadmin: Actor;
  let community_id: string;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['superadmin'],
    });
    superadmin = actors.superadmin;
    community_id = community!.id;
  });

  afterAll(async () => {
    await dispose()();
  });

  const start_date = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 3);
  const end_date = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 6);

  describe('create', () => {
    it('should create a quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          community_id,
          name: 'test quest',
          description: 'test description',
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      expect(quest?.name).toBe('test quest');
    });

    it('should create a global quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'test quest global',
          description: 'test description',
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      expect(quest?.name).toBe('test quest global');
    });

    it('should not create a quest with the same name', async () => {
      await expect(
        command(CreateQuest(), {
          actor: superadmin,
          payload: {
            community_id,
            name: 'test quest',
            description: 'test description',
            image_url: chance.url(),
            start_date: new Date(
              new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
            ),
            end_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 5),
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
        actor: superadmin,
        payload: {
          community_id,
          name: chance.name(),
          description: chance.sentence(),
          image_url: chance.url(),
          start_date,
          end_date,
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
        actor: superadmin,
        payload: {
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
        actor: superadmin,
        payload: {
          community_id,
          name,
          description: 'test description',
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      await expect(
        command(UpdateQuest(), {
          actor: superadmin,
          payload: {
            quest_id: quest!.id!,
            name,
            description: 'updated description',
          },
        }),
      ).rejects.toThrowError(
        `Quest named "${name}" in community "${community_id}"`,
      );
    });

    it('should not update a quest that has started', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          community_id,
          name: chance.name() + Math.random(),
          description: 'test description',
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      // hack to update the start_date
      const now = new Date();
      await models.Quest.update(
        { start_date: now },
        {
          where: { community_id, id: quest!.id! },
        },
      );
      await expect(
        command(UpdateQuest(), {
          actor: superadmin,
          payload: {
            quest_id: quest!.id!,
          },
        }),
      ).rejects.toThrowError(
        `Start date ${moment(now).format('YYYY-MM-DD')} already passed`,
      );
    });
  });

  describe('query', () => {
    it('should get a quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          community_id,
          name: chance.name(),
          description: chance.sentence(),
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      const retrieved = await query(GetQuest(), {
        actor: superadmin,
        payload: { quest_id: quest!.id! },
      });
      expect(retrieved).toMatchObject(quest!);
    });

    it('should return multiple quests with action metas', async () => {
      // add some quests to the community
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
      const quests = await Promise.all(
        [...Array(3)].map(() =>
          command(CreateQuest(), {
            actor: superadmin,
            payload: {
              community_id,
              name: chance.name() + Math.random(),
              description: chance.sentence(),
              image_url: chance.url(),
              start_date,
              end_date,
            },
          }),
        ),
      );
      await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quests[0]!.id!,
          action_metas,
        },
      });
      const retrieved = await query(GetQuests(), {
        actor: superadmin,
        payload: { community_id, cursor: 1, limit: 10 },
      });
      expect(retrieved?.results?.length).toBe(8);
      quests
        .at(-1)
        ?.action_metas?.forEach((meta, index) =>
          expect(meta).toMatchObject(action_metas[index]),
        );
    });
  });

  describe('delete', () => {
    it('should delete a quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          community_id,
          name: chance.name() + Math.random(),
          description: chance.sentence(),
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      const deleted = await command(DeleteQuest(), {
        actor: superadmin,
        payload: { quest_id: quest!.id! },
      });
      expect(deleted).toBe(true);

      const found = await query(GetQuest(), {
        actor: superadmin,
        payload: { quest_id: quest!.id! },
      });
      expect(found).toBeUndefined();
    });

    it('should not delete a quest that has started', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          community_id,
          name: chance.name(),
          description: chance.sentence(),
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      // hack to update the start_date
      const now = new Date();
      await models.Quest.update(
        { start_date: now },
        { where: { id: quest!.id! } },
      );
      await expect(
        command(DeleteQuest(), {
          actor: superadmin,
          payload: { quest_id: quest!.id! },
        }),
      ).rejects.toThrowError(
        `Start date ${moment(now).format('YYYY-MM-DD')} already passed`,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a quest', async () => {
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          community_id,
          name: chance.name() + Math.random(),
          description: chance.sentence(),
          image_url: chance.url(),
          start_date,
          end_date,
        },
      });
      const cancelled = await command(CancelQuest(), {
        actor: superadmin,
        payload: { quest_id: quest!.id! },
      });
      expect(cancelled).toBe(true);

      const found = await query(GetQuest(), {
        actor: superadmin,
        payload: { quest_id: quest!.id! },
      });
      expect(new Date(found!.end_date).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });
  });
});

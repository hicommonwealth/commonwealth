import { Actor, command, dispose, query } from '@hicommonwealth/core';
import {
  QuestActionMeta,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { Chance } from 'chance';
import dayjs from 'dayjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import {
  CancelQuest,
  CreateQuest,
  DeleteQuest,
  GetQuest,
  GetQuests,
  UpdateQuest,
} from '../../src/aggregates/quest';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

async function createQuest(
  community_id: string,
  actor: Actor,
  start_date: Date,
  end_date: Date,
  name = chance.name() + Math.random(),
  max_xp_to_end = 100,
) {
  const quest = await command(CreateQuest(), {
    actor,
    payload: {
      community_id,
      name,
      description: chance.sentence(),
      image_url: chance.url(),
      start_date,
      end_date,
      max_xp_to_end,
      quest_type: 'common',
    },
  });
  return quest;
}

describe('Quest lifecycle', () => {
  let superadmin: Actor;
  let community_id: string;
  let thread_id: number;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['superadmin'],
    });
    superadmin = actors.superadmin;
    community_id = community!.id;

    // to vote on comments
    const [thread] = await seed('Thread', {
      community_id,
      address_id: community!.Addresses!.at(0)!.id!,
      topic_id: community!.topics!.at(0)!.id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });
    thread_id = thread!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  const start_date = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 3);
  const end_date = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 6);

  describe('create', () => {
    it('should create a quest', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
        'test quest',
      );
      expect(quest?.name).toBe('test quest');
    });

    it('should create a global quest', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
        'test quest global',
      );
      expect(quest?.name).toBe('test quest global');
    });

    it('should not create a quest with the same name', async () => {
      await expect(
        createQuest(
          community_id,
          superadmin,
          start_date,
          end_date,
          'test quest',
        ),
      ).rejects.toThrowError(
        `Quest named "test quest" in community "${community_id}"`,
      );
    });
  });

  describe('update', () => {
    it('should update a quest', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
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
            content_id: `thread:${thread_id}`,
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
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
        name,
      );
      await expect(
        command(UpdateQuest(), {
          actor: superadmin,
          payload: {
            quest_id: quest!.id!,
            community_id,
            name,
            description: 'updated description',
          },
        }),
      ).rejects.toThrowError(
        `Quest named "${name}" in community "${community_id}"`,
      );
    });

    it('should not update a quest that has started', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
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
        `Start date ${dayjs(now).format('YYYY-MM-DD')} already passed`,
      );
    });

    it('should not update a quest with invalid content_id', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );

      await expect(
        command(UpdateQuest(), {
          actor: superadmin,
          payload: {
            quest_id: quest!.id!,
            action_metas: [
              {
                event_name: 'CommentUpvoted',
                reward_amount: 200,
                participation_limit: QuestParticipationLimit.OncePerPeriod,
                participation_period: QuestParticipationPeriod.Monthly,
                participation_times_per_period: 3,
                creator_reward_weight: 0.1,
                content_id: 'thread:12345678',
              },
            ],
          },
        }),
      ).rejects.toThrowError(`Thread with id "12345678" must exist`);
    });
  });

  describe('query', () => {
    it('should get a quest', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
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
            content_id: `thread:${thread_id}`,
          },
        ];
      const quests = await Promise.all(
        [...Array(3)].map(() =>
          createQuest(community_id, superadmin, start_date, end_date),
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
      expect(retrieved?.results?.length).toBe(10);
      quests
        .at(-1)
        ?.action_metas?.forEach((meta, index) =>
          expect(meta).toMatchObject(action_metas[index]),
        );
    });
  });

  describe('delete', () => {
    it('should delete a quest', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
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

    it('should be able to delete after started but with no actions', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
      // hack to update the start_date
      const now = new Date();
      await models.Quest.update(
        { start_date: now },
        { where: { id: quest!.id! } },
      );
      const deleted = await command(DeleteQuest(), {
        actor: superadmin,
        payload: { quest_id: quest!.id! },
      });
      expect(deleted).toBe(true);
    });

    it('should not delete a quest with actions', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
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
        ];
      const updated = await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest!.id!,
          action_metas,
        },
      });

      // hack to update the start_date
      const now = new Date();
      await models.Quest.update(
        { start_date: now },
        { where: { id: quest!.id! } },
      );

      // insert actions
      await models.XpLog.create({
        user_id: superadmin.user.id!,
        event_created_at: new Date(),
        xp_points: 100,
        action_meta_id: updated!.action_metas!.at(0)!.id!,
        created_at: new Date(),
      });

      await expect(
        command(DeleteQuest(), {
          actor: superadmin,
          payload: { quest_id: quest!.id! },
        }),
      ).rejects.toThrowError(
        `Cannot delete quest "${quest!.id}" because it has actions`,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a quest', async () => {
      const quest = await createQuest(
        community_id,
        superadmin,
        start_date,
        end_date,
      );
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

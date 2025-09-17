import { Transaction } from 'sequelize';
import { models } from '../database';

export async function createQuestMaterializedView(
  quest_id: number,
  transaction: Transaction,
) {
  await models.sequelize.query(
    `
    SELECT create_quest_xp_leaderboard(:quest_id, 3);
  `,
    {
      transaction,
      replacements: {
        quest_id,
      },
    },
  );
}

export function getQuestXpLeaderboardViewName(quest_id: number) {
  return `quest_${quest_id}_xp_leaderboard`;
}

'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE "ValidXpPerUser" AS
      WITH quest_xp_logs AS (
          SELECT
              l.id AS xp_log_id,
              l.event_created_at,
              l.created_at,
              q.id AS quest_id,
              q.max_xp_to_end,
              (l.xp_points + COALESCE(l.creator_xp_points, 0) + COALESCE(l.referrer_xp_points, 0)) AS log_total_xp,
              SUM(l.xp_points + COALESCE(l.creator_xp_points, 0) + COALESCE(l.referrer_xp_points, 0))
              OVER (
                  PARTITION BY q.id
                  ORDER BY l.event_created_at, l.created_at, l.id
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                  ) AS cumulative_xp,
              SUM(l.xp_points + COALESCE(l.creator_xp_points, 0) + COALESCE(l.referrer_xp_points, 0))
              OVER (
                  PARTITION BY q.id
                  ORDER BY l.event_created_at, l.created_at, l.id
                  ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                  ) AS cumulative_xp_before
          FROM
              "XpLogs" l
                  JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                  JOIN "Quests" q ON m.quest_id = q.id
          WHERE
              q.max_xp_to_end > 0
            AND q.id BETWEEN 1 AND 179
      ),
           valid_logs AS (
               SELECT
                   l.id,
                   l.user_id,
                   l.creator_user_id,
                   l.referrer_user_id,
                   l.xp_points,
                   l.creator_xp_points,
                   l.referrer_xp_points
               FROM
                   "XpLogs" l
                       JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                       JOIN "Quests" q ON m.quest_id = q.id
                       LEFT JOIN quest_xp_logs exceeded ON exceeded.quest_id = q.id
                       AND exceeded.cumulative_xp > exceeded.max_xp_to_end
                       AND COALESCE(exceeded.cumulative_xp_before, 0) <= exceeded.max_xp_to_end
               WHERE
                   q.id BETWEEN 1 AND 179
                 AND (
                   exceeded.quest_id IS NULL
                       OR l.event_created_at < exceeded.event_created_at
                   )
      
               -- UNION DISTINCT technically not needed here since quests 1-179 would not include XpAwarded events
               -- UNION DISTINCT performs significantly worse
               UNION
      
               -- Include all XpAwarded logs (from quest -100 and any other quests with this event)
               SELECT
                   l.id,
                   l.user_id,
                   l.creator_user_id,
                   l.referrer_user_id,
                   l.xp_points,
                   l.creator_xp_points,
                   l.referrer_xp_points
               FROM
                   "XpLogs" l
                       JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
               WHERE
                   m.event_name = 'XpAwarded'
           ),
           user_xp AS (
               -- XP for main users
               SELECT user_id, SUM(xp_points) AS total_xp
               FROM valid_logs
               GROUP BY user_id
      
               UNION ALL
      
               -- XP for creators
               SELECT creator_user_id AS user_id, SUM(creator_xp_points) AS total_xp
               FROM valid_logs
               WHERE creator_user_id IS NOT NULL AND creator_xp_points IS NOT NULL
               GROUP BY creator_user_id
      
               UNION ALL
      
               -- XP for referrers
               SELECT referrer_user_id AS user_id, SUM(referrer_xp_points) AS total_xp
               FROM valid_logs
               WHERE referrer_user_id IS NOT NULL AND referrer_xp_points IS NOT NULL
               GROUP BY referrer_user_id
           ), allocations AS (
          SELECT
              UX.user_id,
              U.tier,
              SUM(UX.total_xp) AS total_xp,
              NULL::DOUBLE PRECISION AS percent_allocation,
              NULL::DOUBLE PRECISION AS token_allocation
          FROM
              user_xp UX
                  JOIN "Users" U ON U.id = UX.user_id
          GROUP BY
              UX.user_id, U.tier
      ) SELECT *
      FROM allocations
      WHERE tier > 1 AND total_xp > 0;
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};

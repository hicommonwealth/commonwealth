'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
                    WITH updated_webhooks
                             AS (SELECT id,
                                        array_agg(
                                        CASE
                                            WHEN category = 'new-thread-creation' THEN 'ThreadCreated'
                                            WHEN category = 'new-comment-creation' THEN 'CommentCreated'
                                            WHEN category = 'chain-event' THEN 'ChainEventCreated'
                                            -- Remove new-reaction
                                            ELSE NULL
                                            END
                                                 ) FILTER (WHERE category IS NOT NULL) AS event
                                 FROM "Webhooks",
                                      unnest(categories) AS category
                                 GROUP BY id)
                    UPDATE "Webhooks" W
                    SET categories = updated_webhooks.event
                    FROM updated_webhooks
                    WHERE W.id = updated_webhooks.id;
                `,
        { transaction },
      );
      await queryInterface.renameColumn('Webhooks', 'categories', 'events', {
        transaction,
      });
      await queryInterface.addColumn(
        'Webhooks',
        'destination',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
                UPDATE "Webhooks"
                SET destination = CASE
                                      WHEN url LIKE 'https://discord.com/api/webhooks/%' THEN 'discord'
                                      WHEN url LIKE 'https://discordapp.com/api/webhooks/%' THEN 'discord'
                                      WHEN url LIKE 'https://hooks.slack.com/%' THEN 'slack'
                                      WHEN url LIKE 'https://hooks.zapier.com/%' THEN 'zapier'
                                      WHEN url LIKE 'https://api.telegram.org/%' THEN 'telegram'
                                      ELSE 'unknown'
                    END;
            `,
        { transaction },
      );
      await queryInterface.changeColumn(
        'Webhooks',
        'destination',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Webhooks',
        {
          destination: 'unknown',
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Webhooks', 'events', 'categories', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
                    WITH updated_webhooks
                             AS (SELECT id,
                                        array_agg(
                                        CASE
                                            WHEN category = 'ThreadCreated' THEN 'new-thread-creation'
                                            WHEN category = 'CommentCreated' THEN 'new-comment-creation'
                                            WHEN category = 'ChainEventCreated' THEN 'chain-event'
                                            -- new-reaction is lost
                                            ELSE NULL
                                            END
                                                 ) FILTER (WHERE category IS NOT NULL) AS event
                                 FROM "Webhooks",
                                      unnest(categories) AS category
                                 GROUP BY id)
                    UPDATE "Webhooks" W
                    SET categories = updated_webhooks.event
                    FROM updated_webhooks
                    WHERE W.id = updated_webhooks.id;
                `,
        { transaction },
      );
      await queryInterface.removeColumn('Webhooks', 'destination', {
        transaction,
      });
    });
  },
};

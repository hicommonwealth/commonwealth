'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'temp_stages_enabled',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_stages_enabled = CASE
            WHEN stages_enabled = 'true' THEN TRUE
            ELSE FALSE
        END;
      `,
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('Communities', 'stages_enabled', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Communities',
        'temp_stages_enabled',
        'stages_enabled',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Communities"
        ADD COLUMN temp_custom_stages TEXT[] DEFAULT '{}';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"In Discussion","In Voting","Voting Ended"}'
        WHERE id = 'shell-protocol' AND custom_stages = '["In Discussion","In Voting","Voting Ended"}';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"In Discussion", "Passed"}'
        WHERE id = 'aavegotchi' AND custom_stages = '[In Discussion, Passed]';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"In Discussion", "Passed"}'
        WHERE id = 'cerberus-zone' AND custom_stages = '["In Discussion, Passed"]';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"Temperature Check", "Discussion", "Voting", "Passed", "Failed"}'
        WHERE id = 'dao-masons' AND custom_stages = '["Temperature Check" "Discussion" "Voting" "Passed" "Failed"]';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"Stage 1", "Stage 2", "Stage 3"}'
        WHERE id = 'my-first-community' AND custom_stages = '"Stage 1", "Stage 2", "Stage 3"';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"In Discussion", "Voting", "Ended"}'
        WHERE id = 'talis' AND custom_stages = '"In Discussion","Voting","Ended"';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"chat", "Stage 2", "Stage 3"}'
        WHERE id = 'artrate' AND custom_stages = '["chat", "Stage 2", "Stage 3",…]';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = '{"Stage 1", "Stage 2", "Final Stage"}'
        WHERE id = 'matic-token' AND custom_stages = '[ "Stage 1", "Stage 2", "Final Stage" ]';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET temp_custom_stages = CASE
                                     WHEN custom_stages IS NULL OR custom_stages = '' OR custom_stages IN ('true', 'false')
                                         THEN '{}'
                                     ELSE (
                                         SELECT ARRAY(
                                                        SELECT json_array_elements_text(custom_stages::json)
                                                )
                                     )
            END
        WHERE temp_custom_stages IS NULL;
      `,
        { transaction },
      );

      await queryInterface.removeColumn('Communities', 'custom_stages', {
        transaction,
      });
      await queryInterface.renameColumn(
        'Communities',
        'temp_custom_stages',
        'custom_stages',
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible
  },
};

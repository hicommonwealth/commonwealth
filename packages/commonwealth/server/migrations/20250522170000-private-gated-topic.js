'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // add is_private column to GroupGatedActions
      await queryInterface.addColumn('GroupGatedActions', 'is_private', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        transaction,
      });

      // add GatedThreads view to join gated actions
      await queryInterface.sequelize.query(
        `
CREATE OR REPLACE VIEW "GatedThreads" AS
SELECT
	t.*,
	g.address_id as gated_address_id
FROM
	"Threads" t
	LEFT JOIN (
		SELECT DISTINCT ga.topic_id, m.address_id 
		FROM
			"GroupGatedActions" ga
			JOIN "Memberships" m ON ga.group_id = m.group_id
		WHERE
			ga.is_private = TRUE
      AND m.reject_reason IS NULL
  ) g ON t.topic_id = g.topic_id;
    `,
        { transaction },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('GroupGatedActions', 'is_private');
      await queryInterface.sequelize.query(`DROP VIEW "GatedThreads";`, {
        transaction,
      });
    });
  },
};

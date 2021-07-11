'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      queryInterface.addColumn(
        'Chains',
        'has_chain_events_listener',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        { transaction }
      );

      // sets has_chain_events_listener to true for all existing chains
      // TODO: should all current chains default to true?
      await queryInterface.sequelize.query(
        `UPDATE "Chains" SET "has_chain_events_listener" = true`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chains', 'has_chain_events_listener');
  }
};

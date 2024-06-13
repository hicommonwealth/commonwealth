'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('ChainNodes', 'max_ce_block_range', {
        type: Sequelize.INTEGER,
        allowNull: true,
        transaction,
      });
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          max_ce_block_range: -1,
        },
        {
          url: {
            [Sequelize.Op.like]: '%alchemy%',
          },
        },
        { transaction },
      );

      // constraint ensure infinite block range for Alchemy supported chains and no other
      await queryInterface.sequelize.query(
        `
            ALTER TABLE "ChainNodes"
                ADD CONSTRAINT check_block_range_for_alchemy_nodes
                    CHECK (
                        (url LIKE '%alchemy%' AND max_ce_block_range = -1) OR
                        (url NOT LIKE '%alchemy%' AND max_ce_block_range > -1)
                        );
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'ChainNodes',
        'check_block_range_for_alchemy_nodes',
        { transaction },
      );
      await queryInterface.removeColumn('ChainNodes', 'max_ce_block_range', {
        transaction,
      });
    });
  },
};

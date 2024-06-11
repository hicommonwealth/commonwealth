'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Chains',
        'category',
        {
          type: Sequelize.JSONB,
        },
        { transaction }
      );

      // Update the "category_names" column with the concatenated category names for each chain
      const query = `
        UPDATE "Chains" c
        SET category = (
          SELECT JSONB_AGG(cc.category_name) as category
          FROM "ChainCategories" cct
          INNER JOIN "ChainCategoryTypes" cc ON cct.category_type_id = cc.id
          WHERE c.id = cct.chain_id
          GROUP BY cct.chain_id
        )
      `;

      await queryInterface.sequelize.query(query, { transaction });

      await queryInterface.dropTable('ChainCategories', { transaction });
      await queryInterface.dropTable('ChainCategoryTypes', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ChainCategoryTypes',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          category_name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
        },
        { transaction }
      );

      await queryInterface.createTable(
        'ChainCategories',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'Chains',
              key: 'id',
            },
          },
          category_type_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'ChainCategoryTypes',
              key: 'id',
            },
          },
        },
        { transaction }
      );

      await queryInterface.removeColumn('Chains', 'category', {
        transaction,
      });
    });
  },
};

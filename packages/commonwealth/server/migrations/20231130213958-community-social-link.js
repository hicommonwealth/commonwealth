'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'social_links',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: false,
          defaultValue: [],
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Communities',
        'namespace',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      // Update existing records to merge discord, website, telegram, and github into social_links
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET "social_links" = array_remove(ARRAY[
            NULLIF(discord, ''),
            NULLIF(website, ''),
            NULLIF(telegram, ''),
            NULLIF(github, ''),
            NULLIF(element, '')
          ], NULL)
      `,
        { transaction },
      );

      await queryInterface.removeColumn('Communities', 'discord', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'element', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'website', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'telegram', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'github', {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'discord',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Communities',
        'website',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Communities',
        'telegram',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Communities',
        'github',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Communities',
        'element',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeColumn('Communities', 'social_links', {
        transaction,
      });

      await queryInterface.removeColumn('Communities', 'namespace', {
        transaction,
      });
    });
  },
};

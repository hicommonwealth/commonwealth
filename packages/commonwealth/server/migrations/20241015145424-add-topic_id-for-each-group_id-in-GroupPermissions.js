'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeConstraint(
        'GroupPermissions',
        'GroupPermissions_pkey',
        { transaction: t },
      );

      await queryInterface.removeConstraint(
        'GroupPermissions',
        'GroupPermissions_group_id_fkey',
        { transaction: t },
      );

      await queryInterface.addColumn(
        'GroupPermissions',
        'topic_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'Topics', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        { transaction: t },
      );

      await queryInterface.changeColumn(
        'GroupPermissions',
        'group_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'Groups', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        { transaction: t },
      );

      await queryInterface.addConstraint('GroupPermissions', {
        type: 'primary key',
        fields: ['group_id', 'topic_id'],
        name: 'GroupPermissions_pkey',
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('GroupPermissions', 'topic_id', {
        transaction: t,
      });
      await queryInterface.changeColumn(
        'GroupPermissions',
        'group_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          primaryKey: true,
          references: { model: 'Groups', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        { transaction: t },
      );
    });
  },
};

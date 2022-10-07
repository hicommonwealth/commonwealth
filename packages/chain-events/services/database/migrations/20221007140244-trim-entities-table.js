'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.removeColumn('ChainEntities', 'thread_id', {transaction: t});
            await queryInterface.removeColumn('ChainEntities', 'title', {transaction: t});
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.addColumn('ChainEntities', 'thread_id',
                {type: Sequelize.INT, allowNull: true},
                {transaction: t}
            );
            await queryInterface.addColumn('ChainEntities', 'title',
                {type: Sequelize.STRING, allowNull: true},
                {transaction: t}
            );
        });
    }
};

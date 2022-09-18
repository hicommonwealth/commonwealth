'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.addColumn('ChainEventTypes', 'queued',
                {type: Sequelize.SMALLINT}, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEventTypes"
                SET queued = -1;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEventTypes"
                    ALTER COLUMN queued SET DEFAULT 0;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEventTypes"
                    ALTER COLUMN queued SET NOT NULL;
            `, {transaction: t});

            await queryInterface.addColumn('ChainEntities', 'queued',
                {type: Sequelize.SMALLINT}, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntities"
                SET queued = -1;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntities"
                    ALTER COLUMN queued SET DEFAULT 0;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntities"
                    ALTER COLUMN queued SET NOT NULL;
            `, {transaction: t});

            await queryInterface.addColumn('ChainEvents', 'queued',
                {type: Sequelize.SMALLINT}, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEvents"
                SET queued = -1;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEvents"
                    ALTER COLUMN queued SET DEFAULT 0;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEvents"
                    ALTER COLUMN queued SET NOT NULL;
            `, {transaction: t});
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.transaction(async (t) => {
            await queryInterface.removeColumn('ChainEventTypes', 'queued',
                {transaction: t});
            await queryInterface.removeColumn('ChainEntities', 'queued',
                {transaction: t});
            await queryInterface.removeColumn('ChainEvents', 'queued',
                {transaction: t});
        });
    }
};

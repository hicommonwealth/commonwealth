'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            // copy the required columns to a new table
            await queryInterface.sequelize.query(`
                CREATE table "ChainEntityMeta" as (SELECT id, title, chain, author, thread_id
                                                   from "ChainEntities");
            `, {transaction: t});

            // copy the id column to ce_id and add NOT NULL and UNIQUE constraints
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntityMeta"
                    ADD COLUMN ce_id INTEGER UNIQUE;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntityMeta"
                SET ce_id = id;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntityMeta"
                    ALTER COLUMN ce_id SET NOT NULL;
            `, {transaction: t});

            // set id column as an auto-increment primary key
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntityMeta"
                    ADD PRIMARY KEY (id);
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                CREATE SEQUENCE ChainEntityMeta_id_seq OWNED BY "ChainEntityMeta".id;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntityMeta"
                    ALTER id SET DEFAULT nextval('ChainEntityMeta_id_seq'::regclass);
            `, {transaction: t});

            // set the appropriate foreign keys
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntityMeta"
                    ADD CONSTRAINT "ChainEntityMeta_thread_id_fkey"
                        FOREIGN KEY (thread_id) REFERENCES "Threads";
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEntityMeta"
                    ADD CONSTRAINT "ChainEntityMeta_chain_fkey"
                        FOREIGN KEY (chain) REFERENCES "Chains";
            `, {transaction: t});

            await queryInterface.dropTable('ChainEntity', {transaction: t});

            // drop chain-events table
            await queryInterface.removeConstraint(
                'Notifications',
                'Notifications_chain_event_id_fkey1',
                {transaction: t});
            await queryInterface.dropTable('ChainEvents', {transaction: t});

            // format ChainEventTypes (leave only the id primary key)
            await queryInterface.sequelize.query(`
                ALTER TABLE "ChainEventTypes"
                    DROP COLUMN chain,
                    DROP COLUMN event_name,
                    DROP COLUMN event_network
            `, {transaction: t});

            // make the ChainNodes url unique
            await queryInterface.addConstraint('ChainNodes', {
                name: 'ChainNodes_unique_url',
                fields: ['url'],
                type: 'unique',
                transaction: t
            });

            // format Chains table
            await queryInterface.removeColumn('Chains',
                'ce_verbose',
                {transaction: t}
            );
            await queryInterface.removeColumn(
                'Chains',
                'has_chain_events_listener',
                {transaction: t}
            );
            await queryInterface.addColumn(
                'Chains',
                'queued',
                {type: Sequelize.SMALLINT},
                {transaction: t}
            );
            await queryInterface.sequelize.query(`
                UPDATE "Chains"
                SET queued = -1;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "Chains"
                    ALTER COLUMN queued SET DEFAULT 0;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                ALTER TABLE "Chains"
                    ALTER COLUMN queued SET NOT NULL;
            `, {transaction: t});

            // make chain_event_id unique in notifications table
            await queryInterface.addConstraint('Notifications', {
                name: 'Notifications_unique_chain_event_id',
                fields: ['chain_event_id'],
                type: 'unique',
                transaction: t
            });
        });
    },

    down: async (queryInterface, Sequelize) => {
        // IRREVERSIBLE
    }
};

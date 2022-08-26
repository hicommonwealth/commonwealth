'use strict';

module.exports = {
    // WARNING: irreversible migration
    // WARNING: Migration assumes that `ts-node /server/scripts/getEntitiesWithEvents.ts` was already executed successfully
    up: async (queryInterface, Sequelize) => {
        const [temp, metadata] = (await queryInterface.sequelize.query(`
            SELECT EXISTS(
                           SELECT
                           FROM pg_tables
                           WHERE schemaname = 'public'
                             AND tablename = 'entities_creation_events'
                       );
        `, {raw: true}));
        if (!temp[0].exists) throw new Error("The 'entities_creation_events' table is not defined. Cannot run migration! " +
            "Please run `cd server/scripts && ts-node getEntitiesWithEvents.ts && cd ../..` first.");

        return queryInterface.sequelize.transaction(async (t) => {
            /**
             * Entities with no chain-events
             */

            await queryInterface.sequelize.query(`
                SELECT *
                INTO delete_no_event_entities
                FROM "ChainEntities"
                WHERE NOT EXISTS(
                        SELECT FROM "ChainEvents" WHERE entity_id = "ChainEntities".id
                    );
            `, {transaction: t});


            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id IN (SELECT id FROM delete_no_event_entities);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                CREATE TEMP TABLE comments_to_delete AS (SELECT C.id
                     FROM "Comments" C
                              INNER JOIN delete_no_event_entities CE ON CE.chain = C.chain
                         AND SPLIT_PART(C.root_id, '_', 2) = CE."type_id"
                         AND CE."type" = case SPLIT_PART(C.root_id, '_', 1)
                                              WHEN 'compoundproposal' then 'proposal'
                                              WHEN 'cosmosproposal' then 'proposal'
                                              WHEN 'councilmotion' then 'collective-proposal'
                                              WHEN 'democracyproposal' then 'democracy-proposal'
                                              WHEN 'onchainproposal' then 'proposal'
                                              WHEN 'referendum' then 'democracy-referendum'
                                              WHEN 'signalingproposal' then 'signaling-proposal'
                                              WHEN 'sputnikproposal' then 'proposal'
                                              WHEN 'treasuryproposal' then 'treasury-proposal'
                             END
                     WHERE C.root_id not like 'discussion%');
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "Reactions"
                WHERE comment_id IN (SELECT * FROM comments_to_delete);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "Comments"
                WHERE id IN (SELECT * FROM comments_to_delete);
            `, {transaction: t});

            // delete reactions associated to deleted chain-entity edge cases
            await queryInterface.sequelize.query(`
                WITH temp as (SELECT R.id
                              FROM "Reactions" R
                                       INNER JOIN delete_no_event_entities CE ON CE.chain = R.chain
                                  AND SPLIT_PART(R.proposal_id, '_', 2) = CE."type_id"
                                  AND CE."type" = case SPLIT_PART(R.proposal_id, '_', 1)
                                                      WHEN 'compoundproposal' then 'proposal'
                                                      WHEN 'cosmosproposal' then 'proposal'
                                                      WHEN 'councilmotion' then 'collective-proposal'
                                                      WHEN 'democracyproposal' then 'democracy-proposal'
                                                      WHEN 'onchainproposal' then 'proposal'
                                                      WHEN 'referendum' then 'democracy-referendum'
                                                      WHEN 'signalingproposal' then 'signaling-proposal'
                                                      WHEN 'sputnikproposal' then 'proposal'
                                                      WHEN 'treasuryproposal' then 'treasury-proposal'
                                      END
                              WHERE R.proposal_id IS NOT NULL)
                DELETE
                FROM "Reactions"
                WHERE "Reactions".id IN (SELECT id FROM temp);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DROP TABLE delete_no_event_entities;
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DROP TABlE comments_to_delete;
            `, {transaction: t});


            /**
             * Duplicate entities with non-duplicate events
             */

            // delete entity 403 (replaced by 715)
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 715
                  AND CE2.id = 403;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEvents" CE
                SET entity_id = 715
                WHERE entity_id = 403;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id = 403;
            `, {transaction: t});

            // delete entity 692 (replaced by 717)
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 717
                  AND CE2.id = 692;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEvents" CE
                SET entity_id = 717
                WHERE entity_id = 692;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id = 692;
            `, {transaction: t});

            // delete entity 693 (replaced by 718)
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 718
                  AND CE2.id = 693;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEvents" CE
                SET entity_id = 718
                WHERE entity_id = 693;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id = 693;
            `, {transaction: t});

            // delete entity 694 (replaced by 719)
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntities" CE1
                SET thread_id = CE2.thread_id,
                    completed = CE2.completed,
                    title     = CE2.title
                FROM "ChainEntities" CE2
                WHERE CE1.id = 719
                  AND CE2.id = 694;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                UPDATE "ChainEvents" CE
                SET entity_id = 719
                WHERE entity_id = 694;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id = 694;
            `, {transaction: t});

            // delete entity 109 (replaced by 110)
            // deletes the event that created entity 109 and has the wrong block number
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEvents"
                WHERE id = 19066;
            `, {transaction: t});
            // update the remaining chain-events
            await queryInterface.sequelize.query(`
                UPDATE "ChainEvents" CE
                SET entity_id = 110
                WHERE entity_id = 109;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id = 109;
            `, {transaction: t});

            // deletes entity 506 (replaced by 732)
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEvents"
                WHERE id = 543427;
            `, {transaction: t});
            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id = 506;
            `, {transaction: t});


            // collective-proposals
            // updates comment root_id's for the collective-proposal entities
            await queryInterface.sequelize.query(`
                UPDATE "Comments" C
                SET root_id = CONCAT(SPLIT_PART(C.root_id, '_', 1), ECE.event_data ->> 'proposalIndex')
                FROM entities_creation_events ECE
                WHERE SPLIT_PART(C.root_id, '_', 2) = ECE.type_id
                  AND ECE.type = 'collective-proposal'
                  AND SPLIT_PART(C.root_id, '_', 1) = 'councilmotion';
            `, {transaction: t});
            // updates reactions root_id's (proposal_ids) for the collective proposal entities
            await queryInterface.sequelize.query(`
                UPDATE "Reactions" R
                SET proposal_id = CONCAT(SPLIT_PART(R.proposal_id, '_', 1), ECE.event_data ->> 'proposalIndex')
                FROM entities_creation_events ECE
                WHERE SPLIT_PART(R.proposal_id, '_', 2) = ECE.type_id
                  AND ECE.type = 'collective-proposal'
                  AND SPLIT_PART(R.proposal_id, '_', 1) = 'councilmotion';
            `, {transaction: t});
            // update all collective-proposal entities to use proposalIndex instead of proposalHash
            await queryInterface.sequelize.query(`
                UPDATE "ChainEntities" CE
                SET type_id = ECE.event_data ->> 'proposalIndex'
                FROM entities_creation_events ECE
                WHERE CE.type = 'collective-proposal'
                  AND CE.id = ECE.entity_id;
            `, {transaction: t});


            /*
             * Duplicate chain-events that did not create an entity (null entity or duplicated in same entity)
             */

            await queryInterface.sequelize.query(`
                CREATE TEMP TABLE ce_delete_null_entity AS
                SELECT id
                FROM (SELECT id,
                             entity_id,
                             ROW_NUMBER()
                             OVER (PARTITION BY chain_event_type_id, block_number, event_data, entity_id ORDER BY id) AS Row
                      FROM "ChainEvents") dups
                WHERE dups.row > 1;
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                WITH notifications_to_delete AS (SELECT id
                                                 FROM "Notifications"
                                                 WHERE chain_event_id IN (SELECT * FROM ce_delete_null_entity))
                DELETE
                FROM "NotificationsRead"
                WHERE notification_id IN (SELECT * FROM "notifications_to_delete");
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "Notifications"
                WHERE chain_event_id IN (SELECT * FROM ce_delete_null_entity);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEvents"
                WHERE id IN (SELECT * FROM ce_delete_null_entity);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DROP TABLE ce_delete_null_entity;
            `, {transaction: t});


            /**
             * Duplicate chain-events that created chain-entities
             */

            await queryInterface.sequelize.query(`
                CREATE TEMP TABLE chain_entities_to_delete AS
                SELECT id
                FROM (SELECT *,
                             row_number() over (PARTITION BY chain, type, type_id ORDER BY eventCount DESC) AS real_entity,
                             row_number() over (partition by chain, type, type_id ORDER BY id)      AS row,
                             row_number() over (partition by chain, type, type_id ORDER BY id DESC) AS reverse_row
                      FROM (SELECT *
                            FROM "ChainEntities"
                                     JOIN (SELECT entity_id, COUNT(*) AS eventCount
                                           FROM "ChainEvents"
                                           WHERE entity_id IS NOT NULL
                                           GROUP BY entity_id) AS ceCount
                                          ON ceCount.entity_id = id) AS dups) AS ce_ids
                WHERE ce_ids.row + ce_ids.reverse_row > 2 AND
                      real_entity != 1;
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                CREATE TEMP TABLE chain_events_to_delete AS
                SELECT id
                FROM "ChainEvents"
                WHERE entity_id IN (SELECT * FROM "chain_entities_to_delete");
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                WITH notifications_to_delete AS (SELECT id
                                                 FROM "Notifications"
                                                 WHERE chain_event_id IN (SELECT * FROM "chain_events_to_delete"))
                DELETE
                FROM "NotificationsRead"
                WHERE notification_id IN (SELECT * FROM notifications_to_delete);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "Notifications"
                WHERE chain_event_id IN (SELECT * FROM "chain_events_to_delete");
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEvents"
                WHERE id IN (SELECT * FROM chain_events_to_delete);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEntities"
                WHERE id IN (SELECT * FROM chain_entities_to_delete);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DROP TABLE chain_events_to_delete;
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DROP TABLE chain_entities_to_delete;
            `, {transaction: t});


            /**
             * duplicate chain-events one that references an entity and another that doesn't
             */

            await queryInterface.sequelize.query(`
                select *
                INTO temp_ce
                FROM (SELECT id,
                             chain_event_type_id,
                             block_number,
                             event_data,
                             entity_id,
                             ROW_NUMBER()
                             OVER (PARTITION BY chain_event_type_id, block_number, event_data ORDER BY id)      AS Row,
                             ROW_NUMBER()
                             OVER (PARTITION BY chain_event_type_id, block_number, event_data ORDER BY id DESC) AS ReverseRow
                      FROM "ChainEvents") dups
                WHERE dups.row + reverseRow > 2
                  AND entity_id IS NULL;
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                WITH notiifcations_to_delete AS (SELECT id
                                                 FROM "Notifications"
                                                 WHERE chain_event_id IN (SELECT id FROM temp_ce))
                DELETE
                FROM "NotificationsRead"
                WHERE notification_id IN (SELECT * FROM notiifcations_to_delete);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "Notifications"
                WHERE chain_event_id IN (SELECT id FROM temp_ce);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DELETE
                FROM "ChainEvents"
                WHERE id IN (SELECT id FROM temp_ce);
            `, {transaction: t});

            await queryInterface.sequelize.query(`
                DROP TABLE temp_ce;
            `, {transaction: t});

            await queryInterface.addConstraint('ChainEntities', {
                fields: ['chain', 'type', 'type_id'],
                type: 'unique',
            });
        });
    },

    down: async (queryInterface, Sequelize) => {
        // IRREVERSIBLE
    },
};

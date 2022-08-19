'use strict';

module.exports = {
  // WARNING: irreversible migration
  up: async (queryInterface, Sequelize) => {
    // convert existing type_id's of chain-entities to the hash of the event_data
    // of the chain-event that created the entity
    await queryInterface.sequelize.query(`
        UPDATE "ChainEntities"
        SET type_id = MD5(updated.event_data::TEXT)
        FROM (SELECT CE.id, CE.event_data, CE.entity_id
              FROM (SELECT id,
                           event_data,
                           entity_id,
                           ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY block_number) AS Row
                    FROM "ChainEvents"
                    WHERE entity_id IS NOT NULL) as CE
              WHERE CE.Row = 1) as updated
        WHERE "ChainEntities".id = updated.entity_id;
    `);

    // delete any chain-entity that has a type_id that isn't the MD5 hash of
    // its event_data. This is equivalent to deleting all the chain-entities that
    // don't have any associated chain-events
    await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEntities"
        WHERE length(type_id) != 32;
    `);

    // deletes a unique instance of identical chain-events with different chain-entities
    // One of the entities has an author, so we delete the entity that does not have
    // an author and the chain-event that created it
    await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEvents"
        WHERE id = 543427;
    `);
    await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEntities"
        WHERE id = 506;
    `);

    //////////////////////////////// chain-events that did not create entities //////////////////
    // this does not interfere with the next queries because it only deletes duplicate
    // chain-events that relate to the same entity and ignores all chain-events that created entities

    // creates a temp table of all duplicate (not including original) chain-events that did not create an entity
    await queryInterface.sequelize.query(`
      CREATE TEMP TABLE ce_delete_null_entity AS
      SELECT id
      FROM (SELECT id,
                   entity_id,
                   ROW_NUMBER()
                   OVER (PARTITION BY chain_event_type_id, block_number, event_data, entity_id ORDER BY id) AS Row
            FROM "ChainEvents") dups
      WHERE dups.row > 1;
    `);
    // deletes the notificationsRead that reference the above chain-events
    await queryInterface.sequelize.query(`
        WITH notifications_to_delete AS (SELECT id
                                         FROM "Notifications"
                                         WHERE chain_event_id IN (SELECT * FROM ce_delete_null_entity))
        DELETE
        FROM "NotificationsRead"
        WHERE notification_id IN (SELECT * FROM "notifications_to_delete");
    `);
    // deletes the notifications that reference the above chain-events
    await queryInterface.sequelize.query(`
        DELETE
        FROM "Notifications"
        WHERE chain_event_id IN (SELECT * FROM ce_delete_null_entity);
    `);
    // deletes the duplicate chain-events that reference null entities
    await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEvents"
        WHERE id IN (SELECT * FROM ce_delete_null_entity);
    `);
    await queryInterface.sequelize.query(`
        DROP TABLE ce_delete_null_entity;
    `);

    ///////////// duplicate chain-entities and the chain-events that reference them //////////////

    // select all duplicate chain-entities that have less chain-events referencing them than their counter-parts
    // create a temp table that contains the ids of all chain-entities that need to be deleted
    await queryInterface.sequelize.query(`
      CREATE TEMP TABLE chain_entities_to_delete AS
      SELECT id
      FROM (SELECT *,
                 row_number()
                 over (PARTITION BY chain, type, type_id ORDER BY eventCount DESC)      AS real_entity,
                 row_number() over (partition by chain, type, type_id ORDER BY id)      AS row,
                 row_number() over (partition by chain, type, type_id ORDER BY id DESC) AS reverse_row
          FROM (SELECT *
                FROM "ChainEntities"
                         JOIN (SELECT entity_id, COUNT(*) AS eventCount
                               FROM "ChainEvents"
                               WHERE entity_id IS NOT NULL
                               GROUP BY entity_id) AS ceCount
                              ON ceCount.entity_id = id) AS dups) AS ce_ids
      WHERE ce_ids.row + ce_ids.reverse_row > 2
      AND ce_ids.real_entity != 1;
    `);

    // create a view that contains the ids of all chain-events that need to be deleted
    await queryInterface.sequelize.query(`
      CREATE TEMP TABLE chain_events_to_delete AS
      SELECT id FROM "ChainEvents"
      WHERE entity_id IN (SELECT * FROM "chain_entities_to_delete");
    `);

    // delete NotificationReads that reference notifications that are to be deleted
    await queryInterface.sequelize.query(`
        WITH notifications_to_delete AS (SELECT id
                                         FROM "Notifications"
                                         WHERE chain_event_id IN (SELECT * FROM "chain_events_to_delete"))
        DELETE
        FROM "NotificationsRead"
        WHERE notification_id IN (SELECT * FROM notifications_to_delete);
    `);

    await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEvents"
        WHERE id IN (SELECT * FROM chain_events_to_delete);
    `);

    await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEntities"
        WHERE id IN (SELECT * FROM chain_entities_to_delete);
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE chain_events_to_delete;
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE chain_entities_to_delete;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // IRREVERSIBLE
  },
};

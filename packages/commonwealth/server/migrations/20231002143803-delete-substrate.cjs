'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ceUrl = process.env.CE_DATABASE_URL;

    if (!ceUrl) {
      console.warn(
        'CE_DATABASE_URL env var not set. Substrate proposal links not updated.'
      );
      return;
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Subscriptions" S
        USING "Chains" C
         WHERE S.chain_id = C.id AND S.category_id = 'chain-event' AND C.base = 'substrate';
      `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "Notifications" N
        USING "Chains" C
        WHERE N.chain_id = C.id AND N.category_id = 'chain-event' AND C.base = 'substrate';
      `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        CREATE TEMPORARY TABLE extracted_identifiers AS
        WITH Extracted AS (
            SELECT
                T.id as thread_id,
                link_array.element AS link_element,
                link_array.ordinality - 1 AS link_index
            FROM "Threads" T
                     JOIN "Chains" C ON C.id = T.chain
                     CROSS JOIN LATERAL jsonb_array_elements(T.links) WITH ORDINALITY link_array(element, ordinality)
            WHERE T.links @> '[{"source": "proposal"}]' AND C.base = 'substrate'
              AND link_array.element->>'source' = 'proposal'
        )
        SELECT
                link_element->>'identifier' AS link_identifier,
                Extracted.thread_id,
                Extracted.link_index
        FROM Extracted;
      `,
        { transaction }
      );

      const namespaces = await queryInterface.sequelize.query(
        `
        SELECT nspname as schema
        FROM pg_extension e
                 JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE extname = 'dblink';
      `,
        { transaction, raw: true, type: 'SELECT' }
      );

      if (namespaces.length === 0) {
        throw new Error('dblink extension not installed');
      }

      await queryInterface.sequelize.query(
        `
        CREATE TEMPORARY TABLE merged_entity_link AS
        WITH chain_entities AS MATERIALIZED (SELECT id AS entity_id, type, type_id, chain
                                             FROM ${namespaces[0].schema}.dblink(
                                                          '${ceUrl}',
                                                          'SELECT id, type, type_id, chain FROM "ChainEntities";'
                                                      ) AS type_ids(id integer, type varchar(255), type_id varchar(255), chain varchar(255)))
        SELECT *
        FROM chain_entities ce
                 JOIN extracted_identifiers ei ON ce.entity_id::text = ei.link_identifier;
      `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        DO
        $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT * FROM merged_entity_link)
                    LOOP
                        UPDATE "Threads"
                        SET links = jsonb_set(
                                links,
                                ARRAY [r.link_index::text],
                                links->r.link_index::integer ||
                                jsonb_build_object('source', 'web', 'identifier',
                                                   CASE
                                                       WHEN r.chain = 'hydradx' THEN 'https://cloudflare-ipfs.com/ipns/dotapps.io/?rpc=wss%3A%2F%2Frpc.hydradx.cloud#/democracy'
                                                       ELSE 'https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fmainnet2.edgewa.re#/democracy'
                                                       END,
                                                  'title', INITCAP(REPLACE(r.type, '-', ' ')) || ' ' || r.type_id)
                                    )
                        WHERE id = r.thread_id;
                    END LOOP;
            END
        $$
        LANGUAGE plpgsql;
      `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        DROP TABLE extracted_identifiers;
      `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        DROP TABLE merged_entity_link;
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {},
};

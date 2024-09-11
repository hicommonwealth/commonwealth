'use strict';

const { QueryTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'body_backup', {
        transaction,
      });
      await queryInterface.renameColumn('Threads', 'body', 'body_backup', {
        transaction,
      });
      await queryInterface.renameColumn('Threads', 'plaintext', 'body', {
        transaction,
      });

      // date filter since confirmed on previous execution of this query in
      // production that no older records exist -> significantly improves query
      // performance which is important to speed up the migration
      const encodedThreads = await queryInterface.sequelize.query(
        `
        SELECT id, body
        FROM "Threads"
        WHERE body_backup = body AND body ~ '%[0-9A-Fa-f]{2}' AND created_at > '2024-09-09';
      `,
        { transaction, type: QueryTypes.SELECT },
      );

      if (encodedThreads.length > 0) {
        let query = ``;
        const replacements = [];
        const threadIds = [];
        for (const thread of encodedThreads) {
          try {
            const decodedBody = decodeURIComponent(thread.body);
            if (replacements.length > 0) query += ',\n';
            query += 'WHEN id = ? THEN ?';
            replacements.push(thread.id, decodedBody);
            threadIds.push(thread.id);
          } catch {}
        }

        await queryInterface.sequelize.query(
          `
          UPDATE "Threads"
          SET body = CASE
                          ${query}
                      END
          WHERE id IN (?);
      `,
          { transaction, replacements: [...replacements, threadIds] },
        );
      }

      await queryInterface.removeColumn('Comments', 'text_backup', {
        transaction,
      });
      await queryInterface.renameColumn('Comments', 'text', 'text_backup', {
        transaction,
      });
      await queryInterface.renameColumn('Comments', 'plaintext', 'text', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Comments"
        ALTER COLUMN text SET NOT NULL;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION copy_text_to_backup()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.text_backup := NEW.text;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER copy_text_to_backup_trigger
        BEFORE INSERT ON "Comments"
        FOR EACH ROW
        EXECUTE FUNCTION copy_text_to_backup();
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION copy_body_to_backup()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.body_backup := NEW.body;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER copy_body_to_backup_trigger
        BEFORE INSERT ON "Threads"
        FOR EACH ROW
        EXECUTE FUNCTION copy_body_to_backup();
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Threads', 'body', 'plaintext', {
        transaction,
      });
      await queryInterface.renameColumn('Threads', 'body_backup', 'body', {
        transaction,
      });
      await queryInterface.addColumn(
        'Threads',
        'body_backup',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.renameColumn('Comments', 'text', 'plaintext', {
        transaction,
      });
      await queryInterface.renameColumn('Comments', 'text_backup', 'text', {
        transaction,
      });
      await queryInterface.addColumn(
        'Comments',
        'body_backup',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },
};

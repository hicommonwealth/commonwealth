'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      {
        // backup thread body and sanitize
        await queryInterface.addColumn(
          'Threads',
          'body_backup',
          {
            type: Sequelize.TEXT,
            allowNull: true,
            default: null,
          },
          { transaction },
        );
        await queryInterface.sequelize.query(
          `
            UPDATE "Threads" SET body_backup = body WHERE body LIKE '%video%'
          `,
          {
            transaction,
          },
        );

        const threads = await queryInterface.sequelize.query(
          `
          SELECT id, body
          FROM "Threads"
          WHERE body LIKE '%video%'
        `,
          {
            type: 'SELECT',
            transaction,
          },
        );
        for (const { id, body } of threads) {
          const sanitizedBody = sanitizeQuillText(body);
          await queryInterface.sequelize.query(
            `UPDATE "Threads" SET body = :sanitizedBody WHERE id = :id`,
            {
              replacements: { sanitizedBody, id },
              transaction,
            },
          );
        }
      }

      {
        // backup comments text and sanitize
        await queryInterface.addColumn(
          'Comments',
          'text_backup',
          {
            type: Sequelize.TEXT,
            allowNull: true,
            default: null,
          },
          { transaction },
        );
        await queryInterface.sequelize.query(
          `
            UPDATE "Comments" SET text_backup = "text" WHERE "text" LIKE '%video%'
          `,
          {
            transaction,
          },
        );

        const comments = await queryInterface.sequelize.query(
          `
          SELECT id, "text"
          FROM "Comments"
          WHERE "text" LIKE '%video%'
        `,
          {
            type: 'SELECT',
            transaction,
          },
        );
        for (const { id, text } of comments) {
          const sanitizedBody = sanitizeQuillText(text);
          await queryInterface.sequelize.query(
            `UPDATE "Comments" SET "text" = :sanitizedBody WHERE id = :id`,
            {
              replacements: { sanitizedBody, id },
              transaction,
            },
          );
        }
      }

      {
        // backup profiles bio and sanitize
        await queryInterface.addColumn(
          'Profiles',
          'bio_backup',
          {
            type: Sequelize.TEXT,
            allowNull: true,
            default: null,
          },
          { transaction },
        );
        await queryInterface.sequelize.query(
          `
            UPDATE "Profiles" SET bio_backup = bio WHERE bio LIKE '%video%'
          `,
          {
            transaction,
          },
        );

        const profiles = await queryInterface.sequelize.query(
          `
          SELECT id, bio
          FROM "Profiles"
          WHERE bio LIKE '%video%'
        `,
          {
            type: 'SELECT',
            transaction,
          },
        );
        for (const { id, bio } of profiles) {
          const sanitizedBody = sanitizeQuillText(bio, true);
          await queryInterface.sequelize.query(
            `UPDATE "Profiles" SET bio = :sanitizedBody WHERE id = :id`,
            {
              replacements: { sanitizedBody, id },
              transaction,
            },
          );
        }
      }

      {
        // backup topics default_offchain_template and sanitize
        await queryInterface.addColumn(
          'Topics',
          'default_offchain_template_backup',
          {
            type: Sequelize.TEXT,
            allowNull: true,
            default: null,
          },
          { transaction },
        );
        await queryInterface.sequelize.query(
          `
            UPDATE "Topics" SET default_offchain_template_backup = default_offchain_template
            WHERE default_offchain_template LIKE '%video%'
          `,
          {
            transaction,
          },
        );

        const defaultOffchainTemplates = await queryInterface.sequelize.query(
          `
          SELECT id, default_offchain_template
          FROM "Topics"
          WHERE default_offchain_template LIKE '%video%'
        `,
          {
            type: 'SELECT',
            transaction,
          },
        );
        for (const {
          id,
          default_offchain_template,
        } of defaultOffchainTemplates) {
          const sanitizedBody = sanitizeQuillText(
            default_offchain_template,
            true,
          );
          await queryInterface.sequelize.query(
            `UPDATE "Topics" SET default_offchain_template = :sanitizedBody WHERE id = :id`,
            {
              replacements: { sanitizedBody, id },
              transaction,
            },
          );
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // restore threads body
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads" SET body = body_backup
        WHERE body_backup != NULL
      `,
        { transaction },
      );
      await queryInterface.removeColumn('Threads', 'body_backup', {
        transaction,
      });

      // restore comments text
      await queryInterface.sequelize.query(
        `
        UPDATE "Comments" SET "text" = text_backup
        WHERE text_backup != NULL
      `,
        { transaction },
      );
      await queryInterface.removeColumn('Comments', 'text_backup', {
        transaction,
      });

      // restore profiles bio
      await queryInterface.sequelize.query(
        `
        UPDATE "Profiles" SET bio = bio_backup
        WHERE bio_backup != NULL
      `,
        { transaction },
      );
      await queryInterface.removeColumn('Profiles', 'bio_backup', {
        transaction,
      });

      // restore topics default_offchain_template
      await queryInterface.sequelize.query(
        `
        UPDATE "Topics" SET default_offchain_template = default_offchain_template_backup
        WHERE default_offchain_template_backup != NULL
      `,
        { transaction },
      );
      await queryInterface.removeColumn(
        'Topics',
        'default_offchain_template_backup',
        {
          transaction,
        },
      );
    });
  },
};

// ----

const youtubeEmbedSanitizer = (url) => {
  const regex =
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regex);
  if (match) {
    const hash = match[1];
    return `https://www.youtube.com/embed/${hash}?autoplay=0`;
  }
  return null;
};

const vimeoEmbedSanitizer = (url) => {
  const regex = /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/;
  const match = url.match(regex);
  if (match) {
    const hash = match[1];
    return `https://player.vimeo.com/video/${hash}`;
  }
  return null;
};

const embedSanitizers = [youtubeEmbedSanitizer, vimeoEmbedSanitizer];

function sanitizeQuillText(input, noEncode) {
  let parsedObject = null;
  if (noEncode) {
    parsedObject = JSON.parse(input);
  } else {
    try {
      parsedObject = JSON.parse(decodeURIComponent(input));
    } catch (err) {
      return input;
    }
  }
  const { ops } = parsedObject;
  for (const op of ops) {
    const videoEmbedUrl = op.insert?.video;
    if (videoEmbedUrl) {
      const sanitizedEmbedUrl = embedSanitizers
        .map((fn) => fn(videoEmbedUrl))
        .find(Boolean);

      if (sanitizedEmbedUrl) {
        op.insert = {
          video: sanitizedEmbedUrl,
        };
      } else {
        op.insert = '';
      }
    }
  }
  if (noEncode) {
    return JSON.stringify(parsedObject);
  }
  return encodeURIComponent(JSON.stringify(parsedObject));
}

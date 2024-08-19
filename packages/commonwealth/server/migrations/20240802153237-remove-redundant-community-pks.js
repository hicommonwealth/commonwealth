'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Comments" DROP COLUMN IF EXISTS community_id;
        ALTER TABLE "Reactions" DROP COLUMN IF EXISTS community_id;
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async () => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Comments" ADD COLUMN community_id INT;
        ALTER TABLE "Reactions" ADD COLUMN community_id INT;

        UPDATE "Comments" c SET community_id = t.community_id
        FROM "Threads" t
        WHERE c.thread_id = t.id;

        UPDATE "Reactions" r SET community_id = t.community_id
        FROM "Threads" t
        WHERE r.thread_id = c.id;

        UPDATE "Reactions" r SET community_id = t.community_id
        FROM "Comments" c JOIN "Threads" t ON c.thread_id = t.id
        WHERE r.comment_id = c.id;

        --ALTER TABLE "Comments" ADD CONSTRAINT fk_comments_community 
        --FOREIGN KEY (community_id) REFERENCES "Communities" (id);
        --ALTER TABLE "Reactions" ADD CONSTRAINT fk_reactions_community
        --FOREIGN KEY (community_id) REFERENCES "Communities" (id);
       `,
        {
          transaction: t,
        },
      );
    });
  },
};

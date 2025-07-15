'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "ContestActions"
              DROP CONSTRAINT "ContestActions_contests_fkey",
              ADD CONSTRAINT "ContestActions_contests_fkey"
                  FOREIGN KEY (contest_address, contest_id)
                      REFERENCES "Contests" (contest_address, contest_id)
                      ON UPDATE NO ACTION
                      ON DELETE CASCADE;
      `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Contests"
              DROP CONSTRAINT "Contests_contestmanagers_fkey",
              ADD CONSTRAINT "Contests_contestmanagers_fkey"
                  FOREIGN KEY (contest_address)
                      REFERENCES "ContestManagers" (contest_address)
                      ON UPDATE NO ACTION
                      ON DELETE CASCADE;
      `,
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
            ALTER TABLE "ContestActions"
                DROP CONSTRAINT "ContestActions_contests_fkey",
                ADD CONSTRAINT "ContestActions_contests_fkey"
                    FOREIGN KEY (contest_address, contest_id)
                        REFERENCES "Contests" (contest_address, contest_id)
                        ON DELETE NO ACTION;
        `,
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Contests"
              DROP CONSTRAINT "Contests_contestmanagers_fkey",
              ADD CONSTRAINT "Contests_contestmanagers_fkey"
                  FOREIGN KEY (contest_address)
                      REFERENCES "ContestManagers" (contest_address)
                      ON DELETE NO ACTION;
        `,
        { transaction: t },
      );
    });
  },
};

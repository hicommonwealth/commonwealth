module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.query(
      `
            INSERT INTO "ChatChannels"
            SELECT nextval('"ChatChannels_id_seq"'::regclass) as id,
                   'General'                                  as name,
                   id                                         as chain_id,
                   'General'                                  as category,
                   CURRENT_TIMESTAMP                          as created_at,
                   CURRENT_TIMESTAMP                          as updated_at
            FROM "Chains";
        `,
      { raw: true, type: 'RAW' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `
            DELETE
            FROM "ChatChannels"
            WHERE name = 'General';
        `,
      { raw: true, type: 'RAW' }
    );
  },
};

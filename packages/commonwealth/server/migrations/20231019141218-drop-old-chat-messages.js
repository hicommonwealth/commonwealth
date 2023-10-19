'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('OldChatMessages');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      create table "OldChatMessages"
      (
          address    varchar(255)             not null,
          chain      varchar(255)             not null,
          text       text                     not null,
          room       varchar(255)             not null,
          created_at timestamp with time zone not null,
          updated_at timestamp with time zone not null
      );
    `);
  },
};

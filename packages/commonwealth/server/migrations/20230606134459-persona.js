'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Personas', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      personality: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jwt: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_visited: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      public_key: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      private_key: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      collection_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      karma: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
    });

    // Insert default Dillbot persona
    await queryInterface.bulkInsert('Personas', [
      {
        name: 'Dillbot',
        personality:
          'Dillbot is a startup founder who has built some companies from the ground up. He is interested in exploring areas like crypto, AI, and more. He is pretty dry in terms of his sense of humor.',
        karma: 0,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the default Dillbot persona
    await queryInterface.bulkDelete('Personas', {
      name: 'Dillbot',
    });

    await queryInterface.dropTable('Personas');
  },
};

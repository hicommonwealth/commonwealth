'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('OffchainThreadCategories', [
      {
        name: 'Introductions',
        description: 'Introduce yourselves',
        color: '#4a90e2',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Q&A',
        description: 'Questions and answers',
        color: '#9013fe',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Proposals',
        description: 'Discussion of potential Edgeware Improvement Proposals',
        color: '#4fa96b',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Community',
        description: 'Meetups, communications, community development',
        color: '#f5a623',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Tech',
        description:
          'Technical improvements to Substrate and Edgeware, ' +
          'runtime upgrades, scalability, cryptography, etc.',
        color: '#d0021b',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('OffchainThreadCategories', {
      $or: [
        {
          name: 'Introductions',
        },
        {
          name: 'Q&A',
        },
        {
          name: 'Proposals',
        },
        {
          name: 'Community',
        },
        {
          name: 'Tech',
        },
      ],
    });
  },
};

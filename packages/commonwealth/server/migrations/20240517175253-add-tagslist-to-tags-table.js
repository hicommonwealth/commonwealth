'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          INSERT INTO public."Tags" 
          (name, created_at, updated_at) 
          values 
          ('DAO', now(), now()),
          ('NFTs', now(), now()),
          ('Gaming', now(), now()),
          ('Social', now(), now()),
          ('Memes', now(), now()),
          ('AI', now(), now()),
          ('DeFi', now(), now()),
          ('ReFi', now(), now()),
          ('Lending/Borrowing', now(), now()),
          ('Staking', now(), now()),
          ('Swaps', now(), now()),
          ('dApp', now(), now()),
          ('Technology', now(), now()),
          ('Security/Auditing', now(), now()),
          ('Governance', now(), now()),
          ('Marketplace', now(), now());
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          DELETE FROM public."Tags" 
          WHERE name IN 
          ('DAO', 'NFTs', 'Gaming', 'Social', 'Memes', 'AI', 'DeFi', 'ReFi', 'Lending/Borrowing', 'Staking', 'Swaps', 'dApp', 'Technology', 'Security/Auditing', 'Governance', 'Marketplace');
        `,
        { transaction },
      );
    });
  },
};

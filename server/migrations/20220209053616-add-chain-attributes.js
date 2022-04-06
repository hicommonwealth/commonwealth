module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // creates a new table called ChainCategoryTypes
      await queryInterface.createTable(
        'ChainCategoryTypes',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          category_name: { type: Sequelize.STRING, allowNull: true },
        },
        { transaction: t }
      );

      const categoryTypes = [
        { category_name: 'DeFi' },
        { category_name: 'DAO' },
      ];

      await queryInterface.bulkInsert(
        'ChainCategoryTypes',
        [...categoryTypes],
        { transaction: t }
      );

      // creates a new table called ChainCategories
      await queryInterface.createTable(
        'ChainCategories',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          category_type_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'ChainCategoryTypes', key: 'id' },
          },
        },
        { transaction: t }
      );

      const chainCategories = [];
      const daos = ['dydx', 'osmosis', 'new-order-dao', 'spiritswap', 'notional', 
        'element-finance', 'knoxedge', 'chihuahua', 'hashes', 'bitdao', 'hummingbot-foundation',
        'terra', 'uniswap', 'aave', 'polygon', 'alpha-finance', 'tribe', 'frax',
        'axie-infinity', 'lion', 'jenny-metaverse-dao', 'divine-dao', 'beanstalk', 'krause-house',
        'redacted-cartel', 'phantom-dao', 'debt-dao', 'qnt-dao', 'yearn-finance', 
        'sushi', 'derivadao', 'compound', 'maker', 'bancor-network-toke', 'convex-finance', 'aavegotchi',
        '1inch', 'curve-dao-token', 'lido-dao', 'the-graph', 'friends-with-benefi', 'dxdao' ];
      const defi = ['dydx', 'osmosis', 'notional', 'redacted-cartel', 'spookyswap', 'usemate', 'tribe',
        'uniswap', 'aave', 'beanstalk', 'spiritswap', 'redacted-cartel', 'yearn-finance', 'debt-dao', 'sushi',
        'synthetix-network-token', '0x', 'compound', 'bancor-network-toke', 'convex-finance', 'harvest-finance',
        'maker', '1inch', 'curve-dao-token', 'gnosis', 'kyber-network-crystal', 'idle', 'celsius-network', 'serum', 'rarible'];
      
      daos.forEach((c) => chainCategories.push({ chain_id: c, category_type_id: 2 }));
      defi.forEach((c) => chainCategories.push({ chain_id: c, category_type_id: 1 }));
      await queryInterface.bulkInsert('ChainCategories', [...chainCategories], {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('ChainCategories', { transaction: t });
      await queryInterface.dropTable('ChainCategoryTypes', { transaction: t });
    });
  },
};

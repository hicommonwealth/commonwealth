'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Users', [{ 
          email: 'notifications@commonwealth.im',
          emailVerified: true,
          isAdmin: false,
          magicIssuer: false,
        }], { transaction: t }
      );
      const chains = await queryInterface.sequelize.query(
        'SELECT id, network FROM "Chains";',
        { transaction: t },
      );

      /* 
        new-thread-creation,
        new-comment-creation,
        new-chain-event
          ===> chain event category

        For now, we'll only add chains
      */
      const promises = [];

      const notificationCategories = await queryInterface.sequelize.query(
        'SELECT id, category FROM "NotificationCategories";',
        { transaction: t }
      )

      const threads = await 

      await models.OffchainComment.findOne({ where: { id: Number(p_id), } });

      /* 
        Find all chains, subscribe to all notification categories
        await queryInterface.sequelize.bu(
          'SELECT id, category FROM "NotificationCategories";',
          { transaction: t }
        )
      */ 

      await Promise.all(promises);

    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('Users', [{
        email: 'notifications@commonwealth.im'
      }], { transaction: t });
    });
  }
};

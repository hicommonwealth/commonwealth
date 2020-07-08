'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
  // add columns
    await queryInterface.addColumn('Subscriptions', 'chain_id', { type: dataTypes.STRING, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'community_id', { type: dataTypes.STRING, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'offchain_thread_id', { type: dataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'offchain_comment_id', { type: dataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'chain_event_type_id', { type: dataTypes.STRING, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'chain_entity_id', { type: dataTypes.STRING, allowNull: true });


    // for each subscription, create relevant associations
    const chains = await queryInterface.sequelize.query(`SELECT * FROM "Chains"`);
    const subscriptions = await queryInterface.sequelize.query(`SELECT * FROM "Subscriptions";`);
    await Promise.All(subscriptions.forEach(async (s) => {
      const { object_id, category_id, id } = s;
      const object_id_split = object_id.split(/- | /_);
      const p_object_id = object_id_split[1];
      const entity = object_id_split[0];
      let query;
      switch (category_id)  {
        case 'new-thread-creation': // object_id: "kusama"/"edgeware"
          if (chains.includes(object_id)) {
            query = `UPDATE "Subscriptions" SET chain_id=${object_id} WHERE id=${id};`;
          } else {
            query = `UPDATE "Subscriptions" SET community_id=${object_id} WHERE id=${id};`;
          }
          await queryInterface.sequelize.query(query);
          break;
        case 'new-comment-creation':  // object_id: "discussion_123"
          // councilmotion_0x3dd9c8b50b896089ddf9db75d231bd23d6596822ba6d5480697ed0833b64f077
          // referendum_0
          if (entity === 'discussion') {
            // query associate OffchainThread
            // associate chain or community
          } else if (entity === 'comment') {
            // query associate OffchainComment
            // associate chain or community
          } else {
            // query associate ChainEntity
            // associate chain
          }
          await queryInterface.sequelize.query(query);
          break;
        case 'new-reaction':  // object_id "comment-923" / "discussion_442" (hyphen or underscore)
          if (entity === 'comment') {
            // query associate offchain_comment
            // associate chain or community
          } else if (entity === 'discussion') {
            // query associate offchain_thread
            // associate chain or community
          } else {
            // query association ChainEntity
            // associate chain
          }
          await queryInterface.sequelize.query(query);
          break;
        case 'chain-event': // object_id: "edgeware-reward" / "edgeware-treasury-awarded" / "edgeware-treasury-rejected"
          query = `UPDATE "Subscriptions" SET chain_id=${entity} where id=${id};`;
          break;
        default:
          break;
      }
    })); // end of loop
  },

  down: (queryInterface, DataTypes) => {
    await Promise.all([
      queryInterface.removeColumn('Subscriptions', 'chain_id', { type: dataTypes.STRING, allowNull: true }),
      queryInterface.removeColumn('Subscriptions', 'community_id', { type: dataTypes.STRING, allowNull: true }),
      queryInterface.removeColumn('Subscriptions', 'offchain_thread_id', { type: dataTypes.INTEGER, allowNull: true }),
      queryInterface.removeColumn('Subscriptions', 'offchain_comment_id', { type: dataTypes.INTEGER, allowNull: true }),
      queryInterface.removeColumn('Subscriptions', 'chain_event_type_id', { type: dataTypes.STRING, allowNull: true }),
      queryInterface.removeColumn('Subscriptions', 'chain_entity_id', { type: dataTypes.STRING, allowNull: true }),

    ]);
  }
};

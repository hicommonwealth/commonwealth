/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
  // add columns
    await queryInterface.addColumn('Subscriptions', 'chain_id', { type: dataTypes.STRING, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'community_id', { type: dataTypes.STRING, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'offchain_thread_id', { type: dataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'offchain_comment_id', { type: dataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'chain_event_type_id', { type: dataTypes.STRING, allowNull: true });
    await queryInterface.addColumn('Subscriptions', 'chain_entity_id', { type: dataTypes.STRING, allowNull: true });


    // for each subscription, create relevant associations
    const chains = await queryInterface.sequelize.query(`SELECT * FROM "Chains"`);
    console.dir(chains);
    const subscriptions = await queryInterface.sequelize.query(`SELECT * FROM "Subscriptions";`);
    console.dir(subscriptions);
    await Promise.All(subscriptions.forEach(async (s) => {
      const { object_id, category_id, id } = s;
      const object_id_split = object_id.split(/-|_/); // hyphen or underscore
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
            query = `UPDATE "Subscriptions" SET offchain_thread_id=${p_object_id} WHERE id=${id};`;
            // associate chain or community
            const thread = await queryInterface.sequelize.query(`SELECT * FROM "OffchainThreads" WHERE id=${p_object_id};`);
            if (thread.chain) {
              query += `UPDATE "Subscriptions" SET chain_id=${thread.chain} WHERE id=${id};`;
            } else if (thread.community) {
              query += `UPDATE "Subscriptions" SET community_id=${thread.community} WHERE id=${id};`;
            }
          } else if (entity === 'comment') {
            // query associate OffchainComment
            query = `UPDATE "Subscriptions" SET offchain_comment_id=${p_object_id} WHERE id=${id};`;
            // associate chain or community
            const comment = await queryInterface.sequelize.query(`SELECT * FROM "OffchainComments" WHERE id=${p_object_id};`);
            if (comment.chain) {
              query += `UPDATE "Subscriptions" SET chain_id=${comment.chain} WHERE id=${id};`;
            } else if (comment.community) {
              query += `UPDATE "Subscriptions" SET community_id=${comment.community} WHERE id=${id};`;
            }
          } else {
            // query associate ChainEntity
            // associate chain
            // TODO: I THINK THIS IS NOT POSSIBLE GIVEN CURRENT ISSUE IN FINDING CHAIN FROM SUBSCRIPTION
          }
          await queryInterface.sequelize.query(query);
          break;
        case 'new-reaction':  // object_id "comment-923" / "discussion_442" (hyphen or underscore)
          if (entity === 'discussion') {
            // query associate offchain_thread
            query = `UPDATE "Subscriptions" SET offchain_thread_id=${p_object_id} WHERE id=${id};`;
            // associate chain or community
            const thread = await queryInterface.sequelize.query(`SELECT * FROM "OffchainThreads" WHERE id=${p_object_id};`);
            if (thread.chain) {
              query += `UPDATE "Subscriptions" SET chain_id=${thread.chain} WHERE id=${id};`;
            } else if (thread.community) {
              query += `UPDATE "Subscriptions" SET community_id=${thread.community} WHERE id=${id};`;
            }
          } else if (entity === 'comment') {
            // query associate offchain_comment
            query = `UPDATE "Subscriptions" SET offchain_comment_id=${p_object_id} WHERE id=${id};`;
            // associate chain or community
            const comment = await queryInterface.sequelize.query(`SELECT * FROM "OffchainComments" WHERE id=${p_object_id};`);
            if (comment.chain) {
              query += `UPDATE "Subscriptions" SET chain_id=${comment.chain} WHERE id=${id};`;
            } else if (comment.community) {
              query += `UPDATE "Subscriptions" SET community_id=${comment.community} WHERE id=${id};`;
            }
          } else {
            // There are no new-reaction subscriptions for chain entities in our db
          }
          await queryInterface.sequelize.query(query);
          break;
        case 'chain-event': // object_id: "edgeware-reward" / "edgeware-treasury-awarded" / "edgeware-treasury-rejected"
          query = `UPDATE "Subscriptions" SET chain_id=${entity} WHERE id=${id};`;
          query += `UPDATE "Subscriptions" SET chain_event_type_id=${object_id} WHERE id=${id};`;
          await queryInterface.sequelize.query(query);
          break;
        default:
          // all cases should be detailed above.
          break;
      }
    })); // end of loop
  },

  down: async (queryInterface, DataTypes) => {
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

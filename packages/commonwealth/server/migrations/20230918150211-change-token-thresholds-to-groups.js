'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add group_ids column to topics table
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Topics',
        'group_ids',
        {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          allowNull: false,
          defaultValue: []
        },
        { transaction: t }
      )
    })
    await queryInterface.sequelize.transaction(async (t) => {
      // get threshold values for all topics
       const [topics] = await queryInterface.sequelize.query(
        `SELECT
            "Topics".id as topic_id,
            "Topics".chain_id,
            "Topics".token_threshold,
            "Chains".network,
            "Chains".default_symbol as token_symbol,
            "Contracts".address as contract_address
          FROM "Topics"
          JOIN  "Chains" ON "Chains".id = "Topics".chain_id
          JOIN "CommunityContracts" ON "CommunityContracts".chain_id = "Topics".chain_id
          JOIN "Contracts" ON "Contracts".id = "CommunityContracts".contract_id
          WHERE "Chains".network IN ('ethereum', 'erc20', 'erc721', 'cosmos')`
      )

      // for each topic...
      for (const topic of topics) {
        console.log('topic: ', topic)
        const {
          topic_id,
          chain_id,
          token_threshold,
          network,
          token_symbol,
          contract_address
        } = topic
         // create a new group
        const source =
          ['erc20', 'erc721'].includes(network) ? { source_type: network, chain_id, contract_address } :
          network === 'ethereum' ? { source_type: 'eth_native', chain_id } :
          network === 'cosmos' ? { source_type: 'cosmos_native', token_symbol } :
          null
        if (!source) {
          throw new Error(`unsupported network for topic: ${JSON.stringify(topic)}`)
        }
        const requirements = [
          {
            rule: 'threshold',
            data: {
              threshold: token_threshold,
              source
            }
          }
        ]
        const insertGroupQuery = `
          INSERT INTO "Groups"
              ("chain_id", "metadata", "requirements", "created_at", "updated_at")
            VALUES
              (:chain_id, '{}', :requirements, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id
        `
        try {
          const [[{ id }]] = await queryInterface.sequelize.query(insertGroupQuery, {
            replacements: {
              chain_id,
              requirements: JSON.stringify(requirements)
            },
            type: queryInterface.sequelize.QueryTypes.INSERT
          });
          // associate group with topic
          const updateTopicQuery = `
            UPDATE "Topics" SET "group_ids" = "group_ids" || ARRAY[${id}] WHERE id = ${topic_id}
          `
          await await queryInterface.sequelize.query(updateTopicQuery)
        } catch (err) {
          console.error(err)
        }
       }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Topics',
        'group_ids',
        { transaction: t }
      )
      const deleteGroupsQuery = `
        DELETE FROM "Groups"
      `
      await await queryInterface.sequelize.query(deleteGroupsQuery)
    })
  }
};

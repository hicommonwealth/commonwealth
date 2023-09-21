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
      // get threshold values for all topics greater than zero
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
          WHERE "Chains".network IN ('ethereum', 'erc20', 'erc721', 'cosmos') AND
                "Topics".token_threshold NOT IN ('0', '0000000000000000000') AND
                "Topics".deleted_at IS NULL`
      )

      // for each topic, great a new group for it
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
         // build new group
        const source =
          ['erc20', 'erc721'].includes(network) ? { source_type: network, chain_id, contract_address } :
          network === 'ethereum' ? { source_type: 'eth_native', chain_id } :
          network === 'cosmos' ? { source_type: 'cosmos_native', token_symbol } :
          null
        if (!source) {
          throw new Error(`unsupported network for topic: ${JSON.stringify(topic)}`)
        }
        const metadata = {}
        const requirements = [
          {
            rule: 'threshold',
            data: {
              threshold: token_threshold,
              source
            }
          }
        ]
        // check for existing matching group
        const existingGroupId = await findGroup(queryInterface, chain_id, requirements, metadata)
        if (existingGroupId) {
          // found existing group- add to topic
          await addGroupIdToTopic(queryInterface, existingGroupId, topic_id)
        } else {
          // does not exist- create group then add to topic
          const createdGroupId = await insertGroup(queryInterface, chain_id, metadata, requirements)
          if (createdGroupId) {
            await addGroupIdToTopic(queryInterface, createdGroupId, topic_id)
          }
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

async function findGroup(queryInterface, chain_id, requirements, metadata) {
  try {
    const findGroupQuery = `
      SELECT id
      FROM "Groups"
      WHERE chain_id = :chain_id AND metadata::text = :metadata::text AND requirements::text = :requirements::text
    `;
    const result = await queryInterface.sequelize.query(findGroupQuery, {
      replacements: {
        chain_id,
        requirements: JSON.stringify(requirements, null, 2),
        metadata: JSON.stringify(metadata, null, 2)
      },
      type: queryInterface.sequelize.QueryTypes.SELECT
    });

    if (result.length > 0) {
      const { id: existingGroupId } = result[0];
      return existingGroupId;
    } else {
      return null;
    }
  } catch (err) {
    console.error('findGroup error:', err);
    return null;
  }
}


async function addGroupIdToTopic(queryInterface, groupId, topicId) {
  try {
    const updateTopicQuery = `
      UPDATE "Topics" SET "group_ids" = "group_ids" || ARRAY[${groupId}] WHERE id = ${topicId} AND deleted_at IS NULL
    `
    return queryInterface.sequelize.query(updateTopicQuery)
  } catch (err) {
    console.error('addGroupIdToTopic error: ', err)
    return null
  }
}

async function insertGroup(queryInterface, chain_id, metadata, requirements) {
  const insertGroupQuery = `
    INSERT INTO "Groups"
        ("chain_id", "metadata", "requirements", "created_at", "updated_at")
      VALUES
        (:chain_id, :metadata, :requirements, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id
  `
  try {
    const [[{ id: createdGroupId }]] = await queryInterface.sequelize.query(insertGroupQuery, {
      replacements: {
        chain_id,
        metadata: JSON.stringify(metadata, null, 2),
        requirements: JSON.stringify(requirements, null, 2)
      },
      type: queryInterface.sequelize.QueryTypes.INSERT
    });
    return createdGroupId
  } catch (err) {
    console.error('insertGroup error: ', err)
    return null
  }
}

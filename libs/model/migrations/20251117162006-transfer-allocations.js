/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    // copy aura, historic, nft from existing allocations
    await queryInterface.sequelize.query(
      `
        WITH nft_data AS (
          SELECT user_id, SUM(total_token_allocation) as total_token_allocation
          FROM "NftSnapshot"
          WHERE user_id IS NOT NULL
          GROUP BY user_id
        ),
        joined AS (
          SELECT
            ca.user_id,
            ca.event_id,
            COALESCE(aa.token_allocation, 0) AS aura,
            COALESCE(ha.token_allocation, 0) AS historic,
            COALESCE(nft.total_token_allocation, 0) AS nft
          FROM "ClaimAddresses" ca
          LEFT JOIN "AuraAllocations" aa ON aa.user_id = ca.user_id
          LEFT JOIN "HistoricalAllocations" ha ON ha.user_id = ca.user_id
          LEFT JOIN nft_data nft ON nft.user_id = ca.user_id
          WHERE ca.event_id = 'common-airdrop'
        )
        UPDATE "ClaimAddresses" ca
        SET
          aura = j.aura,
          historic = j.historic,
          nft = j.nft
        FROM joined j
        WHERE 
          ca.event_id = j.event_id
          AND ca.user_id = j.user_id
          AND (j.aura + j.historic + j.nft) > 0
      `,
    );
  },

  async down() {},
};

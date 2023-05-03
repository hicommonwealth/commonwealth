import type { DB } from '../models';
import { QueryTypes } from 'sequelize';

export const Errors = {
  InvalidChain: 'Invalid chain',
};

const bulkProfiles = async (models: DB, req, res) => {
  const { searchTerm } = req.query;

  const profiles = await models.sequelize.query(
    `
    SELECT
      "Profiles".id,
      "Profiles".user_id as profileUserId,
      "Profiles".profile_name,
      "Addresses".address,
      "Addresses".user_id as addressUserId,
      ts_rank_cd("Profiles".profile_name, query) as rank
    JOIN
      "Addresses" on "Profiles".user_id = "Addresses".user_id
    WHERE
      query @@ "Profiles".profile_name
  `,
    {
      bind: {
        searchTerm,
        type: QueryTypes.SELECT,
      },
    }
  );

  return res.json({
    status: 'Success',
    result: profiles,
  });
};

export default bulkProfiles;

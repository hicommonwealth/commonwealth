import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function GetTokenStats(): Query<typeof schemas.GetTokenStats> {
  return {
    ...schemas.GetTokenStats,
    auth: [],
    secure: false,
    async body({ payload }) {
      const { token_address } = payload;

      const tokenTypeQuery = `
        SELECT 
          CASE 
            WHEN EXISTS(SELECT 1 FROM "LaunchpadTokens" WHERE token_address = :token_address) 
            THEN 'launchpad'
            WHEN EXISTS(SELECT 1 FROM "ThreadTokens" WHERE token_address = :token_address)
            THEN 'postcoin'
            ELSE 'unknown'
          END as token_type
      `;

      const [tokenTypeRow] = await models.sequelize.query<{
        token_type: string;
      }>(tokenTypeQuery, {
        replacements: { token_address },
        type: QueryTypes.SELECT,
      });

      const tokenType = tokenTypeRow?.token_type;

      if (tokenType === 'unknown') {
        return {
          holder_count: 0,
          volume_24h: 0,
        };
      }

      const sql =
        tokenType === 'launchpad'
          ? `
        SELECT
          COUNT(DISTINCT trader_address) AS holder_count,
          COALESCE(
            SUM(
              CASE 
                WHEN timestamp >= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours')
                THEN price * community_token_amount 
                ELSE 0 
              END
            ),
            0
          ) AS volume_24h
        FROM "LaunchpadTrades" 
        WHERE token_address = :token_address
      `
          : `
        SELECT
          COUNT(DISTINCT trader_address) AS holder_count,
          COALESCE(
            SUM(
              CASE 
                WHEN timestamp >= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours')
                THEN price * community_token_amount 
                ELSE 0 
              END
            ),
            0
          ) AS volume_24h
        FROM "ThreadTokenTrades" 
        WHERE token_address = :token_address
      `;

      const [row] = await models.sequelize.query<{
        holder_count: number;
        volume_24h: string;
      }>(sql, {
        replacements: { token_address },
        type: QueryTypes.SELECT,
      });

      return {
        holder_count: parseInt(row?.holder_count as unknown as string) || 0,
        volume_24h: parseFloat(row?.volume_24h || '0'),
      };
    },
  };
}

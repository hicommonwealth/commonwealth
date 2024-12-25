import { ExternalServiceUserIds, type Command } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export function CreateJWTs(): Command<typeof schemas.CreateJWTs> {
  return {
    ...schemas.CreateJWTs,
    auth: [],
    secure: true,
    authStrategy: { type: 'authtoken', userId: ExternalServiceUserIds.K6 },
    body: async ({ payload }) => {
      const userIds = await models.sequelize.query<{ id: number }>(
        `
            WITH random_ids AS (SELECT id
                                FROM "Users"
                                         TABLESAMPLE SYSTEM (1)
                                LIMIT :numberOfJwt)
            SELECT id
            FROM random_ids
            ORDER BY RANDOM()
            LIMIT :numberOfJwt;
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: { numberOfJwt: payload.number_of_jwt },
        },
      );

      const jwts: string[] = [];
      for (const { id } of userIds) {
        jwts.push(
          jwt.sign({ id }, config.AUTH.JWT_SECRET, {
            expiresIn: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
          }),
        );
      }

      return jwts;
    },
  };
}

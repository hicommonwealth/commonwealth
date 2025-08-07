import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetThreadToken(): Query<typeof schemas.GetThreadToken> {
  return {
    ...schemas.GetThreadToken,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { thread_id } = payload;

      const token = await models.sequelize.query<
        z.infer<typeof schemas.TokenView>
      >(
        `
      SELECT thread_purchase_token, TT.* from "Communities" C
      LEFT JOIN "Threads" T ON T.community_id = C.id
      LEFT JOIN "ThreadTokens" TT ON TT.thread_id = T.id
      WHERE T.id = :thread_id;
      `,
        {
          replacements: { thread_id },
          type: QueryTypes.SELECT,
        },
      );

      return token[0];
    },
  };
}
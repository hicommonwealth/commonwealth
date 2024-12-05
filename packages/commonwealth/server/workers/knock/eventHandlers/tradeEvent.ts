import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import z from 'zod';

const output = z.boolean();

export const processTradeEvent: EventHandler<
  'TradeEvent',
  typeof output
> = async ({ payload }) => {
  const provider = notificationsProvider();

  const results = await models.sequelize.query<{
    user_id: number;
    community_id: string;
    symbol: string;
  }>(
    `
    SELECT U.user_id, C.community_id, T.symbol from "Users" U
    JOIN "Addresses" A ON U.user_id = A.user_id
    JOIN "Communities" C ON C.id = A.community_id
    JOIN "Tokens" T ON T.namespace = C.namespace
    WHERE :token_address = T.token_address;
  `,
    {
      replacements: { token_address: payload.token_address },
      type: QueryTypes.SELECT,
    },
  );

  await provider.triggerWorkflow({
    key: WorkflowKeys.TradeEvent,
    users: results.map((u) => ({ id: String(u.user_id) })),
    data: {
      community_id: results[0].community_id,
      symbol: results[0].symbol,
      is_buy: payload.is_buy,
    },
  });

  if (payload.floating_supply < BigInt(10000)) {
    await provider.triggerWorkflow({
      key: WorkflowKeys.CapReached,
      users: results.map((u) => ({ id: String(u.user_id) })),
      data: {
        symbol: results[0].symbol,
      },
    });
  }
};

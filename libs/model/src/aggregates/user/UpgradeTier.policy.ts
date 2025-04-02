import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op, QueryTypes } from 'sequelize';
import { models } from '../../database';

const MIN_TRADE_AMOUNT = 10 ** 6;

const log = logger(import.meta);

const inputs = {
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
};

export function UpgradeTierPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      LaunchpadTokenTraded: async ({ payload }) => {
        const { token_address } = payload;

        const token = await models.LaunchpadToken.findOne({
          where: {
            token_address,
            creator_address: {
              [Op.ne]: null,
            },
          },
        });
        if (!token) {
          log.warn(
            `Token with creator not found for token address ${token_address}`,
          );
          return;
        }

        // check tier of token creator user
        const userAddress = await models.Address.findOne({
          where: {
            address: token.creator_address!,
          },
          include: [
            {
              model: models.User,
              required: true,
            },
          ],
        });
        if (!userAddress?.User) {
          log.warn(
            `User address not found for trader address ${payload.trader_address}`,
          );
          return;
        }
        if (userAddress.User.tier >= 4) return;

        // if token has been traded above min amount, upgrade tier
        const [totalTraded] = await models.sequelize.query<{
          sum: number;
        }>(
          `SELECT SUM(community_token_amount) as sum FROM launchpad_trades WHERE token_address = :token_address`,
          {
            replacements: { token_address },
            type: QueryTypes.SELECT,
          },
        );

        if (totalTraded.sum > MIN_TRADE_AMOUNT) {
          await models.User.update(
            { tier: 4 },
            { where: { id: userAddress.User.id } },
          );
        }
      },
    },
  };
}

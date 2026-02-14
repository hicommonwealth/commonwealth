import { Projection, logger } from '@hicommonwealth/core';
import {
  PredictionMarketStatus,
  PredictionMarketTradeAction,
  events,
} from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

const log = logger(import.meta);

const inputs = {
  PredictionMarketProposalCreated: events.PredictionMarketProposalCreated,
  PredictionMarketMarketCreated: events.PredictionMarketMarketCreated,
  PredictionMarketTokensMinted: events.PredictionMarketTokensMinted,
  PredictionMarketTokensMerged: events.PredictionMarketTokensMerged,
  PredictionMarketSwapExecuted: events.PredictionMarketSwapExecuted,
  PredictionMarketTokensRedeemed: events.PredictionMarketTokensRedeemed,
  PredictionMarketProposalResolved: events.PredictionMarketProposalResolved,
  PredictionMarketMarketResolved: events.PredictionMarketMarketResolved,
};

export function PredictionMarketProjection(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      PredictionMarketProposalCreated: async ({ payload }) => {
        const { prediction_market_id, proposal_id } = payload;
        const market =
          await models.PredictionMarket.findByPk(prediction_market_id);
        mustExist('Prediction Market', market);

        await market.update({ proposal_id });
      },
      PredictionMarketMarketCreated: async ({ payload }) => {
        const { prediction_market_id, market_id } = payload;
        const market =
          await models.PredictionMarket.findByPk(prediction_market_id);
        mustExist('Prediction Market', market);

        await market.update({ market_id });
      },
      PredictionMarketTokensMinted: async ({ payload }) => {
        const {
          market_id,
          eth_chain_id,
          transaction_hash,
          trader_address,
          collateral_amount,
          p_token_amount,
          f_token_amount,
          timestamp,
        } = payload;

        const market = await models.PredictionMarket.findOne({
          where: { market_id },
        });
        if (!market) {
          log.warn(
            `PredictionMarketTokensMinted: market not found for market_id=${market_id}`,
          );
          return;
        }

        await models.sequelize.transaction(async (transaction) => {
          // Insert trade (idempotent via composite PK)
          const [, tradeCreated] =
            await models.PredictionMarketTrade.findOrCreate({
              where: { eth_chain_id, transaction_hash },
              defaults: {
                eth_chain_id,
                transaction_hash,
                prediction_market_id: market.id!,
                trader_address,
                action: PredictionMarketTradeAction.Mint,
                collateral_amount,
                p_token_amount,
                f_token_amount,
                timestamp,
              },
              transaction,
            });

          // Skip position/market updates if trade already existed (idempotency)
          if (!tradeCreated) return;

          // Upsert position
          const [position, positionCreated] =
            await models.PredictionMarketPosition.findOrCreate({
              where: {
                prediction_market_id: market.id!,
                user_address: trader_address,
              },
              defaults: {
                prediction_market_id: market.id!,
                user_address: trader_address,
                p_token_balance: p_token_amount,
                f_token_balance: f_token_amount,
                total_collateral_in: collateral_amount,
              },
              transaction,
            });

          if (!positionCreated) {
            await models.PredictionMarketPosition.update(
              {
                p_token_balance: models.sequelize.literal(
                  `p_token_balance + ${p_token_amount}`,
                ) as unknown as bigint,
                f_token_balance: models.sequelize.literal(
                  `f_token_balance + ${f_token_amount}`,
                ) as unknown as bigint,
                total_collateral_in: models.sequelize.literal(
                  `total_collateral_in + ${collateral_amount}`,
                ) as unknown as bigint,
              },
              { where: { id: position.id }, transaction },
            );
          }

          // Update market total collateral
          await models.PredictionMarket.update(
            {
              total_collateral: models.sequelize.literal(
                `total_collateral + ${collateral_amount}`,
              ) as unknown as bigint,
            },
            { where: { id: market.id }, transaction },
          );
        });
      },
      PredictionMarketTokensMerged: async ({ payload }) => {
        const {
          market_id,
          eth_chain_id,
          transaction_hash,
          trader_address,
          collateral_amount,
          p_token_amount,
          f_token_amount,
          timestamp,
        } = payload;

        const market = await models.PredictionMarket.findOne({
          where: { market_id },
        });
        if (!market) {
          log.warn(
            `PredictionMarketTokensMerged: market not found for market_id=${market_id}`,
          );
          return;
        }

        await models.sequelize.transaction(async (transaction) => {
          // Insert trade (idempotent via composite PK)
          const [, tradeCreated] =
            await models.PredictionMarketTrade.findOrCreate({
              where: { eth_chain_id, transaction_hash },
              defaults: {
                eth_chain_id,
                transaction_hash,
                prediction_market_id: market.id!,
                trader_address,
                action: PredictionMarketTradeAction.Merge,
                collateral_amount,
                p_token_amount,
                f_token_amount,
                timestamp,
              },
              transaction,
            });

          // Skip position/market updates if trade already existed (idempotency)
          if (!tradeCreated) return;

          // Upsert position (decrement both token balances)
          const [position, positionCreated] =
            await models.PredictionMarketPosition.findOrCreate({
              where: {
                prediction_market_id: market.id!,
                user_address: trader_address,
              },
              defaults: {
                prediction_market_id: market.id!,
                user_address: trader_address,
                p_token_balance: 0n,
                f_token_balance: 0n,
                total_collateral_in: 0n,
              },
              transaction,
            });

          if (!positionCreated) {
            await models.PredictionMarketPosition.update(
              {
                p_token_balance: models.sequelize.literal(
                  `p_token_balance - ${p_token_amount}`,
                ) as unknown as bigint,
                f_token_balance: models.sequelize.literal(
                  `f_token_balance - ${f_token_amount}`,
                ) as unknown as bigint,
              },
              { where: { id: position.id }, transaction },
            );
          }

          // Decrement market total collateral
          await models.PredictionMarket.update(
            {
              total_collateral: models.sequelize.literal(
                `total_collateral - ${collateral_amount}`,
              ) as unknown as bigint,
            },
            { where: { id: market.id }, transaction },
          );
        });
      },
      PredictionMarketSwapExecuted: async ({ payload }) => {
        const {
          market_id,
          eth_chain_id,
          transaction_hash,
          trader_address,
          buy_pass,
          amount_in,
          amount_out,
          timestamp,
        } = payload;

        const market = await models.PredictionMarket.findOne({
          where: { market_id },
        });
        if (!market) {
          log.warn(
            `PredictionMarketSwapExecuted: market not found for market_id=${market_id}`,
          );
          return;
        }

        await models.sequelize.transaction(async (transaction) => {
          const action = buy_pass
            ? PredictionMarketTradeAction.SwapBuyPass
            : PredictionMarketTradeAction.SwapBuyFail;

          // For trade record: map swap amounts to token fields
          // buyPass=true: spending f_tokens (amountIn), receiving p_tokens (amountOut)
          // buyPass=false: spending p_tokens (amountIn), receiving f_tokens (amountOut)
          const p_token_amount = buy_pass ? amount_out : amount_in;
          const f_token_amount = buy_pass ? amount_in : amount_out;

          // Insert trade (idempotent via composite PK)
          const [, tradeCreated] =
            await models.PredictionMarketTrade.findOrCreate({
              where: { eth_chain_id, transaction_hash },
              defaults: {
                eth_chain_id,
                transaction_hash,
                prediction_market_id: market.id!,
                trader_address,
                action,
                collateral_amount: 0n,
                p_token_amount,
                f_token_amount,
                timestamp,
              },
              transaction,
            });

          // Skip position/market updates if trade already existed (idempotency)
          if (!tradeCreated) return;

          // Upsert position: swap exchanges one token for the other
          // buyPass=true: p_token += amount_out, f_token -= amount_in
          // buyPass=false: f_token += amount_out, p_token -= amount_in
          const [position, positionCreated] =
            await models.PredictionMarketPosition.findOrCreate({
              where: {
                prediction_market_id: market.id!,
                user_address: trader_address,
              },
              defaults: {
                prediction_market_id: market.id!,
                user_address: trader_address,
                p_token_balance: buy_pass ? amount_out : 0n,
                f_token_balance: buy_pass ? 0n : amount_out,
                total_collateral_in: 0n,
              },
              transaction,
            });

          if (!positionCreated) {
            if (buy_pass) {
              await models.PredictionMarketPosition.update(
                {
                  p_token_balance: models.sequelize.literal(
                    `p_token_balance + ${amount_out}`,
                  ) as unknown as bigint,
                  f_token_balance: models.sequelize.literal(
                    `f_token_balance - ${amount_in}`,
                  ) as unknown as bigint,
                },
                { where: { id: position.id }, transaction },
              );
            } else {
              await models.PredictionMarketPosition.update(
                {
                  f_token_balance: models.sequelize.literal(
                    `f_token_balance + ${amount_out}`,
                  ) as unknown as bigint,
                  p_token_balance: models.sequelize.literal(
                    `p_token_balance - ${amount_in}`,
                  ) as unknown as bigint,
                },
                { where: { id: position.id }, transaction },
              );
            }
          }

          // Update market probability from swap ratio
          const total = Number(amount_in) + Number(amount_out);
          const probability = buy_pass
            ? Number(amount_out) / total
            : Number(amount_in) / total;

          await models.PredictionMarket.update(
            { current_probability: probability },
            { where: { id: market.id }, transaction },
          );
        });
      },
      PredictionMarketTokensRedeemed: async ({ payload }) => {
        const {
          market_id,
          eth_chain_id,
          transaction_hash,
          trader_address,
          collateral_amount,
          p_token_amount,
          f_token_amount,
          timestamp,
        } = payload;

        const market = await models.PredictionMarket.findOne({
          where: { market_id },
        });
        if (!market) {
          log.warn(
            `PredictionMarketTokensRedeemed: market not found for market_id=${market_id}`,
          );
          return;
        }

        await models.sequelize.transaction(async (transaction) => {
          // Insert trade (idempotent via composite PK)
          const [, tradeCreated] =
            await models.PredictionMarketTrade.findOrCreate({
              where: { eth_chain_id, transaction_hash },
              defaults: {
                eth_chain_id,
                transaction_hash,
                prediction_market_id: market.id!,
                trader_address,
                action: PredictionMarketTradeAction.Redeem,
                collateral_amount,
                p_token_amount,
                f_token_amount,
                timestamp,
              },
              transaction,
            });

          // Skip position updates if trade already existed (idempotency)
          if (!tradeCreated) return;

          // Upsert position (decrement winning token balance)
          const [position, positionCreated] =
            await models.PredictionMarketPosition.findOrCreate({
              where: {
                prediction_market_id: market.id!,
                user_address: trader_address,
              },
              defaults: {
                prediction_market_id: market.id!,
                user_address: trader_address,
                p_token_balance: 0n,
                f_token_balance: 0n,
                total_collateral_in: 0n,
              },
              transaction,
            });

          if (!positionCreated) {
            const updates: Record<string, unknown> = {};
            if (p_token_amount > 0n) {
              updates.p_token_balance = models.sequelize.literal(
                `p_token_balance - ${p_token_amount}`,
              ) as unknown as bigint;
            }
            if (f_token_amount > 0n) {
              updates.f_token_balance = models.sequelize.literal(
                `f_token_balance - ${f_token_amount}`,
              ) as unknown as bigint;
            }
            if (Object.keys(updates).length > 0) {
              await models.PredictionMarketPosition.update(updates, {
                where: { id: position.id },
                transaction,
              });
            }
          }
        });
      },
      PredictionMarketProposalResolved: async ({ payload }) => {
        const { market_id, winner } = payload;

        const market = await models.PredictionMarket.findOne({
          where: { market_id },
        });
        if (!market) {
          log.warn(
            `PredictionMarketProposalResolved: market not found for market_id=${market_id}`,
          );
          return;
        }

        // Idempotent: skip if already resolved
        if (market.status === PredictionMarketStatus.Resolved) return;

        await market.update({
          status: PredictionMarketStatus.Resolved,
          winner,
          resolved_at: new Date(),
        });
      },
      PredictionMarketMarketResolved: async ({ payload }) => {
        const { market_id, winner } = payload;

        const market = await models.PredictionMarket.findOne({
          where: { market_id },
        });
        if (!market) {
          log.warn(
            `PredictionMarketMarketResolved: market not found for market_id=${market_id}`,
          );
          return;
        }

        // Idempotent: skip if already resolved
        if (market.status === PredictionMarketStatus.Resolved) return;

        await market.update({
          status: PredictionMarketStatus.Resolved,
          winner,
          resolved_at: new Date(),
        });
      },
    },
  };
}

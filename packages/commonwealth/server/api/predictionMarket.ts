import { trpc } from '@hicommonwealth/adapters';
import { PredictionMarket } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createPredictionMarket: trpc.command(
    PredictionMarket.CreatePredictionMarket,
    trpc.Tag.PredictionMarket,
  ),
  deployPredictionMarket: trpc.command(
    PredictionMarket.DeployPredictionMarket,
    trpc.Tag.PredictionMarket,
  ),
  resolvePredictionMarket: trpc.command(
    PredictionMarket.ResolvePredictionMarket,
    trpc.Tag.PredictionMarket,
  ),
  cancelPredictionMarket: trpc.command(
    PredictionMarket.CancelPredictionMarket,
    trpc.Tag.PredictionMarket,
  ),
  getPredictionMarkets: trpc.query(
    PredictionMarket.GetPredictionMarkets,
    trpc.Tag.PredictionMarket,
  ),
  getPredictionMarketTrades: trpc.query(
    PredictionMarket.GetPredictionMarketTrades,
    trpc.Tag.PredictionMarket,
  ),
  getPredictionMarketPositions: trpc.query(
    PredictionMarket.GetPredictionMarketPositions,
    trpc.Tag.PredictionMarket,
  ),
});

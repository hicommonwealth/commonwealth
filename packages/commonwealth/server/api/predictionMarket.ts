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
  getPredictionMarkets: trpc.query(
    PredictionMarket.GetPredictionMarkets,
    trpc.Tag.PredictionMarket,
  ),
});

import { trpc } from '@hicommonwealth/adapters';
import { PredictionMarket } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getPredictionMarkets: trpc.query(
    PredictionMarket.GetPredictionMarkets,
    trpc.Tag.PredictionMarket,
  ),
  cancelPredictionMarket: trpc.command(
    PredictionMarket.CancelPredictionMarket,
    trpc.Tag.PredictionMarket,
  ),
});

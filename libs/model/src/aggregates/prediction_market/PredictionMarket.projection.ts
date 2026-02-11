import { Projection, logger } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';

const log = logger(import.meta);

const inputs = {
  PredictionMarketCreated: events.PredictionMarketCreated,
  PredictionMarketDeployed: events.PredictionMarketDeployed,
  PredictionMarketProposalCreated: events.PredictionMarketProposalCreated,
  PredictionMarketMarketCreated: events.PredictionMarketMarketCreated,
};

export function PredictionMarketProjection(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      PredictionMarketCreated: async ({ payload }) => {
        log.info('Projecting PredictionMarketCreated', { id: payload.id });
        // The read model is the same as the write model for now
      },
      PredictionMarketDeployed: async ({ payload }) => {
        log.info('Projecting PredictionMarketDeployed', {
          id: payload.prediction_market_id,
        });
      },
      PredictionMarketProposalCreated: async ({ payload }) => {
        log.info('Projecting PredictionMarketProposalCreated', {
          id: payload.prediction_market_id,
          proposal_id: payload.proposal_id,
        });
      },
      PredictionMarketMarketCreated: async ({ payload }) => {
        log.info('Projecting PredictionMarketMarketCreated', {
          id: payload.prediction_market_id,
          market_id: payload.market_id,
        });
      },
    },
  };
}

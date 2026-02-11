import { Policy, command } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import {
  ProjectPredictionMarketMarket,
  ProjectPredictionMarketProposal,
} from '../aggregates/prediction_market';
import { systemActor } from '../middleware';

const inputs = {
  PredictionMarketProposalCreated: events.PredictionMarketProposalCreated,
  PredictionMarketMarketCreated: events.PredictionMarketMarketCreated,
};

export function PredictionMarketPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      PredictionMarketProposalCreated: async ({ payload }) => {
        await command(ProjectPredictionMarketProposal(), {
          actor: systemActor({}),
          payload: {
            prediction_market_id: payload.prediction_market_id,
            proposal_id: payload.proposal_id,
          },
        });
      },
      PredictionMarketMarketCreated: async ({ payload }) => {
        await command(ProjectPredictionMarketMarket(), {
          actor: systemActor({}),
          payload: {
            prediction_market_id: payload.prediction_market_id,
            market_id: payload.market_id,
          },
        });
      },
    },
  };
}

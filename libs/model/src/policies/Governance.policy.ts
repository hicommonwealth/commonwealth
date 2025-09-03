import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';

const log = logger(import.meta);

const inputs = {
  CmnOzProposalCreated: events.CmnOzProposalCreated,
  CmnTokenVoteCast: events.CmnTokenVoteCast,
  CmnAddressVoteCast: events.CmnAddressVoteCast,
};

export function GovernancePolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CmnOzProposalCreated: async ({ payload }) => {},
      CmnTokenVoteCast: async ({ payload }) => {},
      CmnAddressVoteCast: async ({ payload }) => {},
    },
  };
}

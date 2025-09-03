import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';

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
      CmnOzProposalCreated: async ({ payload }) => {
        try {
          await models.GovernanceProposal.create(
            {
              eth_chain_id: payload.eventSource.ethChainId,
              proposal_id: payload.parsedArgs.proposalId,
              tx_hash: payload.rawLog.transactionHash,
              timestamp: payload.block.timestamp,
              proposer_address: payload.parsedArgs.proposerAddress,
              description: payload.parsedArgs.description,
              vote_start_timestamp: payload.parsedArgs.voteStartTimestamp,
              vote_end_timestamp: payload.parsedArgs.voteEndTimestamp,
            },
            {
              ignoreDuplicates: true,
            },
          );
          log.info(
            `Created governance proposal ${payload.parsedArgs.proposalId} on chain ${payload.eventSource.ethChainId}`,
          );
        } catch (error) {
          log.error(`Failed to create governance proposal: ${error}`);
          throw error;
        }
      },
      CmnTokenVoteCast: async ({ payload }) => {
        try {
          await models.ProposalVote.create(
            {
              eth_chain_id: payload.eventSource.ethChainId,
              proposal_id: payload.parsedArgs.proposalId,
              tx_hash: payload.rawLog.transactionHash,
              timestamp: payload.block.timestamp,
              token_id: payload.parsedArgs.tokenId,
              support: payload.parsedArgs.support,
            },
            {
              ignoreDuplicates: true,
            },
          );
          log.info(
            `Created token vote for proposal ${payload.parsedArgs.proposalId} with token ${payload.parsedArgs.tokenId} on chain ${payload.eventSource.ethChainId}`,
          );
        } catch (error) {
          log.error(`Failed to create token vote: ${error}`);
          throw error;
        }
      },
      CmnAddressVoteCast: async ({ payload }) => {
        try {
          await models.ProposalVote.create(
            {
              eth_chain_id: payload.eventSource.ethChainId,
              proposal_id: payload.parsedArgs.proposalId,
              tx_hash: payload.rawLog.transactionHash,
              timestamp: payload.block.timestamp,
              voter_address: payload.parsedArgs.voterAddress,
              support: payload.parsedArgs.support,
            },
            {
              ignoreDuplicates: true,
            },
          );
          log.info(
            `Created address vote for proposal ${payload.parsedArgs.proposalId} by ${payload.parsedArgs.voterAddress} on chain ${payload.eventSource.ethChainId}`,
          );
        } catch (error) {
          log.error(`Failed to create address vote: ${error}`);
          throw error;
        }
      },
    },
  };
}

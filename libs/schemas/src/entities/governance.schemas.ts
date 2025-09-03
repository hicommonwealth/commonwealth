import { z } from 'zod';
import { EVM_ADDRESS, PG_ETH, PG_INT } from '../utils';

export const GovernanceProposal = z.object({
  eth_chain_id: PG_INT,
  proposal_id: PG_ETH,
  tx_hash: z.string().length(66),
  timestamp: PG_ETH,
  proposer_address: EVM_ADDRESS,
  description: z.string(),
  vote_start_timestamp: PG_ETH,
  vote_end_timestamp: PG_ETH,
});

export const ProposalVote = z.object({
  eth_chain_id: PG_INT,
  proposal_id: PG_ETH,
  tx_hash: z.string().length(66),
  timestamp: PG_ETH,
  token_id: PG_ETH.optional(),
  voter_address: EVM_ADDRESS.optional(),
  support: z.number(),
});

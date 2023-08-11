import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse } from '../../types';

type GetProposalVotesRequestParams = {
  chainId: string;
  proposalId: string;
};

type GetProposalVotesResponse = {
  votes: any[];
};

export const get_proposal_votes_handler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetProposalVotesRequestParams>,
  res: TypedResponse<GetProposalVotesResponse>
) => {
  const { chainId, proposalId } = req.query;

  const votes = await controllers.proposals.getProposalVotes({
    chainId,
    proposalId: +proposalId,
  });

  return res.json({
    status: 'Success',
    result: {
      votes,
    },
  });
};

import { ServerControllers } from '../../routing/router';
import { success, TypedRequestQuery, TypedResponse } from '../../types';

type GetProposalVotesRequestParams = {
  chainId: string;
  proposalId: string;
};

type GetProposalVotesResponse = {
  votes: any[];
};

export const getProposalVotesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetProposalVotesRequestParams>,
  res: TypedResponse<GetProposalVotesResponse>
) => {
  const { chainId, proposalId } = req.query;

  const votes = await controllers.proposals.getProposalVotes({
    chainId,
    proposalId,
  });

  return success(res, {
    votes,
  });
};

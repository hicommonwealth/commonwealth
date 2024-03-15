import { ServerControllers } from '../../routing/router';
import { success, TypedRequestQuery, TypedResponse } from '../../types';

type GetProposalVotesRequestParams = {
  communityId: string;
  proposalId: string;
};

type GetProposalVotesResponse = {
  votes: any[];
};

export const getProposalVotesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetProposalVotesRequestParams>,
  res: TypedResponse<GetProposalVotesResponse>,
) => {
  const { communityId, proposalId } = req.query;

  const votes = await controllers.proposals.getProposalVotes({
    communityId,
    proposalId,
  });

  return success(res, {
    votes,
  });
};

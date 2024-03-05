import { ServerControllers } from '../../routing/router';
import { success, TypedRequestQuery, TypedResponse } from '../../types';

type GetProposalsRequestParams = {
  communityId: string;
};

type GetProposalsResponse = {
  proposals: any;
};

export const getProposalsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetProposalsRequestParams>,
  res: TypedResponse<GetProposalsResponse>,
) => {
  const { communityId } = req.query;

  const proposals = await controllers.proposals.getProposals({
    communityId,
  });

  return success(res, {
    proposals,
  });
};

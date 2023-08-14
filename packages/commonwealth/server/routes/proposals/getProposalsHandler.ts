import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse } from '../../types';

type GetProposalsRequestParams = {
  chainId: string;
};

type GetProposalsResponse = {
  proposals: any;
};

export const getProposalsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetProposalsRequestParams>,
  res: TypedResponse<GetProposalsResponse>
) => {
  const { chainId } = req.query;

  const proposals = await controllers.proposals.getCompletedProposals({
    chainId,
  });

  return res.json({
    status: 'Success',
    result: {
      proposals,
    },
  });
};

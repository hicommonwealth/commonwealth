import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse } from '../../types';

type GetProposalsRequestBody = {
  chainId: string;
};

type GetProposalsResponse = {
  proposals: any;
};

export const getProposalsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<GetProposalsRequestBody>,
  res: TypedResponse<GetProposalsResponse>
) => {
  const { chainId } = req.body;

  const proposals = await controllers.proposals.getCompletedProposals({
    chainId,
  });

  return res.json({
    status: 'Success',
    result: {
      proposals: JSON.stringify(proposals, null, 2),
    },
  });
};

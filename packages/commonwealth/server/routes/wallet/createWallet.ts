import { ServerControllers } from 'server/routing/router';
import { TypedRequest, TypedResponse, success } from 'server/types';

type CreateWalletRequest = {
  address: string;
  signedMessage: string;
};

type CreateWalletResponse = {
  walletAddress: string;
  new: boolean;
};

export const createWalletHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<CreateWalletRequest>,
  res: TypedResponse<CreateWalletResponse>,
) => {
  const wallet = await controllers.wallet.createWallet({
    address: req.body.address,
    signedMessage: req.body.signedMessage,
    user: req.user,
  });
  return success(res, wallet);
};

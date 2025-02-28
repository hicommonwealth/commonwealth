import { ChainBase } from '@hicommonwealth/shared';
import axios from 'axios';
import Web3 from 'web3';
import WebWalletController from '../../controllers/app/web_wallets';
import app from '../../state';

export const getCreateWallet = async (
  address: string,
  signedMessage: string,
) => {
  const headers = {
    authorization: app.user.jwt,
    address_id: app.user.activeAccount.address,
  };

  const response = await axios.post(
    'http://localhost:8080/api/v1/wallet.CreateWallet',
    {
      id: '0',
      address,
      signedMessage,
    },
    { headers },
  );
  const data = response.data.result.data;
  return data.walletAddress;
};

export const fundAAWalelt = async (
  walletAddress: string,
  amountEth: number,
  chainId: string,
) => {
  const wallet = WebWalletController.Instance.availableWallets(
    ChainBase.Ethereum,
  )[0];

  if (wallet.api) {
    await wallet.enable(chainId);
  }
  // @ts-expect-error StrictNullChecks
  await this.wallet.switchNetwork(chainId);
  const web3 = new Web3(wallet.api.givenProvider);
  const aaWallet = await getCreateWallet(walletAddress, '');
  const receipt = await web3.eth.sendTransaction({
    from: walletAddress,
    to: aaWallet,
    value: amountEth,
  });
  return receipt;
};

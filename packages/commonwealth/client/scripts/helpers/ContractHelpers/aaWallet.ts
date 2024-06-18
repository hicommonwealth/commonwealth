import axios from 'axios';
import app from '../../state';

export const sendUserOpTransaction = async (
  to: string,
  value: string | number,
  data: string,
) => {
  const headers = {
    authorization: app.user.jwt,
    address_id: app.user.activeAccount.address,
  };
  const response = await axios.post(
    'http://localhost:8080/api/v1/wallet.SendTransaction',
    {
      id: '0',
      to,
      value: Number(value),
      data,
    },
    { headers },
  );
  console.log(response.data.result.data.transaction_hash);
  const txReceipt = {
    transactionHash: response.data.result.data.transaction_hash,
  };
  return txReceipt;
};

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

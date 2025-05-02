import { notifySuccess } from 'controllers/app/notifications';
import { Magic } from 'magic-sdk';
import Web3 from 'web3';

export const magic = new Magic(process.env.MAGIC_PUBLISHABLE_KEY!);
export const web3 = new Web3(magic.rpcProvider);

export const fetchUserAddress = async (): Promise<string> => {
  const address = (await web3.eth.getAccounts())[0];
  return address;
};

export const formatUsdBalance = (
  ethBalance: string,
  ethToUsdRate: number,
): string => {
  const balanceUsd = parseFloat(ethBalance) * ethToUsdRate;
  return isNaN(balanceUsd) ? '$0.00 USD' : `$${balanceUsd.toFixed(2)} USD`;
};

export const handleRefreshBalance = async (
  refetch: () => Promise<any>,
): Promise<void> => {
  await refetch();
  notifySuccess('Balance refreshed successfully');
};

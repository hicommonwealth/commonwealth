import { notifySuccess } from 'controllers/app/notifications';
import Web3 from 'web3';

export const fetchUserAddress = async (web3Instance: Web3): Promise<string> => {
  const address = (await web3Instance.eth.getAccounts())[0];
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

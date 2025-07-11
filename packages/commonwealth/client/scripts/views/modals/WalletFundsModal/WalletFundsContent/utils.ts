import { notifySuccess } from 'controllers/app/notifications';

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

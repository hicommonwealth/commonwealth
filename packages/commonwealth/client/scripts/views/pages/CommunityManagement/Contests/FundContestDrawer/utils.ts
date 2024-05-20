import { capDecimals } from 'views/modals/ManageCommunityStakeModal/utils';

export const calculateNewContractBalance = (
  currentEthBalance: string,
  amountEth: string,
) => {
  const newBalance = parseFloat(currentEthBalance) + parseFloat(amountEth);

  if (isNaN(newBalance)) {
    return '';
  }

  return newBalance.toFixed(8);
};

export const getAmountError = (userEthBalance: string, amountEth: string) => {
  if (parseFloat(userEthBalance) < parseFloat(amountEth)) {
    return 'Not enough funds in wallet';
  }

  if (amountEth === '' || parseFloat(amountEth) === 0) {
    return 'Please enter an amount';
  }

  if (parseFloat(amountEth) < 0) {
    return 'Please enter non negative amount';
  }
};

export const displayAmount = (amount: string) => {
  if (!amount || amount === '0') {
    return '0.00';
  }

  return capDecimals(amount);
};

import { WalletId } from '@hicommonwealth/core';
import { setActiveAccount } from 'controllers/app/login';
import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import app from 'state';

export const convertEthToUsd = (
  ethAmount: string | number,
  ethUsdRate: string,
) => {
  const eth =
    typeof ethAmount === 'number' ? Number(ethAmount) : parseFloat(ethAmount);
  const rate = parseFloat(ethUsdRate);

  if (isNaN(eth) || isNaN(rate)) {
    return '';
  }

  return (eth * rate).toFixed(2);
};

export const buildEtherscanLink = (txHash: string) => {
  // TODO remove goerli before production deployment
  const prefix = 'goerli.';
  return `https://${prefix}etherscan.io/tx/${txHash}`;
};

export const capDecimals = (value: string, capNumber = 8) => {
  if (!value) {
    return;
  }

  const [, decimalPart] = value.split('.');

  if (!decimalPart || decimalPart.length <= capNumber) {
    return value;
  }

  return parseFloat(value).toFixed(capNumber);
};

export const getInitialAccountValue = (
  activeAccountAddress: string,
  addressOptions: { value: string; label: string }[],
) => {
  const activeAddressOption = addressOptions.find(
    ({ value }) => value === activeAccountAddress,
  );

  return activeAddressOption || addressOptions[0];
};

export const getAvailableAddressesForStakeExchange = (
  activeAccounts: Account[],
  userAddresses: AddressInfo[],
) => {
  // only active accounts (from selected community) that are metamask wallets
  return activeAccounts.reduce((availableAddresses, account) => {
    const foundAddress = userAddresses.find(
      (address) =>
        address.address === account.address &&
        address.community.id === account.community.id,
    );

    if (!foundAddress || foundAddress.walletId !== WalletId.Metamask) {
      return [...availableAddresses];
    }

    return [...availableAddresses, account];
  }, []);
};

export const setActiveAccountOnTransactionSuccess = async (
  userAddressUsedInTransaction: string,
) => {
  if (app.user.activeAccount.address !== userAddressUsedInTransaction) {
    const accountToSet = app.user.activeAccounts.find(
      (account) => account.address === userAddressUsedInTransaction,
    );
    return await setActiveAccount(accountToSet);
  }
};

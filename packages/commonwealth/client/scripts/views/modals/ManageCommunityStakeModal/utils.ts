import { WalletId } from '@hicommonwealth/shared';
import { setActiveAccount } from 'controllers/app/login';
import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import NodeInfo from 'models/NodeInfo';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';
import { userStore } from 'state/ui/user';

export const convertTokenAmountToUsd = (
  tokenAmount: string | number,
  tokenToUsdRate: string,
) => {
  const amount =
    typeof tokenAmount === 'number'
      ? Number(tokenAmount)
      : parseFloat(tokenAmount);
  const rate = parseFloat(tokenToUsdRate);

  if (isNaN(amount) || isNaN(rate)) {
    return '';
  }

  return (amount * rate).toFixed(2);
};

export const buildEtherscanLink = (txHash: string, chainNodeId?: number) => {
  const blockExplorer = chainNodeId
    ? queryClient
        .getQueryData<NodeInfo[]>([ApiEndpoints.FETCH_NODES])
        ?.find((n) => n?.id === chainNodeId)?.block_explorer
    : app.chain?.meta?.ChainNode?.block_explorer;

  const url = blockExplorer ?? 'https://basescan.org/';

  return `${url}tx/${txHash}`;
};

export const capDecimals = (value: string, capNumber = 8) => {
  if (!value) {
    return;
  }

  if (isNaN(Number(value))) {
    return 0;
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
  if (
    userStore.getState().activeAccount &&
    userStore.getState().activeAccount?.address !== userAddressUsedInTransaction
  ) {
    const accountToSet = userStore
      .getState()
      .accounts.find(
        (account) => account.address === userAddressUsedInTransaction,
      );
    // @ts-expect-error StrictNullChecks
    return await setActiveAccount(accountToSet);
  }
};
